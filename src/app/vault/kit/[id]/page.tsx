"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { InlineError } from "@/components/ui/InlineError";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { VaultEntryCard } from "@/components/vault/VaultEntryCard";
import { VaultBuildSequence } from "@/components/vault/vault-build-sequence";
import { assetToVaultEntry } from "@/lib/vault/asset-to-entry";
import type { VaultAssetRow, VaultKitRow } from "@/lib/vault/kit-types";
import { APP_NICHES } from "@/lib/niches";

type PlatformFilter = "all" | "quora" | "pinterest";

function nicheLabel(id: string): string {
  return APP_NICHES.find((n) => n.id === id)?.label || id.replace(/_/g, " ");
}

export default function VaultKitPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const [kit, setKit] = useState<VaultKitRow | null>(null);
  const [assets, setAssets] = useState<VaultAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    try {
      const res = await fetch(`/api/vault/kits/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load kit.");
      setKit(data.kit);
      setAssets(data.assets || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load kit.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return assets;
    return assets.filter((a) => a.platform === filter);
  }, [assets, filter]);

  const handleRetry = async () => {
    setRetrying(true);
    setError("");
    try {
      const res = await fetch(`/api/vault/kits/${id}/build`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Build failed.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Build failed.");
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this vault kit?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vault/kits/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete.");
      }
      router.replace("/vault");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-text-muted">Loading vault kit…</div>;
  }

  if (!kit) {
    return (
      <div className="space-y-4 p-6">
        <InlineError message={error || "Kit not found."} />
        <Link href="/vault" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft size={14} />
          Back to Vault
        </Link>
      </div>
    );
  }

  if (kit.status === "building") {
    return (
      <div className="mx-auto flex w-full max-w-none flex-col gap-6 pb-10">
        <PageHeader eyebrow="VAULT" title={kit.name} subtitle="Your kit is still building…" />
        <VaultBuildSequence progress={kit.build_progress || { completedStages: [] }} active />
        <button type="button" onClick={() => void load()} className="btn-secondary w-fit">
          Refresh status
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-6 pb-10 sm:pb-12">
      <PageHeader
        eyebrow="VAULT KIT"
        title={kit.name}
        subtitle={`${nicheLabel(kit.niche_id)} · ${kit.stats?.quoraCount || 0} Quora · ${kit.stats?.pinterestCount || 0} Pinterest`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/vault" className="btn-ghost inline-flex items-center gap-2 text-sm">
          <ArrowLeft size={14} />
          All kits
        </Link>
        <Link href="/vault/build" className="btn-secondary text-sm">
          New kit
        </Link>
        {kit.status === "failed" ? (
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={retrying}
            className="btn-primary text-sm"
          >
            <RefreshCw size={14} />
            {retrying ? "Retrying…" : "Retry build"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="btn-secondary text-sm"
        >
          <Trash2 size={14} />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {error ? <InlineError message={error} /> : null}

      {kit.status === "failed" ? (
        <p className="text-sm text-[var(--danger)]">
          This kit failed to finish. Retry to generate Quora answers and Pinterest pins again.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["quora", "Quora"],
            ["pinterest", "Pinterest"],
          ] as const
        ).map(([value, label]) => (
          <SelectableChip
            key={value}
            label={label}
            selected={filter === value}
            onClick={() => setFilter(value)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No posts in this filter yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((asset) => (
            <VaultEntryCard
              key={asset.id}
              entry={assetToVaultEntry(asset, kit.niche_id)}
              showSavedUsed={false}
              offerLabel={kit.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
