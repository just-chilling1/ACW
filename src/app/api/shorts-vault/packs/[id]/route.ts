import { NextResponse } from "next/server";
import { clampString, requireApiUser } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { id: rawId } = await context.params;
  const id = clampString(rawId, 64);
  if (!id) {
    return NextResponse.json({ error: "Pack id required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("shorts_script_packs")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[shorts-vault] DELETE pack failed", error);
    return NextResponse.json({ error: "Could not delete pack." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}
