"use client";

import { GenerationProgress } from "@/components/ui/generation-progress";

const BUILD_MESSAGES = [
  "Analyzing your offer…",
  "Finding matching opportunities…",
  "Ranking traffic sources…",
  "Preparing your promotion plan…",
  "Building your Traffic Machine…",
];

interface MagicMomentProps {
  active: boolean;
}

export function MagicMoment({ active }: MagicMomentProps) {
  return (
    <GenerationProgress
      active={active}
      showBanner={false}
      label="Building your Traffic Machine…"
      statusMessages={BUILD_MESSAGES}
      statusIntervalMs={2800}
      scrollOnComplete={false}
    />
  );
}
