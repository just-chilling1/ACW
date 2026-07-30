import { getVimeoEmbedUrl } from "@/lib/vimeo";

const THUMB_V = "20260730a";

export const VIDEO_THUMBNAILS: Record<string, string> = {
  // Dashboard Track A (1–2 live; 3 pending)
  "1213002067": `/thumbnails/thumb-d01-watch-this-first.webp?v=${THUMB_V}`,
  "1213002066": `/thumbnails/thumb-d02-how-the-money-flows.webp?v=${THUMB_V}`,

  // Legacy training / premium (keep until full roster is wired)
  "1171466801": "/thumbnails/thumb-01-dashboard.webp",
  "1171473195": "/thumbnails/thumb-02-getting-started.webp",
  "1171474608": "/thumbnails/thumb-03-advanced.webp",
  "1171728175": "/thumbnails/thumb-04-dfy.webp",
  "1171734563": "/thumbnails/thumb-05-autopilot.webp",
  "1171721099": "/thumbnails/thumb-06-instant.webp",
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
