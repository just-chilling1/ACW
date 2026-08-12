import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import type { AudienceMode } from "@/lib/dfy/types";
import { TRAFFIC_SOURCES } from "./sources";
import { scoreAllOpportunities, summarizeOpportunities } from "./scoring";
import { generateSevenDayPlan, refreshPlanStatuses } from "./seven-day-plan";
import { defaultExperiments } from "./health";
import { deriveStage } from "./stage";
import type { ActivationRow, TrafficGoal, TrafficMachineRow } from "./types";

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
      goal: patch.goal || "visitors",
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

export async function buildMachine(
  supabase: SupabaseClient,
  userId: string,
  offerUrl: string,
  audienceNiche: string,
  goal: TrafficGoal,
) {
  let machine = await getMachineForUser(supabase, userId);
  if (!machine) {
    machine = await upsertMachine(supabase, userId, {
      offer_url: offerUrl,
      audience_niche: audienceNiche,
      goal,
      status: "building",
    });
  } else {
    const { data, error } = await supabase
      .from("traffic_machines")
      .update({ status: "building", updated_at: new Date().toISOString() })
      .eq("id", machine.id)
      .select("*")
      .single();
    if (error) throw error;
    machine = data as TrafficMachineRow;
  }

  const audienceMode = (audienceNiche === "not_sure" ? "auto" : audienceNiche) as AudienceMode;
  const snapshot = await analyzeOffer(offerUrl, audienceMode);
  const resolvedAudience =
    audienceNiche === "not_sure" && snapshot.recommendedAudienceMode
      ? snapshot.recommendedAudienceMode
      : audienceNiche;

  const activations = await getActivations(supabase, machine.id);
  const activatedIds = new Set(activations.filter((a) => a.status === "active").map((a) => a.source_id));

  const scored = scoreAllOpportunities(TRAFFIC_SOURCES, resolvedAudience, goal, activatedIds, snapshot);
  const planDays = generateSevenDayPlan(scored, activatedIds);
  const experiments = defaultExperiments(scored);
  const stage = deriveStage(activatedIds.size, scored.length, "ready");

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
      updated_at: new Date().toISOString(),
    })
    .eq("id", machine.id)
    .select("*")
    .single();
  if (error) throw error;

  return {
    machine: data as TrafficMachineRow,
    summary: summarizeOpportunities(scored),
    scored,
  };
}

export async function ensureMachineForUser(supabase: SupabaseClient, userId: string) {
  const existing = await getMachineForUser(supabase, userId);
  if (existing) return existing;
  return upsertMachine(supabase, userId, { status: "setup" });
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

export async function deactivateSource(
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
        status: "pending",
        activated_at: null,
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
