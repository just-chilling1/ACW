# Accessibility + radius pass — migration note

Scoped to tokens and four component rules. No component logic, no affiliate URLs, no video IDs. One commit.

## 1. Capture the baseline

```bash
grep -rn "jvz\|clickbank\|digistore\|convertri\|explodely\|http" src --include='*.tsx' --include='*.ts' | grep -i "href\|url\|link" > /tmp/links-before.txt
grep -rEno "player\.vimeo\.com/video/[0-9]+" src > /tmp/videos-before.txt
```

## 2. Apply the tokens

Paste `globals-tokens-patch.css` over the matching `:root` blocks in `src/app/globals.css`. Every token name is preserved — nothing downstream needs to change to compile.

## 3. Sweep hardcoded radius utilities

The tokens only reach components that use them. Anything with a literal Tailwind radius class keeps its old corners, so:

```bash
grep -rn "rounded-" src --include='*.tsx' | wc -l          # count first
```

Map by intent, largest first so the shorter class names don't get double-replaced:

| Find | Replace | Because |
|---|---|---|
| `rounded-3xl` `rounded-2xl` | `rounded-[var(--radius-xl)]` | modals, promo cards |
| `rounded-xl` | `rounded-[var(--radius-lg)]` | cards, callouts |
| `rounded-lg` | `rounded-[var(--radius-md)]` | buttons, inputs, chips |
| `rounded-md` | `rounded-[var(--radius-sm)]` | badges, wells |
| `rounded-full` | **review each** | keep on avatars and status dots only; everything else → `rounded-[var(--radius-md)]` |

`rounded-full` is the one that needs eyes on it. Chips and pills read as broken at 5px if half of them stay round.

## 4. Sweep retired hex values

```bash
grep -rn "10B981\|EF4444\|38BDF8\|F5B301\|A89680" src
```

Every hit is a component bypassing the token layer. Replace with `var(--success)`, `var(--danger)`, `var(--info)`, `var(--warning)`, `var(--text-tertiary)`.

## 5. Add the icon to every semantic surface

The info hue is gone, so anything that previously said "this is informational" by being blue now says nothing. Each `.badge-info` / `.status-info` needs `ti-info-circle` or the Lucide equivalent. Same for success and warning — hue alone is no longer a signal anywhere in the system.

## 6. Verify

```bash
npx tsc --noEmit
grep -rn "jvz\|clickbank\|digistore\|convertri\|explodely\|http" src --include='*.tsx' --include='*.ts' | grep -i "href\|url\|link" > /tmp/links-after.txt
diff /tmp/links-before.txt /tmp/links-after.txt    # must be empty
grep -rEno "player\.vimeo\.com/video/[0-9]+" src > /tmp/videos-after.txt
diff /tmp/videos-before.txt /tmp/videos-after.txt  # must be empty
```

Then walk `/dev/style-guide`, `/dashboard`, `/search`, `/radar`, `/replies`, and the three premium pages at 375px and at 1440px.

## What to look at, not just measure

Three things the numbers won't catch:

1. **The `EarningsBanner`** is specced in the playbook against a navy Robinhood palette (`#101726`, `#fbbf24`). On brown it will fight the new warning orange. It needs its own pass.
2. **`--grad-brand` on text clips** still works, but check the gradient text in the h1 — clipped gradients lose contrast at the light end, and the h1 is the one place a ratio can drop without a token being wrong.
3. **The three sidebar offer cards.** They're gold-on-brown links at small size, now on `--gold-text` with a 48% border. If they now shout louder than the primary CTA, drop them to `--border-subtle` — they should be findable, not dominant.
