# Quora + Pinterest Vault Offer Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve `/vault` into link → niche → curated Quora/Pinterest posts with optional offer-aware per-entry customize saved as account-backed packs, and remove the Filter the library section.

**Architecture:** Page-local affiliate link drives curated `__LINK__` substitution. Customize API analyzes the offer page, LLM-rewrites one curated seed entry (Quora or Pinterest), and upserts `vault_entry_packs`. My library lists/deletes packs. Saved/used stays on curated cards via existing vault state.

**Tech Stack:** Next.js App Router, Supabase (RLS), existing `analyzeOffer` / `callChatGPT`, Framer Motion page shell.

**Spec:** [docs/superpowers/specs/2026-08-12-quora-pinterest-vault-offer-packs-design.md](../specs/2026-08-12-quora-pinterest-vault-offer-packs-design.md)

## Global Constraints

- Affiliate link is page-local only (`acw.vault.affiliateLink`); never call `setAffiliateLink`.
- No Filter the library UI (no platform chips, Saved only, Hide used).
- Customize is one entry per request; packs upsert on `(user_id, source_entry_id, affiliate_link)`.
- Pack body fields: Quora `answer` / Pinterest `pinDescription` contain the real URL exactly once; no leftover `__LINK__`; no URL/`__LINK__` in question, searchQuery, pinTitle, boardName, or imageConcept.
- Do not change `/shorts-vault` behavior or `shorts_script_packs`.
- Follow `src/lib/vault/content/RUBRIC.md` for curated edits; keep `npm run validate:vault` green.
- Skip git commits unless the user explicitly asks (workspace rule).

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/20260812190000_vault_entry_packs.sql` | Table + RLS + unique index |
| `src/lib/vault/vault-packs.ts` | Pack DTO, row mapper, `isValidPackEntry` |
| `src/lib/vault/vault-customize.ts` | Offer analyze + LLM rewrite + fallback |
| `src/app/api/vault/customize/route.ts` | Customize + upsert |
| `src/app/api/vault/packs/route.ts` | List packs |
| `src/app/api/vault/packs/[id]/route.ts` | Delete pack |
| `src/components/vault/VaultEntryCard.tsx` | Customize / library modes |
| `src/app/vault/page.tsx` | New workflow UX |
| `src/lib/vault/content/*.ts` (not `shorts/`) | Editorial enhance |

Reuse unchanged: `catalog.ts` helpers, `/api/vault/state`, `types.ts`, `validate-vault.mjs`, DFY `analyzeOffer`, `sanitizeExternalUrl`, `isSafeHttpUrl`.

---

### Task 1: Migration + pack types/mappers

**Files:**
- Create: `supabase/migrations/20260812190000_vault_entry_packs.sql`
- Create: `src/lib/vault/vault-packs.ts`
- Test: manual typecheck / node assert on `isValidPackEntry` (no dedicated test runner required; use a small inline check script or `npx tsc --noEmit` after Task 2)

**Interfaces:**
- Produces: `VaultEntryPack`, `VaultEntryPackRow`, `mapPackRow`, `isValidPackEntry(value, opts): value is VaultEntry`

- [ ] **Step 1: Add migration**

Create `supabase/migrations/20260812190000_vault_entry_packs.sql`:

```sql
-- Per-user customized Quora/Pinterest Vault entries (single-entry packs).

CREATE TABLE IF NOT EXISTS vault_entry_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_entry_id TEXT NOT NULL,
    niche_id TEXT NOT NULL,
    affiliate_link TEXT NOT NULL,
    offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    entry JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, source_entry_id, affiliate_link)
);

CREATE INDEX IF NOT EXISTS idx_vault_entry_packs_user_id
    ON vault_entry_packs(user_id);

CREATE INDEX IF NOT EXISTS idx_vault_entry_packs_user_created
    ON vault_entry_packs(user_id, created_at DESC);

ALTER TABLE vault_entry_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vault entry packs" ON vault_entry_packs;
CREATE POLICY "Users manage own vault entry packs"
    ON vault_entry_packs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

Apply locally/remotely with the project's usual Supabase migration flow (CLI or MCP `apply_migration` only if the user asks for remote apply).

- [ ] **Step 2: Add `vault-packs.ts`**

Create `src/lib/vault/vault-packs.ts`:

```ts
import type { OfferSnapshot } from "@/lib/dfy/types";
import type { NicheId } from "@/lib/niches";
import type { PinterestEntry, QuoraEntry, VaultEntry } from "@/lib/vault/types";

export type VaultEntryPack = {
  id: string;
  sourceEntryId: string;
  nicheId: NicheId;
  affiliateLink: string;
  offerSnapshot: OfferSnapshot;
  entry: VaultEntry;
  createdAt: string;
  updatedAt: string;
};

export type VaultEntryPackRow = {
  id: string;
  user_id: string;
  source_entry_id: string;
  niche_id: string;
  affiliate_link: string;
  offer_snapshot: OfferSnapshot;
  entry: VaultEntry;
  created_at: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

function hasBannedLinkTokens(text: string, affiliateLink: string): boolean {
  return text.includes("__LINK__") || (affiliateLink.length > 0 && text.includes(affiliateLink));
}

/** Structural check for a rewritten VaultEntry before persist. */
export function isValidPackEntry(
  value: unknown,
  opts: {
    affiliateLink: string;
    sourceEntryId: string;
    nicheId: NicheId;
    minQuoraWords?: number;
  },
): value is VaultEntry {
  if (!isRecord(value)) return false;
  if (value.id !== opts.sourceEntryId) return false;
  if (value.nicheId !== opts.nicheId) return false;
  if (typeof value.angle !== "string" || !value.angle.trim()) return false;

  if (value.platform === "quora") {
    if (typeof value.question !== "string" || !value.question.trim()) return false;
    if (typeof value.searchQuery !== "string" || !value.searchQuery.trim()) return false;
    if (typeof value.answer !== "string" || !value.answer.trim()) return false;
    if (!Array.isArray(value.topics) || value.topics.length === 0) return false;
    if (!value.topics.every((t) => typeof t === "string" && t.trim())) return false;

    if (hasBannedLinkTokens(value.question, opts.affiliateLink)) return false;
    if (hasBannedLinkTokens(value.searchQuery, opts.affiliateLink)) return false;
    if (value.answer.includes("__LINK__")) return false;
    if (countOccurrences(value.answer, opts.affiliateLink) !== 1) return false;

    const minWords = opts.minQuoraWords ?? 120;
    if (wordCount(value.answer) < minWords) return false;
    return true;
  }

  if (value.platform === "pinterest") {
    if (typeof value.pinTitle !== "string" || !value.pinTitle.trim()) return false;
    if (typeof value.pinDescription !== "string" || !value.pinDescription.trim()) return false;
    if (typeof value.boardName !== "string" || !value.boardName.trim()) return false;
    if (typeof value.imageConcept !== "string" || !value.imageConcept.trim()) return false;
    if (!Array.isArray(value.keywords) || value.keywords.length < 4 || value.keywords.length > 8) {
      return false;
    }
    if (!value.keywords.every((k) => typeof k === "string" && k.trim())) return false;

    if (value.pinTitle.length > 100) return false;
    if (value.pinDescription.length > 500) return false;
    if (hasBannedLinkTokens(value.pinTitle, opts.affiliateLink)) return false;
    if (hasBannedLinkTokens(value.boardName, opts.affiliateLink)) return false;
    if (hasBannedLinkTokens(value.imageConcept, opts.affiliateLink)) return false;
    if (value.pinDescription.includes("__LINK__")) return false;
    if (countOccurrences(value.pinDescription, opts.affiliateLink) !== 1) return false;
    return true;
  }

  return false;
}

export function mapPackRow(row: VaultEntryPackRow): VaultEntryPack {
  return {
    id: row.id,
    sourceEntryId: row.source_entry_id,
    nicheId: row.niche_id as NicheId,
    affiliateLink: row.affiliate_link,
    offerSnapshot: row.offer_snapshot,
    entry: row.entry,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type { QuoraEntry, PinterestEntry };
```

- [ ] **Step 3: Sanity-check mapper/validator mentally with fixtures**

Expected: Quora fixture with link once in answer passes at `minQuoraWords: 120`; Pinterest with title >100 fails; answer with `__LINK__` fails.

---

### Task 2: Customize server module

**Files:**
- Create: `src/lib/vault/vault-customize.ts`

**Interfaces:**
- Consumes: `analyzeOffer`, `parseJsonFromLlm`, `callChatGPT`, `isValidPackEntry`
- Produces: `customizeVaultEntry({ seed, affiliateLink, nicheId }) => Promise<{ entry: VaultEntry; offerSnapshot: OfferSnapshot }>`

- [ ] **Step 1: Implement `vault-customize.ts`**

Mirror `src/lib/vault/shorts-customize.ts` with Vault-specific prompts:

```ts
import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import type { OfferSnapshot } from "@/lib/dfy/types";
import { callChatGPT } from "@/lib/llm";
import type { NicheId } from "@/lib/niches";
import { isValidPackEntry } from "@/lib/vault/vault-packs";
import type { VaultEntry } from "@/lib/vault/types";

function buildRewritePrompt(seed: VaultEntry, offer: OfferSnapshot, affiliateLink: string): string {
  if (seed.platform === "quora") {
    return `Rewrite this Quora answer so it promotes THIS specific offer while staying helpful and non-spammy.

OFFER
- Product: ${offer.productName}
- Promise: ${offer.mainPromise}
- Audience: ${offer.targetAudience}
- Strongest angle: ${offer.strongestAngle}
- Pain points: ${offer.painPoints.join("; ")}
- Benefits: ${offer.primaryBenefits.join("; ")}
- Affiliate URL (must appear exactly once in answer only): ${affiliateLink}

SEED (JSON)
${JSON.stringify(seed, null, 2)}

Return ONLY JSON matching QuoraEntry shape with the same id, platform "quora", nicheId.
Rules:
- Keep id, platform, nicheId exactly.
- Rewrite angle, question, searchQuery, answer, topics for this offer.
- Answer ≥180 words when possible. Lead with real help; place the affiliate URL once in the last third as a resource continuation.
- question and searchQuery must NOT contain URLs or "__LINK__".
- answer must include the affiliate URL exactly once as plain text and no "__LINK__".
- No fake testimonials, guarantees, or medical/income promises.
- Do not mention AI CashWave or internal product names.
- Plain, concrete beginner-friendly language.`;
  }

  return `Rewrite this Pinterest pin so it promotes THIS specific offer.

OFFER
- Product: ${offer.productName}
- Promise: ${offer.mainPromise}
- Audience: ${offer.targetAudience}
- Strongest angle: ${offer.strongestAngle}
- Pain points: ${offer.painPoints.join("; ")}
- Benefits: ${offer.primaryBenefits.join("; ")}
- Affiliate URL (must appear exactly once in pinDescription only): ${affiliateLink}

SEED (JSON)
${JSON.stringify(seed, null, 2)}

Return ONLY JSON matching PinterestEntry shape with the same id, platform "pinterest", nicheId.
Rules:
- Keep id, platform, nicheId exactly.
- Rewrite angle, pinTitle (≤100 chars), pinDescription (≤500 chars), boardName, imageConcept, keywords (4-8).
- pinDescription must include the affiliate URL exactly once and no "__LINK__".
- pinTitle, boardName, imageConcept must NOT contain URLs or "__LINK__".
- Benefit-led, not clickbait. No guarantees or spam triggers.
- Do not mention AI CashWave or internal product names.`;
}

function mergeRewrite(seed: VaultEntry, partial: Partial<VaultEntry>): VaultEntry {
  if (seed.platform === "quora") {
    const p = partial as Partial<Extract<VaultEntry, { platform: "quora" }>>;
    return {
      ...seed,
      angle: typeof p.angle === "string" && p.angle.trim() ? p.angle.trim() : seed.angle,
      question: typeof p.question === "string" && p.question.trim() ? p.question.trim() : seed.question,
      searchQuery:
        typeof p.searchQuery === "string" && p.searchQuery.trim()
          ? p.searchQuery.trim()
          : seed.searchQuery,
      answer: typeof p.answer === "string" && p.answer.trim() ? p.answer.trim() : seed.answer,
      topics:
        Array.isArray(p.topics) && p.topics.length
          ? p.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
          : seed.topics,
      id: seed.id,
      platform: "quora",
      nicheId: seed.nicheId,
    };
  }

  const p = partial as Partial<Extract<VaultEntry, { platform: "pinterest" }>>;
  return {
    ...seed,
    angle: typeof p.angle === "string" && p.angle.trim() ? p.angle.trim() : seed.angle,
    pinTitle: typeof p.pinTitle === "string" && p.pinTitle.trim() ? p.pinTitle.trim() : seed.pinTitle,
    pinDescription:
      typeof p.pinDescription === "string" && p.pinDescription.trim()
        ? p.pinDescription.trim()
        : seed.pinDescription,
    boardName:
      typeof p.boardName === "string" && p.boardName.trim() ? p.boardName.trim() : seed.boardName,
    imageConcept:
      typeof p.imageConcept === "string" && p.imageConcept.trim()
        ? p.imageConcept.trim()
        : seed.imageConcept,
    keywords:
      Array.isArray(p.keywords) && p.keywords.length
        ? p.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
        : seed.keywords,
    id: seed.id,
    platform: "pinterest",
    nicheId: seed.nicheId,
  };
}

function fallbackOfferAwareEntry(
  seed: VaultEntry,
  offer: OfferSnapshot,
  affiliateLink: string,
): VaultEntry {
  const product = offer.productName || "this resource";
  if (seed.platform === "quora") {
    const withLink = seed.answer.includes("__LINK__")
      ? seed.answer.replace("__LINK__", affiliateLink)
      : `${seed.answer.trim()}\n\nIf you want the step-by-step version for ${product}: ${affiliateLink}`;
    return {
      ...seed,
      angle: offer.strongestAngle || seed.angle,
      answer: withLink.includes(affiliateLink) ? withLink : `${withLink} ${affiliateLink}`,
    };
  }

  const desc = seed.pinDescription.includes("__LINK__")
    ? seed.pinDescription.replace("__LINK__", affiliateLink)
    : `${seed.pinDescription.trim()} Learn more: ${affiliateLink}`;
  return {
    ...seed,
    angle: offer.strongestAngle || seed.angle,
    pinTitle: `${seed.pinTitle}`.slice(0, 100),
    pinDescription: (desc.includes(affiliateLink) ? desc : `${desc} ${affiliateLink}`).slice(0, 500),
  };
}

function degradedOffer(nicheId: NicheId): OfferSnapshot {
  return {
    productName: "Your Offer",
    category: "Digital Product",
    mainPromise: "A practical solution for people looking for results.",
    primaryBenefits: ["Easy to get started", "Saves time", "Beginner-friendly"],
    secondaryBenefits: ["Flexible approach", "Step-by-step guidance"],
    targetAudience: "People in this niche looking for a clear next step",
    buyerIntent: "High — actively searching for solutions",
    painPoints: ["Overwhelmed by options", "Unsure where to start"],
    desiredOutcome: "Clear next steps and confidence",
    objections: ["Is this legit?", "Will it work for me?"],
    strongestAngle: "Simple beginner-friendly approach",
    contentAngles: ["problem/solution", "beginner education", "tips"],
    ctaStyle: "Educational + soft resource recommendation",
    promotionChannels: ["Quora", "Pinterest"],
    recommendedAudienceMode: nicheId,
    promotionStyle: "Educational + problem/solution",
  };
}

async function rewriteOnce(
  seed: VaultEntry,
  offer: OfferSnapshot,
  affiliateLink: string,
): Promise<VaultEntry> {
  const raw = await callChatGPT([
    { role: "user", content: buildRewritePrompt(seed, offer, affiliateLink) },
  ]);
  const parsed = parseJsonFromLlm<Partial<VaultEntry>>(raw, {});
  return mergeRewrite(seed, parsed);
}

export async function customizeVaultEntry(opts: {
  seed: VaultEntry;
  affiliateLink: string;
  nicheId: NicheId;
}): Promise<{ entry: VaultEntry; offerSnapshot: OfferSnapshot }> {
  const { seed, affiliateLink, nicheId } = opts;

  let offer: OfferSnapshot;
  try {
    offer = await analyzeOffer(affiliateLink, nicheId);
  } catch {
    offer = degradedOffer(nicheId);
  }

  const validateStrict = (entry: VaultEntry) =>
    isValidPackEntry(entry, {
      affiliateLink,
      sourceEntryId: seed.id,
      nicheId,
      minQuoraWords: seed.platform === "quora" ? 180 : undefined,
    });

  const validateSoft = (entry: VaultEntry) =>
    isValidPackEntry(entry, {
      affiliateLink,
      sourceEntryId: seed.id,
      nicheId,
      minQuoraWords: seed.platform === "quora" ? 120 : undefined,
    });

  try {
    let rewritten = await rewriteOnce(seed, offer, affiliateLink);
    if (!validateStrict(rewritten)) {
      rewritten = await rewriteOnce(seed, offer, affiliateLink);
    }
    if (validateStrict(rewritten) || validateSoft(rewritten)) {
      return { entry: rewritten, offerSnapshot: offer };
    }
    const fallback = fallbackOfferAwareEntry(seed, offer, affiliateLink);
    if (!validateSoft(fallback)) {
      throw new Error("Customized entry failed validation");
    }
    return { entry: fallback, offerSnapshot: offer };
  } catch (error) {
    const fallback = fallbackOfferAwareEntry(seed, offer, affiliateLink);
    if (!validateSoft(fallback)) {
      throw error instanceof Error ? error : new Error("Customize failed");
    }
    return { entry: fallback, offerSnapshot: offer };
  }
}
```

- [ ] **Step 2: Confirm exports compile**

Run: `npx tsc --noEmit` (or project equivalent). Expected: no errors from `vault-customize.ts` / `vault-packs.ts` (routes come in Task 3).

---

### Task 3: Customize + packs APIs

**Files:**
- Create: `src/app/api/vault/customize/route.ts`
- Create: `src/app/api/vault/packs/route.ts`
- Create: `src/app/api/vault/packs/[id]/route.ts`

**Interfaces:**
- Consumes: `requireApiUser`, `clampString`, `sanitizeExternalUrl`, `getVaultEntryById`, `isVaultEntryId`, `customizeVaultEntry`, `mapPackRow`
- Produces: `POST /api/vault/customize`, `GET /api/vault/packs`, `DELETE /api/vault/packs/[id]`

- [ ] **Step 1: Customize route**

Create `src/app/api/vault/customize/route.ts` (mirror shorts; body uses `entryId`):

```ts
import { NextResponse } from "next/server";
import { clampString, requireApiUser } from "@/lib/api-auth";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { sanitizeExternalUrl } from "@/lib/safe-url";
import { getVaultEntryById, isVaultEntryId } from "@/lib/vault/catalog";
import { customizeVaultEntry } from "@/lib/vault/vault-customize";
import { mapPackRow, type VaultEntryPackRow } from "@/lib/vault/vault-packs";

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((niche) => niche.id === value);
}

export async function POST(req: Request) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  try {
    const body = await req.json();
    const entryId = clampString(body.entryId, 64);
    const nicheIdRaw = clampString(body.nicheId, 64);
    const affiliateLink = sanitizeExternalUrl(clampString(body.affiliateLink, 2048));

    if (!entryId || !isVaultEntryId(entryId)) {
      return NextResponse.json({ error: "Valid entry required" }, { status: 400 });
    }
    if (!nicheIdRaw || !isNicheId(nicheIdRaw)) {
      return NextResponse.json({ error: "Valid niche required" }, { status: 400 });
    }
    if (!affiliateLink) {
      return NextResponse.json({ error: "Valid affiliate link required" }, { status: 400 });
    }

    const seed = getVaultEntryById(entryId);
    if (!seed) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    if (seed.nicheId !== nicheIdRaw) {
      return NextResponse.json({ error: "Niche does not match entry" }, { status: 400 });
    }

    const { entry, offerSnapshot } = await customizeVaultEntry({
      seed,
      affiliateLink,
      nicheId: nicheIdRaw,
    });

    const now = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from("vault_entry_packs")
      .upsert(
        {
          user_id: auth.user.id,
          source_entry_id: seed.id,
          niche_id: seed.nicheId,
          affiliate_link: affiliateLink,
          offer_snapshot: offerSnapshot,
          entry,
          updated_at: now,
        },
        { onConflict: "user_id,source_entry_id,affiliate_link" },
      )
      .select("*")
      .single();

    if (error || !data) {
      console.error("[vault] customize upsert failed", error);
      return NextResponse.json({ error: "Could not save customized entry." }, { status: 500 });
    }

    return NextResponse.json({ pack: mapPackRow(data as VaultEntryPackRow) });
  } catch (error) {
    console.error("[vault] customize failed", error);
    return NextResponse.json(
      { error: "Could not customize that entry. Please try again." },
      { status: 422 },
    );
  }
}
```

- [ ] **Step 2: List packs route**

Create `src/app/api/vault/packs/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { mapPackRow, type VaultEntryPackRow } from "@/lib/vault/vault-packs";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { data, error } = await auth.supabase
    .from("vault_entry_packs")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[vault] GET packs failed", error);
    return NextResponse.json({ error: "Could not load your library." }, { status: 500 });
  }

  const packs = (data || []).map((row) => mapPackRow(row as VaultEntryPackRow));
  return NextResponse.json({ packs });
}
```

- [ ] **Step 3: Delete pack route**

Create `src/app/api/vault/packs/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { clampString, requireApiUser } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (auth.unauthorized) return auth.unauthorized;

  const { id: rawId } = await context.params;
  const id = clampString(rawId, 64);
  if (!id) {
    return NextResponse.json({ error: "Pack id required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("vault_entry_packs")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[vault] DELETE pack failed", error);
    return NextResponse.json({ error: "Could not delete pack." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}
```

---

### Task 4: Card + page workflow UX

**Files:**
- Modify: `src/components/vault/VaultEntryCard.tsx`
- Modify: `src/app/vault/page.tsx`

**Interfaces:**
- Consumes: `VaultEntryPack`, `/api/vault/customize`, `/api/vault/packs`, `isSafeHttpUrl`, `getVaultEntriesForNiche`, `applyAffiliateLink`
- Produces: page steps 1–4; card customize/delete modes

- [ ] **Step 1: Extend `VaultEntryCard`**

Add optional props matching Shorts card patterns:

- `onCustomize?: () => void`
- `customizing?: boolean`
- `customizeError?: string | null`
- `showSavedUsed?: boolean` (default `true`)
- `onDelete?: () => void`
- `deleting?: boolean`
- `offerLabel?: string`

UI changes:

1. When `offerLabel` set, show `Customized for {offerLabel}` under the title area.
2. In the bottom action row (before or after Save/Used): if `onCustomize`, render a button with Sparkles icon: label `Customize to my offer` / `Customizing…` when `customizing`. Show `customizeError` as `role="alert"` text under the row.
3. If `showSavedUsed === false`, hide Save/Used buttons.
4. If `onDelete`, render a destructive/secondary Delete button with Trash2; disable while `deleting`.

Import `Sparkles` and `Trash2` from `lucide-react`.

- [ ] **Step 2: Rebuild `/vault` page**

Rewrite `src/app/vault/page.tsx` to mirror `src/app/shorts-vault/page.tsx` with these substitutions:

| Shorts | Vault |
|---|---|
| `acw.shorts-vault.*` | `acw.vault.niche`, `acw.vault.affiliateLink` |
| Remove `PLATFORM_KEY` / platform / savedOnly / hideUsed | Gone |
| `useSearch` affiliate | Remove; page-local only |
| `getShortsForNiche` / `applyAffiliateLinkToScript` | `getVaultEntriesForNiche(niche)` / `applyAffiliateLink` |
| `/api/shorts-vault/*` | `/api/vault/customize`, `/api/vault/packs` |
| body `scriptId` | body `entryId` |
| `ShortsScriptPack` / `sourceScriptId` | `VaultEntryPack` / `sourceEntryId` |
| `ShortsScriptCard` | `VaultEntryCard` |

Page sections:

1. Paste affiliate link (input + hint + `linkInputRef`)
2. Choose niche
3. Copy or customize — curated list; quiet `{usedCount} of {nicheTotal} used`; no Filter section; do not gate curated list on `loading` skeletons for the whole list (saved/used can show a small loading note like Shorts)
4. My library — niche-filtered packs; skeletons only here; empty: “Customize a post to save it here.”

Subtitle/tutorial: link → niche → posts → optional customize.

Pack card usage:

```tsx
<VaultEntryCard
  key={pack.id}
  entry={pack.entry}
  showSavedUsed={false}
  offerLabel={pack.offerSnapshot?.productName || pack.affiliateLink}
  onDelete={() => handleDeletePack(pack.id)}
  deleting={deletingId === pack.id}
  disabled={deletingId === pack.id}
/>
```

Curated card usage:

```tsx
<VaultEntryCard
  key={entry.id}
  entry={entry}
  saved={saved.has(entry.id)}
  used={used.has(entry.id)}
  disabled={pendingId === entry.id || customizingId === entry.id}
  onToggleSaved={() => patchState(entry.id, { saved: !saved.has(entry.id) })}
  onToggleUsed={() => patchState(entry.id, { used: !used.has(entry.id) })}
  onCustomize={() => handleCustomize(entry.id)}
  customizing={customizingId === entry.id}
  customizeError={customizeErrors[entry.id] || null}
/>
```

`handleCustomize` must focus the link field and set hint when `!isSafeHttpUrl(affiliateLink.trim())`.

- [ ] **Step 3: Manual UX smoke (no LLM required)**

Open `/vault`: Filter section gone; link field present; niche changes entries; empty link still shows posts; Customize without valid link focuses input.

---

### Task 5: Enhance curated posts

**Files:**
- Modify: `src/lib/vault/content/make-money-online.ts`
- Modify: `src/lib/vault/content/weight-loss.ts`
- Modify: `src/lib/vault/content/health-fitness.ts`
- Modify: `src/lib/vault/content/beauty-skincare.ts`
- Modify: `src/lib/vault/content/relationships.ts`
- Modify: `src/lib/vault/content/tech-gadgets.ts`
- Modify: `src/lib/vault/content/pets.ts`
- Modify: `src/lib/vault/content/home-garden.ts`

Do **not** edit `src/lib/vault/content/shorts/*`.

- [ ] **Step 1: Editorial pass per niche file**

For each of 10 Quora + 10 Pinterest entries:

- Stronger first 1–2 sentences (specific problem, not generic opener).
- Clear useful steps before the link.
- Natural last-third resource framing for `__LINK__` (Quora) / benefit + CTA in description (Pinterest).
- Keep IDs, counts, `__LINK__` exactly once, word/length limits, distinct angles.
- No spam triggers; beginner voice; no product-name leaks.

Prefer strengthening weak openers and CTAs over full rewrites when already strong (e.g. parts of `make-money-online.ts`).

- [ ] **Step 2: Validate**

Run: `npm run validate:vault`  
Expected: PASS (exit 0). Fix any failures before proceeding.

---

### Task 6: Verify

- [ ] **Step 1: Typecheck / lint**

Run project typecheck and fix issues in touched files.

- [ ] **Step 2: Spec smoke checklist**

1. Paste link → pick niche → posts show with link in answer/description; Filter section gone.
2. Customize one Quora + one Pinterest → appear in My library; recustomize same source+link updates same pack.
3. Delete pack; invalid link blocks customize; curated works with empty link.
4. Saved/used still persist for curated ids; packs do not appear on `/shorts-vault`.
5. Migration applied in the environment used for manual customize tests.

---

## Spec coverage self-review

| Spec requirement | Task |
|---|---|
| Page-local affiliate link | Task 4 |
| Remove Filter the library | Task 4 |
| Instant curated + link apply | Task 4 (catalog reuse) |
| Optional Customize to my offer | Tasks 2–4 |
| My library packs | Tasks 1, 3, 4 |
| `vault_entry_packs` + RLS + upsert key | Tasks 1, 3 |
| Enhance curated content | Task 5 |
| Card UX polish | Task 4 |
| Error handling table | Tasks 3–4 |
| No Shorts changes | Global constraint |
| validate:vault | Task 5–6 |
