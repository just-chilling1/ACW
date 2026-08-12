import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import {
  activateSource,
  deactivateSource,
  ensureMachineForUser,
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
    const machine = await ensureMachineForUser(auth.supabase, auth.user.id);

    const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const done = body.done !== false;
    const activation = done
      ? await activateSource(auth.supabase, machine.id, sourceId, body.promotionKit)
      : await deactivateSource(auth.supabase, machine.id, sourceId);
    const synced = await syncMachineAfterActivation(auth.supabase, machine);
    const nextAction = buildNextAction(
      synced.machine,
      synced.scored,
      synced.activations.filter((a) => a.status === "active").length,
    );

    return NextResponse.json({
      activation,
      machine: synced.machine,
      activations: synced.activations,
      nextAction,
    });
  } catch {
    return NextResponse.json({ error: "Could not activate opportunity." }, { status: 500 });
  }
}
