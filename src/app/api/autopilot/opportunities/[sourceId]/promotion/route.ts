import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import {
  getActivations,
  getMachineForUser,
  upsertPendingPack,
} from "@/lib/traffic-machine/machine-service";
import {
  buildSubmissionPack,
  coerceSubmissionPack,
  generateSubmissionPackWithAi,
} from "@/lib/traffic-machine/submission-pack";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";

type RouteContext = { params: Promise<{ sourceId: string }> };

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { sourceId } = await context.params;

  try {
    const machine = await getMachineForUser(auth.supabase, auth.user.id);
    if (!machine) {
      return NextResponse.json({ error: "No Traffic Machine found." }, { status: 404 });
    }

    const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const useAi = body.useAi !== false;
    const force = body.force === true;

    const activations = await getActivations(auth.supabase, machine.id);
    const existing = activations.find((a) => a.source_id === sourceId);

    if (existing?.promotion_kit && !force) {
      const pack = coerceSubmissionPack(
        existing.promotion_kit,
        source,
        machine.offer_url,
        machine.offer_snapshot,
      );
      return NextResponse.json({ submissionPack: pack, promotionKit: pack });
    }

    const pack = useAi
      ? await generateSubmissionPackWithAi(source, machine.offer_url, machine.offer_snapshot)
      : buildSubmissionPack(source, machine.offer_url, machine.offer_snapshot);

    await upsertPendingPack(
      auth.supabase,
      machine.id,
      sourceId,
      pack,
      existing?.status === "active" ? "active" : existing?.status === "dismissed" ? "dismissed" : "pending",
    );

    return NextResponse.json({ submissionPack: pack, promotionKit: pack });
  } catch {
    try {
      const machine = await getMachineForUser(auth.supabase, auth.user.id);
      const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
      if (machine && source) {
        const pack = buildSubmissionPack(source, machine.offer_url, machine.offer_snapshot);
        return NextResponse.json({ submissionPack: pack, promotionKit: pack });
      }
    } catch {
      // fall through
    }
    return NextResponse.json({ error: "Could not generate submission pack." }, { status: 500 });
  }
}
