import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { isSafeHttpUrl } from "@/lib/safe-url";
import {
  getActivations,
  getMachineForUser,
  importLegacyActivations,
  upsertMachine,
} from "@/lib/traffic-machine/machine-service";
import { scoreAllOpportunities, summarizeOpportunities } from "@/lib/traffic-machine/scoring";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";
import type { TrafficGoal, TrafficMachineRow } from "@/lib/traffic-machine/types";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const machine = await getMachineForUser(auth.supabase, auth.user.id);
    if (!machine) {
      return NextResponse.json({ machine: null, activations: [], summary: null });
    }

    const activations = await getActivations(auth.supabase, machine.id);
    const activatedIds = new Set(
      activations.filter((a) => a.status === "active").map((a) => a.source_id),
    );
    const scored = scoreAllOpportunities(
      TRAFFIC_SOURCES,
      machine.audience_niche,
      machine.goal,
      activatedIds,
      machine.offer_snapshot,
    );

    return NextResponse.json({
      machine,
      activations,
      summary: summarizeOpportunities(scored),
      activatedCount: activatedIds.size,
    });
  } catch {
    return NextResponse.json({ error: "Could not load Traffic Machine." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const offerUrl = clampString(body.offerUrl, 500);
    const legacyIds = Array.isArray(body.legacyCompletedIds)
      ? body.legacyCompletedIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 100)
      : [];

    if (offerUrl && !isSafeHttpUrl(offerUrl)) {
      return NextResponse.json({ error: "Please enter a valid URL." }, { status: 400 });
    }

    const patch: Partial<TrafficMachineRow> = {};
    if (offerUrl) patch.offer_url = offerUrl;
    if (typeof body.audienceNiche === "string") {
      patch.audience_niche = clampString(body.audienceNiche, 40) || "not_sure";
    }
    if (typeof body.goal === "string" && body.goal) {
      patch.goal = clampString(body.goal, 20) as TrafficGoal;
    }

    const machine = await upsertMachine(auth.supabase, auth.user.id, patch);

    if (legacyIds.length > 0 && !machine.meta?.legacy_migrated) {
      await importLegacyActivations(auth.supabase, machine.id, legacyIds);
      await auth.supabase
        .from("traffic_machines")
        .update({
          meta: { ...machine.meta, legacy_migrated: true },
          updated_at: new Date().toISOString(),
        })
        .eq("id", machine.id);
    }

    return NextResponse.json({ machine });
  } catch {
    return NextResponse.json({ error: "Could not save Traffic Machine." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const existing = await getMachineForUser(auth.supabase, auth.user.id);

    const patch: Partial<TrafficMachineRow> = {};
    if (typeof body.offerUrl === "string") {
      const offerUrl = clampString(body.offerUrl, 500);
      if (offerUrl && !isSafeHttpUrl(offerUrl)) {
        return NextResponse.json({ error: "Please enter a valid URL." }, { status: 400 });
      }
      patch.offer_url = offerUrl;
    }
    if (typeof body.audienceNiche === "string") {
      patch.audience_niche = clampString(body.audienceNiche, 40) || "not_sure";
    }
    if (typeof body.goal === "string") patch.goal = clampString(body.goal, 20) as TrafficGoal;
    if (typeof body.stage === "string") patch.stage = clampString(body.stage, 20) as TrafficMachineRow["stage"];
    if (typeof body.status === "string") patch.status = clampString(body.status, 20) as TrafficMachineRow["status"];
    if (body.plan) patch.plan = body.plan;
    if (body.experiments) patch.experiments = body.experiments;
    if (body.meta) patch.meta = { ...(existing?.meta || {}), ...body.meta };

    const machine = await upsertMachine(auth.supabase, auth.user.id, patch);
    return NextResponse.json({ machine });
  } catch {
    return NextResponse.json({ error: "Could not update Traffic Machine." }, { status: 500 });
  }
}
