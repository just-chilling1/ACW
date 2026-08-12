"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { InlineError } from "@/components/ui/InlineError";
import { Field } from "@/components/ui/field";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { useSearch } from "@/context/SearchContext";
import { CatalogProgress } from "@/components/traffic-machine/CatalogProgress";
import { SourceCatalogCard } from "@/components/traffic-machine/SourceCatalogCard";
import { TRAFFIC_SOURCES } from "@/lib/traffic-machine/sources";
import { readLegacyCompletedIds, markLegacyMigrated, wasLegacyMigrated } from "@/lib/traffic-machine/migrate-local";
import { APP_NICHES } from "@/lib/niches";
import { normalizeHttpUrl } from "@/lib/safe-url";
import type { ActivationRow, TrafficMachineRow } from "@/lib/traffic-machine/types";

const AUTOPILOT_VIDEO_ID = "1214661265";
const PAGE_SIZE = 24;
const NICHE_FILTERS = ["All", ...APP_NICHES.map((n) => n.label)] as const;
const HOW_IT_WORKS = [
  { num: "1", title: "Pick your niche", desc: "Filter sources that match the offer you promote." },
  { num: "2", title: "Submit your link", desc: "Copy the description, follow the steps, paste on the site." },
  { num: "3", title: "Get automatic traffic", desc: "One submission keeps sending visitors — no daily posting." },
] as const;

function nicheLabelFromId(id: string | undefined) {
  if (!id || id === "not_sure" || id === "auto") return "All";
  return APP_NICHES.find((n) => n.id === id)?.label ?? "All";
}

function nicheIdFromLabel(label: string) {
  if (label === "All") return "not_sure";
  return APP_NICHES.find((n) => n.label === label)?.id ?? "not_sure";
}

function completedIdsFromActivations(activations: ActivationRow[]) {
  return new Set(activations.filter((a) => a.status === "active").map((a) => a.source_id));
}

export default function AutomatedProfitsPage() {
  const { affiliateLink } = useSearch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [machine, setMachine] = useState<TrafficMachineRow | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [pageUrl, setPageUrl] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [difficulty, setDifficulty] = useState<"All" | "Easy">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const filteredSources = useMemo(() => {
    let list = TRAFFIC_SOURCES;
    if (selectedNiche !== "All") list = list.filter((s) => s.niche === selectedNiche);
    if (difficulty === "Easy") list = list.filter((s) => s.difficulty === "Easy");
    return [...list].sort((a, b) => {
      if (a.difficulty !== b.difficulty) return a.difficulty === "Easy" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedNiche, difficulty]);

  const completedCount = useMemo(
    () => filteredSources.filter((s) => completedIds.has(s.id)).length,
    [filteredSources, completedIds],
  );

  const visibleSources = filteredSources.slice(0, visibleCount);

  const persistMachine = useCallback(
    async (patch: { offerUrl?: string; audienceNiche?: string; legacyCompletedIds?: string[] }) => {
      const res = await fetch("/api/autopilot/machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save.");
      if (data.machine) setMachine(data.machine);
      return data.machine as TrafficMachineRow | undefined;
    },
    [],
  );

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const legacyIds = !wasLegacyMigrated() ? readLegacyCompletedIds() : [];
      const res = await fetch("/api/autopilot/machine");
      if (!res.ok) throw new Error("load");
      const data = await res.json();

      let nextMachine = data.machine as TrafficMachineRow | null;
      let nextActivations = (data.activations || []) as ActivationRow[];

      if (legacyIds.length > 0) {
        await persistMachine({
          legacyCompletedIds: legacyIds,
          offerUrl: nextMachine?.offer_url || "",
        });
        markLegacyMigrated();
        const retry = await fetch("/api/autopilot/machine");
        if (!retry.ok) throw new Error("load");
        const retryData = await retry.json();
        nextMachine = retryData.machine;
        nextActivations = retryData.activations || [];
      }

      setMachine(nextMachine);
      setCompletedIds(completedIdsFromActivations(nextActivations));
      setSelectedNiche(nicheLabelFromId(nextMachine?.audience_niche));
    } catch {
      setError("We couldn't load your traffic sources. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [persistMachine]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    setPageUrl((current) => current || machine?.offer_url || affiliateLink || "");
  }, [loading, machine?.offer_url, affiliateLink]);

  const saveUrl = async () => {
    const raw = pageUrl.trim();
    if (!raw) {
      setUrlError(null);
      return;
    }
    const normalized = normalizeHttpUrl(raw);
    if (!normalized) {
      setUrlError("Please enter a valid URL.");
      return;
    }
    setUrlError(null);
    if (normalized !== pageUrl) setPageUrl(normalized);
    if (machine?.offer_url === normalized) return;
    try {
      await persistMachine({ offerUrl: normalized });
    } catch {
      setError("We couldn't save your link. Please try again.");
    }
  };

  const handleNicheChange = async (niche: string) => {
    if (niche === selectedNiche) return;
    setSelectedNiche(niche);
    setVisibleCount(PAGE_SIZE);
    setExpandedId(null);
    try {
      await persistMachine({ audienceNiche: nicheIdFromLabel(niche) });
    } catch {
      setError("We couldn't save your niche. Please try again.");
    }
  };

  const handleMarkDone = async (sourceId: string, done: boolean) => {
    setError(null);
    setMarkingId(sourceId);
    try {
      if (pageUrl.trim()) {
        const normalized = normalizeHttpUrl(pageUrl);
        if (!normalized) {
          setUrlError("Please enter a valid URL before marking a source done.");
          return;
        }
        if (machine?.offer_url !== normalized) {
          await persistMachine({ offerUrl: normalized, audienceNiche: nicheIdFromLabel(selectedNiche) });
        }
      }
      const res = await fetch(`/api/autopilot/opportunities/${sourceId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "We couldn't save that. Please try again.");
        return;
      }
      if (data.machine) setMachine(data.machine);
      if (Array.isArray(data.activations)) {
        setCompletedIds(completedIdsFromActivations(data.activations));
      } else {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          if (done) next.add(sourceId);
          else next.delete(sourceId);
          return next;
        });
      }
    } catch {
      setError("We couldn't save that. Please try again.");
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-12">
        <PageHeader
          eyebrow="PREMIUM"
          title="Automated Profits"
          subtitle="Loading your traffic sources…"
        />
        <p className="text-center text-sm text-text-muted">Please wait…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6 pb-16"
    >
      <PageHeader
        eyebrow="PREMIUM"
        title="Automated Profits"
        subtitle="Submit once, get ongoing visitors. Copy → paste → Mark Done."
      />

      <TutorialVideoSection
        videoId={AUTOPILOT_VIDEO_ID}
        title="How Automated Profits Works"
        description="Enter your page URL, pick a niche, copy the pre-written description, and submit your link. Traffic keeps coming after you submit."
      />

      {error ? <InlineError message={error} /> : null}

      <section className="surface-panel space-y-4 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">How this works</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
              <span className="text-sm font-semibold tabular-nums text-[var(--gold-text)]">{step.num}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">{step.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 bg-[var(--bg-app)]/95 py-3 backdrop-blur-sm lg:top-0">
        <Field
          id="autopilot-page-url"
          label="Your page URL"
          type="text"
          inputMode="url"
          placeholder="https://your-offer.com"
          value={pageUrl}
          error={urlError || undefined}
          hint="We’ll insert this link into every submission description."
          onChange={(e) => {
            setPageUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          onBlur={saveUrl}
        />
      </div>

      <CatalogProgress done={completedCount} total={filteredSources.length} />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Niche</p>
        <div className="flex flex-wrap gap-2">
          {NICHE_FILTERS.map((niche) => (
            <SelectableChip
              key={niche}
              label={niche}
              selected={selectedNiche === niche}
              onClick={() => handleNicheChange(niche)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <SelectableChip
            label="All difficulties"
            selected={difficulty === "All"}
            onClick={() => {
              setDifficulty("All");
              setVisibleCount(PAGE_SIZE);
            }}
          />
          <SelectableChip
            label="Easy"
            selected={difficulty === "Easy"}
            onClick={() => {
              setDifficulty("Easy");
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {visibleSources.map((source) => (
          <SourceCatalogCard
            key={source.id}
            source={source}
            pageUrl={normalizeHttpUrl(pageUrl) || pageUrl}
            done={completedIds.has(source.id)}
            expanded={expandedId === source.id}
            marking={markingId === source.id}
            onToggle={() => setExpandedId((id) => (id === source.id ? null : source.id))}
            onMarkDone={(done) => handleMarkDone(source.id, done)}
          />
        ))}
      </div>

      {visibleCount < filteredSources.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            <Sparkles size={14} />
            Show more sources ({filteredSources.length - visibleCount} remaining)
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
