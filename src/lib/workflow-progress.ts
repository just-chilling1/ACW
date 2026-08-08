/**
 * Workflow unlock level from SearchContext state.
 * Steps unlock strictly in order — later flags are ignored until earlier ones exist.
 *
 * 0 — only Step 1 open
 * 1 — Step 2 unlocked (Find Ads completed)
 * 2 — Step 3 unlocked (demand checked)
 * 3 — Step 4 unlocked (ads selected)
 */
export function getWorkflowProgress(
  step1Completed: boolean,
  hasAnalysis: boolean,
  hasSelectedAds: boolean
): number {
  if (!step1Completed) return 0;
  if (!hasAnalysis) return 1;
  if (!hasSelectedAds) return 2;
  return 3;
}

/** All workflow steps are always accessible. */
export function isWorkflowStepLocked(
  _requiresWorkflowStep: number | undefined,
  _workflowProgress: number
): boolean {
  return false;
}

/** Step N is completed only after the user has progressed past it. */
export function isWorkflowStepCompleted(
  stepIndex: number | undefined,
  workflowProgress: number
): boolean {
  if (!stepIndex) return false;
  return workflowProgress >= stepIndex;
}
