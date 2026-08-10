import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeOffer, buildStrategy, derivePrimaryKeyword, deriveSearchQueries } from "./offer-analyze";
import { discoverPosts } from "./opportunities";
import {
    computeCampaignScore,
    enrichOpportunitiesWithAi,
    generateCalendar,
    generateContentPack,
    generateCtas,
    generateHooks,
    generateWeeklyBatch,
    scorePostHeuristic,
} from "./content-engine";
import type {
    AudienceMode,
    BuildProgress,
    BuildStage,
    CampaignRow,
    ChannelMode,
    OfferSnapshot,
} from "./types";
import { BUILD_STAGES } from "./types";

export async function updateCampaignProgress(
    supabase: SupabaseClient,
    campaignId: string,
    progress: BuildProgress,
    extra: Record<string, unknown> = {},
) {
    await supabase
        .from("campaigns")
        .update({ build_progress: progress, updated_at: new Date().toISOString(), ...extra })
        .eq("id", campaignId);
}

export async function runBuildStage(
    supabase: SupabaseClient,
    campaign: CampaignRow,
    stage: BuildStage,
): Promise<BuildProgress> {
    const progress: BuildProgress = {
        ...(campaign.build_progress || { completedStages: [] }),
        currentStage: stage,
        completedStages: campaign.build_progress?.completedStages || [],
    };

    const snapshot = campaign.offer_snapshot as OfferSnapshot;
    const audienceMode = (campaign.audience_mode || "auto") as AudienceMode;
    const channels = (campaign.channels || ["everywhere"]) as ChannelMode[];

    switch (stage) {
        case "analyze_offer": {
            const analyzed = await analyzeOffer(campaign.offer_url, audienceMode);
            const resolvedAudience = audienceMode === "auto"
                ? (analyzed.recommendedAudienceMode || "auto")
                : audienceMode;
            await supabase.from("campaigns").update({
                offer_snapshot: analyzed,
                audience_mode: resolvedAudience,
                name: analyzed.productName,
                primary_keyword: derivePrimaryKeyword(analyzed),
            }).eq("id", campaign.id);
            campaign.offer_snapshot = analyzed;
            campaign.name = analyzed.productName;
            campaign.primary_keyword = derivePrimaryKeyword(analyzed);
            break;
        }
        case "determine_audience":
            break;
        case "determine_strategy": {
            const keyword = campaign.primary_keyword || derivePrimaryKeyword(snapshot);
            const strategy = await buildStrategy(snapshot, campaign.audience_mode as AudienceMode, channels, keyword);
            await supabase.from("campaigns").update({ strategy }).eq("id", campaign.id);
            break;
        }
        case "discover_opportunities": {
            const keyword = campaign.primary_keyword || derivePrimaryKeyword(snapshot);
            const queries = deriveSearchQueries(snapshot, keyword);
            const posts = await discoverPosts(supabase, queries);
            await supabase.from("campaign_opportunities").delete().eq("campaign_id", campaign.id);
            const scored = posts.map((p) => scorePostHeuristic(p, snapshot));
            for (const s of scored) {
                await supabase.from("campaign_opportunities").insert({
                    campaign_id: campaign.id,
                    platform: s.post.platform,
                    url: s.post.url,
                    title: s.post.title || s.post.text.slice(0, 80),
                    context: s.post.text,
                    engagement: s.post.engagement != null ? String(s.post.engagement) : null,
                    relevance_score: s.relevanceScore,
                    intent_score: s.intentScore,
                    opportunity_score: s.opportunityScore,
                    label: s.label,
                    why_selected: s.whySelected,
                    recommended_approach: s.recommendedApproach,
                    recommended_reply: "",
                    alternative_replies: [],
                    meta: { postId: s.post.id },
                });
            }
            break;
        }
        case "score_opportunities":
            break;
        case "generate_replies": {
            const { data: opps } = await supabase
                .from("campaign_opportunities")
                .select("*")
                .eq("campaign_id", campaign.id)
                .order("opportunity_score", { ascending: false });

            if (opps?.length) {
                const posts = opps.map((o) => ({
                    id: (o.meta as { postId?: string })?.postId || o.id,
                    platform: o.platform,
                    text: o.context,
                    title: o.title,
                    url: o.url,
                    engagement: o.engagement,
                }));
                const scored = posts.map((p) => scorePostHeuristic(p, snapshot));
                const enriched = await enrichOpportunitiesWithAi(scored, snapshot, campaign.offer_url);
                for (const e of enriched) {
                    const opp = opps.find((o) => o.url === e.post.url);
                    if (!opp) continue;
                    await supabase.from("campaign_opportunities").update({
                        why_selected: e.whySelected,
                        recommended_approach: e.recommendedApproach,
                        recommended_reply: e.recommendedReply,
                        alternative_replies: e.alternativeReplies,
                    }).eq("id", opp.id);
                }
            }
            break;
        }
        case "generate_content": {
            await supabase.from("campaign_assets").delete().eq("campaign_id", campaign.id).in("kind", ["post", "comment", "submission_copy"]);
            const content = await generateContentPack(snapshot, campaign.offer_url, channels);
            for (const item of content) {
                await supabase.from("campaign_assets").insert({
                    campaign_id: campaign.id,
                    kind: item.kind,
                    channel: item.channel,
                    content: item.content,
                    meta: item.meta,
                });
            }
            break;
        }
        case "generate_hooks": {
            const hooks = await generateHooks(snapshot);
            for (const hook of hooks) {
                await supabase.from("campaign_assets").insert({
                    campaign_id: campaign.id,
                    kind: "hook",
                    channel: "All",
                    content: hook.content,
                    meta: hook.meta,
                });
            }
            break;
        }
        case "generate_ctas": {
            const ctas = await generateCtas(snapshot, campaign.offer_url);
            for (const cta of ctas) {
                await supabase.from("campaign_assets").insert({
                    campaign_id: campaign.id,
                    kind: "cta",
                    channel: "All",
                    content: cta.content,
                    meta: cta.meta,
                });
            }
            break;
        }
        case "build_calendar": {
            const { data: existingCalendar } = await supabase
                .from("campaign_assets")
                .select("id, meta")
                .eq("campaign_id", campaign.id);
            const calendarIds = (existingCalendar || [])
                .filter((a) => (a.meta as { section?: string })?.section === "calendar")
                .map((a) => a.id);
            if (calendarIds.length > 0) {
                await supabase.from("campaign_assets").delete().in("id", calendarIds);
            }
            const calendar = await generateCalendar(snapshot, campaign.offer_url);
            for (const day of calendar) {
                await supabase.from("campaign_assets").insert({
                    campaign_id: campaign.id,
                    kind: day.kind,
                    channel: day.channel,
                    content: day.content,
                    meta: { ...day.meta, section: "calendar" },
                });
            }
            break;
        }
        case "score_campaign":
        case "finalize": {
            const [{ count: oppCount }, { count: assetCount }] = await Promise.all([
                supabase.from("campaign_opportunities").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id),
                supabase.from("campaign_assets").select("*", { count: "exact", head: true }).eq("campaign_id", campaign.id),
            ]);
            const channelsUsed = new Set(channels.includes("everywhere") ? ["social", "communities", "qa", "blogs"] : channels);
            const { score, breakdown } = computeCampaignScore(
                oppCount || 0,
                assetCount || 0,
                channelsUsed.size,
                30,
                snapshot,
            );
            const stats = {
                opportunityCount: oppCount || 0,
                assetCount: assetCount || 0,
                channelCount: channelsUsed.size,
                contentDays: 30,
            };

            const { data: topOpp } = await supabase
                .from("campaign_opportunities")
                .select("*")
                .eq("campaign_id", campaign.id)
                .order("opportunity_score", { ascending: false })
                .limit(1)
                .maybeSingle();

            const { data: todayContent } = await supabase
                .from("campaign_assets")
                .select("*")
                .eq("campaign_id", campaign.id)
                .eq("kind", "post")
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            await supabase.from("campaign_actions").delete().eq("campaign_id", campaign.id);
            if (topOpp) {
                await supabase.from("campaign_actions").insert({
                    campaign_id: campaign.id,
                    kind: "start_opportunity",
                    label: "Start with this opportunity",
                    payload: { opportunityId: topOpp.id },
                    status: "todo",
                });
            }
            if (todayContent) {
                await supabase.from("campaign_actions").insert({
                    campaign_id: campaign.id,
                    kind: "publish_today",
                    label: "Publish this today",
                    payload: { assetId: todayContent.id },
                    status: "todo",
                });
            }
            await supabase.from("campaign_actions").insert({
                campaign_id: campaign.id,
                kind: "follow_strategy",
                label: "Follow this strategy",
                payload: {},
                status: "todo",
            });

            await supabase.from("campaigns").update({
                score,
                score_breakdown: breakdown,
                stats,
                status: "ready",
            }).eq("id", campaign.id);
            break;
        }
    }

    if (!progress.completedStages.includes(stage)) {
        progress.completedStages.push(stage);
    }
    progress.currentStage = undefined;
    await updateCampaignProgress(supabase, campaign.id, progress);
    return progress;
}

export async function runFullBuild(supabase: SupabaseClient, campaignId: string): Promise<void> {
    await supabase.from("campaigns").update({ status: "building", updated_at: new Date().toISOString() }).eq("id", campaignId);

    const { data: campaign, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

    if (error || !campaign) throw new Error("Campaign not found");

    const stages = BUILD_STAGES.map((s) => s.key);
    for (const stage of stages) {
        try {
            const { data: fresh } = await supabase.from("campaigns").select("*").eq("id", campaignId).single();
            if (!fresh) break;
            await runBuildStage(supabase, fresh as CampaignRow, stage);
        } catch (e) {
            await supabase.from("campaigns").update({
                status: "failed",
                build_progress: {
                    ...(campaign.build_progress as BuildProgress),
                    error: e instanceof Error ? e.message : "Build failed",
                },
            }).eq("id", campaignId);
            throw e;
        }
    }
}

export async function runWeeklyBatchForCampaign(
    supabase: SupabaseClient,
    campaign: CampaignRow,
): Promise<number> {
    const snapshot = campaign.offer_snapshot as OfferSnapshot;
    const keyword = campaign.primary_keyword || derivePrimaryKeyword(snapshot);
    const { data: existingBatch } = await supabase
        .from("campaign_assets")
        .select("id, meta")
        .eq("campaign_id", campaign.id);
    const batchIds = (existingBatch || [])
        .filter((a) => (a.meta as { section?: string })?.section === "weekly_batch")
        .map((a) => a.id);
    if (batchIds.length > 0) {
        await supabase.from("campaign_assets").delete().in("id", batchIds);
    }

    const batch = await generateWeeklyBatch(snapshot, campaign.offer_url, keyword);
    for (const item of batch) {
        await supabase.from("campaign_assets").insert({
            campaign_id: campaign.id,
            kind: item.kind,
            channel: item.channel,
            content: item.content,
            meta: item.meta,
        });
    }

    const { count } = await supabase
        .from("campaign_assets")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

    await supabase.from("campaigns").update({
        stats: { ...(campaign.stats || {}), assetCount: count || 0 },
        updated_at: new Date().toISOString(),
    }).eq("id", campaign.id);

    return batch.length;
}
