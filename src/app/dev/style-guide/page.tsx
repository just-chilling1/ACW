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
import { EarningsBanner } from "@/components/ui/earnings-banner";
import { useState } from "react";

const CANVAS_SWATCHES = [
  { name: "bg-app", token: "--bg-app", value: "#0B0B0B" },
  { name: "bg-app-2", token: "--bg-app-2", value: "#1A120B" },
  { name: "surface-1", token: "--surface-1", value: "#171717" },
  { name: "surface-2", token: "--surface-2", value: "rgba(248,250,252,0.04)" },
  { name: "surface-3", token: "--surface-3", value: "#24180F" },
];

const BORDER_SWATCHES = [
  { name: "border-subtle", token: "--border-subtle", value: "#3A2A1B" },
  { name: "border-strong", token: "--border-strong", value: "#4D3824" },
];

const BRAND_SWATCHES = [
  { name: "gold", token: "--gold", value: "#EEB310" },
  { name: "gold-dim", token: "--gold-dim", value: "#F4C542" },
  { name: "copper", token: "--copper", value: "#C9952A" },
];

const SEMANTIC_SWATCHES = [
  { name: "success", token: "--success", value: "#10B981" },
  { name: "warning", token: "--warning", value: "#F5B301" },
  { name: "danger", token: "--danger", value: "#EF4444" },
  { name: "info", token: "--info", value: "#38BDF8" },
];

const TEXT_SWATCHES = [
  { name: "text-primary", token: "--text-primary", value: "#F8FAFC" },
  { name: "text-secondary", token: "--text-secondary", value: "#B8B3AA" },
  { name: "text-tertiary", token: "--text-tertiary", value: "#8A857D" },
  { name: "text-on-accent", token: "--text-on-accent", value: "#0B0B0B" },
];

const RADIUS_SAMPLES = [
  { name: "sm", token: "--radius-sm", value: "8px" },
  { name: "md", token: "--radius-md", value: "12px" },
  { name: "lg", token: "--radius-lg", value: "16px" },
  { name: "xl", token: "--radius-xl", value: "20px" },
];

function SwatchGrid({
  title,
  swatches,
}: {
  title: string;
  swatches: { name: string; token: string; value: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="ds-h4">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {swatches.map((s) => (
          <div key={s.name} className="card-base p-3!">
            <div
              className="mb-2 h-12 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]"
              style={{ background: `var(${s.token}, ${s.value})` }}
            />
            <p className="text-xs font-semibold text-text-primary">{s.name}</p>
            <p className="text-[10px] tabular-nums text-text-muted">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonStateRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="ds-caption w-24 shrink-0 font-semibold uppercase">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function StyleGuidePage() {
  const [chip, setChip] = useState("weight loss");

  return (
    <div className="min-h-dvh px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <PageHeader
          eyebrow="DEV"
          title={
            <>
              AI <span className="text-gradient">CashWave</span> Design System
            </>
          }
          subtitle="Canonical tokens, typography, buttons, semantic states, spacing, and responsive patterns."
        />

        {/* ── Colors ── */}
        <section className="flex flex-col gap-6">
          <h2 className="ds-h2">Color palette</h2>
          <SwatchGrid title="Canvas & surfaces" swatches={CANVAS_SWATCHES} />
          <SwatchGrid title="Borders" swatches={BORDER_SWATCHES} />
          <SwatchGrid title="Brand" swatches={BRAND_SWATCHES} />
          <SwatchGrid title="Semantic" swatches={SEMANTIC_SWATCHES} />
          <SwatchGrid title="Text" swatches={TEXT_SWATCHES} />

          <div className="flex flex-col gap-3">
            <h3 className="ds-h4">Semantic badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="badge-success">Success</span>
              <span className="badge-warning">Warning</span>
              <span className="badge-danger">Danger</span>
              <span className="badge-info">Info</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="ds-h4">Status blocks</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="status-success rounded-[var(--radius-md)] px-4 py-3 text-sm">Success status message</div>
              <div className="status-warning rounded-[var(--radius-md)] px-4 py-3 text-sm">Warning status message</div>
              <div className="status-danger rounded-[var(--radius-md)] px-4 py-3 text-sm">Error status message</div>
              <div className="status-info rounded-[var(--radius-md)] px-4 py-3 text-sm">Info status message</div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Surface panels</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="surface-panel p-4">
              <p className="ds-h6">surface-panel</p>
              <p className="ds-caption mt-1">Flat surface-1 container</p>
            </div>
            <div className="surface-panel-elevated p-4">
              <p className="ds-h6">surface-panel-elevated</p>
              <p className="ds-caption mt-1">Surface-1 with elevation shadow</p>
            </div>
            <div className="surface-well-lg">
              <p className="ds-h6">surface-well-lg</p>
              <p className="ds-caption mt-1">Padded surface-2 section</p>
            </div>
            <div className="step-card">
              <p className="ds-h6">step-card</p>
              <p className="ds-caption">Numbered step layout pattern</p>
            </div>
          </div>
        </section>

        {/* ── Typography ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Typography</h2>
          <div className="card-base flex flex-col gap-4">
            <span className="page-eyebrow">Eyebrow / page label</span>
            <h1 className="ds-h1">H1 — Display title (Outfit)</h1>
            <h2 className="ds-h2">H2 — Section heading (Inter semibold)</h2>
            <h3 className="ds-h3">H3 — Card / block title</h3>
            <h4 className="ds-h4">H4 — Micro label uppercase</h4>
            <h5 className="ds-h5">H5 — Sub-section title</h5>
            <h6 className="ds-h6">H6 — Compact title</h6>
            <p className="ds-body">Body — Default paragraph copy at 16px with relaxed 1.6 leading.</p>
            <p className="ds-body-sm">Body SM — Compact body at 14px for dense UI areas.</p>
            <p className="ds-subtitle">Subtitle — Supporting copy under page titles at 15px secondary color.</p>
            <p className="ds-label">Label — Form field labels at 14px medium weight.</p>
            <p className="ds-caption">Caption — Helper text and footnotes at 12px muted.</p>
            <p className="ds-annotation">Annotation — Tags, timestamps, metadata</p>
            <p>
              <span className="text-gradient">Gold gradient</span>
              {" · "}
              <span className="text-gradient-alt">Gold → copper gradient</span>
            </p>
          </div>
        </section>

        {/* ── Spacing & radius ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Spacing & radius</h2>
          <div className="card-base flex flex-col gap-6">
            <div>
              <h3 className="ds-h4 mb-3">Spacing scale</h3>
              <div className="flex flex-wrap items-end gap-4">
                {[1, 2, 3, 4, 6, 8].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div
                      className="rounded-[var(--radius-sm)] bg-[var(--accent-bg-medium)]"
                      style={{ width: `var(--space-${n})`, height: `var(--space-${n})` }}
                    />
                    <span className="ds-caption tabular-nums">--space-{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="ds-h4 mb-3">Radius scale</h3>
              <div className="flex flex-wrap gap-4">
                {RADIUS_SAMPLES.map((r) => (
                  <div key={r.name} className="flex flex-col items-center gap-2">
                    <div
                      className="h-16 w-16 border border-[var(--accent-border)] bg-[var(--surface-2)]"
                      style={{ borderRadius: `var(${r.token})` }}
                    />
                    <span className="ds-caption">{r.name} ({r.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Buttons ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Buttons — all states</h2>
          <div className="card-base flex flex-col gap-5">
            <ButtonStateRow label="Primary">
              <button type="button" className="btn-primary">Default</button>
              <button type="button" className="btn-primary" disabled>Disabled</button>
            </ButtonStateRow>
            <ButtonStateRow label="Secondary">
              <button type="button" className="btn-secondary">Default</button>
              <button type="button" className="btn-secondary" disabled>Disabled</button>
            </ButtonStateRow>
            <ButtonStateRow label="Soft">
              <button type="button" className="btn-soft">Default</button>
              <button type="button" className="btn-soft" disabled>Disabled</button>
            </ButtonStateRow>
            <ButtonStateRow label="Ghost">
              <button type="button" className="btn-ghost">Default</button>
              <button type="button" className="btn-ghost" disabled>Disabled</button>
            </ButtonStateRow>
            <ButtonStateRow label="Danger">
              <button type="button" className="btn-danger">Default</button>
              <button type="button" className="btn-danger" disabled>Disabled</button>
            </ButtonStateRow>
            <p className="ds-caption">
              Hover and active states: interact with buttons above. Focus: Tab to any button for gold focus ring.
              All buttons min-height 44px (40px on short screens).
            </p>
          </div>
        </section>

        {/* ── Forms & chips ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Inputs & chips</h2>
          <div className="max-w-md">
            <Field label="Topic" placeholder='e.g. "weight loss"' hint="One or two words work best." />
          </div>
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

        {/* ── Surfaces ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Surfaces & cards</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="card-base">
              <p className="ds-h5 mb-1">card-base</p>
              <p className="ds-caption">Standard elevated panel</p>
            </div>
            <div className="glass-card p-6">
              <p className="ds-h5 mb-1">glass-card</p>
              <p className="ds-caption">Frosted marketing surface</p>
            </div>
            <div className="card-interactive">
              <p className="ds-h5 mb-1">card-interactive</p>
              <p className="ds-caption">Hover for gold border lift</p>
            </div>
          </div>
          <div className="premium-nav-section p-4">
            <p className="ds-h5 text-[var(--gold)]">premium-nav-section</p>
            <p className="ds-caption">Animated gold glow + conic border</p>
          </div>
        </section>

        {/* ── Components ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Composite components</h2>
          <Steps
            items={[
              { title: "Type a topic", description: "Enter what you want to promote." },
              { title: "We find ads", description: "Demand and conversations surface." },
              { title: "You copy & earn", description: "Reply with your affiliate link." },
            ]}
          />
          <Callout variant="info">
            <p>Info callout for how-it-works guidance and calm system messages.</p>
          </Callout>
          <Callout variant="promo">
            <p>Promo callout for free training — contained, tasteful, clearly an offer.</p>
          </Callout>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card eyebrow="CARD" title="Default card" description="E1 elevation with hairline border.">
              <p className="ds-body-sm text-text-secondary">Body content slot.</p>
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
          <EarningsBanner compact />
        </section>

        {/* ── Loading ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Loading</h2>
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

        {/* ── Responsive guide ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-h2">Responsive layout</h2>
          <div className="card-base flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="ds-well">
                <p className="ds-h5 mb-2">Mobile (&lt; 1024px)</p>
                <ul className="ds-body-sm flex flex-col gap-1 text-text-secondary">
                  <li>Sticky header + bottom nav</li>
                  <li>Content pb-24 for nav clearance</li>
                  <li>16px inputs (no iOS zoom)</li>
                  <li>44px touch targets</li>
                  <li>Safe-area insets on header/nav</li>
                </ul>
              </div>
              <div className="ds-well">
                <p className="ds-h5 mb-2">Desktop (≥ 1024px)</p>
                <ul className="ds-body-sm flex flex-col gap-1 text-text-secondary">
                  <li>Fixed sidebar 240px / 72px collapsed</li>
                  <li>max-w-6xl content container</li>
                  <li>No bottom nav</li>
                  <li>xl: two-column dashboard rail</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <SupportFooter />
      </div>
    </div>
  );
}
