import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
    const auth = await requireApiUser();
    if (auth.unauthorized) return auth.unauthorized;

    const { id } = await params;
    const body = await req.json();
    const targetType = clampString(body.targetType, 30);
    const targetId = clampString(body.targetId, 80);
    const mode = clampString(body.mode, 30) || "different_angle";

    const { data: campaign } = await auth.supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("user_id", auth.user.id)
        .single();

    if (!campaign) return NextResponse.json({ error: "Not found." }, { status: 404 });

    try {
        if (targetType === "opportunity" && targetId) {
            const { data: opp } = await auth.supabase
                .from("campaign_opportunities")
                .select("*")
                .eq("id", targetId)
                .eq("campaign_id", id)
                .single();

            if (!opp) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });

            const prompt = `Rewrite this reply (${mode}) for context: ${opp.context}
Offer: ${campaign.offer_snapshot?.productName}
URL: ${campaign.offer_url}
Return ONLY JSON: {"recommendedReply":"...","alternativeReplies":[{"style":"Helpful","text":"..."}]}
No fake personal experiences.`;

            const raw = await callChatGPT([{ role: "user", content: prompt }]);
            const parsed = parseJsonFromLlm<{ recommendedReply: string; alternativeReplies: { style: string; text: string }[] }>(raw, {
                recommendedReply: opp.recommended_reply,
                alternativeReplies: opp.alternative_replies || [],
            });

            await auth.supabase.from("campaign_opportunities").update({
                recommended_reply: parsed.recommendedReply,
                alternative_replies: parsed.alternativeReplies,
            }).eq("id", targetId);

            return NextResponse.json({ opportunity: { ...opp, recommended_reply: parsed.recommendedReply, alternative_replies: parsed.alternativeReplies } });
        }

        if (targetType === "asset" && targetId) {
            const { data: asset } = await auth.supabase
                .from("campaign_assets")
                .select("*")
                .eq("id", targetId)
                .eq("campaign_id", id)
                .single();

            if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

            const prompt = `Rewrite this ${asset.kind} (${mode}):
${asset.content}
Offer: ${campaign.offer_snapshot?.productName}
Return ONLY the new text, no JSON.`;

            const content = await callChatGPT([{ role: "user", content: prompt }]);
            await auth.supabase.from("campaign_assets").update({ content: content.trim() }).eq("id", targetId);
            return NextResponse.json({ asset: { ...asset, content: content.trim() } });
        }

        return NextResponse.json({ error: "Invalid regenerate target." }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "Could not regenerate. Try again." }, { status: 500 });
    }
}
