import { NextResponse } from "next/server";
import { clampString, requireApiUser } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { getShortsScriptById, isShortsScriptId } from "@/lib/vault/shorts-catalog";
import { customizeShortsScript } from "@/lib/vault/shorts-customize";
import { mapPackRow, type ShortsScriptPackRow } from "@/lib/vault/shorts-packs";

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((niche) => niche.id === value);
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const scriptId = clampString(body.scriptId, 64);
    const nicheIdRaw = clampString(body.nicheId, 64);
    const affiliateLink = sanitizeExternalUrl(clampString(body.affiliateLink, 2048));

    if (!scriptId || !isShortsScriptId(scriptId)) {
      return NextResponse.json({ error: "Valid script required" }, { status: 400 });
    }
    if (!nicheIdRaw || !isNicheId(nicheIdRaw)) {
      return NextResponse.json({ error: "Valid niche required" }, { status: 400 });
    }
    if (!affiliateLink) {
      return NextResponse.json({ error: "Valid affiliate link required" }, { status: 400 });
    }

    const seed = getShortsScriptById(scriptId);
    if (!seed) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }
    if (seed.nicheId !== nicheIdRaw) {
      return NextResponse.json({ error: "Niche does not match script" }, { status: 400 });
    }

    const { script, offerSnapshot } = await customizeShortsScript({
      seed,
      affiliateLink,
      nicheId: nicheIdRaw,
    });

    const now = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from("shorts_script_packs")
      .upsert(
        {
          user_id: auth.user.id,
          source_script_id: seed.id,
          niche_id: seed.nicheId,
          affiliate_link: affiliateLink,
          offer_snapshot: offerSnapshot,
          script,
          updated_at: now,
        },
        { onConflict: "user_id,source_script_id,affiliate_link" },
      )
      .select("*")
      .single();

    if (error || !data) {
      console.error("[shorts-vault] customize upsert failed", error);
      return NextResponse.json({ error: "Could not save customized script." }, { status: 500 });
    }

    return NextResponse.json({ pack: mapPackRow(data as ShortsScriptPackRow) });
  } catch (error) {
    console.error("[shorts-vault] customize failed", error);
    return NextResponse.json(
      { error: "Could not customize that script. Please try again." },
      { status: 422 },
    );
  }
}
