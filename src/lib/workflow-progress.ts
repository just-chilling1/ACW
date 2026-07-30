/**
 * Workflow unlock level from SearchContext state.
 * 0 — only Step 1 open
 * 1 — Step 2 unlocked (topic CTA completed → variations)
 * 2 — Step 3 unlocked (demand checked)
 * 3 — Step 4 unlocked (ads selected)
 */
export function getWorkflowProgress(
  hasVariations: boolean,
  hasAnalysis: boolean,
  hasSelectedAds: boolean
): number {
  if (hasSelectedAds) return 3;
  if (hasAnalysis) return 2;
  if (hasVariations) return 1;
  return 0;
}

/** Locked until workflowProgress >= requiresWorkflowStep. */
export function isWorkflowStepLocked(
  requiresWorkflowStep: number | undefined,
  workflowProgress: number
): boolean {
  if (!requiresWorkflowStep) return false;
  return workflowProgress < requiresWorkflowStep;
}
