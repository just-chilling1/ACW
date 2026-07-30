/**
 * Workflow unlock level from SearchContext state.
 * Steps unlock strictly in order — later flags are ignored until earlier ones exist.
 *
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
  if (!hasVariations) return 0;
  if (!hasAnalysis) return 1;
  if (!hasSelectedAds) return 2;
  return 3;
}

/** Locked until workflowProgress >= requiresWorkflowStep. */
export function isWorkflowStepLocked(
  requiresWorkflowStep: number | undefined,
  workflowProgress: number
): boolean {
  if (!requiresWorkflowStep) return false;
  return workflowProgress < requiresWorkflowStep;
}

/** Step N is completed only after the user has progressed past it. */
export function isWorkflowStepCompleted(
  stepIndex: number | undefined,
  workflowProgress: number
): boolean {
  if (!stepIndex) return false;
  return workflowProgress >= stepIndex;
}
