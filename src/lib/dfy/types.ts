export type CampaignStatus = "draft" | "building" | "ready" | "failed";
export type OpportunityLabel = "excellent" | "strong" | "good" | "low";
export type AudienceMode =
    | "auto"
    | "weight_loss"
    | "make_money_online"
    | "health_fitness"
    | "beauty_skincare"
    | "relationships"
    | "tech_gadgets"
    | "pets"
    | "home_garden"
    /** @deprecated legacy values — kept for older saved campaigns */
    | "make_money"
    | "solve_problem"
    | "beginners"
    | "business_owners"
    | "professionals"
    | "hobby";

export type ChannelMode = "everywhere" | "social" | "communities" | "qa" | "blogs";

export type BuildStage =
    | "analyze_offer"
    | "determine_audience"
    | "determine_strategy"
    | "discover_opportunities"
    | "score_opportunities"
    | "generate_replies"
    | "generate_content"
    | "generate_hooks"
    | "generate_ctas"
    | "build_calendar"
    | "score_campaign"
    | "finalize";

export type AssetKind =
    | "reply"
    | "post"
    | "follow_up"
    | "objection"
    | "dm"
    | "submission_copy"
    | "hook"
    | "cta"
    | "comment";

export interface OfferSnapshot {
    productName: string;
    category: string;
    mainPromise: string;
    primaryBenefits: string[];
    secondaryBenefits: string[];
    targetAudience: string;
    buyerIntent: string;
    painPoints: string[];
    desiredOutcome: string;
    objections: string[];
    strongestAngle: string;
    contentAngles: string[];
    ctaStyle: string;
    promotionChannels: string[];
    recommendedAudienceMode?: AudienceMode;
    promotionStyle?: string;
}

export interface CampaignStrategy {
    summary: string;
    whoToTarget: string;
    whatToSay: string;
    whereToPromote: string;
    whatToStartWith: string;
    strongestOpportunities: string;
    ctaStyle: string;
    whatToAvoid: string;
    firstStep: string;
}

export interface ScoreBreakdown {
    offerClarity: number;
    audienceFit: number;
    opportunityQuality: number;
    contentVariety: number;
    ctaQuality: number;
    campaignCoverage: number;
    weakAreas?: string[];
    improveSuggestions?: string[];
}

export interface CampaignStats {
    opportunityCount: number;
    assetCount: number;
    channelCount: number;
    contentDays: number;
}

export interface BuildProgress {
    currentStage?: BuildStage;
    completedStages: BuildStage[];
    error?: string;
}

export interface SocialPost {
    id: string;
    platform: string;
    text: string;
    title?: string;
    url: string;
    engagement?: string | number;
}

export interface CampaignOpportunityRow {
    id: string;
    campaign_id: string;
    platform: string;
    url: string;
    title: string;
    context: string;
    engagement: string | null;
    relevance_score: number;
    intent_score: number;
    opportunity_score: number;
    label: OpportunityLabel;
    why_selected: string;
    recommended_approach: string;
    recommended_reply: string;
    alternative_replies: { style: string; text: string }[];
    meta: Record<string, unknown>;
    created_at: string;
}

export interface CampaignAssetRow {
    id: string;
    campaign_id: string;
    kind: AssetKind;
    channel: string | null;
    content: string;
    meta: Record<string, unknown>;
    used_at: string | null;
    created_at: string;
}

export interface CampaignActionRow {
    id: string;
    campaign_id: string;
    kind: string;
    label: string;
    payload: Record<string, unknown>;
    status: "todo" | "done" | "skipped";
    completed_at: string | null;
    created_at: string;
}

export interface CampaignRow {
    id: string;
    user_id: string;
    name: string;
    offer_url: string;
    offer_snapshot: OfferSnapshot;
    audience_mode: AudienceMode;
    channels: ChannelMode[];
    status: CampaignStatus;
    build_progress: BuildProgress;
    strategy: CampaignStrategy;
    score: number | null;
    score_breakdown: ScoreBreakdown;
    primary_keyword: string | null;
    stats: CampaignStats;
    created_at: string;
    updated_at: string;
}

export interface DfyOfferRow {
    id: string;
    user_id: string;
    url: string;
    name: string;
    snapshot: OfferSnapshot;
    created_at: string;
    updated_at: string;
}

export const BUILD_STAGES: { key: BuildStage; label: string }[] = [
    { key: "analyze_offer", label: "Understanding your offer" },
    { key: "determine_audience", label: "Identifying your ideal audience" },
    { key: "determine_strategy", label: "Building your promotion strategy" },
    { key: "discover_opportunities", label: "Finding high-intent opportunities" },
    { key: "score_opportunities", label: "Analyzing conversations" },
    { key: "generate_replies", label: "Creating personalized responses" },
    { key: "generate_content", label: "Writing promotional content" },
    { key: "generate_hooks", label: "Crafting your best hooks" },
    { key: "generate_ctas", label: "Preparing call-to-actions" },
    { key: "build_calendar", label: "Building your 30-day campaign" },
    { key: "score_campaign", label: "Selecting your best opportunities" },
    { key: "finalize", label: "Preparing your action plan" },
];

import { APP_NICHES } from "@/lib/niches";

export const AUDIENCE_OPTIONS: { id: AudienceMode; label: string; description: string; recommended?: boolean }[] =
    APP_NICHES.map((niche) => ({
        id: niche.id as AudienceMode,
        label: niche.label,
        description: niche.description,
    }));

export const CHANNEL_OPTIONS: { id: ChannelMode; label: string; recommended?: boolean }[] = [
    { id: "everywhere", label: "Everywhere", recommended: true },
    { id: "social", label: "Social media" },
    { id: "communities", label: "Communities" },
    { id: "qa", label: "Q&A" },
    { id: "blogs", label: "Blogs & content" },
];
