import { NextResponse } from "next/server";
import { requireApiUser, clampString } from "@/lib/api-auth";
import { callChatGPTForRegeneration } from "@/lib/llm";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import type { OfferSnapshot } from "@/lib/dfy/types";

type RouteParams = { params: Promise<{ id: string }> };

function getSnapshot(campaign: { offer_snapshot?: OfferSnapshot | null }): OfferSnapshot {
    const snap = campaign.offer_snapshot;
    return {
        productName: snap?.productName || "this offer",
        category: snap?.category || "",
        mainPromise: snap?.mainPromise || "",
        primaryBenefits: snap?.primaryBenefits || [],
        secondaryBenefits: snap?.secondaryBenefits || [],
        targetAudience: snap?.targetAudience || "",
        buyerIntent: snap?.buyerIntent || "",
        painPoints: snap?.painPoints || [],
        desiredOutcome: snap?.desiredOutcome || "",
        objections: snap?.objections || [],
        strongestAngle: snap?.strongestAngle || "",
        contentAngles: snap?.contentAngles || [],
        ctaStyle: snap?.ctaStyle || "",
        promotionChannels: snap?.promotionChannels || [],
    };
}

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

    const snapshot = getSnapshot(campaign);

    try {
        if (targetType === "opportunity" && targetId) {
            const { data: opp } = await auth.supabase
                .from("campaign_opportunities")
                .select("*")
                .eq("id", targetId)
                .eq("campaign_id", id)
                .single();

            if (!opp) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });

            const prompt = `Rewrite this reply (${mode}) for the conversation below.

CONVERSATION: ${opp.context}
OFFER: ${snapshot.productName}
CATEGORY: ${snapshot.category}
PROMISE: ${snapshot.mainPromise}
BENEFITS: ${snapshot.primaryBenefits.join(", ")}
URL: ${campaign.offer_url}

Return ONLY JSON: {"recommendedReply":"unique reply for THIS post","alternativeReplies":[{"style":"Helpful expert","text":"..."},{"style":"Relatable angle","text":"..."},{"style":"Short & direct","text":"..."}]}
Rules: Address their specific question. Include URL once. No fake personal experiences. Each reply must be different.`;

            const raw = await callChatGPTForRegeneration([{ role: "user", content: prompt }]);
            const parsed = parseJsonFromLlm<{ recommendedReply: string; alternativeReplies: { style: string; text: string }[] }>(raw, {
                recommendedReply: opp.recommended_reply,
                alternativeReplies: opp.alternative_replies || [],
            });

            const { error: updateError } = await auth.supabase.from("campaign_opportunities").update({
                recommended_reply: parsed.recommendedReply,
                alternative_replies: parsed.alternativeReplies,
            }).eq("id", targetId);

            if (updateError) {
                return NextResponse.json({ error: "Could not save regenerated reply." }, { status: 500 });
            }

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

            const meta = (asset.meta || {}) as Record<string, unknown>;
            const isWeeklyBatch = meta.section === "weekly_batch";

            let prompt: string;
            if (asset.kind === "hook") {
                prompt = `Rewrite this marketing hook (${mode}) for "${snapshot.productName}":
${asset.content}
Return ONLY the new hook text, no JSON or labels.`;
            } else if (asset.kind === "cta") {
                prompt = `Rewrite this call-to-action (${mode}) for "${snapshot.productName}":
${asset.content}
Offer URL: ${campaign.offer_url}
Return ONLY the new CTA text, no JSON.`;
            } else if (isWeeklyBatch) {
                prompt = `Rewrite this weekly post (${mode}) for "${snapshot.productName}".
Offer URL: ${campaign.offer_url}
Target audience: ${snapshot.targetAudience}
Angle: ${meta.angle || ""}
Current hook: ${meta.hook || ""}
Current post body (middle only): ${asset.content}
Current CTA: ${meta.cta || ""}

Return ONLY JSON:
{"hook":"new hook","content":"MIDDLE BODY ONLY — 120-200 words, detailed, no hook or CTA repeated inside","cta":"new CTA with link"}

Rules: content must NOT include the hook or CTA text. Be specific to ${snapshot.productName}.`;
            } else {
                prompt = `Rewrite this ${asset.kind} (${mode}):
${asset.content}
Offer: ${snapshot.productName}
Return ONLY the new text, no JSON.`;
            }

            const raw = await callChatGPTForRegeneration([{ role: "user", content: prompt }]);

            let content = raw.trim();
            let updatedMeta = { ...meta };

            if (isWeeklyBatch) {
                const parsed = parseJsonFromLlm<{ hook?: string; content?: string; cta?: string }>(raw, {});
                if (parsed.content) content = parsed.content.trim();
                if (parsed.hook) updatedMeta.hook = parsed.hook;
                if (parsed.cta) updatedMeta.cta = parsed.cta;
            }

            const { error: updateError } = await auth.supabase.from("campaign_assets").update({
                content,
                meta: updatedMeta,
            }).eq("id", targetId);

            if (updateError) {
                return NextResponse.json({ error: "Could not save regenerated content." }, { status: 500 });
            }

            return NextResponse.json({ asset: { ...asset, content, meta: updatedMeta } });
        }

        return NextResponse.json({ error: "Invalid regenerate target." }, { status: 400 });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Could not regenerate. Try again.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
