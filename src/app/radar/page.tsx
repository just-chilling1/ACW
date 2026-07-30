"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ExternalLink, ArrowLeft, Search, ArrowRight
} from "lucide-react";
import { useSearch, Ad } from "@/context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { GenerationProgress } from "@/components/ui/generation-progress";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { SkeletonCards } from "@/components/ui/skeleton";

function PlatformBadge({ platform }: { platform: string }) {
  const isReddit = platform === "Reddit";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
        isReddit
          ? "border-orange-400/20 bg-orange-400/5 text-orange-400"
          : "border-red-500/20 bg-red-500/5 text-red-500"
      )}
    >
      {platform}
    </span>
  );
}

function RadarAdCard({
  post,
  isSelected,
  onToggle,
}: {
  post: Ad;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onToggle}
      className={clsx(
        "card-base relative cursor-pointer p-4! transition-all",
        isSelected && "border-[rgba(234,179,8,0.45)] bg-[rgba(234,179,8,0.06)]"
      )}
    >
      <div
        className={clsx(
          "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all sm:h-5 sm:w-5",
          isSelected
            ? "border-[var(--gold)] bg-[var(--gold)] text-[#0A0A0B]"
            : "border-[var(--border-strong)] bg-[var(--surface-2)]"
        )}
      >
        {isSelected && <Check size={11} strokeWidth={3} />}
      </div>

      <div className="flex flex-col gap-2.5 pr-6">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={post.platform} />
          <span className="text-[9px] font-medium tabular-nums text-text-muted">
            {typeof post.engagement === "number"
              ? `${post.engagement.toLocaleString()} engagements`
              : post.engagement}
          </span>
        </div>
        <p className="line-clamp-3 text-[13px] font-medium leading-relaxed text-text-primary">
          {post.text || post.title}
        </p>
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-[var(--gold)]"
          >
            <ExternalLink size={10} strokeWidth={1.75} />
            <span>View original</span>
          </a>
          <span
            className={clsx(
              "text-[9px] font-bold uppercase tracking-widest",
              isSelected ? "text-[var(--gold)]" : "text-text-muted"
            )}
          >
            {isSelected ? "Selected" : "Click to select"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function RadarPage() {
  const {
    variations,
    activeChip,
    setActiveChip,
    postsByVariation,
    setPostsByVariation,
    selectedAds,
    setSelectedAds,
  } = useSearch();

  const [loadingChip, setLoadingChip] = useState<string | null>(null);
  const [showOfferBanner, setShowOfferBanner] = useState(false);
  const [requestedChips, setRequestedChips] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  const currentPosts = postsByVariation[activeChip] || [];
  const hasFetchedActive = requestedChips.has(activeChip);

  // Resume chips that already have results in this session — never auto-fetch on mount.
  useEffect(() => {
    const loaded = Object.keys(postsByVariation).filter(
      (k) => (postsByVariation[k]?.length ?? 0) > 0
    );
    if (loaded.length === 0) return;
    setRequestedChips((prev) => {
      const next = new Set(prev);
      let changed = false;
      loaded.forEach((k) => {
        if (!next.has(k)) {
          next.add(k);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [postsByVariation]);

  const fetchPostsForChip = async (chip: string) => {
    if (!chip || loadingChip) return;
    setShowOfferBanner(true);
    setFetchError(null);
    setRequestedChips((prev) => new Set(prev).add(chip));
    setLoadingChip(chip);
    try {
      const resp = await fetch("/api/jackpots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: chip.trim() }),
      });
      const data = await resp.json().catch(() => ({}));
      const results = Array.isArray(data.results) ? data.results : [];

      if (results.length > 0) {
        setPostsByVariation((prev) => ({ ...prev, [chip]: results }));
        return;
      }

      // Retry once with a shorter keyword if the long-tail query returned nothing
      const simplified = chip.trim().split(/\s+/).slice(0, 3).join(" ");
      if (simplified && simplified !== chip.trim()) {
        const retry = await fetch("/api/jackpots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: simplified }),
        });
        const retryData = await retry.json().catch(() => ({}));
        const retryResults = Array.isArray(retryData.results) ? retryData.results : [];
        if (retryResults.length > 0) {
          setPostsByVariation((prev) => ({ ...prev, [chip]: retryResults }));
          return;
        }
      }

      setPostsByVariation((prev) => ({ ...prev, [chip]: [] }));
      setFetchError(
        !resp.ok
          ? "We couldn't load ads right now. Tap Search again in a moment."
          : "No ads matched this keyword. Try a shorter topic like \"side hustle\" or \"make money\"."
      );
    } catch (e) {
      console.error("Fetch ads failed:", e);
      setPostsByVariation((prev) => ({ ...prev, [chip]: [] }));
      setFetchError("We couldn't connect. Check your internet and try Search again.");
    } finally {
      setLoadingChip(null);
    }
  };

  const togglePostSelection = (post: Ad) => {
    const isAlreadySelected = selectedAds.some((p) => p.id === post.id);
    if (isAlreadySelected) {
      setSelectedAds(selectedAds.filter((p) => p.id !== post.id));
    } else {
      setSelectedAds([...selectedAds, post]);
    }
  };

  if (variations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <Search size={24} strokeWidth={1.75} className="text-text-muted" />
        </div>
        <div className="flex flex-col gap-2 text-center">
          <h2 className="ds-h2">Start with Step 1</h2>
          <p className="text-sm text-text-muted">Enter a topic first so we can find ads for you.</p>
        </div>
        <button onClick={() => router.push("/search")} className="btn-primary">
          <Search size={16} strokeWidth={1.75} />
          <span>Go to Step 1</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6"
    >
      <PageHeader
        eyebrow="STEP 3 OF 4"
        step={3}
        title="Find Ads"
        subtitle="Click ads to select them, then create replies in the next step."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end border-r border-[var(--border-subtle)] px-3">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Selected
              </span>
              <span className="text-lg font-bold tabular-nums text-[var(--gold)]">
                {selectedAds.length}
              </span>
            </div>
            <button
              onClick={() => router.push("/replies")}
              disabled={selectedAds.length === 0}
              className="btn-primary h-10 px-5 text-sm"
            >
              <span>Step 4: Create Replies</span>
              <ArrowRight size={16} strokeWidth={1.75} />
            </button>
          </div>
        }
      />

      <div id="radar-keyword-chips" className="flex flex-wrap gap-2">
        {variations.map((v) => (
          <SelectableChip
            key={v}
            label={v}
            selected={activeChip === v}
            onClick={() => {
              setActiveChip(v);
              setFetchError(null);
            }}
          />
        ))}
      </div>

      {!hasFetchedActive && (
        <div className="card-base flex flex-col items-center gap-4 p-8! text-center">
          <p className="max-w-md text-sm leading-relaxed text-text-secondary">
            Select a keyword above, then click below to find ads. Nothing runs until you start.
          </p>
          <button
            type="button"
            onClick={() => fetchPostsForChip(activeChip)}
            disabled={!activeChip || loadingChip !== null}
            className="btn-primary h-12 min-w-[220px] px-8"
          >
            <Search size={18} strokeWidth={1.75} />
            Find Ads
            <ArrowRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {(loadingChip !== null || (showOfferBanner && hasFetchedActive)) && (
        <div className="min-h-[140px]">
          <GenerationProgress
            active={loadingChip !== null}
            showBanner={showOfferBanner}
            label={`Finding ads for "${loadingChip || activeChip}"...`}
            offer="earnings"
          />
        </div>
      )}

      <div id="generation-results" className="scroll-mt-24">
        <AnimatePresence mode="popLayout">
          {loadingChip === activeChip ? (
            <SkeletonCards count={6} />
          ) : hasFetchedActive && currentPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentPosts.map((post) => (
                <RadarAdCard
                  key={post.id}
                  post={post}
                  isSelected={selectedAds.some((p) => p.id === post.id)}
                  onToggle={() => togglePostSelection(post)}
                />
              ))}
            </div>
          ) : hasFetchedActive ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] py-16">
              <Search size={32} strokeWidth={1.5} className="text-text-muted/30" />
              <p className="text-sm font-medium text-text-muted">
                No ads found for &ldquo;{activeChip}&rdquo;
              </p>
              <p className="max-w-md text-center text-[12px] text-text-muted">
                {fetchError ||
                  "Try a shorter keyword (e.g. \"side hustle\" or \"make money\"), then click Find Ads again."}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchPostsForChip(activeChip)}
                  className="btn-secondary px-4 py-2.5 text-[13px]"
                >
                  Search again
                </button>
                <button
                  onClick={() => router.push("/search")}
                  className="text-[12px] font-semibold text-text-muted hover:text-[var(--gold)]"
                >
                  Start a new search
                </button>
              </div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
        <button
          onClick={() => router.push("/analysis")}
          className="btn-ghost px-0 text-[11px] font-semibold"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          <span>Back to Step 2</span>
        </button>
        {selectedAds.length > 0 && (
          <p className="text-[11px] text-text-muted">
            <strong className="text-[var(--gold)]">{selectedAds.length}</strong> ad
            {selectedAds.length !== 1 ? "s" : ""} ready for replies
          </p>
        )}
      </div>
    </motion.div>
  );
}
