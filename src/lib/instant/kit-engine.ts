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
    selectPlatforms,
} from "./content-engine";
import { buildFallbackQuickPlan } from "./fallbacks";
import type {
    KitBuildProgress,
    KitStage,
    KitStats,
    PromotionAssetRow,
    PromotionKitRow,
} from "./types";
import { DEFAULT_CHECKLIST } from "./types";

type AssetInsert = {
    type: string;
    platform?: string;
    title?: string;
    content: string;
    angle?: string;
    cta?: string;
    why?: string;
    include_link?: boolean;
    meta?: Record<string, unknown>;
};

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
    assets: AssetInsert[],
): Promise<PromotionAssetRow[]> {
    if (!assets.length) return [];

    const payload = assets.map((asset) => ({
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
    }));

    const { data, error } = await supabase
        .from("promotion_assets")
        .insert(payload)
        .select("*");

    if (error || !data) return [];
    return data as PromotionAssetRow[];
}

async function markStagesComplete(
    supabase: SupabaseClient,
    kitId: string,
    completed: KitStage[],
    currentStage?: KitStage,
) {
    const progress: KitBuildProgress = {
        completedStages: completed,
        currentStage,
    };
    await updateKitProgress(supabase, kitId, progress);
    return progress;
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
            await finalizeKit(supabase, kit, assets, snapshot);
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

async function finalizeKit(
    supabase: SupabaseClient,
    kit: PromotionKitRow,
    assets: PromotionAssetRow[],
    snapshot: OfferSnapshot,
) {
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
        posts.map((p) => ({
            id: p.id,
            content: p.content,
            platform: p.platform,
            cta: p.cta,
            why: p.why,
            meta: p.meta as Record<string, unknown>,
        })),
        hooks.map((h) => ({ id: h.id, content: h.content, meta: h.meta as Record<string, unknown> })),
        replies.map((r) => ({ id: r.id, content: r.content })),
        ctas.map((c) => ({ id: c.id, content: c.content, meta: c.meta as Record<string, unknown> })),
    );

    // Deterministic plan avoids an extra LLM round-trip at the end of build.
    const quickPlan = buildFallbackQuickPlan(snapshot);
    if (posts[0]) quickPlan[0].actions[0].assetId = posts[0].id;
    if (hooks[0] && quickPlan[0].actions[1]) quickPlan[0].actions[1].assetId = hooks[0].id;
    if (replies[0] && quickPlan[1]?.actions?.[1]) quickPlan[1].actions[1].assetId = replies[0].id;

    await supabase.from("promotion_kits").update({
        recommendations,
        quick_plan: quickPlan,
        checklist: DEFAULT_CHECKLIST,
        stats,
        status: "ready",
    }).eq("id", kit.id);
}

/**
 * Optimized kit build: one parallel LLM wave for content assets + batch inserts.
 * Progress stages still update so the build UI stays informative.
 */
export async function runKitBuild(supabase: SupabaseClient, kitId: string): Promise<void> {
    await supabase.from("promotion_kits").update({
        status: "building",
        updated_at: new Date().toISOString(),
    }).eq("id", kitId);

    const { data: kitRow, error } = await supabase
        .from("promotion_kits")
        .select("*")
        .eq("id", kitId)
        .single();

    if (error || !kitRow) throw new Error("Kit not found");

    const kit = kitRow as PromotionKitRow;
    const completed: KitStage[] = [];

    try {
        await markStagesComplete(supabase, kitId, completed, "understand_offer");
        await runKitStage(supabase, kit, "understand_offer");
        completed.push("understand_offer");

        await markStagesComplete(supabase, kitId, completed, "identify_audience");
        completed.push("identify_audience");
        await markStagesComplete(supabase, kitId, completed, "find_angles");

        const snapshot = kit.offer_snapshot as OfferSnapshot;
        const offerUrl = kit.offer_url;
        const platforms = selectPlatforms(snapshot);

        // Single parallel LLM wave for independent content types.
        const [angles, hooks, posts, replies, ctas] = await Promise.all([
            generatePromotionAngles(snapshot),
            generatePromotionHooks(snapshot),
            generatePromotionPosts(snapshot, offerUrl, platforms),
            generatePromotionReplies(snapshot, offerUrl),
            generatePromotionCtas(snapshot, offerUrl),
        ]);

        await supabase
            .from("promotion_assets")
            .delete()
            .eq("kit_id", kitId)
            .in("type", ["angle", "hook", "post", "reply", "cta"]);

        const angleRows = await insertAssets(
            supabase,
            kitId,
            angles.map((a) => ({
                type: "angle",
                title: a.title,
                content: a.content,
                angle: a.angle,
                why: a.why,
                meta: a.meta,
            })),
        );
        completed.push("find_angles");
        await markStagesComplete(supabase, kitId, completed, "write_hooks");

        const hookRows = await insertAssets(
            supabase,
            kitId,
            hooks.map((h) => ({
                type: "hook",
                content: h.content,
                meta: h.meta,
            })),
        );
        completed.push("write_hooks");
        await markStagesComplete(supabase, kitId, completed, "create_posts");

        const postRows = await insertAssets(
            supabase,
            kitId,
            posts.map((p) => ({
                type: "post",
                platform: p.platform,
                title: p.title,
                content: p.content,
                angle: p.angle,
                cta: p.cta,
                why: p.why,
                include_link: p.include_link,
                meta: p.meta,
            })),
        );
        completed.push("create_posts");
        await markStagesComplete(supabase, kitId, completed, "prepare_replies");

        const replyRows = await insertAssets(
            supabase,
            kitId,
            replies.map((r) => ({
                type: "reply",
                title: r.title,
                content: r.content,
                meta: r.meta,
            })),
        );
        completed.push("prepare_replies");
        await markStagesComplete(supabase, kitId, completed, "create_ctas");

        const ctaRows = await insertAssets(
            supabase,
            kitId,
            ctas.map((c) => ({
                type: "cta",
                content: c.content,
                meta: c.meta,
            })),
        );
        completed.push("create_ctas");
        await markStagesComplete(supabase, kitId, completed, "build_plan");

        const allAssets = [...angleRows, ...hookRows, ...postRows, ...replyRows, ...ctaRows];
        await finalizeKit(supabase, kit, allAssets, snapshot);
        completed.push("build_plan", "finalize");
        await markStagesComplete(supabase, kitId, completed);
    } catch (e) {
        await supabase.from("promotion_kits").update({
            status: "failed",
            build_progress: {
                completedStages: completed,
                error: e instanceof Error ? e.message : "Build failed",
            },
        }).eq("id", kitId);
        throw e;
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
