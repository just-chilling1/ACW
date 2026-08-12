import type { NicheId } from "@/lib/niches";

export type ShortsPlatformTag = "tiktok" | "reels" | "shorts";

export type ShortsBeat = {
  /** Inclusive start to exclusive end, e.g. "0:04-0:12". */
  timecode: string;
  /** What the voice says over this beat. */
  voiceover: string;
  /** The text overlay burned onto the screen. */
  onScreen: string;
  /** The b-roll, stock clip, or screen-recording direction. */
  visual: string;
};

export type ShortsScript = {
  id: string;
  nicheId: NicheId;
  /** The specific take, e.g. "Beginner mistake". */
  angle: string;
  /** The structural template, e.g. "Three mistakes". */
  format: string;
  title: string;
  platforms: ShortsPlatformTag[];
  durationSeconds: number;
  /** Spoken from 0:00 until the first beat starts. Never contains __LINK__. */
  hook: string;
  beats: ShortsBeat[];
  /** Spoken close. Points to the bio. Never contains __LINK__. */
  cta: string;
  /** Post caption. Contains __LINK__ exactly once. */
  caption: string;
  /** No leading "#" and no whitespace. */
  hashtags: string[];
  visualStyle: string;
  soundNote: string;
};
