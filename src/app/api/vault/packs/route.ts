import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { mapPackRow, type VaultEntryPackRow } from "@/lib/vault/vault-packs";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { data, error } = await auth.supabase
    .from("vault_entry_packs")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[vault] GET packs failed", error);
    return NextResponse.json({ error: "Could not load your library." }, { status: 500 });
  }

  const packs = (data || []).map((row) => mapPackRow(row as VaultEntryPackRow));
  return NextResponse.json({ packs });
}
