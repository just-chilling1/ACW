"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  ActionPlanItem,
  Campaign,
  CampaignPhase,
  CampaignStrategy,
  OfferAnalysis,
  Opportunity,
  OpportunityFilter,
  PromotionPackContent,
  TrustCheckResult,
} from "@/lib/campaign/types";
import { campaignStrength } from "@/lib/campaign/scoring";
import {
  createCampaignId,
  readCampaigns,
  saveCampaign,
  getCampaign,
} from "@/lib/campaign/storage";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { VideoThumbnail } from "@/components/ui/video-thumbnail";
import { VideoOverlay } from "@/components/ui/video-overlay";
import { CampaignWorkflowProgress } from "./campaign-workflow-progress";
import { OfferInput } from "./offer-input";
import { AiAnalysisProgress } from "./ai-analysis-progress";
import { OfferAnalysisResult } from "./offer-analysis-result";
import { OpportunityList } from "./opportunity-list";
import { CampaignStrategyView } from "./campaign-strategy";
import { PromotionPack } from "./promotion-pack";
import { TrustCheck } from "./trust-check";
import { ConversationAssistant } from "./conversation-assistant";
import { ActionPlan } from "./action-plan";
import { CampaignDashboard } from "./campaign-dashboard";
import { getPrimaryReply } from "@/lib/campaign/trust-check";

const DFY_VIDEO_ID = "1214651948";

const LEGACY_KEYWORDS = [
  {
    label: "Best natural appetite suppressant",
    search: "best natural appetite suppressant reddit 2024",
    niche: "Weight Loss",
  },
  {
    label: "Best VPN for streaming",
    search: "best vpn for netflix 2024 reddit",
    niche: "Cybersecurity",
  },
  {
    label: "How to make money with AI tools",
    search: "how to make money with ai tools reddit",
    niche: "MMO",
  },
  {
    label: "Best ergonomic chair for back pain",
    search: "best ergonomic chair back pain under 300 reddit",
    niche: "Home Office",
  },
  {
    label: "Best email marketing tool for small business",
    search: "best email marketing platform for creators reddit",
    niche: "Marketing",
  },
];

function buildActionPlan(
  opportunities: Opportunity[],
  selectedId: string,
  postingGuidance: string
): ActionPlanItem[] {
  const selected = opportunities.find((o) => o.id === selectedId);
  const others = opportunities.filter((o) => o.id !== selectedId).slice(0, 2);

  const makeItem = (opp: Opportunity, status: ActionPlanItem["status"] = "ready"): ActionPlanItem => ({
    id: `action_${opp.id}`,
    opportunityId: opp.id,
    title: opp.post.title || opp.post.text.slice(0, 80),
    platform: opp.post.platform,
    intentLabel:
      (opp.score.buyingIntent ?? 0) >= 75
        ? "High Intent"
        : (opp.score.opportunity ?? 0) >= 75
          ? "Low Competition"
          : "Strong Match",
    whatToDo: postingGuidance || "Copy your recommended reply and post it under this conversation.",
    whyItMatters: opp.whyPicked,
    status,
    postUrl: opp.post.url,
  });

  const items: ActionPlanItem[] = [];
  if (selected) items.push(makeItem(selected, "ready"));
  others.forEach((o) => items.push(makeItem(o, "new")));
  return items;
}

export function CampaignBuilder() {
  const [phase, setPhase] = useState<CampaignPhase>("offer");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<OfferAnalysis | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState<OpportunityFilter>("best_match");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);
  const [promotionPack, setPromotionPack] = useState<PromotionPackContent | null>(null);
  const [trustCheck, setTrustCheck] = useState<TrustCheckResult | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [savedCampaigns, setSavedCampaigns] = useState<Campaign[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [showOfferBanner, setShowOfferBanner] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      setSavedCampaigns(readCampaigns(id));
      const latest = readCampaigns(id)[0];
      if (latest) setCampaign(latest);
    });
  }, []);

  const persistCampaign = useCallback((next: Campaign) => {
    setCampaign(next);
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? userId;
      setSavedCampaigns(saveCampaign(next, id));
    });
  }, [userId]);

  const restoreCampaign = useCallback((selected: Campaign, nextPhase: CampaignPhase = "dashboard") => {
    setCampaign(selected);
    setAffiliateLink(selected.offer.affiliateLink);
    setAnalysis(selected.offer.analysis);
    setOpportunities(selected.opportunities);
    setSelectedOpportunity(
      selected.opportunities.find((o) => o.id === selected.selectedOpportunityId) ?? null
    );
    setStrategy(selected.strategy);
    setPromotionPack(selected.promotionPack);
    setTrustCheck(selected.trustCheck);
    setPhase(nextPhase);
    setError("");
  }, []);

  const handleAnalyze = async (linkOverride?: string) => {
    const link = (linkOverride ?? affiliateLink).trim();
    if (!link) {
      setError("Please paste your affiliate link.");
      return;
    }

    setAffiliateLink(link);
    setError("");
    setPhase("analyzing");
    setShowOfferBanner(true);

    try {
      const analyzeResp = await fetch("/api/campaign/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateLink: link }),
      });
      const analyzeData = await analyzeResp.json();

      if (!analyzeResp.ok) {
        setError(analyzeData.message || "We couldn't analyze this offer right now.");
        setPhase("offer");
        return;
      }

      setAnalysis(analyzeData.analysis);

      const oppResp = await fetch("/api/campaign/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: analyzeData.analysis }),
      });
      const oppData = await oppResp.json();

      if (!oppData.opportunities?.length) {
        setOpportunities([]);
        setError(oppData.message || "We couldn't find strong opportunities yet.");
        setPhase("discovery");
        return;
      }

      setOpportunities(oppData.opportunities);
      setPhase("discovery");
    } catch {
      setError("We couldn't analyze this offer right now.");
      setPhase("offer");
    }
  };

  const handleSelectOpportunity = async (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setLoadingStrategy(true);
    setPhase("strategy");

    try {
      const resp = await fetch("/api/campaign/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, opportunity: opp }),
      });
      const data = await resp.json();
      setStrategy(data.strategy);
    } catch {
      setStrategy({
        approach:
          "Answer the person's question first with useful information. Introduce the offer only after establishing relevance.",
        bestAngle: analysis?.positioning || "Focus on the main benefit naturally.",
        recommendedCta: "Keep the CTA soft and optional.",
      });
    } finally {
      setLoadingStrategy(false);
    }
  };

  const handleBuildPack = async () => {
    if (!analysis || !selectedOpportunity || !strategy) return;
    setLoadingPack(true);
    setPhase("pack");

    try {
      const resp = await fetch("/api/campaign/promotion-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          opportunity: selectedOpportunity,
          strategy,
          affiliateLink,
        }),
      });
      const data = await resp.json();
      setPromotionPack(data.promotionPack);
      setTrustCheck(data.trustCheck);
      setPhase("plan");

      const actionPlan = buildActionPlan(
        opportunities,
        selectedOpportunity.id,
        data.promotionPack?.postingGuidance
      );

      const newCampaign: Campaign = {
        id: createCampaignId(),
        name: `${analysis.productName} Campaign`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        offer: { affiliateLink, analysis },
        opportunities,
        selectedOpportunityId: selectedOpportunity.id,
        strategy,
        promotionPack: data.promotionPack,
        trustCheck: data.trustCheck,
        actionPlan,
        campaignStrength: campaignStrength({
          actionPlan,
          offer: { analysis },
        }),
      };
      persistCampaign(newCampaign);
    } catch {
      setError("We couldn't build your promotion pack. Try again.");
      setPhase("strategy");
    } finally {
      setLoadingPack(false);
    }
  };

  const handleMarkDone = (actionId: string) => {
    if (!campaign) return;
    const actionPlan = campaign.actionPlan.map((a) =>
      a.id === actionId ? { ...a, status: "completed" as const } : a
    );
    const updated: Campaign = {
      ...campaign,
      actionPlan,
      updatedAt: new Date().toISOString(),
      campaignStrength: campaignStrength({ actionPlan, offer: campaign.offer }),
    };
    persistCampaign(updated);
  };

  const handleStartActions = () => {
    setPhase("dashboard");
  };

  const handleNewCampaign = () => {
    setPhase("offer");
    setAffiliateLink("");
    setAnalysis(null);
    setOpportunities([]);
    setSelectedOpportunity(null);
    setStrategy(null);
    setPromotionPack(null);
    setTrustCheck(null);
    setError("");
  };

  const handleSelectSaved = (id: string) => {
    const selected = getCampaign(id, userId);
    if (selected) restoreCampaign(selected, "dashboard");
  };

  const handleViewPlan = () => {
    if (campaign) restoreCampaign(campaign, "plan");
  };

  const isAnalyzing = phase === "analyzing";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8 sm:gap-10 sm:py-10"
    >
      <PageHeader
        eyebrow="PREMIUM"
        title={
          <>
            Done-For-You <span className="text-gradient">Campaign Builder</span>
          </>
        }
        subtitle="Give AI your offer. It finds opportunities, creates content, and tells you exactly what to do next."
      />

      <section className="card-base overflow-hidden p-0!">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <VideoThumbnail
              videoId={DFY_VIDEO_ID}
              title="How to Use Done-For-You"
              onPlay={() => setVideoOpen(true)}
              className="rounded-none border-0"
            />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:w-1/2 md:p-10">
            <p className="page-eyebrow text-[11px]!">Watch First</p>
            <h2 className="ds-h2">Your offer in. Your campaign out.</h2>
            <p className="leading-relaxed text-text-secondary">
              Paste your affiliate link once — AI handles analysis, opportunity discovery, content, and your action plan.
            </p>
          </div>
        </div>
      </section>

      <CampaignWorkflowProgress phase={phase} />

      {(isAnalyzing || loadingPack) && (
        <GenerationProgress
          active={isAnalyzing || loadingPack}
          showBanner={showOfferBanner}
          label={
            isAnalyzing
              ? "Analyzing your offer..."
              : "Building your promotion pack..."
          }
          offer="welcome"
        />
      )}

      {isAnalyzing ? <AiAnalysisProgress active={isAnalyzing} /> : null}

      <AnimatePresence mode="wait">
        {phase === "offer" && (
          <motion.div key="offer" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <OfferInput
              affiliateLink={affiliateLink}
              onChange={setAffiliateLink}
              onSubmit={() => handleAnalyze()}
              onNoLink={() =>
                window.open("https://www.digistore24.com", "_blank", "noopener,noreferrer")
              }
              error={error}
            />

            {savedCampaigns.length > 0 ? (
              <div className="mx-auto mt-8 max-w-2xl">
                <button
                  type="button"
                  onClick={() => restoreCampaign(savedCampaigns[0], "dashboard")}
                  className="btn-secondary w-full"
                >
                  Continue: {savedCampaigns[0].name}
                </button>
              </div>
            ) : null}

            <details className="mx-auto mt-6 max-w-2xl">
              <summary className="cursor-pointer text-center text-sm font-medium text-text-muted hover:text-[var(--gold)]">
                Advanced: Explore manually with a keyword
              </summary>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {LEGACY_KEYWORDS.map((kw) => (
                  <button
                    key={kw.search}
                    type="button"
                    onClick={async () => {
                      if (!affiliateLink.trim()) {
                        setError("Paste your affiliate link first, then pick a keyword.");
                        return;
                      }
                      setError("");
                      setPhase("analyzing");
                      setShowOfferBanner(true);
                      const manualAnalysis: OfferAnalysis = {
                        productName: kw.label,
                        category: kw.niche,
                        mainProblem: `People searching for ${kw.label.toLowerCase()}.`,
                        targetAudience: `People interested in ${kw.niche}`,
                        mainBenefit: "A relevant solution for this niche",
                        positioning: "Helpful first, promotion second.",
                        searchKeywords: [kw.search],
                        opportunityScore: {
                          overall: 80,
                          label: "Strong",
                          audienceMatch: 78,
                          buyingIntent: 82,
                          opportunity: 76,
                          offerMatch: 80,
                        },
                      };
                      setAnalysis(manualAnalysis);
                      try {
                        const oppResp = await fetch("/api/campaign/opportunities", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ analysis: manualAnalysis }),
                        });
                        const oppData = await oppResp.json();
                        if (oppData.opportunities?.length) {
                          setOpportunities(oppData.opportunities);
                          setPhase("discovery");
                        } else {
                          setError("We couldn't find strong opportunities for this keyword.");
                          setPhase("offer");
                        }
                      } catch {
                        setError("Something went wrong. Please try again.");
                        setPhase("offer");
                      }
                    }}
                    className="card-interactive p-4! text-left text-sm"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{kw.niche}</span>
                    <p className="mt-1 font-medium text-text-primary">{kw.label}</p>
                  </button>
                ))}
              </div>
            </details>
          </motion.div>
        )}

        {phase === "discovery" && analysis && (
          <motion.div key="discovery" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col gap-10">
            <OfferAnalysisResult analysis={analysis} />
            {error && opportunities.length === 0 ? (
              <div className="card-base flex flex-col items-center gap-4 p-10! text-center">
                <p className="text-sm text-[var(--danger)]">{error}</p>
                <button type="button" onClick={() => setPhase("offer")} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : (
              <OpportunityList
                opportunities={opportunities}
                filter={filter}
                onFilterChange={setFilter}
                selectedId={selectedOpportunity?.id ?? null}
                onSelect={handleSelectOpportunity}
              />
            )}
            <button type="button" onClick={handleNewCampaign} className="btn-ghost mx-auto text-sm">
              <RotateCcw size={14} aria-hidden />
              Start over
            </button>
          </motion.div>
        )}

        {phase === "strategy" && (
          <motion.div key="strategy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {loadingStrategy && !strategy ? (
              <AiAnalysisProgress
                active
                title="Planning your campaign approach..."
                steps={[
                  "Reviewing the conversation",
                  "Choosing the best angle",
                  "Setting your CTA approach",
                ]}
              />
            ) : strategy ? (
              <CampaignStrategyView
                strategy={strategy}
                onBuildPack={handleBuildPack}
                loading={loadingStrategy || loadingPack}
              />
            ) : null}
          </motion.div>
        )}

        {phase === "pack" && loadingPack ? (
          <motion.div key="pack-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AiAnalysisProgress
              active
              title="Creating your promotion pack..."
              steps={[
                "Writing your recommended reply",
                "Preparing alternative angles",
                "Building follow-up responses",
                "Running quality checks",
              ]}
            />
          </motion.div>
        ) : null}

        {phase === "plan" && promotionPack && analysis && (
          <motion.div key="plan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
            <PromotionPack pack={promotionPack} />
            {trustCheck ? <TrustCheck result={trustCheck} /> : null}
            <ConversationAssistant
              analysis={analysis}
              ourPreviousReply={getPrimaryReply(promotionPack)}
            />
            {campaign ? (
              <ActionPlan
                items={campaign.actionPlan}
                onStart={handleStartActions}
                onMarkDone={handleMarkDone}
              />
            ) : null}
          </motion.div>
        )}

        {phase === "dashboard" && campaign && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <CampaignDashboard
              campaign={campaign}
              onMarkDone={handleMarkDone}
              onNewCampaign={handleNewCampaign}
              onSelectCampaign={handleSelectSaved}
              onViewPlan={handleViewPlan}
              savedCampaigns={savedCampaigns}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-6 flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] pt-8 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {["Offer Analysis", "Opportunity Finder", "Promotion Pack", "Action Plan"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              <div className="h-1 w-1 rounded-full bg-[var(--gold)]" aria-hidden />
              {item}
            </div>
          ))}
        </div>
      </footer>

      <VideoOverlay
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        videoUrl={`https://player.vimeo.com/video/${DFY_VIDEO_ID}`}
        title="How to Use Done-For-You"
      />
    </motion.div>
  );
}
