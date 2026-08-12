"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { NichePicker } from "@/components/ui/niche-picker";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/InlineError";
import { VaultEntryCard } from "@/components/vault/VaultEntryCard";
import { useSearch } from "@/context/SearchContext";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { applyAffiliateLink, getVaultEntriesForNiche } from "@/lib/vault/catalog";
import type { VaultPlatform, VaultStateResponse } from "@/lib/vault/types";

const NICHE_KEY = "acw.vault.niche";
const PLATFORM_KEY = "acw.vault.platform";

type PlatformFilter = VaultPlatform | "all";

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}

function isPlatformFilter(value: string): value is PlatformFilter {
  return value === "all" || value === "quora" || value === "pinterest";
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

export default function VaultPage() {
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
      setError("We couldn't load your saved and used items. You can still browse and copy.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    loadState();
  }, [hydrated, loadState]);

  const nicheEntries = useMemo(
    () => getVaultEntriesForNiche(niche, platform).map((entry) => applyAffiliateLink(entry, affiliateLink || "")),
    [niche, platform, affiliateLink],
  );

  const nicheTotal = useMemo(() => getVaultEntriesForNiche(niche).length, [niche]);
  const usedCount = useMemo(
    () => getVaultEntriesForNiche(niche).filter((entry) => used.has(entry.id)).length,
    [niche, used],
  );

  const visibleEntries = useMemo(() => {
    return nicheEntries.filter((entry) => {
      if (savedOnly && !saved.has(entry.id)) return false;
      if (hideUsed && used.has(entry.id)) return false;
      return true;
    });
  }, [nicheEntries, savedOnly, hideUsed, saved, used]);

  const patchState = useCallback(
    async (entryId: string, patch: { saved?: boolean; used?: boolean }) => {
      const prevSaved = new Set(saved);
      const prevUsed = new Set(used);

      if (typeof patch.saved === "boolean") {
        const next = new Set(saved);
        if (patch.saved) next.add(entryId);
        else next.delete(entryId);
        setSaved(next);
      }
      if (typeof patch.used === "boolean") {
        const next = new Set(used);
        if (patch.used) next.add(entryId);
        else next.delete(entryId);
        setUsed(next);
      }

      setPendingId(entryId);
      try {
        const res = await fetch("/api/vault/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, ...patch }),
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
            Quora + Pinterest <span className="text-gradient">Vault</span>
          </>
        }
        subtitle="Pick a niche. Copy a ready-to-post Quora answer or Pinterest pin. Your link is already in it."
      />

      <TutorialVideoSection
        title="How the Vault Works"
        description="Choose a niche, copy an answer or pin, then paste it on Quora or Pinterest with your affiliate link already included."
      />

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">1. Choose your niche</h2>
        <NichePicker value={niche} onChange={setNiche} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">2. Filter the library</h2>
        <div className="flex flex-wrap gap-2">
          <SelectableChip label="All" selected={platform === "all"} onClick={() => setPlatform("all")} />
          <SelectableChip label="Quora" selected={platform === "quora"} onClick={() => setPlatform("quora")} />
          <SelectableChip
            label="Pinterest"
            selected={platform === "pinterest"}
            onClick={() => setPlatform("pinterest")}
          />
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
        <h2 className="ds-h5">3. Copy and post</h2>

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

        {!loading && visibleEntries.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-text-muted">
            No entries match these filters. Try another niche or clear Saved only / Hide used.
          </div>
        )}

        {!loading && visibleEntries.length > 0 && (
          <div className="flex flex-col gap-4">
            {visibleEntries.map((entry) => (
              <VaultEntryCard
                key={entry.id}
                entry={entry}
                saved={saved.has(entry.id)}
                used={used.has(entry.id)}
                disabled={pendingId === entry.id}
                onToggleSaved={() => patchState(entry.id, { saved: !saved.has(entry.id) })}
                onToggleUsed={() => patchState(entry.id, { used: !used.has(entry.id) })}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
