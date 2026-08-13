import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import {
  getActivations,
  getMachineForUser,
  importLegacyActivations,
  upsertMachine,
} from "@/lib/traffic-machine/machine-service";
import { scoreAllOpportunities, summarizeOpportunities } from "@/lib/traffic-machine/scoring";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";
import type { TrafficGoal } from "@/lib/traffic-machine/types";

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
    const audienceNiche = clampString(body.audienceNiche, 40) || "not_sure";
    const goal = (clampString(body.goal, 20) || "visitors") as TrafficGoal;
    const legacyIds = Array.isArray(body.legacyCompletedIds)
      ? body.legacyCompletedIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 100)
      : [];

    if (offerUrl) {
      try {
        new URL(offerUrl);
      } catch {
        return NextResponse.json({ error: "Please enter a valid URL." }, { status: 400 });
      }
    }

    const machine = await upsertMachine(auth.supabase, auth.user.id, {
      offer_url: offerUrl,
      audience_niche: audienceNiche,
      goal,
      status: offerUrl ? "setup" : "setup",
    });

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
    const machine = await getMachineForUser(auth.supabase, auth.user.id);
    if (!machine) {
      return NextResponse.json({ error: "No Traffic Machine found." }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.offerUrl) patch.offer_url = clampString(body.offerUrl, 500);
    if (body.audienceNiche) patch.audience_niche = clampString(body.audienceNiche, 40);
    if (body.goal) patch.goal = clampString(body.goal, 20);
    if (body.stage) patch.stage = clampString(body.stage, 20);
    if (body.status) patch.status = clampString(body.status, 20);
    if (body.plan) patch.plan = body.plan;
    if (body.experiments) patch.experiments = body.experiments;
    if (body.meta) patch.meta = { ...machine.meta, ...body.meta };

    const { data, error } = await auth.supabase
      .from("traffic_machines")
      .update(patch)
      .eq("id", machine.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Could not update Traffic Machine." }, { status: 500 });
    return NextResponse.json({ machine: data });
  } catch {
    return NextResponse.json({ error: "Could not update Traffic Machine." }, { status: 500 });
  }
}
