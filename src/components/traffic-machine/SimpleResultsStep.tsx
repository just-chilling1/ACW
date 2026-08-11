"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface SimpleResultsStepProps {
  activatedCount: number;
  bestSourceName?: string;
  nextTaskTitle?: string;
  onBack: () => void;
  onDoAnother: () => void;
}

export function SimpleResultsStep({
  activatedCount,
  bestSourceName,
  nextTaskTitle,
  onBack,
  onDoAnother,
}: SimpleResultsStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="ds-h4">Here&apos;s what you&apos;ve done</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Keep going — one task at a time is how the machine grows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="surface-well-lg p-4">
          <p className="text-xs text-text-muted">Opportunities activated</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{activatedCount}</p>
        </div>
        <div className="surface-well-lg p-4">
          <p className="text-xs text-text-muted">Best source so far</p>
          <p className="mt-1 text-lg font-semibold text-text-primary">{bestSourceName || "Finish a task to find out"}</p>
        </div>
      </div>

      {nextTaskTitle && (
        <p className="text-sm text-text-secondary">
          Tomorrow / next: <span className="font-medium text-text-primary">{nextTaskTitle}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="btn-secondary">
          <ArrowLeft size={14} />
          Back
        </button>
        <button type="button" onClick={onDoAnother} className="btn-primary">
          Do another task
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
