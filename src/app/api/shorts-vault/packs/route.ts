import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { mapPackRow, type ShortsScriptPackRow } from "@/lib/vault/shorts-packs";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { data, error } = await auth.supabase
    .from("shorts_script_packs")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[shorts-vault] GET packs failed", error);
    return NextResponse.json({ error: "Could not load your library." }, { status: 500 });
  }

  const packs = (data || []).map((row) => mapPackRow(row as ShortsScriptPackRow));
  return NextResponse.json({ packs });
}
