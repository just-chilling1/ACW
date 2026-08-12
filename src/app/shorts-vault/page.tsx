"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { NichePicker } from "@/components/ui/niche-picker";
import { ShortsScriptCard } from "@/components/vault/ShortsScriptCard";
import {
  PremiumLandingShell,
  PremiumHero,
  PremiumSection,
  PremiumStateBlock,
} from "@/components/premium";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { applyAffiliateLinkToScript, getShortsForNiche } from "@/lib/vault/shorts-catalog";
import type { ShortsScriptPack } from "@/lib/vault/shorts-packs";
import type { VaultStateResponse } from "@/lib/vault/types";

const NICHE_KEY = "acw.shorts-vault.niche";
const LINK_KEY = "acw.shorts-vault.affiliateLink";

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

export default function ShortsVaultPage() {
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [affiliateLink, setAffiliateLinkLocal] = useState("");
  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [packs, setPacks] = useState<ShortsScriptPack[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadingState, setLoadingState] = useState(true);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packsError, setPacksError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [customizingId, setCustomizingId] = useState<string | null>(null);
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
      setError("We couldn't load your saved and used scripts. You can still browse and copy.");
    } finally {
      setLoadingState(false);
    }
  }, []);

  const loadPacks = useCallback(async () => {
    setPacksError(null);
    setLoadingPacks(true);
    try {
      const res = await fetch("/api/shorts-vault/packs");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load packs");
      }
      const data = (await res.json()) as { packs: ShortsScriptPack[] };
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

  const linkValid = isSafeHttpUrl(affiliateLink.trim());

  const nicheScripts = useMemo(
    () =>
      getShortsForNiche(niche).map((script) =>
        applyAffiliateLinkToScript(script, affiliateLink.trim()),
      ),
    [niche, affiliateLink],
  );

  const nicheTotal = nicheScripts.length;
  const usedCount = useMemo(
    () => nicheScripts.filter((script) => used.has(script.id)).length,
    [nicheScripts, used],
  );

  const nichePacks = useMemo(
    () => packs.filter((pack) => pack.nicheId === niche),
    [packs, niche],
  );

  const patchState = useCallback(
    async (scriptId: string, patch: { saved?: boolean; used?: boolean }) => {
      const prevSaved = new Set(saved);
      const prevUsed = new Set(used);

      if (typeof patch.saved === "boolean") {
        const next = new Set(saved);
        if (patch.saved) next.add(scriptId);
        else next.delete(scriptId);
        setSaved(next);
      }
      if (typeof patch.used === "boolean") {
        const next = new Set(used);
        if (patch.used) next.add(scriptId);
        else next.delete(scriptId);
        setUsed(next);
      }

      setPendingId(scriptId);
      try {
        const res = await fetch("/api/vault/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: scriptId, ...patch }),
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
    async (scriptId: string) => {
      if (!linkValid) {
        setLinkHint("Paste a valid http(s) affiliate link first.");
        linkInputRef.current?.focus();
        return;
      }
      setLinkHint(null);
      setCustomizeErrors((prev) => {
        const next = { ...prev };
        delete next[scriptId];
        return next;
      });
      setCustomizingId(scriptId);
      try {
        const res = await fetch("/api/shorts-vault/customize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scriptId,
            nicheId: niche,
            affiliateLink: affiliateLink.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Customize failed");
        }
        const pack = data.pack as ShortsScriptPack;
        setPacks((prev) => {
          const without = prev.filter((p) => p.id !== pack.id);
          const alsoWithoutDup = without.filter(
            (p) =>
              !(
                p.sourceScriptId === pack.sourceScriptId &&
                p.affiliateLink === pack.affiliateLink
              ),
          );
          return [pack, ...alsoWithoutDup];
        });
      } catch (err) {
        setCustomizeErrors((prev) => ({
          ...prev,
          [scriptId]:
            err instanceof Error
              ? err.message
              : "Could not customize that script. Please try again.",
        }));
      } finally {
        setCustomizingId(null);
      }
    },
    [affiliateLink, linkValid, niche],
  );

  const handleDeletePack = useCallback(async (packId: string) => {
    if (!window.confirm("Delete this customized script from your library?")) return;
    const prev = packs;
    setPacks((list) => list.filter((p) => p.id !== packId));
    setDeletingId(packId);
    try {
      const res = await fetch(`/api/shorts-vault/packs/${packId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setPacks(prev);
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
            Viral Shorts <span className="text-gradient">Vault</span>
          </>
        }
        subtitle="Paste your affiliate link, pick a niche, and copy faceless scripts — or customize one to your offer."
      />

      <TutorialVideoSection
        title="How the Shorts Vault Works"
        description="Enter your link, choose a niche, copy a ready script, or customize a card so the hook, beats, and caption match your offer."
      />

      <PremiumSection
        step={1}
        title="Paste your affiliate link"
        description="Used only on this page. Captions update instantly; customize needs a valid link."
      >
        <input
          ref={linkInputRef}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://your-affiliate-link.com/offer"
          value={affiliateLink}
          onChange={(e) => {
            setAffiliateLinkLocal(e.target.value);
            if (linkHint) setLinkHint(null);
          }}
          className="input-base w-full"
        />
        {linkHint ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {linkHint}
          </p>
        ) : null}
      </PremiumSection>

      <PremiumSection step={2} title="Choose your niche">
        <NichePicker value={niche} onChange={setNiche} />
      </PremiumSection>

      <PremiumSection
        step={3}
        title="Copy, film, or customize"
        meta={`${usedCount} of ${nicheTotal} used`}
      >
        {error ? (
          <PremiumStateBlock variant="error" message={error} onRetry={loadState} />
        ) : null}

        {nicheScripts.length === 0 ? (
          <PremiumStateBlock variant="empty" message="No scripts in this niche yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {loadingState ? (
              <p className="text-xs text-text-muted">Syncing saved and used marks…</p>
            ) : null}
            {nicheScripts.map((script) => (
              <ShortsScriptCard
                key={script.id}
                script={script}
                saved={saved.has(script.id)}
                used={used.has(script.id)}
                disabled={pendingId === script.id || customizingId === script.id}
                onToggleSaved={() => patchState(script.id, { saved: !saved.has(script.id) })}
                onToggleUsed={() => patchState(script.id, { used: !used.has(script.id) })}
                onCustomize={() => handleCustomize(script.id)}
                customizing={customizingId === script.id}
                customizeError={customizeErrors[script.id] || null}
              />
            ))}
          </div>
        )}
      </PremiumSection>

      <PremiumSection
        step={4}
        title="My library"
        description="Offer-aware scripts you customized. Showing packs for this niche."
      >
        {packsError ? (
          <PremiumStateBlock variant="error" message={packsError} onRetry={loadPacks} />
        ) : null}

        {loadingPacks ? <PremiumStateBlock rows={2} heightClassName="h-32" /> : null}

        {!loadingPacks && nichePacks.length === 0 ? (
          <PremiumStateBlock
            variant="empty"
            message="Customize a script to save it here."
          />
        ) : null}

        {!loadingPacks && nichePacks.length > 0 ? (
          <div className="flex flex-col gap-4">
            {nichePacks.map((pack) => (
              <ShortsScriptCard
                key={pack.id}
                script={pack.script}
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
