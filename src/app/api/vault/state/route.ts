import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { isVaultEntryId } from "@/lib/vault/catalog";
import { isShortsScriptId } from "@/lib/vault/shorts-catalog";
import type { VaultStateResponse } from "@/lib/vault/types";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { data, error } = await auth.supabase
    .from("vault_entry_states")
    .select("entry_id, saved, used")
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("[vault] GET state failed", error);
    return NextResponse.json({ error: "Could not load vault saves." }, { status: 500 });
  }

  const saved: string[] = [];
  const used: string[] = [];
  for (const row of data || []) {
    if (row.saved) saved.push(row.entry_id);
    if (row.used) used.push(row.entry_id);
  }

  const response: VaultStateResponse = { saved, used };
  return NextResponse.json(response);
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const entryId = clampString(body.entryId, 64);

    if (!entryId || (!isVaultEntryId(entryId) && !isShortsScriptId(entryId))) {
      return NextResponse.json({ error: "Valid entry required" }, { status: 400 });
    }

    const hasSaved = typeof body.saved === "boolean";
    const hasUsed = typeof body.used === "boolean";
    if (!hasSaved && !hasUsed) {
      return NextResponse.json({ error: "saved or used is required" }, { status: 400 });
    }

    const { data: existing, error: loadError } = await auth.supabase
      .from("vault_entry_states")
      .select("saved, used")
      .eq("user_id", auth.user.id)
      .eq("entry_id", entryId)
      .maybeSingle();

    if (loadError) {
      console.error("[vault] POST load failed", loadError);
      return NextResponse.json({ error: "Could not save vault state." }, { status: 500 });
    }

    const saved = hasSaved ? body.saved : Boolean(existing?.saved);
    const used = hasUsed ? body.used : Boolean(existing?.used);
    const now = new Date().toISOString();

    const { error: upsertError } = await auth.supabase.from("vault_entry_states").upsert(
      {
        user_id: auth.user.id,
        entry_id: entryId,
        saved,
        used,
        updated_at: now,
      },
      { onConflict: "user_id,entry_id" },
    );

    if (upsertError) {
      console.error("[vault] POST upsert failed", upsertError);
      return NextResponse.json({ error: "Could not save vault state." }, { status: 500 });
    }

    return NextResponse.json({ entryId, saved, used });
  } catch {
    return NextResponse.json({ error: "Could not save vault state." }, { status: 500 });
  }
}
