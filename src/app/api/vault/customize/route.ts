import { NextResponse } from "next/server";
import { clampString, requireApiUser } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { getVaultEntryById, isVaultEntryId } from "@/lib/vault/catalog";
import { customizeVaultEntry } from "@/lib/vault/vault-customize";
import { mapPackRow, type VaultEntryPackRow } from "@/lib/vault/vault-packs";

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((niche) => niche.id === value);
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const entryId = clampString(body.entryId, 64);
    const nicheIdRaw = clampString(body.nicheId, 64);
    const affiliateLink = sanitizeExternalUrl(clampString(body.affiliateLink, 2048));

    if (!entryId || !isVaultEntryId(entryId)) {
      return NextResponse.json({ error: "Valid entry required" }, { status: 400 });
    }
    if (!nicheIdRaw || !isNicheId(nicheIdRaw)) {
      return NextResponse.json({ error: "Valid niche required" }, { status: 400 });
    }
    if (!affiliateLink) {
      return NextResponse.json({ error: "Valid affiliate link required" }, { status: 400 });
    }

    const seed = getVaultEntryById(entryId);
    if (!seed) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    if (seed.nicheId !== nicheIdRaw) {
      return NextResponse.json({ error: "Niche does not match entry" }, { status: 400 });
    }

    const { entry, offerSnapshot } = await customizeVaultEntry({
      seed,
      affiliateLink,
      nicheId: nicheIdRaw,
    });

    const now = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from("vault_entry_packs")
      .upsert(
        {
          user_id: auth.user.id,
          source_entry_id: seed.id,
          niche_id: seed.nicheId,
          affiliate_link: affiliateLink,
          offer_snapshot: offerSnapshot,
          entry,
          updated_at: now,
        },
        { onConflict: "user_id,source_entry_id,affiliate_link" },
      )
      .select("*")
      .single();

    if (error || !data) {
      console.error("[vault] customize upsert failed", error);
      return NextResponse.json({ error: "Could not save customized entry." }, { status: 500 });
    }

    return NextResponse.json({ pack: mapPackRow(data as VaultEntryPackRow) });
  } catch (error) {
    console.error("[vault] customize failed", error);
    return NextResponse.json(
      { error: "Could not customize that entry. Please try again." },
      { status: 422 },
    );
  }
}
