### Task 4: Card + page workflow UX

**Files:**
- Modify: `src/components/vault/VaultEntryCard.tsx`
- Modify: `src/app/vault/page.tsx`

**Interfaces:**
- Consumes: `VaultEntryPack`, `/api/vault/customize`, `/api/vault/packs`, `isSafeHttpUrl`, `getVaultEntriesForNiche`, `applyAffiliateLink`
- Produces: page steps 1â€“4; card customize/delete modes

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
2. In the bottom action row (before or after Save/Used): if `onCustomize`, render a button with Sparkles icon: label `Customize to my offer` / `Customizingâ€¦` when `customizing`. Show `customizeError` as `role="alert"` text under the row.
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
3. Copy or customize â€” curated list; quiet `{usedCount} of {nicheTotal} used`; no Filter section; do not gate curated list on `loading` skeletons for the whole list (saved/used can show a small loading note like Shorts)
4. My library â€” niche-filtered packs; skeletons only here; empty: â€œCustomize a post to save it here.â€‌

Subtitle/tutorial: link â†’ niche â†’ posts â†’ optional customize.

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
