"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { motion } from "framer-motion";
import { InfoHint } from "@/components/ui/InfoHint";
import { InlineError } from "@/components/ui/InlineError";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { Field } from "@/components/ui/field";
import { Steps } from "@/components/ui/steps";
import { RecentTopics } from "@/components/ui/recent-topics";
import { isValidTopicKeyword, sanitizeTopicKeyword } from "@/lib/keyword";

export default function SearchPage() {
  const {
    setKeyword,
    setVariations,
    setPostsByVariation,
    setActivityByVariation,
    setAnalysisByVariation,
    setSelectedAds,
    setActiveChip,
    setStep1Completed,
    history,
    addToHistory,
  } = useSearch();
  const [topicInput, setTopicInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOfferBanner, setShowOfferBanner] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = async (val?: string) => {
    const searchVal = sanitizeTopicKeyword(val || topicInput);
    if (!searchVal) {
      setError("Enter a short topic to search for.");
      return;
    }
    if (!isValidTopicKeyword(searchVal)) {
      setError('Enter a short topic like "weight loss" — not a link or long paste.');
      return;
    }

    setLoading(true);
    setShowOfferBanner(true);
    setError("");
    setStep1Completed(false);
    setKeyword(searchVal);
    addToHistory(searchVal);
    setVariations([]);
    setActiveChip("");
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
      setStep1Completed(true);
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-4 sm:py-10"
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="page-eyebrow">STEP 1 OF 4</span>
        <h1 className="ds-h1">Enter Your Ad Topic</h1>
        <p className="ds-subtitle max-w-xl">
          Type one topic below. We will find related ads and conversations from Reddit and YouTube.
        </p>
        <div className="flex w-full max-w-md items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
            <div className="h-full w-1/4 rounded-full" style={{ background: "var(--grad-brand)" }} />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-text-muted">1/4</span>
        </div>
        <InfoHint
          label="What is an ad topic?"
          text="A topic is just the subject people are searching for — like 'weight loss' or 'dog food'. Pick one thing you want to promote."
        />
      </header>

      <div className="card-base flex flex-col gap-6 p-6! sm:gap-7 sm:p-10!">
        <Field
          label="Topic"
          placeholder='e.g. "weight loss", "dog food", "acne"'
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          autoFocus
          trailing={<Search size={18} strokeWidth={1.75} className="text-text-muted" />}
        />

        <button
          onClick={() => handleSearch()}
          disabled={loading || !topicInput.trim()}
          className="btn-primary h-14 w-full text-base"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Finding Ads...
            </>
          ) : (
            <>
              <Search size={20} strokeWidth={1.75} />
              Find Ads
              <ArrowRight size={18} strokeWidth={1.75} />
            </>
          )}
        </button>

        <InlineError message={error} />

        <RecentTopics
          topics={history}
          disabled={loading}
          onSelect={(topic) => {
            setTopicInput(topic);
            handleSearch(topic);
          }}
        />
      </div>

      {(loading || showOfferBanner) && (
        <div className="min-h-[140px]">
          <GenerationProgress
            active={loading}
            showBanner={showOfferBanner}
            label="Finding ads..."
            offer="earnings"
            scrollOnComplete={false}
          />
        </div>
      )}

      <div className="border-t border-[var(--border-subtle)] pt-8">
        <p className="page-eyebrow mb-5 text-center">How it works</p>
        <Steps
          items={[
            { title: "Type a topic", description: "Enter what you want to promote." },
            { title: "We find ads", description: "Demand and conversations surface." },
            { title: "You copy & earn", description: "Reply with your link." },
          ]}
        />
      </div>
    </motion.div>
  );
}
