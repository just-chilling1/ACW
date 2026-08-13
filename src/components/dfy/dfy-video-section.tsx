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
      title="How to Use DFY Replies"
      description="Watch this quick walkthrough to save your offer link, pick your niche, and copy ready-made replies onto real Reddit threads."
      className={className}
      compact={compact}
    />
  );
}
