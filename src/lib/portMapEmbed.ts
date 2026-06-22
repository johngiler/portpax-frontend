/** Google Maps embed URL — centers map and marker on exact coordinates. */
export function buildPortMapEmbedUrl(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  const point = `${lat},${lng}`;

  const params = new URLSearchParams({
    q: point,
    ll: point,
    hl: "es",
    z: "16",
    output: "embed",
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

export function parsePortCoordinates(
  latitude: string | null,
  longitude: string | null,
): { lat: number; lng: number } | null {
  if (latitude == null || longitude == null || latitude === "" || longitude === "") {
    return null;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
