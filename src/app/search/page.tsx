"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, History, Loader2 } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { motion } from "framer-motion";
import { InfoHint } from "@/components/ui/InfoHint";
import { InlineError } from "@/components/ui/InlineError";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { Field } from "@/components/ui/field";
import { Steps } from "@/components/ui/steps";

export default function SearchPage() {
  const {
    keyword,
    setKeyword,
    setVariations,
    setPostsByVariation,
    setActivityByVariation,
    setAnalysisByVariation,
    setSelectedAds,
    setActiveChip,
    history,
    addToHistory,
  } = useSearch();
  const [loading, setLoading] = useState(false);
  const [showOfferBanner, setShowOfferBanner] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = async (val?: string) => {
    const searchVal = val || keyword;
    if (!searchVal) return;

    setLoading(true);
    setShowOfferBanner(true);
    setError("");
    addToHistory(searchVal);
    setPostsByVariation({});
    setActivityByVariation({});
    setAnalysisByVariation({});
    setSelectedAds([]);

    try {
      const resp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchVal }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError("That didn't work — please try again in a moment.");
        return;
      }

      setVariations(data.variations || []);
      setActiveChip(data.variations?.[0] || "");
      await new Promise((r) => setTimeout(r, 900));
      router.push("/analysis");
    } catch (e) {
      console.error(e);
      setError("We couldn't connect. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-2"
    >
      <PageHeader
        eyebrow="STEP 1 OF 4"
        step={1}
        title="Enter Your Ad Topic"
        subtitle="Type one topic below. We will find related ads and conversations from Reddit and YouTube."
        actions={
          <InfoHint
            label="What is an ad topic?"
            text="A topic is just the subject people are searching for — like 'weight loss' or 'dog food'. Pick one thing you want to promote."
          />
        }
      />

      {(loading || showOfferBanner) && (
        <GenerationProgress
          active={loading}
          showBanner={showOfferBanner}
          label="Finding ads..."
          offer="earnings"
          scrollOnComplete={false}
        />
      )}

      <div className="card-base flex max-w-2xl flex-col gap-4">
        <Field
          label="Topic"
          placeholder='e.g. "weight loss", "dog food", "acne"'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          autoFocus
          trailing={<Search size={18} strokeWidth={1.75} className="text-text-muted" />}
        />

        <button
          onClick={() => handleSearch()}
          disabled={loading || !keyword}
          className="btn-primary h-12 w-full text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Finding Ads...
            </>
          ) : (
            <>
              <Search size={18} strokeWidth={1.75} />
              Find Ads
              <ArrowRight size={16} strokeWidth={1.75} />
            </>
          )}
        </button>

        <InlineError message={error} />
      </div>

      {history.length > 0 && (
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <History size={14} strokeWidth={1.75} className="text-text-muted" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Recent
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setKeyword(h);
                  handleSearch(h);
                }}
                disabled={loading}
                className="btn-chip disabled:opacity-50"
              >
                {h}
                <ArrowRight size={12} strokeWidth={1.75} className="opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl border-t border-[var(--border-subtle)] pt-6">
        <p className="page-eyebrow mb-4">How it works</p>
        <Steps
          compact
          items={[
            { title: "Type a topic" },
            { title: "We find ads" },
            { title: "You copy & earn" },
          ]}
        />
      </div>
    </motion.div>
  );
}
