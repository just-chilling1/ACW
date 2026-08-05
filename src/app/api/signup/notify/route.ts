import { NextResponse } from "next/server";
import { clampString } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const firstName = clampString(body.firstName, 100);
        const email = clampString(body.email, 320);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const webhookUrl = process.env.MAKE_SIGNUP_WEBHOOK_URL?.trim();
        if (!webhookUrl) {
            return NextResponse.json({ ok: true });
        }

        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, email }),
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Could not process signup notification" }, { status: 500 });
    }
}
