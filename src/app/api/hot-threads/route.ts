import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { getHotThreadPack } from "@/lib/hot-threads/get-pack";
import { sanitizeExternalUrl } from "@/lib/safe-url";

const MAX_AFFILIATE_LINK_LENGTH = 2048;

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}

export async function GET(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { searchParams } = new URL(req.url);
  const niche = clampString(searchParams.get("niche"), 64);
  const affiliateLink = sanitizeExternalUrl(
    clampString(searchParams.get("affiliateLink"), MAX_AFFILIATE_LINK_LENGTH),
  );

  if (!niche || !isNicheId(niche)) {
    return NextResponse.json({ error: "Valid niche required" }, { status: 400 });
  }

  try {
    const pack = await getHotThreadPack(auth.supabase, niche, affiliateLink);
    return NextResponse.json(pack);
  } catch (e) {
    console.error("[hot-threads] GET failed", e);
    return NextResponse.json(
      { error: "Could not load hot threads. Please try again." },
      { status: 500 },
    );
  }
}
