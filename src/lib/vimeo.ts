/** Hide uploader name, avatar, title overlay, channel, and Vimeo badge. */
export function getVimeoEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    badge: "0",
    byline: "0",
    portrait: "0",
    title: "0",
    dnt: "1",
    transparent: "0",
    autopause: "0",
    pip: "0",
    playsinline: "1",
    controls: "1",
    sidedock: "0",
    player_id: "0",
    app_id: "58479",
  });
  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}
