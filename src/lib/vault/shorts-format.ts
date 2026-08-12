import type { ShortsPlatformTag, ShortsScript } from "@/lib/vault/shorts-types";

const PLATFORM_LABELS: Record<ShortsPlatformTag, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
};

export function platformLabel(tag: ShortsPlatformTag): string {
  return PLATFORM_LABELS[tag];
}

export function formatHashtags(hashtags: string[]): string {
  return hashtags.map((tag) => `#${tag}`).join(" ");
}

/**
 * Plain text for pasting into a notes app or teleprompter.
 * Expects a script that already had its affiliate link substituted.
 */
export function formatScriptForCopy(script: ShortsScript): string {
  const platforms = script.platforms.map(platformLabel).join(" / ");
  const firstBeatStart = script.beats[0]?.timecode.split("-")[0] ?? "0:00";

  const beats = script.beats
    .map((beat) =>
      [
        beat.timecode,
        `Say: ${beat.voiceover}`,
        `On screen: ${beat.onScreen}`,
        `Show: ${beat.visual}`,
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `${script.title} — ${script.durationSeconds}s — ${platforms}`,
    "",
    `HOOK (0:00-${firstBeatStart})`,
    script.hook,
    "",
    beats,
    "",
    "CTA",
    script.cta,
    "",
    "CAPTION",
    script.caption,
    "",
    "HASHTAGS",
    formatHashtags(script.hashtags),
    "",
    "HOW TO SHOOT IT",
    script.visualStyle,
    "",
    "SOUND",
    script.soundNote,
  ].join("\n");
}
