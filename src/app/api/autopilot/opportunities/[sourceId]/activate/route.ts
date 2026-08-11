import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import {
  activateSource,
  getMachineForUser,
  syncMachineAfterActivation,
} from "@/lib/traffic-machine/machine-service";
import { buildNextAction } from "@/lib/traffic-machine/rank";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";

type RouteContext = { params: Promise<{ sourceId: string }> };

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const { sourceId } = await context.params;
    const machine = await getMachineForUser(auth.supabase, auth.user.id);
    if (!machine) {
      return NextResponse.json({ error: "No Traffic Machine found." }, { status: 404 });
    }

    const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const activation = await activateSource(
      auth.supabase,
      machine.id,
      sourceId,
      body.promotionKit,
    );
    const synced = await syncMachineAfterActivation(auth.supabase, machine);
    const nextAction = buildNextAction(
      synced.machine,
      synced.scored,
      synced.activations.filter((a) => a.status === "active").length,
    );

    return NextResponse.json({
      activation,
      machine: synced.machine,
      nextAction,
    });
  } catch {
    return NextResponse.json({ error: "Could not activate opportunity." }, { status: 500 });
  }
}
