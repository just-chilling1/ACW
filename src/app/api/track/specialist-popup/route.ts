import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveRequestCountry } from "@/lib/specialist-popup-eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set(["cta_call_click", "popup_open"]);

export async function POST(request: Request) {
    try {
        // sendBeacon often uses text/plain; accept JSON from any content-type.
        const raw = await request.text().catch(() => "");
        let body: { event?: unknown } = {};
        if (raw) {
            try {
                body = JSON.parse(raw) as { event?: unknown };
            } catch {
                body = {};
            }
        }
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
                country: resolveRequestCountry(request),
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
