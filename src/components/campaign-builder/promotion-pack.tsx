"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { PromotionPackContent } from "@/lib/campaign/types";
import { ReplyCard } from "@/components/ui/reply-card";

const TABS: { id: keyof PromotionPackContent; label: string; primary?: boolean }[] = [
  { id: "recommendedReply", label: "Recommended Reply", primary: true },
  { id: "alternativeReply", label: "Alternative Reply" },
  { id: "shortReply", label: "Short Reply" },
  { id: "followUpResponse", label: "Follow-Up" },
  { id: "objectionResponse", label: "Objection Response" },
  { id: "dmResponse", label: "DM Response" },
  { id: "cta", label: "CTA" },
  { id: "postingGuidance", label: "Posting Guidance" },
];

type PromotionPackProps = {
  pack: PromotionPackContent;
};

export function PromotionPack({ pack }: PromotionPackProps) {
  const [active, setActive] = useState<keyof PromotionPackContent>("recommendedReply");
  const [showMore, setShowMore] = useState(false);

  const primaryTabs = TABS.filter((t) => t.primary);
  const moreTabs = TABS.filter((t) => !t.primary);
  const visibleTabs = showMore ? TABS : primaryTabs;
  const activeContent = pack[active];

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="ds-h2">Your Promotion Pack</h2>
        <p className="mt-1 text-sm text-text-muted">Copy the reply that fits best — more options below.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={clsx(
              "rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors",
              active === tab.id
                ? "border-[var(--accent-border-strong)] bg-[var(--accent-bg-subtle)] text-[var(--gold)]"
                : "border-[var(--border-strong)] bg-[var(--surface-2)] text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
        {!showMore ? (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-3 py-2 text-xs font-semibold text-text-muted hover:text-[var(--gold)]"
          >
            More options
          </button>
        ) : null}
      </div>

      <ReplyCard
        styleLabel={TABS.find((t) => t.id === active)?.label}
        text={activeContent}
      />

      {showMore ? (
        <div className="grid gap-3 md:grid-cols-2">
          {moreTabs
            .filter((t) => t.id !== active)
            .slice(0, 4)
            .map((tab) => (
              <ReplyCard key={tab.id} styleLabel={tab.label} text={pack[tab.id]} className="opacity-90" />
            ))}
        </div>
      ) : null}
    </section>
  );
}
