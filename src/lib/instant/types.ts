import type { OfferSnapshot } from "@/lib/dfy/types";

export type KitStatus = "draft" | "building" | "ready" | "failed";
export type AssetType = "post" | "hook" | "reply" | "cta" | "angle";
export type AssetStatus = "ready" | "used" | "saved";
export type FeedbackResult = "yes" | "no" | "not_sure";

export type KitStage =
    | "understand_offer"
    | "identify_audience"
    | "find_angles"
    | "write_hooks"
    | "create_posts"
    | "prepare_replies"
    | "create_ctas"
    | "build_plan"
    | "finalize";

export interface KitBuildProgress {
    currentStage?: KitStage;
    completedStages: KitStage[];
    error?: string;
}

export interface KitRecommendations {
    bestPostId?: string;
    bestReplyId?: string;
    bestHookId?: string;
    bestCtaId?: string;
    bestPromotionId?: string;
    bestPromotionWhy?: string;
    bestPromotionPlatform?: string;
    bestPromotionCta?: string;
    nextAction?: string;
    nextActionAssetId?: string;
}

export interface QuickPlanDay {
    day: number;
    label: string;
    actions: Array<{
        label: string;
        assetId?: string;
        content?: string;
        type?: "copy" | "view" | "info";
    }>;
}

export interface ChecklistItem {
    id: string;
    label: string;
    done: boolean;
}

export interface KitStats {
    postCount: number;
    hookCount: number;
    replyCount: number;
    ctaCount: number;
    angleCount: number;
}

export interface PromotionKitRow {
    id: string;
    user_id: string;
    offer_url: string;
    offer_snapshot: OfferSnapshot;
    name: string;
    status: KitStatus;
    build_progress: KitBuildProgress;
    recommendations: KitRecommendations;
    quick_plan: QuickPlanDay[];
    checklist: ChecklistItem[];
    stats: KitStats;
    created_at: string;
    updated_at: string;
}

export interface PromotionAssetRow {
    id: string;
    kit_id: string;
    type: AssetType;
    platform: string;
    title: string;
    content: string;
    angle: string;
    cta: string;
    why: string;
    include_link: boolean;
    status: AssetStatus;
    meta: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export const KIT_STAGES: { key: KitStage; label: string }[] = [
    { key: "understand_offer", label: "Understanding your offer" },
    { key: "identify_audience", label: "Identifying your ideal audience" },
    { key: "find_angles", label: "Finding the strongest promotional angles" },
    { key: "write_hooks", label: "Writing attention-grabbing hooks" },
    { key: "create_posts", label: "Creating ready-to-use posts" },
    { key: "prepare_replies", label: "Preparing community replies" },
    { key: "create_ctas", label: "Creating CTAs" },
    { key: "build_plan", label: "Building your quick-start plan" },
    { key: "finalize", label: "Finalizing recommendations" },
];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: "choose_post", label: "Choose your first post", done: false },
    { id: "copy_post", label: "Copy your post", done: false },
    { id: "find_community", label: "Find a relevant community", done: false },
    { id: "publish", label: "Publish naturally", done: false },
    { id: "watch_replies", label: "Watch for questions", done: false },
    { id: "use_replies", label: "Use Cashwave's ready-made replies", done: false },
    { id: "try_angle", label: "Try another angle", done: false },
];

export const IMPROVE_OPTIONS = [
    "more_natural",
    "shorter",
    "stronger_opening",
    "more_helpful",
    "less_salesy",
    "more_conversational",
    "better_cta",
] as const;

export type ImproveOption = (typeof IMPROVE_OPTIONS)[number];

export const REGENERATE_OPTIONS = [
    "different_angle",
    "shorter",
    "more_casual",
    "more_educational",
    "more_direct",
    "completely_different",
] as const;

export type RegenerateOption = (typeof REGENERATE_OPTIONS)[number];
