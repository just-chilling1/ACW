import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getActivations, getMachineForUser } from "@/lib/traffic-machine/machine-service";
import { scoreAllOpportunities } from "@/lib/traffic-machine/scoring";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const machine = await getMachineForUser(auth.supabase, auth.user.id);
    if (!machine) {
      return NextResponse.json({ opportunities: [] });
    }

    const activations = await getActivations(auth.supabase, machine.id);
    const activatedIds = new Set(
      activations.filter((a) => a.status === "active").map((a) => a.source_id),
    );
    const activationMap = new Map(activations.map((a) => [a.source_id, a]));

    const scored = scoreAllOpportunities(
      TRAFFIC_SOURCES,
      machine.audience_niche,
      machine.goal,
      activatedIds,
      machine.offer_snapshot,
    ).map((s) => ({
      ...s,
      activationStatus: activationMap.get(s.source.id)?.status,
    }));

    return NextResponse.json({ opportunities: scored });
  } catch {
    return NextResponse.json({ error: "Could not load opportunities." }, { status: 500 });
  }
}
