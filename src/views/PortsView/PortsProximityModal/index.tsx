"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Gauge, Globe2, Loader2, Timer } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { FormFieldSelect } from "@/components/ui/FormField";
import { fetchPorts } from "@/services/catalogs/portService";
import { fetchPortProximities, type PortProximity } from "@/services/catalogs/portProximityService";
import { portDisplayName } from "@/types/catalog";

type PortPoint = {
  portId: number;
  displayName: string;
  commercialName: string;
  country: string;
  positionCount: number;
  logoUrl: string | null;
  lat: number;
  lon: number;
};

type PortNodeCoords = { x: number; y: number };

type ViewBounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

type PortLabelLayout = {
  portId: number;
  nodeX: number;
  nodeY: number;
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
};

const PROXIMITY_MODAL_PANEL_CLASS = "max-w-[min(1360px,88vw)]";
const PROXIMITY_MAP_HEIGHT_CLASS = "h-[min(550px,57vh)] min-h-[360px] w-full";
const OSM_ZOOM_LEVEL = 4;
const OSM_TILE_SIZE = 256;
const MERCATOR_MAX_LAT = 85.05112878;
const LABEL_CARD_W = 152;
const LABEL_CARD_H = 44;
const CLUSTER_NODE_DISTANCE_PX = 80;
const CLUSTER_COLUMN_GAP = 8;
const CLUSTER_OFFSET_X = 26;

function parseDecimalString(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatTravelTime(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

function formatCoordinate(value: number, kind: "lat" | "lon"): string {
  const abs = Math.abs(value).toFixed(2);
  const suffix = kind === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${abs}° ${suffix}`;
}

function clampMercatorLat(lat: number): number {
  return Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, lat));
}

function lonToWorldPixel(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * OSM_TILE_SIZE * 2 ** zoom;
}

function latToWorldPixel(lat: number, zoom: number): number {
  const clampedLat = clampMercatorLat(lat);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return y * OSM_TILE_SIZE * 2 ** zoom;
}

function computeViewportBounds(points: PortPoint[]): ViewBounds {
  if (points.length === 0) {
    return { minLon: -120, maxLon: 10, minLat: 5, maxLat: 45 };
  }

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const p of points) {
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
  }

  const lonSpan = Math.max(maxLon - minLon, 8);
  const latSpan = Math.max(maxLat - minLat, 6);
  const lonPad = lonSpan * 0.22;
  const latPad = latSpan * 0.18;

  return {
    minLon: minLon - lonPad,
    maxLon: maxLon + lonPad,
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
  };
}

function buildViewportProjection(
  bounds: ViewBounds,
  width: number,
  height: number,
  zoom: number,
) {
  const topLeftX = lonToWorldPixel(bounds.minLon, zoom);
  const topLeftY = latToWorldPixel(bounds.maxLat, zoom);
  const bottomRightX = lonToWorldPixel(bounds.maxLon, zoom);
  const bottomRightY = latToWorldPixel(bounds.minLat, zoom);
  const viewWorldW = Math.max(bottomRightX - topLeftX, 1);
  const viewWorldH = Math.max(bottomRightY - topLeftY, 1);
  const scale = Math.min(width / viewWorldW, height / viewWorldH);
  const mapW = viewWorldW * scale;
  const mapH = viewWorldH * scale;
  const offsetX = (width - mapW) / 2;
  const offsetY = (height - mapH) / 2;

  const project = (lon: number, lat: number): PortNodeCoords => ({
    x: offsetX + (lonToWorldPixel(lon, zoom) - topLeftX) * scale,
    y: offsetY + (latToWorldPixel(lat, zoom) - topLeftY) * scale,
  });

  const projectTile = (tileX: number, tileY: number) => {
    const tileWorldX = tileX * OSM_TILE_SIZE;
    const tileWorldY = tileY * OSM_TILE_SIZE;
    return {
      left: offsetX + (tileWorldX - topLeftX) * scale,
      top: offsetY + (tileWorldY - topLeftY) * scale,
      width: OSM_TILE_SIZE * scale,
      height: OSM_TILE_SIZE * scale,
    };
  };

  return { project, projectTile, topLeftX, topLeftY, viewWorldW, viewWorldH, offsetX, offsetY, scale };
}

function getTileKeysForBounds(bounds: ViewBounds, zoom: number): string[] {
  const minX = Math.floor(lonToWorldPixel(bounds.minLon, zoom) / OSM_TILE_SIZE);
  const maxX = Math.floor(lonToWorldPixel(bounds.maxLon, zoom) / OSM_TILE_SIZE);
  const minY = Math.floor(latToWorldPixel(bounds.maxLat, zoom) / OSM_TILE_SIZE);
  const maxY = Math.floor(latToWorldPixel(bounds.minLat, zoom) / OSM_TILE_SIZE);
  const keys: string[] = [];

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      keys.push(`${zoom}/${x}/${y}`);
    }
  }

  return keys;
}

function clampLabelRect(cardX: number, cardY: number, width: number, height: number) {
  return {
    cardX: Math.min(width - LABEL_CARD_W - 8, Math.max(8, cardX)),
    cardY: Math.min(height - LABEL_CARD_H - 8, Math.max(8, cardY)),
  };
}

function labelOverlapArea(
  a: Pick<PortLabelLayout, "cardX" | "cardY" | "cardW" | "cardH">,
  b: Pick<PortLabelLayout, "cardX" | "cardY" | "cardW" | "cardH">,
  gap = 10,
) {
  const overlapX =
    Math.min(a.cardX + a.cardW + gap, b.cardX + b.cardW + gap) - Math.max(a.cardX - gap, b.cardX - gap);
  const overlapY =
    Math.min(a.cardY + a.cardH + gap, b.cardY + b.cardH + gap) - Math.max(a.cardY - gap, b.cardY - gap);
  if (overlapX <= 0 || overlapY <= 0) return 0;
  return overlapX * overlapY;
}

function buildPortClusters(
  points: PortPoint[],
  coords: Map<number, PortNodeCoords>,
): number[][] {
  const parent = new Map<number, number>();

  function find(id: number): number {
    const current = parent.get(id) ?? id;
    if (current === id) {
      parent.set(id, id);
      return id;
    }
    const root = find(current);
    parent.set(id, root);
    return root;
  }

  function union(a: number, b: number) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  }

  const ids = points.map((p) => p.portId);
  for (const id of ids) find(id);

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const ca = coords.get(ids[i]);
      const cb = coords.get(ids[j]);
      if (!ca || !cb) continue;
      if (Math.hypot(ca.x - cb.x, ca.y - cb.y) <= CLUSTER_NODE_DISTANCE_PX) {
        union(ids[i], ids[j]);
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (const id of ids) {
    const root = find(id);
    const group = groups.get(root) ?? [];
    group.push(id);
    groups.set(root, group);
  }

  return [...groups.values()].filter((group) => group.length >= 2);
}

function layoutClusterColumnRight(
  portIds: number[],
  coords: Map<number, PortNodeCoords>,
  width: number,
  height: number,
  placed: PortLabelLayout[],
): PortLabelLayout[] {
  const nodes = portIds
    .map((id) => ({ id, c: coords.get(id) }))
    .filter((entry): entry is { id: number; c: PortNodeCoords } => entry.c != null)
    .sort((a, b) => a.c.y - b.c.y || a.c.x - b.c.x);

  if (nodes.length === 0) return [];

  const maxX = Math.max(...nodes.map((node) => node.c.x));
  const centerY = nodes.reduce((sum, node) => sum + node.c.y, 0) / nodes.length;
  const columnX = maxX + CLUSTER_OFFSET_X;
  const totalH = nodes.length * LABEL_CARD_H + (nodes.length - 1) * CLUSTER_COLUMN_GAP;

  let startY = centerY - totalH / 2;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const draft = nodes.map((node, index) => {
      const rawY = startY + index * (LABEL_CARD_H + CLUSTER_COLUMN_GAP);
      const clamped = clampLabelRect(columnX, rawY, width, height);
      return {
        portId: node.id,
        nodeX: node.c.x,
        nodeY: node.c.y,
        cardW: LABEL_CARD_W,
        cardH: LABEL_CARD_H,
        cardX: clamped.cardX,
        cardY: clamped.cardY,
      };
    });

    const overlap = draft.reduce(
      (sum, candidate) => sum + placed.reduce((inner, other) => inner + labelOverlapArea(candidate, other), 0),
      0,
    );
    if (overlap === 0) return draft;
    startY += 8;
  }

  return nodes.map((node, index) => {
    const rawY = startY + index * (LABEL_CARD_H + CLUSTER_COLUMN_GAP);
    const clamped = clampLabelRect(columnX, rawY, width, height);
    return {
      portId: node.id,
      nodeX: node.c.x,
      nodeY: node.c.y,
      cardW: LABEL_CARD_W,
      cardH: LABEL_CARD_H,
      cardX: clamped.cardX,
      cardY: clamped.cardY,
    };
  });
}

function anchorCandidates(nodeX: number, nodeY: number) {
  const w = LABEL_CARD_W;
  const h = LABEL_CARD_H;
  return [
    { cardX: nodeX + 22, cardY: nodeY - h / 2 },
    { cardX: nodeX + 22, cardY: nodeY - h - 20 },
    { cardX: nodeX + 22, cardY: nodeY + 20 },
    { cardX: nodeX + 36, cardY: nodeY - h - 36 },
    { cardX: nodeX + 36, cardY: nodeY + 36 },
    { cardX: nodeX - w - 22, cardY: nodeY - h / 2 },
    { cardX: nodeX - w / 2, cardY: nodeY - h - 24 },
    { cardX: nodeX - w / 2, cardY: nodeY + 24 },
    { cardX: nodeX - w - 22, cardY: nodeY - h - 20 },
    { cardX: nodeX - w - 22, cardY: nodeY + 20 },
  ];
}

function layoutPortLabels(
  points: PortPoint[],
  coords: Map<number, PortNodeCoords>,
  width: number,
  height: number,
): PortLabelLayout[] {
  const placed: PortLabelLayout[] = [];
  const clusteredPortIds = new Set<number>();
  const clusters = buildPortClusters(points, coords).sort((a, b) => {
    const ca = coords.get(a[0]);
    const cb = coords.get(b[0]);
    if (!ca || !cb) return 0;
    return ca.y - cb.y || ca.x - cb.x;
  });

  for (const group of clusters) {
    for (const portId of group) clusteredPortIds.add(portId);
    placed.push(...layoutClusterColumnRight(group, coords, width, height, placed));
  }

  const sorted = [...points]
    .filter((point) => !clusteredPortIds.has(point.portId))
    .sort((a, b) => {
      const ca = coords.get(a.portId);
      const cb = coords.get(b.portId);
      if (!ca || !cb) return 0;
      return ca.y - cb.y || ca.x - cb.x;
    });

  for (const p of sorted) {
    const c = coords.get(p.portId);
    if (!c) continue;

    let best: PortLabelLayout | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const anchor of anchorCandidates(c.x, c.y)) {
      const clamped = clampLabelRect(anchor.cardX, anchor.cardY, width, height);
      const candidate: PortLabelLayout = {
        portId: p.portId,
        nodeX: c.x,
        nodeY: c.y,
        cardW: LABEL_CARD_W,
        cardH: LABEL_CARD_H,
        ...clamped,
      };

      let score = 0;
      for (const other of placed) {
        score += labelOverlapArea(candidate, other) * 6;
      }
      score += Math.hypot(clamped.cardX - (c.x + 22), clamped.cardY - (c.y - LABEL_CARD_H / 2));
      if (anchor.cardX > c.x) score -= 24;

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best) placed.push(best);
  }

  for (let pass = 0; pass < 32; pass += 1) {
    let moved = false;
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        if (labelOverlapArea(a, b, 0) <= 0) continue;

        const centerAx = a.cardX + a.cardW / 2;
        const centerAy = a.cardY + a.cardH / 2;
        const centerBx = b.cardX + b.cardW / 2;
        const centerBy = b.cardY + b.cardH / 2;
        let dx = centerBx - centerAx;
        let dy = centerBy - centerAy;
        if (dx === 0 && dy === 0) dy = 1;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const push = 4;

        const nextA = clampLabelRect(a.cardX - dx * push, a.cardY - dy * push, width, height);
        a.cardX = nextA.cardX;
        a.cardY = nextA.cardY;
        moved = true;

        const nextB = clampLabelRect(b.cardX + dx * push, b.cardY + dy * push, width, height);
        b.cardX = nextB.cardX;
        b.cardY = nextB.cardY;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return placed;
}

function edgeColorByHours(hours: number): string {
  if (hours <= 24) return "#15803d";
  if (hours <= 48) return "#d97706";
  return "#dc2626";
}

export default function PortsProximityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  type HorizonFilter = 1 | 2 | 3 | "gt3";

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Cargando puertos…");
  const [portsError, setPortsError] = useState<string | null>(null);

  const [withinDays, setWithinDays] = useState<HorizonFilter>(2);
  const [points, setPoints] = useState<PortPoint[]>([]);
  const [edges, setEdges] = useState<PortProximity[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [osmTiles, setOsmTiles] = useState<Map<string, HTMLImageElement>>(new Map());

  const mapWrapRef = useRef<HTMLDivElement | null>(null);

  const withinOptions = useMemo(
    () => [
      { value: 1 as const, label: "1 día" },
      { value: 2 as const, label: "2 días" },
      { value: 3 as const, label: "3 días" },
      { value: "gt3" as const, label: "Más de 3 días" },
    ],
    [],
  );

  const pointsById = useMemo(() => {
    const map = new Map<number, PortPoint>();
    for (const p of points) map.set(p.portId, p);
    return map;
  }, [points]);

  const viewportBounds = useMemo(() => computeViewportBounds(points), [points]);

  const horizonLabel = withinDays === "gt3" ? "más de 3 días" : `${withinDays} días`;
  const selectedPort = selectedPortId != null ? pointsById.get(selectedPortId) : null;

  const selectedOutgoing = useMemo(() => {
    if (selectedPortId == null) return [];
    return edges
      .filter((e) => e.from_port === selectedPortId)
      .map((e) => ({
        to_port: e.to_port,
        to_port_name: pointsById.get(e.to_port)?.displayName ?? e.to_port_name,
        travel_hours_min: parseDecimalString(e.travel_hours_min),
        distance_km: parseDecimalString(e.distance_km),
      }))
      .sort((a, b) => a.travel_hours_min - b.travel_hours_min);
  }, [edges, selectedPortId, pointsById]);

  const viewport = useMemo(
    () =>
      buildViewportProjection(
        viewportBounds,
        Math.max(1, mapSize.width),
        Math.max(1, mapSize.height),
        OSM_ZOOM_LEVEL,
      ),
    [viewportBounds, mapSize.width, mapSize.height],
  );

  const coordsById = useMemo(() => {
    const coords = new Map<number, PortNodeCoords>();
    for (const p of points) {
      coords.set(p.portId, viewport.project(p.lon, p.lat));
    }
    return coords;
  }, [points, viewport]);

  const labelLayouts = useMemo(
    () =>
      layoutPortLabels(points, coordsById, Math.max(1, mapSize.width), Math.max(1, mapSize.height)),
    [points, coordsById, mapSize.width, mapSize.height],
  );

  const tileKeys = useMemo(
    () => getTileKeysForBounds(viewportBounds, OSM_ZOOM_LEVEL),
    [viewportBounds],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function load() {
      setPortsError(null);
      setLoading(true);
      setLoadingMessage("Cargando puertos…");
      setSelectedPortId(null);
      setPoints([]);
      setEdges([]);

      try {
        const portResp = await fetchPorts({ pageSize: 1000 });
        const all = portResp.results;
        if (cancelled) return;

        const latLonPorts = all.filter((p) => p.is_active && p.latitude != null && p.longitude != null);
        const normalized: PortPoint[] = latLonPorts.map((p) => ({
          portId: p.id,
          displayName: portDisplayName(p),
          commercialName: p.commercial_name,
          country: p.country,
          positionCount: p.position_count,
          logoUrl: p.logo,
          lat: Number(p.latitude),
          lon: Number(p.longitude),
        }));
        setPoints(normalized);

        setLoadingMessage(
          withinDays === "gt3"
            ? "Cargando aristas (> 3 días)…"
            : `Cargando aristas (${withinDays} días)…`,
        );
        const proxRaw =
          withinDays === "gt3"
            ? await fetchPortProximities({})
            : await fetchPortProximities({ within_days: withinDays });
        if (cancelled) return;
        const prox =
          withinDays === "gt3"
            ? proxRaw.filter((row) => parseDecimalString(row.travel_hours_min) > 72)
            : proxRaw;
        setEdges(prox);
      } catch {
        if (cancelled) return;
        setPortsError("No se pudieron cargar los datos de proximidad.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, withinDays]);

  useEffect(() => {
    if (!open || tileKeys.length === 0) return;

    let cancelled = false;
    const loaded = new Map<string, HTMLImageElement>();
    const tasks = tileKeys.map(
      (key) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            if (!cancelled) loaded.set(key, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `https://tile.openstreetmap.org/${key}.png`;
        }),
    );

    void Promise.all(tasks).then(() => {
      if (!cancelled) setOsmTiles(new Map(loaded));
    });

    return () => {
      cancelled = true;
    };
  }, [open, tileKeys]);

  useEffect(() => {
    const el = mapWrapRef.current;
    if (!el) return;
    const syncSize = () => {
      const rect = el.getBoundingClientRect();
      setMapSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      });
    };
    syncSize();
    const observer = new ResizeObserver(syncSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  const modalTitle =
    points.length > 0
      ? `Proximidad entre puertos · ${points.length} puertos`
      : "Proximidad entre puertos";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      panelClassName={PROXIMITY_MODAL_PANEL_CLASS}
    >
      <div className="-mx-4 -mt-5 -mb-4 overflow-hidden">
        {portsError ? (
          <div className="mx-4 mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {portsError}
          </div>
        ) : null}

        <div className={`relative w-full overflow-hidden ${PROXIMITY_MAP_HEIGHT_CLASS}`}>
          <div
            ref={mapWrapRef}
            className="relative h-full w-full bg-[#aad3df]"
            onClick={() => setSelectedPortId(null)}
            role="presentation"
          >
            <div className="absolute inset-0 overflow-hidden">
              {tileKeys.map((key) => {
                const img = osmTiles.get(key);
                if (!img) return null;
                const [, tileX, tileY] = key.split("/");
                const rect = viewport.projectTile(Number(tileX), Number(tileY));
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={key}
                    src={img.src}
                    alt=""
                    className="pointer-events-none absolute select-none"
                    style={rect}
                  />
                );
              })}
            </div>

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {edges.map((edge) => {
                const from = coordsById.get(edge.from_port);
                const to = coordsById.get(edge.to_port);
                if (!from || !to) return null;
                const hours = parseDecimalString(edge.travel_hours_min);
                const focused =
                  selectedPortId == null ||
                  edge.from_port === selectedPortId ||
                  edge.to_port === selectedPortId;
                return (
                  <line
                    key={`${edge.from_port}-${edge.to_port}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={edgeColorByHours(hours)}
                    strokeWidth={focused ? 2.8 : 1.6}
                    strokeOpacity={focused ? 1 : 0.52}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0">
              {labelLayouts.map((label) => {
                const point = pointsById.get(label.portId);
                if (!point) return null;
                const selected = selectedPortId === label.portId;
                const moved =
                  Math.abs(label.cardX - (label.nodeX + 22)) > 3 ||
                  Math.abs(label.cardY - (label.nodeY - LABEL_CARD_H / 2)) > 3;

                return (
                  <div key={label.portId}>
                    {moved ? (
                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                        aria-hidden
                      >
                        <line
                          x1={label.nodeX}
                          y1={label.nodeY}
                          x2={label.cardX + 8}
                          y2={label.cardY + LABEL_CARD_H / 2}
                          stroke="rgba(12, 74, 110, 0.92)"
                          strokeWidth={1.75}
                          strokeDasharray="5 4"
                        />
                      </svg>
                    ) : null}
                    <button
                      type="button"
                      className={[
                        "absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-800 shadow-md",
                        selected ? "ring-2 ring-amber-300 bg-sky-950" : "",
                      ].join(" ")}
                      style={{ left: label.nodeX, top: label.nodeY }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPortId(label.portId);
                      }}
                      aria-label={`Seleccionar ${point.displayName}`}
                    />
                    <button
                      type="button"
                      className={[
                        "absolute flex items-center gap-2 rounded-lg border bg-white/95 px-2 py-1.5 shadow-sm transition",
                        selected
                          ? "border-2 border-white ring-2 ring-amber-300"
                          : "border-zinc-200/90 hover:border-zinc-300",
                      ].join(" ")}
                      style={{
                        left: label.cardX,
                        top: label.cardY,
                        width: label.cardW,
                        height: label.cardH,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPortId(label.portId);
                      }}
                      aria-label={`Ver detalle de ${point.displayName}`}
                    >
                      {point.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={point.logoUrl}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded bg-white object-contain"
                        />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sky-50 text-sky-700">
                          <Globe2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[11px] font-semibold text-zinc-900">
                          {point.displayName}
                        </span>
                        <span className="block truncate text-[10px] text-zinc-500">{point.country || "—"}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div
              className="absolute left-3 top-3 z-20 w-[min(220px,calc(100%-1.5rem))] rounded-lg border border-white/80 bg-white/95 p-2 shadow-md backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/92"
              onClick={(event) => event.stopPropagation()}
            >
              <FormFieldSelect
                label="Horizonte"
                name="within_days"
                value={withinDays}
                onChange={(v) => setWithinDays(v)}
                options={withinOptions}
                compact
                emptyValue={2}
              />
            </div>

            <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded bg-black/35 px-2 py-1 text-[10px] text-white">
              © OpenStreetMap contributors
            </div>

            {loading ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/15 backdrop-blur-[1px]">
                <div className="flex items-center gap-3 rounded-full border border-white/35 bg-zinc-900/80 px-4 py-2 text-sm text-white shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{loadingMessage}</span>
                </div>
              </div>
            ) : null}

            {selectedPort ? (
              <aside
                className="absolute inset-y-2 right-2 z-20 w-[350px] max-w-[calc(100%-1rem)] overflow-hidden rounded-xl border border-zinc-200/90 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/90"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {selectedPort.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPort.logoUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg border border-zinc-200/80 bg-white object-contain p-1 dark:border-zinc-700/70"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
                        <Globe2 className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {selectedPort.displayName}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{selectedPort.country}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-2 dark:border-zinc-700/70 dark:bg-zinc-900/40">
                      <div className="text-zinc-500 dark:text-zinc-400">Coordenadas</div>
                      <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                        {formatCoordinate(selectedPort.lat, "lat")}
                      </div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">
                        {formatCoordinate(selectedPort.lon, "lon")}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-2 dark:border-zinc-700/70 dark:bg-zinc-900/40">
                      <div className="text-zinc-500 dark:text-zinc-400">Posiciones</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {selectedPort.positionCount}
                      </div>
                      {selectedPort.commercialName ? (
                        <div className="mt-1 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {selectedPort.commercialName}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-2 dark:border-zinc-700/70 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Activity className="h-3.5 w-3.5" />
                        Rutas
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {selectedOutgoing.length}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-2 dark:border-zinc-700/70 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Timer className="h-3.5 w-3.5" />
                        Mínimo
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {selectedOutgoing.length > 0 ? formatTravelTime(selectedOutgoing[0].travel_hours_min) : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-200/80 bg-white/80 p-2 dark:border-zinc-700/70 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Gauge className="h-3.5 w-3.5" />
                        Promedio
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {selectedOutgoing.length > 0
                          ? formatTravelTime(
                              selectedOutgoing.reduce((acc, row) => acc + row.travel_hours_min, 0) /
                                selectedOutgoing.length,
                            )
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Conexiones ({horizonLabel})</div>

                  <div className="max-h-[220px] overflow-auto pr-1">
                    {selectedOutgoing.length === 0 ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-300">
                        No hay rutas directas dentro del umbral.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedOutgoing.slice(0, 12).map((row) => (
                          <div
                            key={`${selectedPortId}-${row.to_port}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200/70 bg-white/85 p-2.5 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.65)] dark:border-zinc-700/60 dark:bg-zinc-900/55"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {row.to_port_name}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {pointsById.get(row.to_port)?.country || "Destino"}
                              </div>
                            </div>
                            <div className="whitespace-nowrap text-right">
                              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {formatTravelTime(row.travel_hours_min)}
                              </div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {Math.round(row.distance_km)} km
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
