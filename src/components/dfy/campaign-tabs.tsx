"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import type { CampaignActionRow, CampaignAssetRow, CampaignOpportunityRow, CampaignRow } from "@/lib/dfy/types";
import { CopyButton } from "./copy-button";
import { OpportunityCard } from "./opportunity-card";

type OverviewTabProps = {
    campaign: CampaignRow;
    opportunities: CampaignOpportunityRow[];
    assets: CampaignAssetRow[];
    actions: CampaignActionRow[];
    onViewStrategy: () => void;
};

export function OverviewTab({ campaign, opportunities, assets, actions, onViewStrategy }: OverviewTabProps) {
    const topOpp = opportunities[0];
    const todayAsset = assets.find((a) => a.kind === "post" && a.meta?.section !== "calendar") || assets.find((a) => a.kind === "post");
    const strategyAction = actions.find((a) => a.kind === "follow_strategy");

    return (
        <div className="flex flex-col gap-6">
            <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">Recommended Actions</h3>

                {topOpp ? (
                    <div className="mb-6">
                        <p className="mb-2 text-xs font-semibold text-[var(--gold-text)]">1. Start with this opportunity</p>
                        <OpportunityCard opportunity={topOpp} />
                    </div>
                ) : null}

                {todayAsset ? (
                    <div className="card-base mb-6 p-4 sm:p-5">
                        <p className="mb-2 text-xs font-semibold text-[var(--gold-text)]">2. Publish this today</p>
                        <p className="mb-3 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{todayAsset.content}</p>
                        <CopyButton text={todayAsset.content} label="Copy & Use" variant="primary" />
                    </div>
                ) : null}

                <div className="card-base p-4 sm:p-5">
                    <p className="mb-2 text-xs font-semibold text-[var(--gold-text)]">3. Follow this strategy</p>
                    <p className="mb-4 text-sm leading-relaxed text-text-secondary">
                        {campaign.strategy?.summary || strategyAction?.label || "Start with educational content, then problem/solution posts."}
                    </p>
                    <button type="button" onClick={onViewStrategy} className="btn-secondary px-3 py-2 text-xs sm:text-sm">
                        View Full Strategy
                    </button>
                </div>
            </section>
        </div>
    );
}

type OpportunitiesTabProps = {
    opportunities: CampaignOpportunityRow[];
    onRegenerate: (id: string) => void;
    regeneratingId: string | null;
};

export function OpportunitiesTab({ opportunities, onRegenerate, regeneratingId }: OpportunitiesTabProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    if (opportunities.length === 0) {
        return (
            <div className="card-base p-6 text-center">
                <p className="text-sm text-text-secondary">No opportunities yet. Build your campaign to discover high-intent conversations.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {opportunities.map((opp) => (
                <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onRegenerate={() => onRegenerate(opp.id)}
                    regenerating={regeneratingId === opp.id}
                    showAlternatives={expanded[opp.id]}
                    onToggleAlternatives={() => setExpanded((p) => ({ ...p, [opp.id]: !p[opp.id] }))}
                />
            ))}
        </div>
    );
}

type ContentTabProps = {
    assets: CampaignAssetRow[];
    onRegenerate: (id: string) => void;
    regeneratingId: string | null;
};

export function ContentTab({ assets, onRegenerate, regeneratingId }: ContentTabProps) {
    const contentAssets = assets.filter((a) => ["post", "comment", "submission_copy"].includes(a.kind) && a.meta?.section !== "calendar" && a.meta?.section !== "weekly_batch");

    if (contentAssets.length === 0) {
        return (
            <div className="card-base p-6 text-center">
                <p className="text-sm text-text-secondary">Content will appear here once your campaign is built.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {contentAssets.map((asset) => (
                <article key={asset.id} className="card-base flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{asset.channel}</span>
                        {asset.meta?.angle ? (
                            <span className="text-[10px] text-text-muted">· {String(asset.meta.angle)}</span>
                        ) : null}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{asset.content}</p>
                    <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                        <CopyButton text={asset.content} label="Copy Post" variant="primary" />
                        <button
                            type="button"
                            onClick={() => onRegenerate(asset.id)}
                            disabled={regeneratingId === asset.id}
                            className="btn-secondary px-3 py-2 text-xs"
                        >
                            {regeneratingId === asset.id ? "…" : "↻ Regenerate"}
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}

type HooksCtaPanelProps = {
    assets: CampaignAssetRow[];
    onRegenerate?: (id: string) => void;
    regeneratingId?: string | null;
};

function sortByRecommended<T extends { meta?: Record<string, unknown> }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const aRec = a.meta?.recommended ? 1 : 0;
        const bRec = b.meta?.recommended ? 1 : 0;
        return bRec - aRec;
    });
}

export function HooksCtaPanel({ assets, onRegenerate, regeneratingId }: HooksCtaPanelProps) {
    const hooks = sortByRecommended(assets.filter((a) => a.kind === "hook"));
    const ctas = sortByRecommended(assets.filter((a) => a.kind === "cta"));

    return (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">Your Best Hooks</h3>
                <div className="flex flex-col gap-2">
                    {hooks.slice(0, 12).map((hook) => (
                        <div
                            key={hook.id}
                            className={clsx(
                                "card-base flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between",
                                hook.meta?.recommended === true && "border-[var(--gold)]",
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    {hook.meta?.category ? (
                                        <span className="text-[10px] font-semibold uppercase text-text-muted">{String(hook.meta.category)}</span>
                                    ) : null}
                                    {hook.meta?.recommended === true ? (
                                        <span className="rounded-full bg-[var(--gold-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--gold-text)]">
                                            Best Choice
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-sm text-text-secondary">{hook.content}</p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <CopyButton text={hook.content} label="Use Hook" />
                                {onRegenerate ? (
                                    <button
                                        type="button"
                                        onClick={() => onRegenerate(hook.id)}
                                        disabled={regeneratingId === hook.id}
                                        className="btn-secondary px-3 py-2 text-xs"
                                    >
                                        {regeneratingId === hook.id ? "…" : "↻ Regenerate"}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">CTA Bank</h3>
                <div className="flex flex-col gap-2">
                    {ctas.map((cta) => (
                        <div
                            key={cta.id}
                            className={clsx(
                                "card-base flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between",
                                cta.meta?.recommended === true && "border-[var(--gold)]",
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    {cta.meta?.type ? (
                                        <span className="text-[10px] font-semibold uppercase text-text-muted">{String(cta.meta.type)}</span>
                                    ) : null}
                                    {cta.meta?.recommended === true ? (
                                        <span className="rounded-full bg-[var(--gold-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--gold-text)]">
                                            Best Choice
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-sm text-text-secondary">{cta.content}</p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                <CopyButton text={cta.content} label="Copy CTA" variant="primary" />
                                {onRegenerate ? (
                                    <button
                                        type="button"
                                        onClick={() => onRegenerate(cta.id)}
                                        disabled={regeneratingId === cta.id}
                                        className="btn-secondary px-3 py-2 text-xs"
                                    >
                                        {regeneratingId === cta.id ? "…" : "↻ Regenerate"}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

type StrategyScoreTabProps = {
    campaign: CampaignRow;
    onImprove: () => void;
    improving: boolean;
};

export function StrategyScoreTab({ campaign, onImprove, improving }: StrategyScoreTabProps) {
    const breakdown = campaign.score_breakdown || {};
    const categories = [
        { key: "offerClarity", label: "Offer clarity" },
        { key: "audienceFit", label: "Audience fit" },
        { key: "opportunityQuality", label: "Opportunity quality" },
        { key: "contentVariety", label: "Content variety" },
        { key: "ctaQuality", label: "CTA quality" },
        { key: "campaignCoverage", label: "Campaign coverage" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <section className="card-base p-5 sm:p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">Your Recommended Strategy</h3>
                <div className="space-y-4 text-sm leading-relaxed text-text-secondary">
                    <p>{campaign.strategy?.summary}</p>
                    <p><strong className="text-text-primary">Who to target:</strong> {campaign.strategy?.whoToTarget}</p>
                    <p><strong className="text-text-primary">What to say:</strong> {campaign.strategy?.whatToSay}</p>
                    <p><strong className="text-text-primary">What to avoid:</strong> {campaign.strategy?.whatToAvoid}</p>
                    <p><strong className="text-text-primary">Do this first:</strong> {campaign.strategy?.firstStep}</p>
                </div>
            </section>

            <section className="card-base p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Campaign Score</p>
                        <p className="text-3xl font-bold tabular-nums text-[var(--gold-text)]">{campaign.score ?? "—"}/100</p>
                    </div>
                    {breakdown.weakAreas?.length ? (
                        <button type="button" onClick={onImprove} disabled={improving} className="btn-primary">
                            {improving ? "Improving…" : "Improve My Campaign"}
                        </button>
                    ) : null}
                </div>

                {breakdown.weakAreas?.length ? (
                    <p className="mb-4 text-sm text-[var(--warning)]">
                        Your campaign could be stronger in: {breakdown.weakAreas.join(", ")}
                    </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                    {categories.map((cat) => {
                        const val = (breakdown as unknown as Record<string, number>)[cat.key] ?? 0;
                        return (
                            <div key={cat.key} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
                                <div className="mb-1 flex justify-between text-xs">
                                    <span className="text-text-muted">{cat.label}</span>
                                    <span className="font-semibold tabular-nums text-text-primary">{val}/100</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${val}%`, background: "var(--grad-brand)" }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

type WeeklyBatchTabProps = {
    assets: CampaignAssetRow[];
    onFillWeek: () => void;
    filling: boolean;
    onRegenerate: (id: string) => void;
    regeneratingId: string | null;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function WeeklyBatchTab({ assets, onFillWeek, filling, onRegenerate, regeneratingId }: WeeklyBatchTabProps) {
    const weeklyAssets = assets.filter((a) => a.meta?.section === "weekly_batch");
    const [activeDay, setActiveDay] = useState(WEEKDAYS[0]);

    const byDay = WEEKDAYS.reduce<Record<string, CampaignAssetRow>>((acc, day) => {
        const found = weeklyAssets.find((a) => a.meta?.weekday === day);
        if (found) acc[day] = found;
        return acc;
    }, {});

    const activeAsset = byDay[activeDay];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">Weekly Batch Mode</h3>
                    <p className="text-xs text-text-muted">One click generates a full 5-day content pack.</p>
                </div>
                <button type="button" onClick={onFillWeek} disabled={filling} className="btn-primary w-full sm:w-auto">
                    <Sparkles size={16} strokeWidth={1.75} />
                    {filling ? "Building your week…" : "Fill My Week"}
                </button>
            </div>

            {weeklyAssets.length === 0 ? (
                <div className="card-base p-6 text-center">
                    <p className="mb-4 text-sm text-text-secondary">No weekly content yet. Click Fill My Week to generate Mon–Fri posts.</p>
                    <button type="button" onClick={onFillWeek} disabled={filling} className="btn-primary mx-auto">
                        Fill My Week
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {WEEKDAYS.map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => setActiveDay(day)}
                                className={activeDay === day ? "btn-chip btn-chip-active shrink-0" : "btn-chip shrink-0"}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    {activeAsset ? (
                        <article className="card-base p-4 sm:p-5">
                            <p className="mb-1 text-xs font-semibold uppercase text-text-muted">{activeAsset.channel}</p>
                            {activeAsset.meta?.angle ? (
                                <p className="mb-2 text-[11px] text-text-muted">Angle: {String(activeAsset.meta.angle)}</p>
                            ) : null}

                            {activeAsset.meta?.hook ? (
                                <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--gold-text)]">Hook</p>
                                    <p className="text-sm leading-relaxed text-text-primary">{String(activeAsset.meta.hook)}</p>
                                    <div className="mt-2">
                                        <CopyButton text={String(activeAsset.meta.hook)} label="Copy Hook" />
                                    </div>
                                </div>
                            ) : null}

                            <div className="mb-4">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Post</p>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{activeAsset.content}</p>
                            </div>

                            {activeAsset.meta?.cta ? (
                                <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--gold-text)]">CTA</p>
                                    <p className="text-sm leading-relaxed text-text-primary">{String(activeAsset.meta.cta)}</p>
                                    <div className="mt-2">
                                        <CopyButton text={String(activeAsset.meta.cta)} label="Copy CTA" variant="primary" />
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                                <CopyButton text={activeAsset.content} label="Copy Full Post" variant="primary" />
                                <button
                                    type="button"
                                    onClick={() => onRegenerate(activeAsset.id)}
                                    disabled={regeneratingId === activeAsset.id}
                                    className="btn-secondary px-3 py-2 text-xs"
                                >
                                    ↻ Regenerate
                                </button>
                            </div>
                        </article>
                    ) : (
                        <div className="card-base p-4 text-sm text-text-muted">No content for {activeDay} yet.</div>
                    )}
                </>
            )}
        </div>
    );
}

type CampaignLibraryProps = {
    campaigns: Array<{ id: string; name: string; score: number | null; stats: { assetCount?: number; opportunityCount?: number }; created_at: string; updated_at: string }>;
    onDelete: (id: string) => void;
};

export function CampaignLibrary({ campaigns, onDelete }: CampaignLibraryProps) {
    if (campaigns.length === 0) {
        return (
            <div className="card-base p-6 text-center">
                <h3 className="mb-2 font-semibold text-text-primary">No campaigns yet</h3>
                <p className="mb-4 text-sm text-text-secondary">Your first campaign will appear here once Cashwave builds it for you.</p>
                <Link href="/dfy/new" className="btn-primary mx-auto inline-flex">
                    Build My First Campaign
                    <ArrowRight size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
                <article key={c.id} className="card-base flex flex-col gap-3 p-4">
                    <div>
                        <h3 className="font-semibold text-text-primary">{c.name}</h3>
                        <p className="text-2xl font-bold tabular-nums text-[var(--gold-text)]">{c.score ?? "—"}/100</p>
                        <p className="text-xs text-text-muted">
                            {c.stats?.assetCount ?? 0} assets · {c.stats?.opportunityCount ?? 0} opportunities
                        </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                        <Link href={`/dfy/campaigns/${c.id}`} className="btn-primary flex-1 px-3 py-2 text-xs sm:flex-none">
                            Open Campaign
                        </Link>
                        <button type="button" onClick={() => onDelete(c.id)} className="btn-secondary px-3 py-2 text-xs">
                            Delete
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
}
