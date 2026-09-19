export const MAX_VIDEO_BYTES = 20_000_000;
export function validateVideoFile(file: { size: number; name: string; type: string }): string | null {
  if (!file.size || file.size > MAX_VIDEO_BYTES) return "Choose a non-empty video of 20 MB or less.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!(extension === "mp4" && file.type === "video/mp4" || extension === "mov" && file.type === "video/quicktime")) return "Choose an MP4 or MOV video.";
  return null;
}
