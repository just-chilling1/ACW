import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { generateConversationAssist } from "@/lib/llm";
import type { OfferAnalysis } from "@/lib/campaign/types";

const MAX_TEXT = 4000;

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const analysis = body.analysis as OfferAnalysis;
    const theirReply = clampString(body.theirReply, MAX_TEXT);
    const ourPreviousReply = clampString(body.ourPreviousReply, MAX_TEXT);

    if (!theirReply.trim()) {
      return NextResponse.json({ error: "Reply required" }, { status: 400 });
    }

    const offerSummary = [
      analysis?.productName,
      analysis?.mainBenefit,
      analysis?.positioning,
    ]
      .filter(Boolean)
      .join(". ");

    const response = await generateConversationAssist(
      offerSummary || "Affiliate offer",
      ourPreviousReply || "Previous promotional reply",
      theirReply
    );

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Could not generate response" }, { status: 500 });
  }
}
