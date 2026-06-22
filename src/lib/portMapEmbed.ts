/** Google Maps embed URL for port coordinates (no API key required). */
export function buildPortMapEmbedUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    q: `${latitude},${longitude}`,
    hl: "es",
    z: "14",
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
