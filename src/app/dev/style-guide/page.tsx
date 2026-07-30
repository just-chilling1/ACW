"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { Callout } from "@/components/ui/callout";
import { Steps } from "@/components/ui/steps";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { Card } from "@/components/ui/card";
import { TipList } from "@/components/ui/tip-list";
import { Skeleton, SkeletonRows, SkeletonCards } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/ui/offer-card";
import { SourceCard } from "@/components/ui/source-card";
import { ReplyCard } from "@/components/ui/reply-card";
import { SupportFooter } from "@/components/ui/support-footer";
import { useState } from "react";

const SWATCHES = [
  { name: "bg-app", value: "#0A0A0B" },
  { name: "surface-1", value: "#161618" },
  { name: "gold", value: "#EAB308" },
  { name: "gold-dim", value: "#CA9A06" },
  { name: "indigo", value: "#6366F1" },
  { name: "success", value: "#10B981" },
  { name: "warning", value: "#F5B301" },
  { name: "danger", value: "#F04444" },
];

export default function StyleGuidePage() {
  const [chip, setChip] = useState("weight loss");

  return (
    <div className="app-bg min-h-dvh px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <PageHeader
          eyebrow="DEV"
          title={
            <>
              CashTap <span className="text-gradient">Design System</span>
            </>
          }
          subtitle="Canonical tokens and components for the premium dashboard redesign."
        />

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Palette</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {SWATCHES.map((s) => (
              <div key={s.name} className="card-base p-3!">
                <div
                  className="mb-2 h-12 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]"
                  style={{ background: s.value }}
                />
                <p className="text-xs font-semibold text-text-primary">{s.name}</p>
                <p className="text-[10px] tabular-nums text-text-muted">{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Typography</h2>
          <div className="card-base flex flex-col gap-3">
            <span className="page-eyebrow">Eyebrow label</span>
            <h1 className="ds-h1">Display / H1 — Outfit</h1>
            <h2 className="ds-h2">H2 — Inter semibold</h2>
            <h3 className="ds-h3">H3 — section title</h3>
            <p className="ds-subtitle">
              Body / subtitle — Inter, relaxed leading for product UI copy.
            </p>
            <p className="text-sm text-text-muted">Caption / muted helper text</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary">
              Primary CTA
            </button>
            <button type="button" className="btn-secondary">
              Secondary
            </button>
            <button type="button" className="btn-soft">
              Soft
            </button>
            <button type="button" className="btn-ghost">
              Ghost
            </button>
            <button type="button" className="btn-danger">
              Destructive
            </button>
            <button type="button" className="btn-primary" disabled>
              Disabled
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Field</h2>
          <div className="max-w-md">
            <Field label="Topic" placeholder='e.g. "weight loss"' hint="One or two words work best." />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Chips</h2>
          <div className="flex flex-wrap gap-2">
            {["weight loss", "crypto", "skincare"].map((label) => (
              <SelectableChip
                key={label}
                label={label}
                selected={chip === label}
                onClick={() => setChip(label)}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Steps</h2>
          <Steps
            items={[
              { title: "Type a topic", description: "Enter what you want to promote." },
              { title: "We find ads", description: "Demand and conversations surface." },
              { title: "You copy & earn", description: "Reply with your link." },
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Callouts</h2>
          <Callout variant="info">
            <p>Info callout for how-it-works guidance and calm system messages.</p>
          </Callout>
          <Callout variant="promo">
            <p>
              Promo callout for free training — contained, tasteful, clearly an offer.
            </p>
          </Callout>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Cards</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card eyebrow="CARD" title="Default card" description="E1 elevation with hairline border.">
              <p className="text-sm text-text-secondary">Body content slot.</p>
            </Card>
            <OfferCard
              niche="Weight Loss"
              keyword="Best natural appetite suppressant"
              description="Users looking for non-stimulant weight loss solutions."
              onSelect={() => undefined}
            />
            <SourceCard
              name="MyFitnessPal Community"
              type="Forum"
              difficulty="Easy"
              traffic="200-500 visitors/month"
              time="10 minutes"
              onViewInstructions={() => undefined}
              onToggleComplete={() => undefined}
            />
          </div>
          <ReplyCard
            styleLabel="Curiosity Hook"
            text="I came across something that actually helped with this — worth a look if you're still searching."
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Skeletons</h2>
          <Skeleton className="h-8 w-48" />
          <SkeletonRows rows={3} />
          <SkeletonCards count={3} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Tip list</h2>
          <TipList
            title="Pro Tips"
            items={[
              "Keep topics to one or two words.",
              "Prefer High demand keywords.",
              "Paste your affiliate link before generating replies.",
            ]}
          />
        </section>

        <SupportFooter />
      </div>
    </div>
  );
}
