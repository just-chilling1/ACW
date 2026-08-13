"use client";

import { useCallback, useEffect, useState } from "react";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import type { HotThreadItem, HotThreadPackResponse } from "@/lib/hot-threads/types";
import { NichePicker } from "@/components/ui/niche-picker";
import { HotThreadCard } from "@/components/hot-threads/HotThreadCard";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";

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
  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [pack, setPack] = useState<HotThreadPackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNiche(readStoredNiche());
    setHydrated(true);
  }, []);

  const loadPack = useCallback(async (nextNiche: NicheId) => {
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ niche: nextNiche });
      const res = await fetch(`/api/hot-threads?${params.toString()}`);

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
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, niche);
    } catch {
      // ignore
    }
    loadPack(niche);
  }, [hydrated, niche, loadPack]);

  const items: HotThreadItem[] = pack?.items || [];

  return (
    <PremiumLandingShell>
      <PremiumHero
        title={
          <>
            Hot Threads &amp; <span className="text-gradient">Offers</span>
          </>
        }
        subtitle="Pick a niche. Copy a reply. Post it. New threads every 24 hours."
      />

      <TutorialVideoSection
        title="How Hot Threads Works"
        description="Learn how to pick a niche, copy a reply, and post into today’s hottest conversations."
      />

      <PremiumSection step={1} title="Choose your niche">
        <NichePicker value={niche} onChange={setNiche} disabled={loading} />
      </PremiumSection>

      <PremiumSection step={2} title="Today's hot threads">
        {error ? (
          <PremiumStateBlock
            variant="error"
            message={error}
            onRetry={() => loadPack(niche)}
          />
        ) : null}

        {loading ? <PremiumStateBlock rows={3} heightClassName="h-40" /> : null}

        {!loading && !error && items.length === 0 ? (
          <PremiumStateBlock
            variant="empty"
            message="No threads yet for this niche. Try again in a moment."
          />
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <HotThreadCard key={item.id} item={item} index={index} />
            ))}
          </div>
        ) : null}
      </PremiumSection>
    </PremiumLandingShell>
  );
}
