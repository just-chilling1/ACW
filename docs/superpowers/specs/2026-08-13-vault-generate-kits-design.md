# Vault Generate Kits Design

**Date:** 2026-08-13  
**Status:** Approved  
**Supersedes:** [2026-08-12-quora-pinterest-vault-offer-packs-design.md](./2026-08-12-quora-pinterest-vault-offer-packs-design.md) (static library + per-entry customize as primary UX)

## Summary

Replace the Quora + Pinterest Vault static library with an Instant Income–style flow: **affiliate link + niche → analyze offer → staged build → saved kit** of generated Quora answers and Pinterest pins. Users can keep multiple kits over time.

## Goals

1. Remove browse-of-pregenerated-posts as the Vault product.
2. Generate ~6 Quora answers + ~6 Pinterest pins per kit from offer analysis + niche.
3. Persist kits/assets in Supabase with RLS (account-backed history).
4. Mirror Instant UX: landing → build → kit detail with copy actions.

## Non-goals

- DFY opportunity discovery, calendars, weekly batches.
- Instant hooks / replies / CTAs / quick plan (Vault stays Quora + Pinterest only).
- Changes to `/shorts-vault`.
- Per-asset improve/regenerate in v1 (can follow Instant later).

## Decisions

| Topic | Choice |
|---|---|
| Content source | LLM generation from offer snapshot (no static catalog) |
| UX model | Instant-style kits (multiple saved kits) |
| Platforms | Quora + Pinterest only |
| Volume | ~6 Quora + ~6 Pinterest (~12 total) |
| Offer analysis | Reuse `analyzeOffer` / `dfy_offers` |
| Storage | New `vault_kits` + `vault_assets` tables |
| Old library | Removed from product path |
| Old customize/state/packs APIs | Retired from UI; tables may remain unused |

## User flow

1. `/vault` — landing + list of past kits + CTA to create
2. `/vault/build` — paste link → analyze → pick niche → build progress → kit
3. `/vault/kit/[id]` — Quora / Pinterest filter, copy-ready cards

Build stages: understand offer → lock niche → write Quora answers → write Pinterest pins → finalize.

## Data model

### `vault_kits`

- `id`, `user_id`, `offer_url`, `offer_snapshot`, `niche_id`, `name`
- `status`: `draft` | `building` | `ready` | `failed`
- `build_progress` JSONB, `stats` JSONB (`quoraCount`, `pinterestCount`)
- timestamps

### `vault_assets`

- `kit_id`, `platform` (`quora` | `pinterest`), `type` (`post`)
- `title`, `content`, `angle`, `why`, `status`, `meta` JSONB
- Quora meta: `searchQuery`, `topics`, `question`
- Pinterest meta: `pinTitle`, `boardName`, `imageConcept`, `keywords`

Affiliate URL is baked into generated copy (no `__LINK__`).

## APIs

- `POST /api/vault/analyze-offer` (Instant-equivalent; may thin-wrap shared analyze)
- `GET/POST /api/vault/kits`
- `GET/PATCH/DELETE /api/vault/kits/[id]`
- `GET/POST /api/vault/kits/[id]/build`

## Generation rules

Reuse Vault quality rules from customize era:

- Quora: helpful answer, prefer ≥180 words, single affiliate URL in last third
- Pinterest: title ≤100 chars, description ≤500, keywords 4–8
- Safety: Instant `SAFETY_RULES_PROMPT` / sanitize
- Fallbacks if LLM fails so kits can still reach `ready`

## Out of scope cleanup

Delete or stop importing `src/lib/vault/content/*.ts` from runtime. Update `PREMIUM_FEATURES` Vault copy.
