"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { NichePicker } from "@/components/ui/niche-picker";
import { VaultEntryCard } from "@/components/vault/VaultEntryCard";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { applyAffiliateLink, getVaultEntriesForNiche } from "@/lib/vault/catalog";
import type { VaultEntryPack } from "@/lib/vault/vault-packs";
import type { VaultStateResponse } from "@/lib/vault/types";

const NICHE_KEY = "acw.vault.niche";
const LINK_KEY = "acw.vault.affiliateLink";

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}

function readStoredNiche(): NicheId {
  if (typeof window === "undefined") return "make_money_online";
  try {
    const raw = localStorage.getItem(NICHE_KEY);
    if (raw && isNicheId(raw)) return raw;
  } catch {
    // ignore
  }
  return "make_money_online";
}

function readStoredLink(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(LINK_KEY) || "";
  } catch {
    return "";
  }
}

export default function VaultPage() {
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [affiliateLink, setAffiliateLinkLocal] = useState("");
  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [packs, setPacks] = useState<VaultEntryPack[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packsError, setPacksError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [customizingIds, setCustomizingIds] = useState<Set<string>>(new Set());
  const [customizeErrors, setCustomizeErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [linkHint, setLinkHint] = useState<string | null>(null);

  useEffect(() => {
    setNiche(readStoredNiche());
    setAffiliateLinkLocal(readStoredLink());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(NICHE_KEY, niche);
      localStorage.setItem(LINK_KEY, affiliateLink);
    } catch {
      // ignore
    }
  }, [hydrated, niche, affiliateLink]);

  const loadState = useCallback(async () => {
    setError(null);
    setLoadingState(true);
    try {
      const res = await fetch("/api/vault/state");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load");
      }
      const data = (await res.json()) as VaultStateResponse;
      setSaved(new Set(data.saved || []));
      setUsed(new Set(data.used || []));
    } catch {
      setError("We couldn't load your saved and used items. You can still browse and copy.");
    } finally {
      setLoadingState(false);
    }
  }, []);

  const loadPacks = useCallback(async () => {
    setPacksError(null);
    setLoadingPacks(true);
    try {
      const res = await fetch("/api/vault/packs");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load packs");
      }
      const data = (await res.json()) as { packs: VaultEntryPack[] };
      setPacks(data.packs || []);
    } catch {
      setPacksError("We couldn't load your customized library.");
    } finally {
      setLoadingPacks(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void Promise.all([loadState(), loadPacks()]);
  }, [hydrated, loadState, loadPacks]);

  const trimmedAffiliateLink = affiliateLink.trim();
  const linkValid = isSafeHttpUrl(trimmedAffiliateLink);
  const visibleLinkHint =
    trimmedAffiliateLink && !linkValid
      ? "Paste a valid http(s) affiliate link first."
      : linkHint;

  const nicheEntries = useMemo(
    () =>
      getVaultEntriesForNiche(niche).map((entry) =>
        applyAffiliateLink(entry, linkValid ? trimmedAffiliateLink : ""),
      ),
    [niche, linkValid, trimmedAffiliateLink],
  );

  const nicheTotal = nicheEntries.length;
  const usedCount = useMemo(
    () => nicheEntries.filter((entry) => used.has(entry.id)).length,
    [nicheEntries, used],
  );

  const nichePacks = useMemo(
    () => packs.filter((pack) => pack.nicheId === niche),
    [packs, niche],
  );

  const patchState = useCallback(
    async (entryId: string, patch: { saved?: boolean; used?: boolean }) => {
      const prevSaved = new Set(saved);
      const prevUsed = new Set(used);

      if (typeof patch.saved === "boolean") {
        const next = new Set(saved);
        if (patch.saved) next.add(entryId);
        else next.delete(entryId);
        setSaved(next);
      }
      if (typeof patch.used === "boolean") {
        const next = new Set(used);
        if (patch.used) next.add(entryId);
        else next.delete(entryId);
        setUsed(next);
      }

      setPendingId(entryId);
      try {
        const res = await fetch("/api/vault/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, ...patch }),
        });
        if (!res.ok) throw new Error("save failed");
      } catch {
        setSaved(prevSaved);
        setUsed(prevUsed);
        setError("We couldn't save that change. Please try again.");
      } finally {
        setPendingId(null);
      }
    },
    [saved, used],
  );

  const handleCustomize = useCallback(
    async (entryId: string) => {
      if (!linkValid) {
        setLinkHint("Paste a valid http(s) affiliate link first.");
        linkInputRef.current?.focus();
        return;
      }
      setLinkHint(null);
      setCustomizeErrors((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      setCustomizingIds((prev) => new Set(prev).add(entryId));
      try {
        const res = await fetch("/api/vault/customize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryId,
            nicheId: niche,
            affiliateLink: trimmedAffiliateLink,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Customize failed");
        }
        const pack = data.pack as VaultEntryPack;
        setPacks((prev) => {
          const without = prev.filter((item) => item.id !== pack.id);
          const alsoWithoutDuplicate = without.filter(
            (item) =>
              !(
                item.sourceEntryId === pack.sourceEntryId &&
                item.affiliateLink === pack.affiliateLink
              ),
          );
          return [pack, ...alsoWithoutDuplicate];
        });
      } catch (err) {
        setCustomizeErrors((prev) => ({
          ...prev,
          [entryId]:
            err instanceof Error
              ? err.message
              : "Could not customize that post. Please try again.",
        }));
      } finally {
        setCustomizingIds((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });
      }
    },
    [linkValid, niche, trimmedAffiliateLink],
  );

  const handleDeletePack = useCallback(async (packId: string) => {
    if (!window.confirm("Delete this customized post from your library?")) return;
    const previous = packs;
    setPacks((list) => list.filter((pack) => pack.id !== packId));
    setDeletingId(packId);
    try {
      const res = await fetch(`/api/vault/packs/${packId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setPacks(previous);
      setPacksError("We couldn't delete that pack. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }, [packs]);

  return (
    <PremiumLandingShell>
      <PremiumHero
        title={
          <>
            Quora + Pinterest <span className="text-gradient">Vault</span>
          </>
        }
        subtitle="Paste your affiliate link, pick a niche, and copy ready-to-post Quora answers and Pinterest pins — or customize one to your offer."
      />

      <TutorialVideoSection
        title="How the Vault Works"
        description="Enter your link, choose a niche, copy a ready post, or customize a card so the message matches your offer."
      />

      <PremiumSection
        step={1}
        title="Paste your affiliate link"
        description="Used only on this page. Posts update instantly; customize needs a valid link."
      >
        <input
          ref={linkInputRef}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://your-affiliate-link.com/offer"
          value={affiliateLink}
          onChange={(event) => {
            setAffiliateLinkLocal(event.target.value);
            if (linkHint) setLinkHint(null);
          }}
          className="input-base w-full"
        />
        {visibleLinkHint ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {visibleLinkHint}
          </p>
        ) : null}
      </PremiumSection>

      <PremiumSection step={2} title="Choose your niche">
        <NichePicker value={niche} onChange={setNiche} />
      </PremiumSection>

      <PremiumSection
        step={3}
        title="Copy or customize"
        meta={`${usedCount} of ${nicheTotal} used`}
      >
        {error ? (
          <PremiumStateBlock variant="error" message={error} onRetry={loadState} />
        ) : null}

        {nicheEntries.length === 0 ? (
          <PremiumStateBlock variant="empty" message="No posts in this niche yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {loadingState ? (
              <p className="text-xs text-text-muted">Syncing saved and used marks…</p>
            ) : null}
            {nicheEntries.map((entry) => (
              <VaultEntryCard
                key={entry.id}
                entry={entry}
                saved={saved.has(entry.id)}
                used={used.has(entry.id)}
                disabled={pendingId === entry.id || customizingIds.has(entry.id)}
                onToggleSaved={() => patchState(entry.id, { saved: !saved.has(entry.id) })}
                onToggleUsed={() => patchState(entry.id, { used: !used.has(entry.id) })}
                onCustomize={() => handleCustomize(entry.id)}
                customizing={customizingIds.has(entry.id)}
                customizeError={customizeErrors[entry.id] || null}
              />
            ))}
          </div>
        )}
      </PremiumSection>

      <PremiumSection
        step={4}
        title="My library"
        description="Offer-aware posts you customized. Showing packs for this niche."
      >
        {packsError ? (
          <PremiumStateBlock variant="error" message={packsError} onRetry={loadPacks} />
        ) : null}

        {loadingPacks ? <PremiumStateBlock rows={2} heightClassName="h-32" /> : null}

        {!loadingPacks && nichePacks.length === 0 ? (
          <PremiumStateBlock
            variant="empty"
            message="Customize a post to save it here."
          />
        ) : null}

        {!loadingPacks && nichePacks.length > 0 ? (
          <div className="flex flex-col gap-4">
            {nichePacks.map((pack) => (
              <VaultEntryCard
                key={pack.id}
                entry={pack.entry}
                showSavedUsed={false}
                offerLabel={pack.offerSnapshot?.productName || pack.affiliateLink}
                onDelete={() => handleDeletePack(pack.id)}
                deleting={deletingId === pack.id}
                disabled={deletingId === pack.id}
              />
            ))}
          </div>
        ) : null}
      </PremiumSection>
    </PremiumLandingShell>
  );
}
