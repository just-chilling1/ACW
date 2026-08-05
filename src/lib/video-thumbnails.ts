import { getVimeoEmbedUrl } from "@/lib/vimeo";

const THUMB_V = "20260805a";

export const VIDEO_THUMBNAILS: Record<string, string> = {
  // Dashboard Track A
  "1213002067": `/thumbnails/thumb-d01-watch-this-first.webp?v=${THUMB_V}`,
  "1213002066": `/thumbnails/thumb-d02-how-the-money-flows.webp?v=${THUMB_V}`,
  "1214179729": `/thumbnails/thumb-d03-your-5-minute-tour.webp?v=${THUMB_V}`,

  // Academy Track B (4–5)
  "1214645007": `/thumbnails/thumb-a04-check-demand.webp?v=${THUMB_V}`,
  "1214645006": `/thumbnails/thumb-a05-find-ads-reply.webp?v=${THUMB_V}`,

  // Premium (6–8)
  "1214651948": `/thumbnails/thumb-a06-done-for-you.webp?v=${THUMB_V}`,
  "1214657449": `/thumbnails/thumb-a07-instant-income.webp?v=${THUMB_V}`,
  "1214661265": `/thumbnails/thumb-a08-automated-profits.webp?v=${THUMB_V}`,
};

const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

export function getVideoThumbnail(videoUrl: string): string | null {
  const match = videoUrl.match(VIMEO_ID_REGEX);
  if (!match) return null;
  return VIDEO_THUMBNAILS[match[1]] ?? null;
}

export function getVideoThumbnailById(id: string): string | null {
  return VIDEO_THUMBNAILS[id] ?? null;
}

/** Turn a Vimeo URL/id into an embed URL with uploader/channel chrome hidden. */
export function toEmbedUrl(videoUrl: string, autoplay = true): string {
  const match = videoUrl.match(VIMEO_ID_REGEX);
  const id = match?.[1] ?? videoUrl.replace(/\D/g, "");
  const base = getVimeoEmbedUrl(id);
  return autoplay ? `${base}&autoplay=1` : base;
}
