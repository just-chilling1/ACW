/** Dashboard Track A videos (1–3). */
export type DashboardTrainingVideo = {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  priority?: boolean;
  visible?: boolean;
};

const THUMB_V = "20260731a";

export const DASHBOARD_TRAINING_VIDEOS: readonly DashboardTrainingVideo[] = [
  {
    id: "1213002067",
    title: "Watch This First",
    description:
      "Before you touch a single tool — watch this. It kills the night-one doubt and shows you exactly what you bought.",
    duration: "10+ min",
    thumbnail: `/thumbnails/thumb-d01-watch-this-first.webp?v=${THUMB_V}`,
    priority: true,
    visible: true,
  },
  {
    id: "1213002066",
    title: "How The Money Flows",
    description:
      "Where the money comes from, who pays you, and what every word inside AI CashWave actually means — in plain language.",
    duration: "10+ min",
    thumbnail: `/thumbnails/thumb-d02-how-the-money-flows.webp?v=${THUMB_V}`,
    visible: true,
  },
  {
    id: "1214179729",
    title: "Your 5-Minute Tour",
    description:
      "A quick walkthrough of where everything lives in the app — so you never feel lost when you start working.",
    duration: "3–5 min",
    thumbnail: `/thumbnails/thumb-d03-your-5-minute-tour.webp?v=${THUMB_V}`,
    visible: true,
  },
];

export function isPlayableVimeoId(id: string): boolean {
  return /^\d{7,}$/.test(id.trim());
}
