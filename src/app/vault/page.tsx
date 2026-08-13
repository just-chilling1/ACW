"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library, ArrowRight, Sparkles, Copy, ImageIcon } from "lucide-react";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";
import type { VaultKitStats } from "@/lib/vault/kit-types";
import { APP_NICHES } from "@/lib/niches";

type KitSummary = {
  id: string;
  name: string;
  niche_id: string;
  status: string;
  stats: VaultKitStats;
  updated_at: string;
};

function nicheLabel(id: string): string {
  return APP_NICHES.find((n) => n.id === id)?.label || id.replace(/_/g, " ");
}

export default function VaultLandingPage() {
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vault/kits")
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
        : "Open your kit";

  return (
    <PremiumLandingShell>
      <PremiumHero
        title={
          <>
            Quora + Pinterest <span className="text-gradient">Vault</span>
          </>
        }
        subtitle="Paste your offer link. Get Quora answers and Pinterest pins written for your niche."
      />

      <TutorialVideoSection
        title="How the Vault Works"
        description="Paste your affiliate link, pick a niche, and copy ready Quora answers and Pinterest pins."
      />

      {loading ? (
        <PremiumStateBlock rows={1} heightClassName="h-44" />
      ) : latestKit ? (
        <PremiumSection
          elevated
          title="Pick up where you left off"
          description={`${latestKit.stats?.quoraCount || 0} Quora · ${latestKit.stats?.pinterestCount || 0} Pinterest · ${nicheLabel(latestKit.niche_id)}`}
        >
          <p className="text-xl font-semibold text-text-primary">{latestKit.name}</p>
          <Link
            href={`/vault/kit/${latestKit.id}`}
            className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
          >
            {continueLabel}
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/vault/build"
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            <Sparkles size={16} />
            Create a new vault kit
          </Link>
        </PremiumSection>
      ) : (
        <PremiumSection
          elevated
          title="Start here"
          description="We write Quora answers and Pinterest pins from your offer — no static library."
        >
          <Link
            href="/vault/build"
            className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
          >
            <Library size={18} />
            Create My Vault Kit
          </Link>
        </PremiumSection>
      )}

      <PremiumSection title="How it works">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Analyze your offer",
              help: "Paste your affiliate link and pick your niche.",
            },
            {
              icon: Copy,
              title: "Copy Quora answers",
              help: "Search the question, paste the answer, add your link once.",
            },
            {
              icon: ImageIcon,
              title: "Pin on Pinterest",
              help: "Use the title, description, board, and image concept.",
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-3)] text-[var(--gold-text)]">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{step.title}</p>
                  <p className="text-xs text-text-muted">{step.help}</p>
                </div>
              </div>
            );
          })}
        </div>
      </PremiumSection>

      {kits.length > 1 ? (
        <PremiumSection title="Your vault kits">
          <ul className="space-y-2">
            {kits.map((kit) => (
              <li key={kit.id}>
                <Link
                  href={`/vault/kit/${kit.id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-3 text-sm hover:bg-[var(--surface-2)]"
                >
                  <span className="font-semibold text-text-primary">{kit.name}</span>
                  <span className="text-xs text-text-muted">
                    {nicheLabel(kit.niche_id)} · {kit.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </PremiumSection>
      ) : null}
    </PremiumLandingShell>
  );
}
