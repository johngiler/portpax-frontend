export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;

export const IMAGE_FILE_REJECT_MESSAGES = {
  oversized: "Cada imagen debe pesar menos de 20 MB.",
  invalid: "Selecciona archivos de imagen válidos.",
} as const;

export function filterImageFiles(files: FileList | File[] | null | undefined): File[] {
  if (!files) return [];
  const list = files instanceof FileList ? Array.from(files) : files;
  return list.filter(
    (file) => file.type.startsWith("image/") && file.size <= MAX_IMAGE_UPLOAD_BYTES,
  );
}

export function hasOversizedImageFiles(files: FileList | File[] | null | undefined): boolean {
  if (!files) return false;
  const list = files instanceof FileList ? Array.from(files) : files;
  return list.some(
    (file) => file.type.startsWith("image/") && file.size > MAX_IMAGE_UPLOAD_BYTES,
  );
}
