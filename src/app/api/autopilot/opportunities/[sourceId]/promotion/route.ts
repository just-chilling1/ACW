import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { getMachineForUser } from "@/lib/traffic-machine/machine-service";
import { buildPromotionKit, generatePromotionKitWithAi } from "@/lib/traffic-machine/promotion-kit";
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

    const kit = useAi
      ? await generatePromotionKitWithAi(source, machine.offer_url, machine.offer_snapshot)
      : buildPromotionKit(source, machine.offer_url, machine.offer_snapshot);

    return NextResponse.json({ promotionKit: kit });
  } catch {
    try {
      const machine = await getMachineForUser(auth.supabase, auth.user.id);
      const source = TRAFFIC_SOURCES.find((s) => s.id === sourceId);
      if (machine && source) {
        return NextResponse.json({
          promotionKit: buildPromotionKit(source, machine.offer_url, machine.offer_snapshot),
        });
      }
    } catch {
      // fall through
    }
    return NextResponse.json({ error: "Could not generate promotion." }, { status: 500 });
  }
}
