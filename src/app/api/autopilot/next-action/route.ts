import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getActivations, getMachineForUser } from "@/lib/traffic-machine/machine-service";
import { buildNextAction } from "@/lib/traffic-machine/rank";
import { scoreAllOpportunities } from "@/lib/traffic-machine/scoring";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const machine = await getMachineForUser(auth.supabase, auth.user.id);
    if (!machine) {
      return NextResponse.json({
        nextAction: buildNextAction(null, [], 0),
      });
    }

    const activations = await getActivations(auth.supabase, machine.id);
    const activatedIds = new Set(
      activations.filter((a) => a.status === "active").map((a) => a.source_id),
    );
    const dismissedIds = new Set(
      activations.filter((a) => a.status === "dismissed").map((a) => a.source_id),
    );
    const scored = scoreAllOpportunities(
      TRAFFIC_SOURCES,
      machine.audience_niche,
      machine.goal,
      activatedIds,
      machine.offer_snapshot,
    ).map((o) => ({
      ...o,
      activationStatus: dismissedIds.has(o.source.id)
        ? ("dismissed" as const)
        : o.activated
          ? ("active" as const)
          : undefined,
    }));

    return NextResponse.json({
      nextAction: buildNextAction(machine, scored, activatedIds.size, dismissedIds),
    });
  } catch {
    return NextResponse.json({ error: "Could not determine next action." }, { status: 500 });
  }
}
