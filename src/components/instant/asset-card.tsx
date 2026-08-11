"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Check } from "lucide-react";
import { CopyButton } from "@/components/dfy/copy-button";
import type { PromotionAssetRow } from "@/lib/instant/types";
import { IMPROVE_OPTIONS, REGENERATE_OPTIONS } from "@/lib/instant/types";

type AssetCardProps = {
    asset: PromotionAssetRow;
    kitId: string;
    showPlatform?: boolean;
    onUpdate?: (asset: PromotionAssetRow) => void;
};

const IMPROVE_LABELS: Record<string, string> = {
    more_natural: "More natural",
    shorter: "Shorter",
    stronger_opening: "Stronger opening",
    more_helpful: "More helpful",
    less_salesy: "Less salesy",
    more_conversational: "More conversational",
    better_cta: "Better CTA",
};

const REGENERATE_LABELS: Record<string, string> = {
    different_angle: "Different angle",
    shorter: "Shorter",
    more_casual: "More casual",
    more_educational: "More educational",
    more_direct: "More direct",
    completely_different: "Completely different",
};

export function AssetCard({ asset, kitId, showPlatform = true, onUpdate }: AssetCardProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [showImprove, setShowImprove] = useState(false);
    const [showRegenerate, setShowRegenerate] = useState(false);

    const handleStatus = async (status: "used" | "saved" | "ready") => {
        setLoading("status");
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/assets/${asset.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.asset) onUpdate?.(data.asset);
        } finally {
            setLoading(null);
        }
    };

    const handleImprove = async (option: string) => {
        setLoading(`improve-${option}`);
        setShowImprove(false);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/assets/${asset.id}/improve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ option }),
            });
            const data = await res.json();
            if (data.asset) onUpdate?.(data.asset);
        } finally {
            setLoading(null);
        }
    };

    const handleRegenerate = async (option: string) => {
        setLoading(`regen-${option}`);
        setShowRegenerate(false);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/assets/${asset.id}/regenerate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ option }),
            });
            const data = await res.json();
            if (data.asset) onUpdate?.(data.asset);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="card-base flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                    {asset.title ? (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{asset.title}</p>
                    ) : null}
                    {showPlatform && asset.platform && asset.platform !== "General" ? (
                        <span className="badge-info inline-flex text-[10px]">
                            {asset.platform}
                        </span>
                    ) : null}
                    {(asset.meta as { category?: string })?.category ? (
                        <p className="text-xs text-text-muted">
                            {(asset.meta as { category: string }).category}
                        </p>
                    ) : null}
                </div>
                {asset.status === "used" ? (
                    <span className="badge-success text-[10px]">Used</span>
                ) : asset.status === "saved" ? (
                    <span className="badge-info text-[10px]">Saved</span>
                ) : (
                    <span className="badge-info text-[10px]">Ready</span>
                )}
            </div>

            <div className="surface-nested rounded-[var(--radius-md)] p-3 sm:p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{asset.content}</p>
            </div>

            {asset.why ? (
                <p className="text-xs leading-relaxed text-text-muted">{asset.why}</p>
            ) : null}

            {asset.cta ? (
                <p className="text-xs text-text-muted">
                    <span className="font-medium text-text-secondary">CTA:</span> {asset.cta}
                </p>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3">
                <CopyButton text={asset.content} label="Copy" variant="primary" />
                <button
                    type="button"
                    onClick={() => setShowImprove(!showImprove)}
                    disabled={!!loading}
                    className="btn-secondary px-3 py-1.5 text-xs"
                >
                    <Sparkles size={13} />
                    Improve
                </button>
                <button
                    type="button"
                    onClick={() => setShowRegenerate(!showRegenerate)}
                    disabled={!!loading}
                    className="btn-secondary px-3 py-1.5 text-xs"
                >
                    <RefreshCw size={13} />
                    New Version
                </button>
                {asset.status !== "used" ? (
                    <button
                        type="button"
                        onClick={() => handleStatus("used")}
                        disabled={loading === "status"}
                        className="btn-ghost px-3 py-1.5 text-xs"
                    >
                        <Check size={13} />
                        Mark Used
                    </button>
                ) : null}
            </div>

            {showImprove ? (
                <div className="surface-nested flex flex-wrap gap-2 rounded-[var(--radius-md)] p-3">
                    {IMPROVE_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => handleImprove(opt)}
                            disabled={!!loading}
                            className="btn-chip text-xs"
                        >
                            {IMPROVE_LABELS[opt]}
                        </button>
                    ))}
                </div>
            ) : null}

            {showRegenerate ? (
                <div className="surface-nested flex flex-wrap gap-2 rounded-[var(--radius-md)] p-3">
                    {REGENERATE_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => handleRegenerate(opt)}
                            disabled={!!loading}
                            className="btn-chip text-xs"
                        >
                            {REGENERATE_LABELS[opt]}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function AngleCard({
    asset,
    kitId,
    onPostCreated,
}: {
    asset: PromotionAssetRow;
    kitId: string;
    onPostCreated?: (asset: PromotionAssetRow) => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleCreatePost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/instant/kits/${kitId}/angles/${asset.id}/create-post`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.asset) onPostCreated?.(data.asset);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-base flex flex-col gap-3 p-4 sm:p-5">
            <h3 className="font-semibold text-text-primary">{asset.title || asset.angle}</h3>
            <p className="text-sm text-text-muted">{asset.content}</p>
            <button
                type="button"
                onClick={handleCreatePost}
                disabled={loading}
                className="btn-primary w-full sm:w-auto"
            >
                {loading ? "Creating…" : "Create Post"}
            </button>
        </div>
    );
}
