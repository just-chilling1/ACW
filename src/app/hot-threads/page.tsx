"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { useSearch } from "@/context/SearchContext";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import type { HotThreadItem, HotThreadPackResponse } from "@/lib/hot-threads/types";
import { NichePicker } from "@/components/hot-threads/NichePicker";
import { HotThreadCard } from "@/components/hot-threads/HotThreadCard";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/InlineError";

const STORAGE_KEY = "acw.hot-threads.niche";
const UPGRADE_POLL_MS = 5000;

function readStoredNiche(): NicheId {
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
  const affiliateRef = useRef(affiliateLink);
  affiliateRef.current = affiliateLink;

  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [pack, setPack] = useState<HotThreadPackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setNiche(readStoredNiche());
    setReady(true);
  }, []);

  const loadPack = useCallback(async (nextNiche: NicheId, opts?: { silent?: boolean }) => {
    const id = ++requestId.current;
    setError(null);
    if (!opts?.silent) setLoading(true);

    try {
      const params = new URLSearchParams({ niche: nextNiche });
      const link = affiliateRef.current;
      if (link) params.set("affiliateLink", link);

      const res = await fetch(`/api/hot-threads?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load");
      }

      const data = (await res.json()) as HotThreadPackResponse;
      if (id !== requestId.current) return;
      setPack(data);
      return data;
    } catch {
      if (id !== requestId.current) return;
      if (!opts?.silent) {
        setError("We couldn't load today's hot threads. Please try again.");
        setPack(null);
      }
      return null;
    } finally {
      if (id === requestId.current && !opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, niche);
    } catch {
      // ignore
    }
    loadPack(niche);
  }, [ready, niche, loadPack]);

  // Soft-refresh once after a quick pack so live/AI enrichment can land
  useEffect(() => {
    if (!pack?.upgrading) return;
    const currentNiche = niche;
    const timer = window.setTimeout(() => {
      loadPack(currentNiche, { silent: true });
    }, UPGRADE_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [pack?.upgrading, pack?.refreshedAt, niche, loadPack]);

  const items: HotThreadItem[] = pack?.items || [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6 pb-16">
      <PageHeader
        eyebrow="PREMIUM"
        title={
          <>
            Hot Threads &amp; <span className="text-gradient">Offers</span>
          </>
        }
        subtitle="Pick a niche. Open a thread. Copy a reply. Post it."
      />

      <TutorialVideoSection
        title="How Hot Threads Works"
        description="Learn how to pick a niche, copy a reply, and post into today’s hottest conversations."
      />

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">1. Choose your niche</h2>
        <NichePicker value={niche} onChange={setNiche} disabled={loading} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">2. Today&apos;s hot threads</h2>

        {error ? (
          <div className="flex flex-col gap-3">
            <InlineError message={error} />
            <button type="button" className="btn-secondary w-fit" onClick={() => loadPack(niche)}>
              Try again
            </button>
          </div>
        ) : null}

        {loading && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-52 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-text-muted">
            No threads yet for this niche. Try again in a moment.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <HotThreadCard
                key={item.id}
                item={item}
                index={index}
                featured={index === 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
