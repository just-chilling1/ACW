import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { getHotThreadPack, loadExistingPack } from "@/lib/hot-threads/get-pack";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { isStale } from "@/lib/hot-threads/ttl";

const MAX_AFFILIATE_LINK_LENGTH = 2048;

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}

/** Force rebuild only when pack is missing or expired (prevents spam rebuilds). */
export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  let niche = "";
  let affiliateLink = "";
  try {
    const body = await req.json();
    niche = clampString(body.niche, 64);
    affiliateLink = sanitizeExternalUrl(clampString(body.affiliateLink, MAX_AFFILIATE_LINK_LENGTH));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!niche || !isNicheId(niche)) {
    return NextResponse.json({ error: "Valid niche required" }, { status: 400 });
  }

  try {
    const existing = await loadExistingPack(auth.supabase, niche);
    const force = !existing || isStale(existing.refreshed_at);
    const pack = await getHotThreadPack(auth.supabase, niche, affiliateLink, { force });
    return NextResponse.json(pack);
  } catch (e) {
    console.error("[hot-threads] refresh failed", e);
    return NextResponse.json(
      { error: "Could not refresh hot threads. Please try again." },
      { status: 500 },
    );
  }
}
