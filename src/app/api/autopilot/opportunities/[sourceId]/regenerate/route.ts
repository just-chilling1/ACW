import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import {
  getMachineForUser,
  upsertPendingPack,
} from "@/lib/traffic-machine/machine-service";
import { generateSubmissionPackWithAi } from "@/lib/traffic-machine/submission-pack";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";

type RouteContext = { params: Promise<{ sourceId: string }> };

export async function POST(_req: Request, context: RouteContext) {
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

    const pack = await generateSubmissionPackWithAi(
      source,
      machine.offer_url,
      machine.offer_snapshot,
    );
    await upsertPendingPack(auth.supabase, machine.id, sourceId, pack);

    return NextResponse.json({ submissionPack: pack, promotionKit: pack });
  } catch {
    return NextResponse.json({ error: "Could not regenerate submission pack." }, { status: 500 });
  }
}
