import type { MachineProgression, MachineStage, TrafficMachineRow } from "./types";

export function deriveStage(activatedCount: number, totalOpportunities: number, status: TrafficMachineRow["status"]): MachineStage {
  if (status !== "ready") return "discover";
  if (activatedCount === 0) return "discover";
  const pct = totalOpportunities > 0 ? activatedCount / totalOpportunities : 0;
  if (pct < 0.15) return "activate";
  if (pct < 0.5) return "grow";
  return "optimize";
}

export function buildProgression(
  activatedCount: number,
  totalOpportunities: number,
  status: TrafficMachineRow["status"],
): MachineProgression {
  const stage = deriveStage(activatedCount, totalOpportunities, status);
  const activatePct = totalOpportunities > 0 ? Math.round((activatedCount / totalOpportunities) * 100) : 0;
  const growPct = Math.min(100, Math.max(0, activatePct * 2 - 20));

  return {
    discover: status === "ready" ? "complete" : stage === "discover" ? "current" : "locked",
    activate:
      stage === "activate"
        ? activatePct
        : stage === "discover"
          ? "locked"
          : "complete",
    grow:
      stage === "grow"
        ? growPct
        : ["discover", "activate"].includes(stage)
          ? "locked"
          : "complete",
    optimize: stage === "optimize" ? "current" : activatePct >= 50 ? "current" : "locked",
  };
}
