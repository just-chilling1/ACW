"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/context/SearchContext";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import type { HotThreadItem, HotThreadPackResponse } from "@/lib/hot-threads/types";
import { NichePicker } from "@/components/hot-threads/NichePicker";
import { RefreshCountdown } from "@/components/hot-threads/RefreshCountdown";
import { HotThreadCard } from "@/components/hot-threads/HotThreadCard";
import { Skeleton } from "@/components/ui/skeleton";

const STORAGE_KEY = "acw.hot-threads.niche";

function readStoredNiche(): NicheId {
  if (typeof window === "undefined") return "make_money_online";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && APP_NICHES.some((n) => n.id === raw)) return raw as NicheId;
  } catch {
    // ignore
  }
  return "make_money_online";
}

export default function HotThreadsPage() {
  const { affiliateLink } = useSearch();
  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [pack, setPack] = useState<HotThreadPackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNiche(readStoredNiche());
    setHydrated(true);
  }, []);

  const loadPack = useCallback(
    async (nextNiche: NicheId, opts?: { force?: boolean }) => {
      setError(null);
      if (opts?.force) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({ niche: nextNiche });
        if (affiliateLink) params.set("affiliateLink", affiliateLink);

        const url = opts?.force
          ? "/api/hot-threads/refresh"
          : `/api/hot-threads?${params.toString()}`;

        const res = opts?.force
          ? await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ niche: nextNiche, affiliateLink: affiliateLink || "" }),
            })
          : await fetch(url);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load");
        }

        const data = (await res.json()) as HotThreadPackResponse;
        setPack(data);
      } catch {
        setError("We couldn't load today's hot threads. Please try again.");
        setPack(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [affiliateLink],
  );

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, niche);
    } catch {
      // ignore
    }
    loadPack(niche);
  }, [hydrated, niche, loadPack]);

  const expiresSoon =
    pack?.expiresAt && new Date(pack.expiresAt).getTime() - Date.now() <= 0;

  const items: HotThreadItem[] = pack?.items || [];

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
            Hot Threads &amp; <span className="text-gradient">Offers</span>
          </>
        }
        subtitle="Pick a niche. Copy a reply. Post it. New threads every 24 hours."
      />

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">1. Choose your niche</h2>
        <NichePicker value={niche} onChange={setNiche} disabled={loading || refreshing} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="ds-h5">2. Today&apos;s hot threads</h2>
          {pack?.expiresAt && <RefreshCountdown expiresAt={pack.expiresAt} />}
        </div>

        {expiresSoon && (
          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadPack(niche, { force: true })}
            className="btn-secondary w-fit"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
            {refreshing ? "Refreshing…" : "Refresh threads"}
          </button>
        )}

        {error && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error)]">
            {error}
            <button type="button" className="btn-secondary mt-3" onClick={() => loadPack(niche)}>
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-text-muted">
            No threads yet for this niche. Try refresh in a moment.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <HotThreadCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
