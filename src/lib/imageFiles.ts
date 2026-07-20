export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;

export const IMAGE_FILE_REJECT_MESSAGES = {
  oversized: "Cada imagen debe pesar menos de 20 MB.",
  invalid: "Selecciona una imagen JPG, PNG o WebP (no SVG).",
} as const;

const RASTER_MIME_PREFIXES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];

function isSupportedRasterImage(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (type.includes("svg") || name.endsWith(".svg")) return false;
  if (RASTER_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) return true;
  // Some browsers leave type empty for valid files — allow common extensions.
  return /\.(jpe?g|png|webp|gif)$/i.test(name);
}

export function filterImageFiles(files: FileList | File[] | null | undefined): File[] {
  if (!files) return [];
  const list = files instanceof FileList ? Array.from(files) : files;
  return list.filter(
    (file) => isSupportedRasterImage(file) && file.size <= MAX_IMAGE_UPLOAD_BYTES,
  );
}

export function hasOversizedImageFiles(files: FileList | File[] | null | undefined): boolean {
  if (!files) return false;
  const list = files instanceof FileList ? Array.from(files) : files;
  return list.some(
    (file) => isSupportedRasterImage(file) && file.size > MAX_IMAGE_UPLOAD_BYTES,
  );
}
