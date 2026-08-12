"use client";

import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";

export const DFY_VIDEO_ID = "1214651948";

type DfyVideoSectionProps = {
  className?: string;
  compact?: boolean;
};

export function DfyVideoSection({ className, compact }: DfyVideoSectionProps) {
  return (
    <TutorialVideoSection
      videoId={DFY_VIDEO_ID}
      title="How to Build Your Campaign"
      description="Watch this quick walkthrough to paste your offer, pick your niche audience, and let Cashwave build your full promotional campaign."
      className={className}
      compact={compact}
    />
  );
}
