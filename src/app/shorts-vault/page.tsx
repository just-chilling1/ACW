"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { NichePicker } from "@/components/ui/niche-picker";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/InlineError";
import { ShortsScriptCard } from "@/components/vault/ShortsScriptCard";
import { useSearch } from "@/context/SearchContext";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { applyAffiliateLinkToScript, getShortsForNiche } from "@/lib/vault/shorts-catalog";
import type { ShortsPlatformTag } from "@/lib/vault/shorts-types";
import type { VaultStateResponse } from "@/lib/vault/types";

const NICHE_KEY = "acw.shorts-vault.niche";
const PLATFORM_KEY = "acw.shorts-vault.platform";

type PlatformFilter = ShortsPlatformTag | "all";

const PLATFORM_OPTIONS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tiktok", label: "TikTok" },
  { value: "reels", label: "Reels" },
  { value: "shorts", label: "Shorts" },
];

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}

function isPlatformFilter(value: string): value is PlatformFilter {
  return PLATFORM_OPTIONS.some((option) => option.value === value);
}

function readStoredNiche(): NicheId {
  if (typeof window === "undefined") return "make_money_online";
  try {
    const raw = localStorage.getItem(NICHE_KEY);
    if (raw && isNicheId(raw)) return raw;
  } catch {
    // ignore
  }
  return "make_money_online";
}

function readStoredPlatform(): PlatformFilter {
  if (typeof window === "undefined") return "all";
  try {
    const raw = localStorage.getItem(PLATFORM_KEY);
    if (raw && isPlatformFilter(raw)) return raw;
  } catch {
    // ignore
  }
  return "all";
}

export default function ShortsVaultPage() {
  const { affiliateLink } = useSearch();
  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [hideUsed, setHideUsed] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setNiche(readStoredNiche());
    setPlatform(readStoredPlatform());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(NICHE_KEY, niche);
      localStorage.setItem(PLATFORM_KEY, platform);
    } catch {
      // ignore
    }
  }, [hydrated, niche, platform]);

  const loadState = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vault/state");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load");
      }
      const data = (await res.json()) as VaultStateResponse;
      setSaved(new Set(data.saved || []));
      setUsed(new Set(data.used || []));
    } catch {
      setError("We couldn't load your saved and used scripts. You can still browse and copy.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    loadState();
  }, [hydrated, loadState]);

  const nicheScripts = useMemo(
    () =>
      getShortsForNiche(niche, platform).map((script) =>
        applyAffiliateLinkToScript(script, affiliateLink || ""),
      ),
    [niche, platform, affiliateLink],
  );

  const nicheTotal = useMemo(() => getShortsForNiche(niche).length, [niche]);
  const usedCount = useMemo(
    () => getShortsForNiche(niche).filter((script) => used.has(script.id)).length,
    [niche, used],
  );

  const visibleScripts = useMemo(
    () =>
      nicheScripts.filter((script) => {
        if (savedOnly && !saved.has(script.id)) return false;
        if (hideUsed && used.has(script.id)) return false;
        return true;
      }),
    [nicheScripts, savedOnly, hideUsed, saved, used],
  );

  const patchState = useCallback(
    async (scriptId: string, patch: { saved?: boolean; used?: boolean }) => {
      const prevSaved = new Set(saved);
      const prevUsed = new Set(used);

      if (typeof patch.saved === "boolean") {
        const next = new Set(saved);
        if (patch.saved) next.add(scriptId);
        else next.delete(scriptId);
        setSaved(next);
      }
      if (typeof patch.used === "boolean") {
        const next = new Set(used);
        if (patch.used) next.add(scriptId);
        else next.delete(scriptId);
        setUsed(next);
      }

      setPendingId(scriptId);
      try {
        const res = await fetch("/api/vault/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: scriptId, ...patch }),
        });
        if (!res.ok) throw new Error("save failed");
      } catch {
        setSaved(prevSaved);
        setUsed(prevUsed);
        setError("We couldn't save that change. Please try again.");
      } finally {
        setPendingId(null);
      }
    },
    [saved, used],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6 pb-16"
    >
      <PageHeader
        eyebrow="PREMIUM"
        title={
          <>
            Viral Shorts <span className="text-gradient">Vault</span>
          </>
        }
        subtitle="40 faceless scripts for TikTok, Reels, and Shorts. Pick one, read it, post it. No camera needed."
      />

      <TutorialVideoSection
        title="How the Shorts Vault Works"
        description="Choose a niche, copy a full script with its hook, beats, caption, and hashtags, then record it faceless with stock footage or a screen recording."
      />

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">1. Choose your niche</h2>
        <NichePicker value={niche} onChange={setNiche} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">2. Filter the library</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((option) => (
            <SelectableChip
              key={option.value}
              label={option.label}
              selected={platform === option.value}
              onClick={() => setPlatform(option.value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectableChip
            label="Saved only"
            selected={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
          />
          <SelectableChip
            label="Hide used"
            selected={hideUsed}
            onClick={() => setHideUsed((v) => !v)}
          />
        </div>
        <p className="text-sm text-text-muted">
          {usedCount} of {nicheTotal} used
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">3. Copy and film</h2>

        {error ? (
          <div className="flex flex-col gap-3">
            <InlineError message={error} />
            <button type="button" className="btn-secondary w-fit" onClick={loadState}>
              Try again
            </button>
          </div>
        ) : null}

        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}

        {!loading && visibleScripts.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-text-muted">
            No scripts match these filters. Try another niche or clear Saved only / Hide used.
          </div>
        )}

        {!loading && visibleScripts.length > 0 && (
          <div className="flex flex-col gap-4">
            {visibleScripts.map((script) => (
              <ShortsScriptCard
                key={script.id}
                script={script}
                saved={saved.has(script.id)}
                used={used.has(script.id)}
                disabled={pendingId === script.id}
                onToggleSaved={() => patchState(script.id, { saved: !saved.has(script.id) })}
                onToggleUsed={() => patchState(script.id, { used: !used.has(script.id) })}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
