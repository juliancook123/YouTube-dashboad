export function studioImageSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return `/api/image?url=${encodeURIComponent(src)}`;
  }
  return src;
}
