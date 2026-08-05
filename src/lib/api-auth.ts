import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AuthResult =
    | { supabase: SupabaseClient; user: User; unauthorized: null }
    | { supabase: SupabaseClient | null; user: null; unauthorized: NextResponse };

export async function requireApiUser(): Promise<AuthResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            supabase: null,
            user: null,
            unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    return { supabase, user, unauthorized: null };
}

export function clampString(value: unknown, maxLength: number): string {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}
