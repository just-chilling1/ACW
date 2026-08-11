import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import type { OfferSnapshot } from "@/lib/dfy/types";
import {
    buildRecommendations,
    generatePromotionAngles,
    generatePromotionCtas,
    generatePromotionHooks,
    generatePromotionPosts,
    generatePromotionReplies,
    generateQuickPlan,
    selectPlatforms,
} from "./content-engine";
import type {
    KitBuildProgress,
    KitStage,
    KitStats,
    PromotionAssetRow,
    PromotionKitRow,
} from "./types";
import { DEFAULT_CHECKLIST, KIT_STAGES } from "./types";

export async function updateKitProgress(
    supabase: SupabaseClient,
    kitId: string,
    progress: KitBuildProgress,
    extra: Record<string, unknown> = {},
) {
    await supabase
        .from("promotion_kits")
        .update({ build_progress: progress, updated_at: new Date().toISOString(), ...extra })
        .eq("id", kitId);
}

async function insertAssets(
    supabase: SupabaseClient,
    kitId: string,
    assets: Array<{
        type: string;
        platform?: string;
        title?: string;
        content: string;
        angle?: string;
        cta?: string;
        why?: string;
        include_link?: boolean;
        meta?: Record<string, unknown>;
    }>,
): Promise<PromotionAssetRow[]> {
    const rows: PromotionAssetRow[] = [];
    for (const asset of assets) {
        const { data, error } = await supabase
            .from("promotion_assets")
            .insert({
                kit_id: kitId,
                type: asset.type,
                platform: asset.platform || "General",
                title: asset.title || "",
                content: asset.content,
                angle: asset.angle || "",
                cta: asset.cta || "",
                why: asset.why || "",
                include_link: asset.include_link ?? true,
                meta: asset.meta || {},
            })
            .select("*")
            .single();
        if (!error && data) rows.push(data as PromotionAssetRow);
    }
    return rows;
}

export async function runKitStage(
    supabase: SupabaseClient,
    kit: PromotionKitRow,
    stage: KitStage,
): Promise<KitBuildProgress> {
    const progress: KitBuildProgress = {
        ...(kit.build_progress || { completedStages: [] }),
        currentStage: stage,
        completedStages: kit.build_progress?.completedStages || [],
    };

    const snapshot = kit.offer_snapshot as OfferSnapshot;
    const offerUrl = kit.offer_url;

    switch (stage) {
        case "understand_offer": {
            if (!snapshot?.productName || snapshot.productName === "Your Offer") {
                if (offerUrl) {
                    const analyzed = await analyzeOffer(offerUrl, "auto");
                    await supabase.from("promotion_kits").update({
                        offer_snapshot: analyzed,
                        name: analyzed.productName,
                    }).eq("id", kit.id);
                    kit.offer_snapshot = analyzed;
                    kit.name = analyzed.productName;
                }
            }
            break;
        }
        case "identify_audience":
            break;
        case "find_angles": {
            await supabase.from("promotion_assets").delete().eq("kit_id", kit.id).eq("type", "angle");
            const angles = await generatePromotionAngles(snapshot);
            await insertAssets(supabase, kit.id, angles.map((a) => ({
                type: "angle",
                title: a.title,
                content: a.content,
                angle: a.angle,
                why: a.why,
                meta: a.meta,
            })));
            break;
        }
        case "write_hooks": {
            await supabase.from("promotion_assets").delete().eq("kit_id", kit.id).eq("type", "hook");
            const hooks = await generatePromotionHooks(snapshot);
            await insertAssets(supabase, kit.id, hooks.map((h) => ({
                type: "hook",
                content: h.content,
                meta: h.meta,
            })));
            break;
        }
        case "create_posts": {
            await supabase.from("promotion_assets").delete().eq("kit_id", kit.id).eq("type", "post");
            const platforms = selectPlatforms(snapshot);
            const posts = await generatePromotionPosts(snapshot, offerUrl, platforms);
            await insertAssets(supabase, kit.id, posts.map((p) => ({
                type: "post",
                platform: p.platform,
                title: p.title,
                content: p.content,
                angle: p.angle,
                cta: p.cta,
                why: p.why,
                include_link: p.include_link,
                meta: p.meta,
            })));
            break;
        }
        case "prepare_replies": {
            await supabase.from("promotion_assets").delete().eq("kit_id", kit.id).eq("type", "reply");
            const replies = await generatePromotionReplies(snapshot, offerUrl);
            await insertAssets(supabase, kit.id, replies.map((r) => ({
                type: "reply",
                title: r.title,
                content: r.content,
                meta: r.meta,
            })));
            break;
        }
        case "create_ctas": {
            await supabase.from("promotion_assets").delete().eq("kit_id", kit.id).eq("type", "cta");
            const ctas = await generatePromotionCtas(snapshot, offerUrl);
            await insertAssets(supabase, kit.id, ctas.map((c) => ({
                type: "cta",
                content: c.content,
                meta: c.meta,
            })));
            break;
        }
        case "build_plan":
        case "finalize": {
            const { data: allAssets } = await supabase
                .from("promotion_assets")
                .select("*")
                .eq("kit_id", kit.id);

            const assets = (allAssets || []) as PromotionAssetRow[];
            const posts = assets.filter((a) => a.type === "post");
            const hooks = assets.filter((a) => a.type === "hook");
            const replies = assets.filter((a) => a.type === "reply");
            const ctas = assets.filter((a) => a.type === "cta");
            const angles = assets.filter((a) => a.type === "angle");

            const stats: KitStats = {
                postCount: posts.length,
                hookCount: hooks.length,
                replyCount: replies.length,
                ctaCount: ctas.length,
                angleCount: angles.length,
            };

            const recommendations = buildRecommendations(
                posts.map((p) => ({ id: p.id, content: p.content, platform: p.platform, cta: p.cta, why: p.why, meta: p.meta as Record<string, unknown> })),
                hooks.map((h) => ({ id: h.id, content: h.content, meta: h.meta as Record<string, unknown> })),
                replies.map((r) => ({ id: r.id, content: r.content })),
                ctas.map((c) => ({ id: c.id, content: c.content, meta: c.meta as Record<string, unknown> })),
            );

            const quickPlan = await generateQuickPlan(
                snapshot,
                posts.map((p) => p.id),
                hooks.map((h) => h.id),
                replies.map((r) => r.id),
            );

            await supabase.from("promotion_kits").update({
                recommendations,
                quick_plan: quickPlan,
                checklist: DEFAULT_CHECKLIST,
                stats,
                status: "ready",
            }).eq("id", kit.id);
            break;
        }
    }

    if (!progress.completedStages.includes(stage)) {
        progress.completedStages.push(stage);
    }
    progress.currentStage = undefined;
    await updateKitProgress(supabase, kit.id, progress);
    return progress;
}

export async function runKitBuild(supabase: SupabaseClient, kitId: string): Promise<void> {
    await supabase.from("promotion_kits").update({
        status: "building",
        updated_at: new Date().toISOString(),
    }).eq("id", kitId);

    const { data: kit, error } = await supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", kitId)
        .single();

    if (error || !kit) throw new Error("Kit not found");

    const stages = KIT_STAGES.map((s) => s.key);
    for (const stage of stages) {
        try {
            const { data: fresh } = await supabase.from("promotion_kits").select("*").eq("id", kitId).single();
            if (!fresh) break;
            await runKitStage(supabase, fresh as PromotionKitRow, stage);
        } catch (e) {
            await supabase.from("promotion_kits").update({
                status: "failed",
                build_progress: {
                    ...(kit.build_progress as KitBuildProgress),
                    error: e instanceof Error ? e.message : "Build failed",
                },
            }).eq("id", kitId);
            throw e;
        }
    }
}

export async function getKitWithAssets(supabase: SupabaseClient, kitId: string, userId: string) {
    const { data: kit } = await supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", kitId)
        .eq("user_id", userId)
        .single();

    if (!kit) return null;

    const { data: assets } = await supabase
        .from("promotion_assets")
        .select("*")
        .eq("kit_id", kitId)
        .order("created_at", { ascending: true });

    return { kit: kit as PromotionKitRow, assets: (assets || []) as PromotionAssetRow[] };
}
