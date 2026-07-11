type CoverImageRecord = {
  id: number;
  image: string;
  is_cover: boolean;
};

type SyncCoverImageOptions = {
  entityId: number;
  images: CoverImageRecord[];
  coverUrl?: string | null;
  imageFile?: File | null;
  removeImage?: boolean;
  createImage: (
    entityId: number,
    file: File,
    options: { isCover: boolean },
  ) => Promise<unknown>;
  deleteImage: (imageId: number) => Promise<void>;
};

function resolveCoverImageId(
  images: CoverImageRecord[],
  coverUrl?: string | null,
): number | null {
  if (!images.length) return null;
  const byFlag = images.find((img) => img.is_cover);
  if (byFlag) return byFlag.id;
  if (coverUrl) {
    const byUrl = images.find((img) => img.image === coverUrl);
    if (byUrl) return byUrl.id;
  }
  return images[0].id;
}

/** Replace or remove the cover image for berth/position gallery models. */
export async function syncCoverImage({
  entityId,
  images,
  coverUrl,
  imageFile,
  removeImage,
  createImage,
  deleteImage,
}: SyncCoverImageOptions): Promise<void> {
  if (imageFile) {
    const coverId = resolveCoverImageId(images, coverUrl);
    if (coverId) await deleteImage(coverId);
    await createImage(entityId, imageFile, { isCover: true });
    return;
  }
  if (removeImage) {
    const coverId = resolveCoverImageId(images, coverUrl);
    if (coverId) await deleteImage(coverId);
  }
}
