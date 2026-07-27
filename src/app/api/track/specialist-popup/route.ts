import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set(["cta_call_click"]);

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as {
            event?: unknown;
        };
        const event =
            typeof body.event === "string" && ALLOWED_EVENTS.has(body.event)
                ? body.event
                : "cta_call_click";

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase
            .from("specialist_popup_events")
            .insert({
                event,
                user_id: user?.id ?? null,
                country: request.headers.get("x-vercel-ip-country"),
                user_agent:
                    request.headers.get("user-agent")?.slice(0, 300) ?? null,
            });

        if (error) {
            console.error("specialist popup tracking insert failed:", error.message);
        }
    } catch (err) {
        // Tracking must never break the call CTA.
        console.error("specialist popup tracking error:", err);
    }

    return new NextResponse(null, { status: 204 });
}
