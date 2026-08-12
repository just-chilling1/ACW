"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Copy, MessageSquare, RefreshCw, CheckCircle2, FolderOpen } from "lucide-react";
import { clsx } from "clsx";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";
import type { KitStats } from "@/lib/instant/types";

type KitSummary = {
  id: string;
  name: string;
  status: string;
  stats: KitStats;
  updated_at: string;
};

const FLOW_STEPS = [
  {
    id: 1,
    label: "Post this",
    help: "Copy one post and paste it online.",
    icon: Copy,
  },
  {
    id: 2,
    label: "Reply with this",
    help: "Copy a reply when someone comments.",
    icon: MessageSquare,
  },
  {
    id: 3,
    label: "Post again",
    help: "Use another post in a new place.",
    icon: RefreshCw,
  },
  {
    id: 4,
    label: "Next step / All done",
    help: "Reuse unused posts, then finish when the kit is empty.",
    icon: CheckCircle2,
  },
] as const;

export default function InstantLandingPage() {
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instant/kits")
      .then((r) => r.json())
      .then((d) => setKits(d.kits || []))
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  }, []);

  const latestKit = kits.find((k) => k.status === "ready") || kits[0];
  const continueLabel =
    latestKit?.status === "building"
      ? "Continue — kit is still building"
      : latestKit?.status === "failed"
        ? "Retry this kit"
        : "Continue your kit";

  return (
    <PremiumLandingShell>
      <PremiumHero
        title={
          <>
            Instant <span className="text-gradient">Income</span>
          </>
        }
        subtitle="One step at a time. Copy → paste → next."
      />

      <TutorialVideoSection
        title="How Instant Income Works"
        description="A short walkthrough of pasting your offer, copying posts and replies, and posting with confidence."
      />

      {loading ? (
        <PremiumStateBlock rows={1} heightClassName="h-44" />
      ) : latestKit ? (
        <PremiumSection
          elevated
          title="Pick up where you left off"
          description={`${latestKit.stats?.postCount || 0} posts · ${latestKit.stats?.replyCount || 0} replies ready`}
        >
          <p className="text-xl font-semibold text-text-primary">{latestKit.name}</p>
          <Link
            href={`/instant/kit/${latestKit.id}`}
            className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
          >
            {continueLabel}
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/instant/build"
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            <Sparkles size={16} />
            Create a new kit
          </Link>
        </PremiumSection>
      ) : (
        <PremiumSection
          elevated
          title="Start here"
          description="Paste your offer link. We prepare posts and replies in moments — you just copy and paste."
        >
          <Link
            href="/instant/build"
            className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
          >
            <Sparkles size={18} />
            Create My Promotion Kit
          </Link>
        </PremiumSection>
      )}

      <PremiumSection title="How it works">
        <div className="grid gap-3 sm:grid-cols-2">
          {FLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={clsx(
                  "flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3",
                  latestKit && step.id === 1 && "border-[var(--gold)] bg-[var(--surface-2)]",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-3)] text-[var(--gold-text)]">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Step {step.id}: {step.label}
                  </p>
                  <p className="text-xs text-text-muted">{step.help}</p>
                </div>
              </div>
            );
          })}
        </div>
      </PremiumSection>

      {kits.length > 0 ? (
        <Link
          href="/instant/kits"
          className="btn-secondary inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold sm:w-auto sm:min-w-[14rem]"
        >
          <FolderOpen size={16} />
          View all my kits ({kits.length})
        </Link>
      ) : null}
    </PremiumLandingShell>
  );
}
