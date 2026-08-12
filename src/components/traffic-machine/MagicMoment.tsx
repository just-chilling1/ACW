"use client";

import { GenerationProgress } from "@/components/ui/generation-progress";

const BUILD_MESSAGES = [
  "Analyzing your offer…",
  "Matching traffic sources…",
  "Ranking the best places to submit…",
  "Preparing ready-to-paste content…",
  "Almost ready…",
];

interface MagicMomentProps {
  active: boolean;
}

export function MagicMoment({ active }: MagicMomentProps) {
  return (
    <GenerationProgress
      active={active}
      showBanner={false}
      label="Building your traffic list…"
      statusMessages={BUILD_MESSAGES}
      statusIntervalMs={2800}
      scrollOnComplete={false}
    />
  );
}
