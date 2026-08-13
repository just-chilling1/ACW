import type { OfferSnapshot } from "@/lib/dfy/types";
import type { SourceType, TrafficSource } from "./sources";

export type TrafficGoal = "visitors" | "clicks" | "sales" | "passive";
export type MachineStage = "discover" | "activate" | "grow" | "optimize";
export type MachineStatus = "setup" | "building" | "ready";
export type ActivationStatus = "pending" | "active" | "needs_attention" | "dismissed";
export type ScoreLabel = "Excellent" | "Strong" | "Good" | "Fair";
export type OpportunityBucket = "quick_win" | "long_term" | "high_potential" | "content";

export type MachineBuildStage =
  | "understand_offer"
  | "match_channels"
  | "write_submissions"
  | "build_plan"
  | "finalize";

export const MACHINE_BUILD_STAGES: { key: MachineBuildStage; label: string }[] = [
  { key: "understand_offer", label: "Understanding your offer" },
  { key: "match_channels", label: "Matching traffic channels" },
  { key: "write_submissions", label: "Writing your first week of submissions" },
  { key: "build_plan", label: "Building your daily plan" },
  { key: "finalize", label: "Ready" },
];

export interface MachineBuildProgress {
  currentStage?: MachineBuildStage;
  completedStages: MachineBuildStage[];
  error?: string;
}

export interface SubmissionPackField {
  key: string;
  label: string;
  value: string;
}

export interface SubmissionPack {
  version: 2;
  sourceType: SourceType;
  fields: SubmissionPackField[];
  copyAll: string;
  whyThisSource: string;
  tips: string[];
  estimatedTraffic: string;
  generatedBy?: "ai" | "fallback";
}

/** @deprecated Use SubmissionPack — kept for reading legacy activation rows */
export interface PromotionKit {
  headline: string;
  shortDescription: string;
  longDescription: string;
  cta: string;
  keywords: string[];
  anchorText: string;
  copyAll: string;
}

export interface ScoredOpportunity {
  source: TrafficSource;
  score: number;
  label: ScoreLabel;
  audienceMatchPercent: number;
  potential: "High" | "Medium" | "Low";
  reasons: string[];
  bucket: OpportunityBucket;
  activated: boolean;
  activationStatus?: ActivationStatus;
}

export interface OpportunitySummary {
  total: number;
  quickWins: number;
  longTerm: number;
  highPotential: number;
  content: number;
}

export interface SevenDayPlanDay {
  dayIndex: number;
  label: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sourceIds: string[];
  status: "completed" | "current" | "upcoming";
}

export interface TrafficExperiment {
  id: string;
  name: string;
  channel: string;
  status: "testing" | "leading" | "paused";
  sourceIds: string[];
}

export interface NextAction {
  type: "setup" | "build" | "activate" | "plan_day" | "review_health" | "complete";
  title: string;
  description: string;
  sourceId?: string;
  ctaLabel: string;
}

export interface MachineHealthSummary {
  active: number;
  needsAttention: number;
  newOpportunities: number;
  attentionItems: { sourceId: string; message: string }[];
}

export interface TrafficMachineRow {
  id: string;
  user_id: string;
  offer_url: string;
  offer_snapshot: OfferSnapshot;
  audience_niche: string;
  goal: TrafficGoal;
  stage: MachineStage;
  status: MachineStatus;
  plan: { days: SevenDayPlanDay[] };
  experiments: TrafficExperiment[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ActivationRow {
  id: string;
  machine_id: string;
  source_id: string;
  status: ActivationStatus;
  activated_at: string | null;
  promotion_kit: SubmissionPack | PromotionKit | null;
  notes: string | null;
}

export interface MachineProgression {
  discover: "complete" | "current" | "locked";
  activate: "complete" | "current" | "locked" | number;
  grow: "complete" | "current" | "locked" | number;
  optimize: "complete" | "current" | "locked";
}
