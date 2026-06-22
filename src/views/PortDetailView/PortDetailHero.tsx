"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Ship, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ConfirmDeleteButton from "@/components/buttons/ConfirmDeleteButton";
import DefaultButton from "@/components/buttons/DefaultButton";
import CountryLabel from "@/components/ui/CountryLabel";
import { useMotionTransition } from "@/lib/motionPresets";
import type { PortDetail } from "@/types/catalog";
import { formatLargestVessel, portDisplayName, portStatusLabel } from "@/types/catalog";

type PortDetailHeroProps = {
  port: PortDetail;
  onEdit: () => void;
  onDelete: () => void;
};

const LOGO_SIZE_MIN_EXPANDED = 48;
const LOGO_SIZE_MAX_EXPANDED = 120;
const LOGO_SIZE_MIN_STUCK = 32;
const LOGO_SIZE_MAX_STUCK = 80;

const LOGO_HEIGHT_RATIO = 0.98;

const CARD_BASE_CLASS =
  "relative overflow-hidden border border-zinc-200/80 bg-gradient-to-br from-[var(--admin-accent)]/10 via-white to-zinc-50 backdrop-blur-md dark:border-zinc-800 dark:from-[var(--admin-accent)]/20 dark:via-zinc-900 dark:to-zinc-950";

function clampLogoSize(textHeight: number, stuck: boolean): number {
  const scaled = textHeight * LOGO_HEIGHT_RATIO;
  const min = stuck ? LOGO_SIZE_MIN_STUCK : LOGO_SIZE_MIN_EXPANDED;
  const max = stuck ? LOGO_SIZE_MAX_STUCK : LOGO_SIZE_MAX_EXPANDED;
  return Math.min(Math.max(Math.round(scaled), min), max);
}

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  let parent = node.parentElement;
  while (parent) {
    const { overflowY, overflow } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflow === "auto" || overflow === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export default function PortDetailHero({ port, onEdit, onDelete }: PortDetailHeroProps) {
  const largestVessel = formatLargestVessel(port);
  const textCoreRef = useRef<HTMLDivElement>(null);
  const textExpandedRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevStuckRef = useRef(false);
  const [logoSize, setLogoSize] = useState(LOGO_SIZE_MIN_EXPANDED);
  const [isStuck, setIsStuck] = useState(false);
  const [animateSticky, setAnimateSticky] = useState(false);
  const shellTransition = useMotionTransition(0.15);
  const fadeTransition = useMotionTransition(0.12);

  useEffect(() => {
    if (prevStuckRef.current !== isStuck) {
      setAnimateSticky(true);
      prevStuckRef.current = isStuck;
    }
  }, [isStuck]);

  useLayoutEffect(() => {
    setAnimateSticky(false);
  }, [port.id]);

  useLayoutEffect(() => {
    const el = isStuck ? textCoreRef.current : textExpandedRef.current;
    if (!el) return;

    const syncLogoSize = () => {
      setLogoSize(clampLogoSize(el.getBoundingClientRect().height, isStuck));
    };

    syncLogoSize();
    const observer = new ResizeObserver(syncLogoSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    isStuck,
    port.id,
    port.name,
    port.commercial_name,
    port.status,
    port.position_count,
    port.bollard_total,
    largestVessel,
  ]);

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const scrollRoot = getScrollParent(sentinel);
    if (!scrollRoot) return;

    const updateStuck = () => {
      const rootTop = scrollRoot.getBoundingClientRect().top;
      const sentinelTop = sentinel.getBoundingClientRect().top;
      setIsStuck(sentinelTop < rootTop - 1);
    };

    updateStuck();
    scrollRoot.addEventListener("scroll", updateStuck, { passive: true });
    window.addEventListener("resize", updateStuck);

    return () => {
      scrollRoot.removeEventListener("scroll", updateStuck);
      window.removeEventListener("resize", updateStuck);
    };
  }, [port.id]);

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <div
        className={[
          "sticky z-20",
          isStuck ? "-top-4 sm:-top-6 lg:-top-8" : "top-0",
        ].join(" ")}
      >
        <div className={isStuck ? "-mx-4 sm:-mx-6 lg:-mx-8" : ""}>
          <motion.div
            className={[
              CARD_BASE_CLASS,
              isStuck ? "border-x-0 border-t-0 shadow-md" : "shadow-[var(--admin-card-shadow)]",
            ].join(" ")}
            animate={{ borderRadius: isStuck ? 0 : 16 }}
            transition={shellTransition}
          >
            <div
              className={[
                "flex flex-col sm:flex-row sm:justify-between",
                animateSticky ? "transition-[padding,gap] duration-150 ease-in-out" : "",
                isStuck
                  ? "gap-3 p-3 sm:items-center sm:px-6 sm:py-3"
                  : "gap-6 p-6 sm:items-start sm:p-8",
              ].join(" ")}
            >
              <div className={isStuck ? "flex min-w-0 items-center gap-3" : "flex min-w-0 items-start gap-5"}>
                <Link
                  href="/ports"
                  className={[
                    "flex shrink-0 cursor-pointer items-center justify-center self-center rounded-lg border border-zinc-200/80 bg-white/80 text-zinc-600 transition-colors hover:text-[var(--admin-accent)] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300",
                    isStuck ? "h-8 w-8" : "mt-1 h-9 w-9",
                  ].join(" ")}
                  aria-label="Volver a puertos"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex min-w-0 items-stretch gap-3 sm:gap-4">
                  <div
                    className={[
                      "flex shrink-0 items-center justify-center overflow-hidden border border-white/80 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900",
                      isStuck ? "rounded-lg" : "rounded-2xl",
                      animateSticky
                        ? "transition-[width,height,border-radius] duration-150 ease-in-out"
                        : "",
                    ].join(" ")}
                    style={{ width: logoSize, height: logoSize }}
                  >
                    {port.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={port.logo}
                        alt=""
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : (
                      <span
                        className="font-bold text-[var(--admin-accent)]/40"
                        style={{ fontSize: Math.max(logoSize * 0.38, 14) }}
                      >
                        {port.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div ref={textExpandedRef} className="min-w-0 flex flex-col">
                    <div ref={textCoreRef}>
                      <p
                        className={[
                          "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-semibold uppercase text-[var(--admin-accent)]",
                          isStuck ? "text-[10px] tracking-wide" : "text-xs tracking-widest",
                        ].join(" ")}
                      >
                        <CountryLabel country={port.country} />
                        {port.region ? <span>· {port.region}</span> : null}
                      </p>
                      <h1
                        className={[
                          "truncate font-bold tracking-tight text-zinc-900 dark:text-zinc-50",
                          isStuck ? "text-base" : "mt-1 text-2xl",
                        ].join(" ")}
                      >
                        {portDisplayName(port)}
                      </h1>
                      <div className={isStuck ? "mt-1 flex flex-wrap gap-1.5" : "mt-2 flex flex-wrap gap-2"}>
                        <span
                          className={[
                            "rounded-full bg-[var(--admin-accent)]/10 font-medium text-[var(--admin-accent)]",
                            isStuck ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
                          ].join(" ")}
                        >
                          {portStatusLabel(port.status)}
                        </span>
                        <span
                          className={[
                            "rounded-full bg-zinc-100 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                            isStuck ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
                          ].join(" ")}
                        >
                          {port.position_count} posiciones
                        </span>
                        {port.bollard_total > 0 && (
                          <span
                            className={[
                              "rounded-full bg-zinc-100 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                              isStuck ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
                            ].join(" ")}
                          >
                            {port.bollard_total} bitas
                          </span>
                        )}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {!isStuck && (
                        <motion.p
                          key="largest-vessel"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={fadeTransition}
                          className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <Ship
                            className="h-4 w-4 shrink-0 text-[var(--admin-accent)]"
                            strokeWidth={1.75}
                          />
                          <span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              Mayor barco atracado:{" "}
                            </span>
                            {largestVessel ?? "Sin registros"}
                          </span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div
                className={[
                  "flex shrink-0 flex-wrap gap-2 justify-end",
                  isStuck ? "self-center sm:self-center" : "w-full self-end sm:w-auto sm:self-start",
                ].join(" ")}
              >
                <DefaultButton type="button" onClick={onEdit}>
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </span>
                </DefaultButton>
                <ConfirmDeleteButton
                  deleteLabel={`el puerto ${port.name}`}
                  onDelete={onDelete}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                  ariaLabel="Eliminar puerto"
                  title="Eliminar puerto"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </ConfirmDeleteButton>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
