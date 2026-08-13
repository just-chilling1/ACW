import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import type { AudienceMode } from "@/lib/dfy/types";
import { TRAFFIC_SOURCES } from "./sources";
import { parseTrafficMidpoint, scoreAllOpportunities, summarizeOpportunities } from "./scoring";
import { generateSevenDayPlan, refreshPlanStatuses } from "./seven-day-plan";
import { defaultExperiments } from "./health";
import { deriveStage } from "./stage";
import {
  buildSubmissionPack,
  generateSubmissionPackWithAi,
  weekOneSourceIds,
} from "./submission-pack";
import type {
  ActivationRow,
  ActivationStatus,
  MachineBuildProgress,
  MachineBuildStage,
  SubmissionPack,
  TrafficGoal,
  TrafficMachineRow,
} from "./types";

const AI_PACK_BUDGET = 5;

async function setBuildProgress(
  supabase: SupabaseClient,
  machineId: string,
  meta: Record<string, unknown>,
  progress: MachineBuildProgress,
) {
  const { data, error } = await supabase
    .from("traffic_machines")
    .update({
      status: "building",
      meta: { ...meta, build_progress: progress },
      updated_at: new Date().toISOString(),
    })
    .eq("id", machineId)
    .select("*")
    .single();
  if (error) throw error;
  return data as TrafficMachineRow;
}

function advanceProgress(
  completed: MachineBuildStage[],
  current: MachineBuildStage,
): MachineBuildProgress {
  return { currentStage: current, completedStages: completed };
}

export async function getMachineForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("traffic_machines")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as TrafficMachineRow | null;
}

export async function getActivations(supabase: SupabaseClient, machineId: string) {
  const { data, error } = await supabase
    .from("traffic_machine_activations")
    .select("*")
    .eq("machine_id", machineId);
  if (error) throw error;
  return (data || []) as ActivationRow[];
}

export async function upsertMachine(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<TrafficMachineRow> & { offer_url?: string },
) {
  const existing = await getMachineForUser(supabase, userId);
  if (existing) {
    const { data, error } = await supabase
      .from("traffic_machines")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as TrafficMachineRow;
  }

  const { data, error } = await supabase
    .from("traffic_machines")
    .insert({
      user_id: userId,
      offer_url: patch.offer_url || "",
      offer_snapshot: patch.offer_snapshot || {},
      audience_niche: patch.audience_niche || "not_sure",
      goal: patch.goal || "passive",
      stage: "discover",
      status: patch.status || "setup",
      plan: patch.plan || { days: [] },
      experiments: patch.experiments || [],
      meta: patch.meta || {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as TrafficMachineRow;
}

export async function upsertPendingPack(
  supabase: SupabaseClient,
  machineId: string,
  sourceId: string,
  pack: SubmissionPack,
  status: ActivationStatus = "pending",
) {
  const existing = await supabase
    .from("traffic_machine_activations")
    .select("id, status")
    .eq("machine_id", machineId)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (existing.data?.status === "active") {
    const { data, error } = await supabase
      .from("traffic_machine_activations")
      .update({ promotion_kit: pack })
      .eq("id", existing.data.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as ActivationRow;
  }

  const { data, error } = await supabase
    .from("traffic_machine_activations")
    .upsert(
      {
        machine_id: machineId,
        source_id: sourceId,
        status: existing.data?.status === "dismissed" ? "dismissed" : status,
        promotion_kit: pack,
      },
      { onConflict: "machine_id,source_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as ActivationRow;
}

export async function buildMachine(
  supabase: SupabaseClient,
  userId: string,
  offerUrl: string,
  audienceNiche: string,
  goal: TrafficGoal = "passive",
) {
  let machine = await getMachineForUser(supabase, userId);
  if (!machine) {
    machine = await upsertMachine(supabase, userId, {
      offer_url: offerUrl,
      audience_niche: audienceNiche,
      goal,
      status: "building",
      meta: { build_progress: advanceProgress([], "understand_offer") },
    });
  } else {
    machine = await setBuildProgress(supabase, machine.id, machine.meta || {}, {
      currentStage: "understand_offer",
      completedStages: [],
    });
  }

  let completed: MachineBuildStage[] = [];

  const audienceMode = (audienceNiche === "not_sure" ? "auto" : audienceNiche) as AudienceMode;
  const snapshot = await analyzeOffer(offerUrl, audienceMode);
  const resolvedAudience =
    audienceNiche === "not_sure" && snapshot.recommendedAudienceMode
      ? snapshot.recommendedAudienceMode
      : audienceNiche;

  completed = ["understand_offer"];
  machine = await setBuildProgress(supabase, machine.id, machine.meta || {}, {
    currentStage: "match_channels",
    completedStages: completed,
  });

  const activations = await getActivations(supabase, machine.id);
  const activatedIds = new Set(activations.filter((a) => a.status === "active").map((a) => a.source_id));
  const dismissedIds = new Set(
    activations.filter((a) => a.status === "dismissed").map((a) => a.source_id),
  );

  const scored = scoreAllOpportunities(
    TRAFFIC_SOURCES,
    resolvedAudience,
    goal,
    activatedIds,
    snapshot,
  ).map((o) => ({
    ...o,
    activationStatus: dismissedIds.has(o.source.id)
      ? ("dismissed" as const)
      : o.activated
        ? ("active" as const)
        : undefined,
  }));

  completed = [...completed, "match_channels"];
  machine = await setBuildProgress(supabase, machine.id, machine.meta || {}, {
    currentStage: "build_plan",
    completedStages: completed,
  });

  const planDays = generateSevenDayPlan(scored, activatedIds);
  const experiments = defaultExperiments(scored);
  const weekIds = weekOneSourceIds(planDays);

  completed = [...completed, "build_plan"];
  machine = await setBuildProgress(supabase, machine.id, machine.meta || {}, {
    currentStage: "write_submissions",
    completedStages: completed,
  });

  const sourceById = new Map(TRAFFIC_SOURCES.map((s) => [s.id, s]));
  const whyById = new Map(scored.map((s) => [s.source.id, s.reasons[0]]));

  // Fast template packs for the full week
  for (const sourceId of weekIds) {
    const source = sourceById.get(sourceId);
    if (!source) continue;
    if (activatedIds.has(sourceId)) continue;
    const pack = buildSubmissionPack(source, offerUrl, snapshot, whyById.get(sourceId));
    await upsertPendingPack(supabase, machine.id, sourceId, pack, "pending");
  }

  // AI-upgrade the first few sources (budget-capped)
  const machineId = machine.id;
  const aiTargets = weekIds.filter((id) => !activatedIds.has(id)).slice(0, AI_PACK_BUDGET);
  await Promise.all(
    aiTargets.map(async (sourceId) => {
      const source = sourceById.get(sourceId);
      if (!source) return;
      try {
        const pack = await generateSubmissionPackWithAi(
          source,
          offerUrl,
          snapshot,
          whyById.get(sourceId),
        );
        await upsertPendingPack(supabase, machineId, sourceId, pack, "pending");
      } catch {
        // keep fallback pack
      }
    }),
  );

  completed = [...completed, "write_submissions"];
  machine = await setBuildProgress(supabase, machine.id, machine.meta || {}, {
    currentStage: "finalize",
    completedStages: completed,
  });

  const stage = deriveStage(activatedIds.size, scored.length, "ready");
  const finalProgress: MachineBuildProgress = {
    completedStages: [...completed, "finalize"],
    currentStage: undefined,
  };

  const { data, error } = await supabase
    .from("traffic_machines")
    .update({
      offer_url: offerUrl,
      offer_snapshot: snapshot,
      audience_niche: resolvedAudience,
      goal,
      status: "ready",
      stage,
      plan: { days: planDays },
      experiments,
      meta: {
        ...(machine.meta || {}),
        build_progress: finalProgress,
        week_one_source_ids: weekIds,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", machine.id)
    .select("*")
    .single();
  if (error) throw error;

  const freshActivations = await getActivations(supabase, machine.id);

  return {
    machine: data as TrafficMachineRow,
    summary: summarizeOpportunities(scored),
    scored,
    activations: freshActivations,
  };
}

export async function activateSource(
  supabase: SupabaseClient,
  machineId: string,
  sourceId: string,
  promotionKit?: unknown,
) {
  const { data, error } = await supabase
    .from("traffic_machine_activations")
    .upsert(
      {
        machine_id: machineId,
        source_id: sourceId,
        status: "active",
        activated_at: new Date().toISOString(),
        promotion_kit: promotionKit || null,
      },
      { onConflict: "machine_id,source_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as ActivationRow;
}

export async function dismissSource(
  supabase: SupabaseClient,
  machineId: string,
  sourceId: string,
) {
  const { data, error } = await supabase
    .from("traffic_machine_activations")
    .upsert(
      {
        machine_id: machineId,
        source_id: sourceId,
        status: "dismissed",
      },
      { onConflict: "machine_id,source_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as ActivationRow;
}

export async function syncMachineAfterActivation(
  supabase: SupabaseClient,
  machine: TrafficMachineRow,
) {
  const activations = await getActivations(supabase, machine.id);
  const activatedIds = new Set(activations.filter((a) => a.status === "active").map((a) => a.source_id));
  const scored = scoreAllOpportunities(
    TRAFFIC_SOURCES,
    machine.audience_niche,
    machine.goal,
    activatedIds,
    machine.offer_snapshot,
  );
  const planDays = refreshPlanStatuses(machine.plan?.days || [], activatedIds);
  const stage = deriveStage(activatedIds.size, scored.length, machine.status);

  const { data, error } = await supabase
    .from("traffic_machines")
    .update({
      plan: { days: planDays },
      stage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", machine.id)
    .select("*")
    .single();
  if (error) throw error;
  return { machine: data as TrafficMachineRow, scored, activations };
}

export async function importLegacyActivations(
  supabase: SupabaseClient,
  machineId: string,
  sourceIds: string[],
) {
  if (sourceIds.length === 0) return;
  const rows = sourceIds.map((source_id) => ({
    machine_id: machineId,
    source_id,
    status: "active" as const,
    activated_at: new Date().toISOString(),
  }));
  await supabase.from("traffic_machine_activations").upsert(rows, { onConflict: "machine_id,source_id" });
}

export function estimateMonthlyVisitors(activeSourceIds: string[]): number {
  return activeSourceIds.reduce((sum, id) => {
    const source = TRAFFIC_SOURCES.find((s) => s.id === id);
    if (!source) return sum;
    return sum + parseTrafficMidpoint(source.traffic);
  }, 0);
}

export function getBuildProgressFromMachine(machine: TrafficMachineRow | null): MachineBuildProgress {
  const raw = machine?.meta?.build_progress;
  if (!raw || typeof raw !== "object") {
    return { completedStages: [] };
  }
  const progress = raw as MachineBuildProgress;
  return {
    currentStage: progress.currentStage,
    completedStages: Array.isArray(progress.completedStages) ? progress.completedStages : [],
    error: progress.error,
  };
}
