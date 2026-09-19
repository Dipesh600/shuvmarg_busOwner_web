export const PHOTO_VIEWS = ["FRONT", "SIDE", "BACK", "INSIDE"] as const;
export type PhotoView = typeof PHOTO_VIEWS[number];
export type PhotoFiles = Partial<Record<PhotoView, File>>;
export function validatePhotoFile(file: { size: number; type: string; name: string }): string | null {
  if (!file.size || file.size > 5 * 1024 * 1024) return "Choose a non-empty photo of 5 MB or less.";
  const mime = ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, string>)[file.name.split(".").pop()?.toLowerCase() || ""];
  return mime && mime === file.type ? null : "Choose a JPG, PNG, or WebP photo.";
}
