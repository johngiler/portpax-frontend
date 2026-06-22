export function filterImageFiles(files: FileList | File[] | null | undefined): File[] {
  if (!files) return [];
  const list = files instanceof FileList ? Array.from(files) : files;
  return list.filter((file) => file.type.startsWith("image/"));
}
