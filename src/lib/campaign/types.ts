export type OpportunityStatus = "new" | "ready" | "in_progress" | "completed";

export type ScoreLabel = "Excellent" | "Strong" | "Good" | "Weak";

export interface ScoreBreakdown {
  overall: number;
  label: ScoreLabel;
  audienceMatch?: number;
  buyingIntent?: number;
  opportunity?: number;
  offerMatch?: number;
}

export interface OfferAnalysis {
  productName: string;
  category: string;
  mainProblem: string;
  targetAudience: string;
  mainBenefit: string;
  positioning: string;
  searchKeywords: string[];
  opportunityScore: ScoreBreakdown;
}

export interface CampaignPost {
  id: string;
  platform: string;
  text: string;
  title?: string;
  url: string;
  engagement: string | number;
}

export interface Opportunity {
  id: string;
  post: CampaignPost;
  score: ScoreBreakdown;
  indicators: string[];
  whyPicked: string;
  recommended?: boolean;
}

export interface CampaignStrategy {
  approach: string;
  bestAngle: string;
  recommendedCta: string;
}

export interface PromotionPackContent {
  recommendedReply: string;
  alternativeReply: string;
  shortReply: string;
  followUpResponse: string;
  objectionResponse: string;
  dmResponse: string;
  cta: string;
  postingGuidance: string;
}

export interface TrustCheckItem {
  id: string;
  label: string;
  passed: boolean;
  note?: string;
}

export interface TrustCheckResult {
  items: TrustCheckItem[];
  score: number;
  label: ScoreLabel;
}

export interface ActionPlanItem {
  id: string;
  opportunityId: string;
  title: string;
  platform: string;
  intentLabel: string;
  whatToDo: string;
  whyItMatters: string;
  status: OpportunityStatus;
  postUrl: string;
}

export interface ConversationResponse {
  recommended: string;
  why: string;
  softer?: string;
  stronger?: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  offer: {
    affiliateLink: string;
    analysis: OfferAnalysis;
  };
  opportunities: Opportunity[];
  selectedOpportunityId: string | null;
  strategy: CampaignStrategy | null;
  promotionPack: PromotionPackContent | null;
  trustCheck: TrustCheckResult | null;
  actionPlan: ActionPlanItem[];
  campaignStrength: number;
}

export type CampaignPhase =
  | "offer"
  | "analyzing"
  | "discovery"
  | "strategy"
  | "pack"
  | "plan"
  | "dashboard";

export type OpportunityFilter = "best_match" | "highest_intent" | "lowest_competition" | "newest";
