# Viral Shorts Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a premium `/shorts-vault` page serving 40 curated, faceless short-form video scripts (5 per niche across 8 niches), with per-user saved/used state reusing the existing vault's Supabase table and API.

**Architecture:** Static content lives as typed TypeScript modules in `src/lib/vault/content/shorts/` and is imported directly into the client page, so filtering is instant with zero network calls. The affiliate link is substituted client-side via the existing `substituteLink` helper. The only network traffic is loading and updating per-user saved/used state through the already-built `/api/vault/state` route, which is widened by one condition to accept shorts IDs. Content correctness is enforced by a new `scripts/validate-shorts.mjs` that transpiles the content files with the installed `typescript` package and validates the real objects.

**Tech Stack:** Next.js 16.1.6 App Router, React 19, TypeScript 5.9.3, Tailwind CSS v4, lucide-react, framer-motion, clsx, Supabase via `@supabase/ssr`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-08-12-viral-shorts-vault-design.md](../specs/2026-08-12-viral-shorts-vault-design.md)

## Global Constraints

- No new dependencies. No new database table. No AI or network calls at runtime for content.
- Content is static, curated, niche-generic, and faceless-only. No on-camera direction, ever.
- 40 scripts total: exactly 5 per niche across `make_money_online`, `weight_loss`, `health_fitness`, `beauty_skincare`, `relationships`, `tech_gadgets`, `pets`, `home_garden`.
- Each niche gets exactly one script per format: `Three mistakes`, `Myth vs truth`, `POV story`, `Screen demo`, `Before and after`.
- IDs use an `s-` prefix and per-niche slug: `s-mmo-`, `s-wl-`, `s-hf-`, `s-bs-`, `s-rel-`, `s-tech-`, `s-pet-`, `s-hg-`, numbered `01` through `05`.
- `caption` contains `__LINK__` exactly once. `hook`, `cta`, and every `beats[]` field contain zero `__LINK__`.
- `durationSeconds` between 25 and 45. `beats.length` between 4 and 6. `hook` at most 140 characters. `caption` at most 2200 characters. `hashtags` 3 to 8 entries, no `#` and no whitespace inside an entry.
- Timing model: `hook` occupies `0:00` to the first beat's start, which must be between 2 and 5 seconds. Beats are contiguous with no gaps or overlaps and the last beat ends exactly at `durationSeconds`.
- No duplicate hooks and no duplicate captions across the library. No ID collision with existing `VAULT_ENTRIES`.
- Editorial voice matches the existing vault content: plain, concrete, no hype, honest about limits. Health, money, and pet-health topics must avoid guarantees and defer to professionals where relevant.
- Do not modify existing vault content, the `/vault` page, the `vault_entry_states` migration, or `scripts/validate-vault.mjs`.
- The existing vault work is untracked by user decision. Do not commit `src/lib/vault/content/*.ts`, `src/app/vault/`, `src/components/vault/VaultEntryCard.tsx`, `src/app/api/vault/state/route.ts`'s untracked siblings, or the migration. Commit only the files each task names.

---

### Task 1: Foundation — types, catalog, formatter, stubs, validator

**Files:**
- Create: `src/lib/vault/shorts-types.ts`
- Create: `src/lib/vault/shorts-catalog.ts`
- Create: `src/lib/vault/shorts-format.ts`
- Create: `src/lib/vault/content/shorts/index.ts`
- Create: `src/lib/vault/content/shorts/make-money-online.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/weight-loss.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/health-fitness.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/beauty-skincare.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/relationships.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/tech-gadgets.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/pets.ts` (empty array stub)
- Create: `src/lib/vault/content/shorts/home-garden.ts` (empty array stub)
- Create: `scripts/validate-shorts.mjs`
- Create: `docs/superpowers/plans/shorts-authoring-rubric.md`
- Modify: `package.json` (add one script line)

**Interfaces:**
- Consumes: `NicheId` and `APP_NICHES` from `@/lib/niches`; `substituteLink` from `@/lib/hot-threads/ttl`; `VAULT_ENTRIES` from `@/lib/vault/content`.
- Produces: `ShortsScript`, `ShortsBeat`, `ShortsPlatformTag` types; `getShortsForNiche(nicheId, platform?)`, `getShortsScriptById(id)`, `isShortsScriptId(id)`, `applyAffiliateLinkToScript(script, affiliateLink)`; `formatScriptForCopy(script)`; `SHORTS_SCRIPTS` array; and the eight per-niche exports `MAKE_MONEY_ONLINE_SHORTS`, `WEIGHT_LOSS_SHORTS`, `HEALTH_FITNESS_SHORTS`, `BEAUTY_SKINCARE_SHORTS`, `RELATIONSHIPS_SHORTS`, `TECH_GADGETS_SHORTS`, `PETS_SHORTS`, `HOME_GARDEN_SHORTS`.

Creating all eight content files as empty stubs up front means every later content task edits exactly one file and none of them touch `index.ts`, so the seven parallel content tasks cannot conflict.

- [ ] **Step 1: Create the types**

`src/lib/vault/shorts-types.ts`:

```ts
import type { NicheId } from "@/lib/niches";

export type ShortsPlatformTag = "tiktok" | "reels" | "shorts";

export type ShortsBeat = {
  /** Inclusive start to exclusive end, e.g. "0:04-0:12". */
  timecode: string;
  /** What the voice says over this beat. */
  voiceover: string;
  /** The text overlay burned onto the screen. */
  onScreen: string;
  /** The b-roll, stock clip, or screen-recording direction. */
  visual: string;
};

export type ShortsScript = {
  id: string;
  nicheId: NicheId;
  /** The specific take, e.g. "Beginner mistake". */
  angle: string;
  /** The structural template, e.g. "Three mistakes". */
  format: string;
  title: string;
  platforms: ShortsPlatformTag[];
  durationSeconds: number;
  /** Spoken from 0:00 until the first beat starts. Never contains __LINK__. */
  hook: string;
  beats: ShortsBeat[];
  /** Spoken close. Points to the bio. Never contains __LINK__. */
  cta: string;
  /** Post caption. Contains __LINK__ exactly once. */
  caption: string;
  /** No leading "#" and no whitespace. */
  hashtags: string[];
  visualStyle: string;
  soundNote: string;
};
```

- [ ] **Step 2: Create the eight content stubs**

Each of the eight files follows this exact shape. `src/lib/vault/content/shorts/make-money-online.ts`:

```ts
import type { ShortsScript } from "@/lib/vault/shorts-types";

export const MAKE_MONEY_ONLINE_SHORTS: ShortsScript[] = [];
```

Repeat for the remaining seven, changing only the filename and the export name:

- `weight-loss.ts` → `WEIGHT_LOSS_SHORTS`
- `health-fitness.ts` → `HEALTH_FITNESS_SHORTS`
- `beauty-skincare.ts` → `BEAUTY_SKINCARE_SHORTS`
- `relationships.ts` → `RELATIONSHIPS_SHORTS`
- `tech-gadgets.ts` → `TECH_GADGETS_SHORTS`
- `pets.ts` → `PETS_SHORTS`
- `home-garden.ts` → `HOME_GARDEN_SHORTS`

- [ ] **Step 3: Create the content index**

`src/lib/vault/content/shorts/index.ts`:

```ts
import type { ShortsScript } from "@/lib/vault/shorts-types";
import { MAKE_MONEY_ONLINE_SHORTS } from "./make-money-online";
import { WEIGHT_LOSS_SHORTS } from "./weight-loss";
import { HEALTH_FITNESS_SHORTS } from "./health-fitness";
import { BEAUTY_SKINCARE_SHORTS } from "./beauty-skincare";
import { RELATIONSHIPS_SHORTS } from "./relationships";
import { TECH_GADGETS_SHORTS } from "./tech-gadgets";
import { PETS_SHORTS } from "./pets";
import { HOME_GARDEN_SHORTS } from "./home-garden";

export const SHORTS_SCRIPTS: ShortsScript[] = [
  ...MAKE_MONEY_ONLINE_SHORTS,
  ...WEIGHT_LOSS_SHORTS,
  ...HEALTH_FITNESS_SHORTS,
  ...BEAUTY_SKINCARE_SHORTS,
  ...RELATIONSHIPS_SHORTS,
  ...TECH_GADGETS_SHORTS,
  ...PETS_SHORTS,
  ...HOME_GARDEN_SHORTS,
];
```

- [ ] **Step 4: Create the catalog**

`src/lib/vault/shorts-catalog.ts`:

```ts
import type { NicheId } from "@/lib/niches";
import { substituteLink } from "@/lib/hot-threads/ttl";
import { SHORTS_SCRIPTS } from "@/lib/vault/content/shorts";
import type { ShortsPlatformTag, ShortsScript } from "@/lib/vault/shorts-types";

const SCRIPT_BY_ID = new Map(SHORTS_SCRIPTS.map((script) => [script.id, script]));

export function getShortsScriptById(id: string): ShortsScript | undefined {
  return SCRIPT_BY_ID.get(id);
}

export function isShortsScriptId(id: string): boolean {
  return SCRIPT_BY_ID.has(id);
}

/** Platform matches by containment, since one script can target several platforms. */
export function getShortsForNiche(
  nicheId: NicheId,
  platform?: ShortsPlatformTag | "all",
): ShortsScript[] {
  return SHORTS_SCRIPTS.filter((script) => {
    if (script.nicheId !== nicheId) return false;
    if (!platform || platform === "all") return true;
    return script.platforms.includes(platform);
  });
}

/** The link lives only in the caption; spoken lines never carry a URL. */
export function applyAffiliateLinkToScript(
  script: ShortsScript,
  affiliateLink: string,
): ShortsScript {
  return { ...script, caption: substituteLink(script.caption, affiliateLink) };
}
```

- [ ] **Step 5: Create the copy formatter**

`src/lib/vault/shorts-format.ts`:

```ts
import type { ShortsPlatformTag, ShortsScript } from "@/lib/vault/shorts-types";

const PLATFORM_LABELS: Record<ShortsPlatformTag, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
};

export function platformLabel(tag: ShortsPlatformTag): string {
  return PLATFORM_LABELS[tag];
}

export function formatHashtags(hashtags: string[]): string {
  return hashtags.map((tag) => `#${tag}`).join(" ");
}

/**
 * Plain text for pasting into a notes app or teleprompter.
 * Expects a script that already had its affiliate link substituted.
 */
export function formatScriptForCopy(script: ShortsScript): string {
  const platforms = script.platforms.map(platformLabel).join(" / ");
  const firstBeatStart = script.beats[0]?.timecode.split("-")[0] ?? "0:00";

  const beats = script.beats
    .map((beat) =>
      [
        beat.timecode,
        `Say: ${beat.voiceover}`,
        `On screen: ${beat.onScreen}`,
        `Show: ${beat.visual}`,
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `${script.title} — ${script.durationSeconds}s — ${platforms}`,
    "",
    `HOOK (0:00-${firstBeatStart})`,
    script.hook,
    "",
    beats,
    "",
    "CTA",
    script.cta,
    "",
    "CAPTION",
    script.caption,
    "",
    "HASHTAGS",
    formatHashtags(script.hashtags),
    "",
    "HOW TO SHOOT IT",
    script.visualStyle,
    "",
    "SOUND",
    script.soundNote,
  ].join("\n");
}
```

- [ ] **Step 6: Create the validator**

`scripts/validate-shorts.mjs`:

```js
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHORTS_DIR = join(__dirname, "..", "src", "lib", "vault", "content", "shorts");
const VAULT_DIR = join(__dirname, "..", "src", "lib", "vault", "content");

const EXPECTED_NICHES = [
  "make_money_online",
  "weight_loss",
  "health_fitness",
  "beauty_skincare",
  "relationships",
  "tech_gadgets",
  "pets",
  "home_garden",
];

const EXPECTED_FORMATS = [
  "Three mistakes",
  "Myth vs truth",
  "POV story",
  "Screen demo",
  "Before and after",
];

const PLATFORM_TAGS = ["tiktok", "reels", "shorts"];
const SCRIPTS_PER_NICHE = 5;
const MIN_BEATS = 4;
const MAX_BEATS = 6;
const MIN_DURATION = 25;
const MAX_DURATION = 45;
const MAX_HOOK = 140;
const MAX_CAPTION = 2200;
const MIN_HASHTAGS = 3;
const MAX_HASHTAGS = 8;
const MIN_HOOK_WINDOW = 2;
const MAX_HOOK_WINDOW = 5;

const errors = [];

/**
 * Content files import only types, and `import type` is erased by
 * transpilation, so the "@/" path alias never needs resolving.
 */
async function loadArraysFrom(dir, tempDir) {
  const files = readdirSync(dir).filter(
    (name) => name.endsWith(".ts") && name !== "index.ts",
  );
  const collected = [];
  for (const name of files) {
    const source = readFileSync(join(dir, name), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: name,
    });
    const outPath = join(tempDir, `${dir.split(/[\\/]/).pop()}-${name}.mjs`);
    writeFileSync(outPath, outputText, "utf8");
    const mod = await import(pathToFileURL(outPath).href);
    for (const value of Object.values(mod)) {
      if (Array.isArray(value)) collected.push(...value);
    }
  }
  return collected;
}

function parseTimecode(value) {
  const match = /^(\d+):([0-5]\d)-(\d+):([0-5]\d)$/.exec(value ?? "");
  if (!match) return null;
  return {
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  };
}

function countPlaceholder(text) {
  return (String(text ?? "").match(/__LINK__/g) || []).length;
}

function normalize(text) {
  return String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function requireText(script, field, value) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${script.id}: ${field} must be a non-empty string`);
    return false;
  }
  return true;
}

const tempDir = mkdtempSync(join(tmpdir(), "acw-shorts-"));
let scripts = [];
let vaultEntries = [];
try {
  scripts = await loadArraysFrom(SHORTS_DIR, tempDir);
  vaultEntries = await loadArraysFrom(VAULT_DIR, tempDir);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

const vaultIds = new Set(vaultEntries.map((entry) => entry.id));
const seenIds = new Set();
const seenHooks = new Map();
const seenCaptions = new Map();

for (const script of scripts) {
  if (!script.id) {
    errors.push("A script is missing an id");
    continue;
  }
  if (seenIds.has(script.id)) errors.push(`Duplicate id: ${script.id}`);
  seenIds.add(script.id);
  if (vaultIds.has(script.id)) {
    errors.push(`${script.id}: collides with an existing vault entry id`);
  }
  if (!script.id.startsWith("s-")) {
    errors.push(`${script.id}: id must start with "s-"`);
  }

  requireText(script, "title", script.title);
  requireText(script, "angle", script.angle);
  requireText(script, "visualStyle", script.visualStyle);
  requireText(script, "soundNote", script.soundNote);

  if (!EXPECTED_NICHES.includes(script.nicheId)) {
    errors.push(`${script.id}: unexpected nicheId ${script.nicheId}`);
  }
  if (!EXPECTED_FORMATS.includes(script.format)) {
    errors.push(`${script.id}: unexpected format ${script.format}`);
  }

  if (!Array.isArray(script.platforms) || script.platforms.length === 0) {
    errors.push(`${script.id}: platforms must be a non-empty array`);
  } else {
    for (const tag of script.platforms) {
      if (!PLATFORM_TAGS.includes(tag)) {
        errors.push(`${script.id}: invalid platform tag ${tag}`);
      }
    }
  }

  if (
    typeof script.durationSeconds !== "number" ||
    script.durationSeconds < MIN_DURATION ||
    script.durationSeconds > MAX_DURATION
  ) {
    errors.push(
      `${script.id}: durationSeconds must be between ${MIN_DURATION} and ${MAX_DURATION}`,
    );
  }

  if (requireText(script, "hook", script.hook)) {
    if (script.hook.length > MAX_HOOK) {
      errors.push(`${script.id}: hook is ${script.hook.length} chars, max ${MAX_HOOK}`);
    }
    const key = normalize(script.hook);
    if (seenHooks.has(key)) {
      errors.push(`${script.id}: duplicate hook (same as ${seenHooks.get(key)})`);
    } else {
      seenHooks.set(key, script.id);
    }
  }

  if (requireText(script, "cta", script.cta)) {
    if (countPlaceholder(script.cta) !== 0) {
      errors.push(`${script.id}: cta must not contain __LINK__`);
    }
  }

  if (requireText(script, "caption", script.caption)) {
    const links = countPlaceholder(script.caption);
    if (links !== 1) {
      errors.push(
        `${script.id}: caption must contain __LINK__ exactly once (found ${links})`,
      );
    }
    if (script.caption.length > MAX_CAPTION) {
      errors.push(
        `${script.id}: caption is ${script.caption.length} chars, max ${MAX_CAPTION}`,
      );
    }
    const key = normalize(script.caption);
    if (seenCaptions.has(key)) {
      errors.push(`${script.id}: duplicate caption (same as ${seenCaptions.get(key)})`);
    } else {
      seenCaptions.set(key, script.id);
    }
  }

  if (countPlaceholder(script.hook) !== 0) {
    errors.push(`${script.id}: hook must not contain __LINK__`);
  }

  if (!Array.isArray(script.hashtags)) {
    errors.push(`${script.id}: hashtags must be an array`);
  } else {
    if (script.hashtags.length < MIN_HASHTAGS || script.hashtags.length > MAX_HASHTAGS) {
      errors.push(
        `${script.id}: ${script.hashtags.length} hashtags, need ${MIN_HASHTAGS}-${MAX_HASHTAGS}`,
      );
    }
    for (const tag of script.hashtags) {
      if (typeof tag !== "string" || !tag.trim() || /[#\s]/.test(tag)) {
        errors.push(`${script.id}: invalid hashtag "${tag}" (no # and no whitespace)`);
      }
    }
  }

  if (!Array.isArray(script.beats)) {
    errors.push(`${script.id}: beats must be an array`);
    continue;
  }
  if (script.beats.length < MIN_BEATS || script.beats.length > MAX_BEATS) {
    errors.push(
      `${script.id}: ${script.beats.length} beats, need ${MIN_BEATS}-${MAX_BEATS}`,
    );
  }

  let cursor = null;
  script.beats.forEach((beat, index) => {
    const label = `${script.id} beat ${index + 1}`;
    for (const field of ["voiceover", "onScreen", "visual"]) {
      if (typeof beat[field] !== "string" || !beat[field].trim()) {
        errors.push(`${label}: ${field} must be a non-empty string`);
      }
      if (countPlaceholder(beat[field]) !== 0) {
        errors.push(`${label}: ${field} must not contain __LINK__`);
      }
    }

    const span = parseTimecode(beat.timecode);
    if (!span) {
      errors.push(`${label}: unparseable timecode "${beat.timecode}"`);
      cursor = null;
      return;
    }
    if (span.end <= span.start) {
      errors.push(`${label}: timecode ends before it starts`);
    }
    if (index === 0) {
      if (span.start < MIN_HOOK_WINDOW || span.start > MAX_HOOK_WINDOW) {
        errors.push(
          `${label}: first beat starts at ${span.start}s, need ${MIN_HOOK_WINDOW}-${MAX_HOOK_WINDOW}s for the hook`,
        );
      }
    } else if (cursor !== null && span.start !== cursor) {
      errors.push(`${label}: starts at ${span.start}s but previous beat ended at ${cursor}s`);
    }
    cursor = span.end;

    if (index === script.beats.length - 1 && cursor !== script.durationSeconds) {
      errors.push(
        `${label}: last beat ends at ${cursor}s but durationSeconds is ${script.durationSeconds}`,
      );
    }
  });
}

const byNiche = new Map();
for (const script of scripts) {
  if (!byNiche.has(script.nicheId)) byNiche.set(script.nicheId, []);
  byNiche.get(script.nicheId).push(script);
}

for (const niche of EXPECTED_NICHES) {
  const list = byNiche.get(niche) || [];
  if (list.length !== SCRIPTS_PER_NICHE) {
    errors.push(
      `${niche}: expected ${SCRIPTS_PER_NICHE} shorts, found ${list.length}`,
    );
  }
  for (const format of EXPECTED_FORMATS) {
    const count = list.filter((script) => script.format === format).length;
    if (count !== 1) {
      errors.push(`${niche}: expected 1 "${format}" script, found ${count}`);
    }
  }
}

if (errors.length) {
  console.error(
    `Shorts validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):\n`,
  );
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Shorts validation passed: ${scripts.length} scripts across ${EXPECTED_NICHES.length} niches.`,
);
```

- [ ] **Step 7: Wire the validator into package.json**

In `package.json`, add one line after the existing `validate:vault` entry:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "validate:vault": "node scripts/validate-vault.mjs",
    "validate:shorts": "node scripts/validate-shorts.mjs"
  },
```

- [ ] **Step 8: Run the validator to confirm it fails for the right reason**

Run: `npm run validate:shorts`

Expected: exit code 1, with exactly 48 issues — for each of the 8 niches, one `expected 5 shorts, found 0` plus five `expected 1 "<format>" script, found 0`. No other errors. This proves the transpile-and-import path works and the stubs are wired correctly.

- [ ] **Step 9: Confirm the existing vault validator still passes**

Run: `npm run validate:vault`

Expected: `Vault validation passed: 160 entries across 8 niches.`

- [ ] **Step 10: Type check**

Run: `npx tsc --noEmit`

Expected: no output, exit code 0.

- [ ] **Step 11: Write the authoring rubric**

Create `docs/superpowers/plans/shorts-authoring-rubric.md`. Every content task reads this file before writing.

```markdown
# Shorts Authoring Rubric

Read this before writing any script. Then read
`src/lib/vault/content/shorts/make-money-online.ts` as the quality reference.

## Hard rules (the validator enforces these)

- Exactly 5 scripts per niche, one per format: Three mistakes, Myth vs truth,
  POV story, Screen demo, Before and after.
- `durationSeconds` 25 to 45. 4 to 6 beats.
- `hook` at most 140 characters, spoken from 0:00 to the first beat's start.
- The first beat starts between 2 and 5 seconds. Beats are contiguous with no
  gaps or overlaps. The last beat ends exactly at `durationSeconds`.
- `caption` contains `__LINK__` exactly once, at most 2200 characters.
- `hook`, `cta`, and every beat field contain zero `__LINK__`.
- 3 to 8 hashtags, no `#` prefix, no whitespace inside a tag.
- No duplicate hooks or captions anywhere in the library.

## Voice

Match the existing vault content in `src/lib/vault/content/<niche>.ts`. Plain,
concrete, specific. Short sentences. No hype, no "secret", no "crazy hack", no
fake urgency, no invented statistics. Name the real mistake and the real fix.

Be honest about limits. On health, money, and pet-health topics, avoid
guarantees and defer to a professional where the existing Quora answers do.
Never promise income, weight loss, or medical outcomes.

## Faceless only

Every `visual` must be achievable without appearing on camera: stock footage,
a screen recording, a plain text card, a product or object shot, or a simple
graphic. Never write "look at the camera", "point at yourself", or anything
requiring a face or a presenter.

## The link

Spoken lines never read a URL aloud. The `cta` points to the bio. The
`caption` carries `__LINK__` once, which serves as the YouTube Shorts
description and as the link the user pastes into their bio.

## Generic to the niche

Scripts must work for any offer in the niche. Never name a specific product,
brand, price, or company. Say "the plan", "the routine", "the tool" and let
the user's link supply the specifics.

## Per-beat shape

- `voiceover`: what is said. One to three sentences.
- `onScreen`: the burned-in overlay. Short. Under about 40 characters.
- `visual`: the concrete shot direction. Name what is on screen.
```

- [ ] **Step 12: Commit**

```bash
git add docs/superpowers/specs/2026-08-12-viral-shorts-vault-design.md docs/superpowers/plans/2026-08-12-viral-shorts-vault.md docs/superpowers/plans/shorts-authoring-rubric.md src/lib/vault/shorts-types.ts src/lib/vault/shorts-catalog.ts src/lib/vault/shorts-format.ts src/lib/vault/content/shorts scripts/validate-shorts.mjs package.json
git commit -m "feat: scaffold Viral Shorts Vault types, catalog, formatter, and validator"
```

---

### Task 2: Reference content — make_money_online

This task sets the quality bar for the seven that follow. Do it first and alone.

**Files:**
- Modify: `src/lib/vault/content/shorts/make-money-online.ts`

**Interfaces:**
- Consumes: `ShortsScript` from `@/lib/vault/shorts-types`.
- Produces: `MAKE_MONEY_ONLINE_SHORTS` populated with 5 scripts, IDs `s-mmo-01` through `s-mmo-05`.

Assigned format and topic per script:

- `s-mmo-01` — Three mistakes — why beginners stay at zero
- `s-mmo-02` — Myth vs truth — passive income is not passive at the start
- `s-mmo-03` — POV story — you have watched forty hours of tutorials and earned nothing
- `s-mmo-04` — Screen demo — finding what people already ask for
- `s-mmo-05` — Before and after — day 1 to day 30 of posting consistently

- [ ] **Step 1: Read the rubric**

Read `docs/superpowers/plans/shorts-authoring-rubric.md` in full, then read `src/lib/vault/content/weight-loss.ts` (an existing Quora/Pinterest file) to absorb the editorial voice you are matching.

- [ ] **Step 2: Write `s-mmo-01` exactly as given**

This script is the reference the other 39 are measured against. Write it verbatim:

```ts
import type { ShortsScript } from "@/lib/vault/shorts-types";

export const MAKE_MONEY_ONLINE_SHORTS: ShortsScript[] = [
  {
    id: "s-mmo-01",
    nicheId: "make_money_online",
    angle: "Beginner mistake",
    format: "Three mistakes",
    title: "Three Mistakes That Keep Beginners At Zero",
    platforms: ["tiktok", "reels", "shorts"],
    durationSeconds: 32,
    hook: "Three reasons your side hustle is still making zero, and none of them are effort.",
    beats: [
      {
        timecode: "0:04-0:12",
        voiceover:
          "Mistake one: you keep switching. New app on Monday, new niche by Friday. Nothing compounds because nothing runs long enough to compound.",
        onScreen: "1. Switching every week",
        visual:
          "Screen recording scrolling fast through a phone home screen crowded with app icons.",
      },
      {
        timecode: "0:12-0:20",
        voiceover:
          "Mistake two: you are building before anyone asked. A logo, a landing page, a bio. None of that is a customer.",
        onScreen: "2. Building before demand",
        visual:
          "Stock clip of someone arranging shapes in a blank design editor, then a cut to an empty inbox.",
      },
      {
        timecode: "0:20-0:27",
        voiceover:
          "Mistake three: you only post when you feel ready. Ten quiet posts beat one perfect post you never publish.",
        onScreen: "3. Waiting to feel ready",
        visual:
          "Calendar graphic with almost every day empty, then the same calendar filling in day by day.",
      },
      {
        timecode: "0:27-0:32",
        voiceover:
          "Pick one thing. Find out if anyone wants it. Then talk about it for thirty days straight.",
        onScreen: "Pick one. Prove it. Repeat.",
        visual: "Plain text card on a dark background with a slow zoom in.",
      },
    ],
    cta: "The thirty-day version of this is in my bio if you want the steps written out.",
    caption: `Three mistakes that keep beginners at zero: switching every week, building before anyone asked, and waiting until you feel ready. Pick one thing and give it thirty days. Full plan here: __LINK__`,
    hashtags: ["sidehustle", "makemoneyonline", "beginnermistakes", "onlineincome"],
    visualStyle:
      "Faceless. Screen recordings and plain text cards only. Burn in captions so it reads with the sound off.",
    soundNote:
      "Low-energy lo-fi beat under a calm voiceover. Keep the music near fifteen percent so every word stays clear.",
  },
];
```

- [ ] **Step 3: Write `s-mmo-02` through `s-mmo-05`**

Append four more objects to the same array, following the assigned formats and topics above and every rule in the rubric. Match the structure, field order, and voice of `s-mmo-01` exactly. Vary `durationSeconds` across the set (stay within 25 to 45) so the library does not feel templated, and give each a distinct hook and caption.

- [ ] **Step 4: Run the validator**

Run: `npm run validate:shorts`

Expected: exit code 1, and `make_money_online` no longer appears in any error. The remaining errors are only the seven unwritten niches (their `expected 5 shorts, found 0` and per-format lines). If any error mentions an `s-mmo-` ID, fix that script and rerun.

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`

Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/vault/content/shorts/make-money-online.ts
git commit -m "feat: add make_money_online shorts scripts as the quality reference"
```

---

### Tasks 3 through 9: Remaining niche content

These seven tasks are independent and may run in parallel. Each touches exactly one file and none touch `index.ts`.

Every one of these tasks follows the identical six steps below. Substitute the file, export name, ID prefix, and assigned topics from that task's table.

**Shared steps for each content task:**

- [ ] **Step 1:** Read `docs/superpowers/plans/shorts-authoring-rubric.md` in full, then read `src/lib/vault/content/shorts/make-money-online.ts` as the quality reference, then read the matching existing Quora/Pinterest file `src/lib/vault/content/<niche>.ts` to absorb the niche's subject matter and voice.
- [ ] **Step 2:** Write all 5 scripts into the task's content file, one per format, using the assigned IDs and topics. Match the structure, field order, and voice of `s-mmo-01`. Vary `durationSeconds` within 25 to 45.
- [ ] **Step 3:** Run `npm run validate:shorts`. Expected: no error mentions your niche or your ID prefix. Errors for other unwritten niches are expected and are not yours to fix.
- [ ] **Step 4:** Run `npx tsc --noEmit`. Expected: no output, exit code 0.
- [ ] **Step 5:** Reread your five captions and confirm each contains `__LINK__` exactly once and that no spoken line reads a URL aloud.
- [ ] **Step 6:** Commit with `git add <your file>` and message `feat: add <niche> shorts scripts`.

#### Task 3: weight_loss

File: `src/lib/vault/content/shorts/weight-loss.ts` — export `WEIGHT_LOSS_SHORTS`

- `s-wl-01` — Three mistakes — why the scale stopped moving
- `s-wl-02` — Myth vs truth — eating after 8pm is not what caused the gain
- `s-wl-03` — POV story — you lost four pounds, then stalled for a month
- `s-wl-04` — Screen demo — reading a food label in twenty seconds
- `s-wl-05` — Before and after — week 1 to week 12 without a gym

Avoid any promised rate of loss. No before/after body imagery; the timeline is about habits, not bodies.

#### Task 4: health_fitness

File: `src/lib/vault/content/shorts/health-fitness.ts` — export `HEALTH_FITNESS_SHORTS`

- `s-hf-01` — Three mistakes — why you crash every afternoon
- `s-hf-02` — Myth vs truth — you do not need an hour a day
- `s-hf-03` — POV story — your knees complain on the stairs
- `s-hf-04` — Screen demo — building a ten-minute mobility routine
- `s-hf-05` — Before and after — day 1 to day 30 of daily walking

Defer to a clinician for pain, dizziness, and chest symptoms, the way the existing Quora answers do.

#### Task 5: beauty_skincare

File: `src/lib/vault/content/shorts/beauty-skincare.ts` — export `BEAUTY_SKINCARE_SHORTS`

- `s-bs-01` — Three mistakes — why your skin still breaks out
- `s-bs-02` — Myth vs truth — expensive does not mean effective
- `s-bs-03` — POV story — you tried six products this year and your skin is angrier
- `s-bs-04` — Screen demo — reading an ingredient list
- `s-bs-05` — Before and after — four weeks of a three-step routine

No claims about curing acne or reversing aging. Point to a dermatologist for cystic acne and reactions.

#### Task 6: relationships

File: `src/lib/vault/content/shorts/relationships.ts` — export `RELATIONSHIPS_SHORTS`

- `s-rel-01` — Three mistakes — why the same argument keeps repeating
- `s-rel-02` — Myth vs truth — talking more is not the fix
- `s-rel-03` — POV story — you two feel like roommates
- `s-rel-04` — Screen demo — a weekly check-in template
- `s-rel-05` — Before and after — week 1 to week 8 of one small change

Stay away from diagnosing a partner. Where a situation involves control, fear, or safety, point to a licensed counselor.

#### Task 7: tech_gadgets

File: `src/lib/vault/content/shorts/tech-gadgets.ts` — export `TECH_GADGETS_SHORTS`

- `s-tech-01` — Three mistakes — why your wifi is slow in half the house
- `s-tech-02` — Myth vs truth — paying for more speed rarely fixes it
- `s-tech-03` — POV story — every movie buffers at the worst moment
- `s-tech-04` — Screen demo — running a speed test and reading what it means
- `s-tech-05` — Before and after — the same room before and after moving the router

Name no brands or prices. Describe placement, bands, and interference generically.

#### Task 8: pets

File: `src/lib/vault/content/shorts/pets.ts` — export `PETS_SHORTS`

- `s-pet-01` — Three mistakes — why your puppy still bites hands
- `s-pet-02` — Myth vs truth — a crate is a den, not a punishment
- `s-pet-03` — POV story — your cat suddenly stopped using the box
- `s-pet-04` — Screen demo — what a three-minute training session looks like
- `s-pet-05` — Before and after — day 1 to day 14 of redirect training

Keep the existing content's safety lines: a male cat straining with no output is an emergency, and sudden behavior changes warrant a vet.

#### Task 9: home_garden

File: `src/lib/vault/content/shorts/home-garden.ts` — export `HOME_GARDEN_SHORTS`

- `s-hg-01` — Three mistakes — why your herbs keep dying indoors
- `s-hg-02` — Myth vs truth — you do not need a yard
- `s-hg-03` — POV story — you have killed basil three times
- `s-hg-04` — Screen demo — picking a windowsill spot by how light moves
- `s-hg-05` — Before and after — seed to first harvest on a windowsill

Make no medicinal claims about any plant.

---

### Task 10: ShortsScriptCard component

**Files:**
- Create: `src/components/vault/ShortsScriptCard.tsx`

**Interfaces:**
- Consumes: `ShortsScript` from `@/lib/vault/shorts-types`; `formatScriptForCopy`, `formatHashtags`, `platformLabel` from `@/lib/vault/shorts-format`; `CopyButton` from `@/components/dfy/copy-button`.
- Produces: `ShortsScriptCard` with props `{ script: ShortsScript; saved: boolean; used: boolean; onToggleSaved: () => void; onToggleUsed: () => void; disabled?: boolean }` — deliberately the same prop shape as `VaultEntryCard` so the page's handlers are interchangeable.

The `script` prop arrives with its affiliate link already substituted; this component never touches the link.

- [ ] **Step 1: Write the component**

`src/components/vault/ShortsScriptCard.tsx`:

```tsx
"use client";

import { Bookmark, Check, Clock } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton } from "@/components/dfy/copy-button";
import {
  formatHashtags,
  formatScriptForCopy,
  platformLabel,
} from "@/lib/vault/shorts-format";
import type { ShortsScript } from "@/lib/vault/shorts-types";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-text-muted">
      {children}
    </span>
  );
}

export function ShortsScriptCard({
  script,
  saved,
  used,
  onToggleSaved,
  onToggleUsed,
  disabled,
}: {
  script: ShortsScript;
  saved: boolean;
  used: boolean;
  onToggleSaved: () => void;
  onToggleUsed: () => void;
  disabled?: boolean;
}) {
  const hookEnd = script.beats[0]?.timecode.split("-")[0] ?? "0:00";

  return (
    <article className={clsx("flex flex-col gap-4 p-5 card-base", used && "opacity-80")}>
      <div className="flex flex-wrap items-center gap-2">
        {script.platforms.map((tag) => (
          <Badge key={tag}>{platformLabel(tag)}</Badge>
        ))}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
          <Clock size={12} />
          {script.durationSeconds}s
        </span>
        <span className="text-xs font-semibold text-text-muted">{script.format}</span>
        <span className="text-xs text-text-muted">{script.angle}</span>
      </div>

      <h3 className="ds-h5 leading-snug">{script.title}</h3>

      <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Hook · 0:00-{hookEnd}
        </p>
        <p className="mt-1 text-base font-semibold leading-snug text-text-primary">
          {script.hook}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {script.beats.map((beat, index) => (
          <li
            key={`${script.id}-beat-${index}`}
            className="border-l-2 border-[var(--border-subtle)] pl-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {beat.timecode}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-primary">{beat.voiceover}</p>
            <p className="mt-1 text-xs text-text-secondary">
              <span className="font-semibold">On screen:</span> {beat.onScreen}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              <span className="font-semibold">Show:</span> {beat.visual}
            </p>
          </li>
        ))}
      </ol>

      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Spoken CTA
          </dt>
          <dd className="text-text-secondary">{script.cta}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Caption
          </dt>
          <dd className="whitespace-pre-wrap text-text-secondary">{script.caption}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Hashtags
          </dt>
          <dd className="text-text-secondary">{formatHashtags(script.hashtags)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            How to shoot it
          </dt>
          <dd className="text-text-secondary">{script.visualStyle}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Sound
          </dt>
          <dd className="text-text-secondary">{script.soundNote}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <CopyButton
          text={formatScriptForCopy(script)}
          label="Copy full script"
          variant="primary"
        />
        <CopyButton text={script.caption} label="Copy caption" />
        <CopyButton text={formatHashtags(script.hashtags)} label="Copy hashtags" />
        <CopyButton text={script.hook} label="Copy hook" />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleSaved}
          className={clsx("btn-secondary text-xs", saved && "btn-chip-active")}
        >
          <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleUsed}
          className={clsx("btn-secondary text-xs", used && "btn-chip-active")}
        >
          <Check size={14} />
          {used ? "Used" : "Mark used"}
        </button>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Confirm the copy buttons do not mark scripts as used**

Reread the component and confirm no `CopyButton` triggers `onToggleUsed`. Marking used is always an explicit user action, matching `VaultEntryCard`. Do not "improve" this by auto-marking on copy.

- [ ] **Step 3: Type check and lint**

Run: `npx tsc --noEmit && npm run lint`

Expected: no output from tsc, and no new lint errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/vault/ShortsScriptCard.tsx
git commit -m "feat: add ShortsScriptCard for the Viral Shorts Vault"
```

---

### Task 11: Page, nav entry, and state API

**Files:**
- Create: `src/app/shorts-vault/page.tsx`
- Modify: `src/lib/premium-features.ts`
- Modify: `src/app/api/vault/state/route.ts`

**Interfaces:**
- Consumes: `getShortsForNiche`, `applyAffiliateLinkToScript`, `isShortsScriptId` from `@/lib/vault/shorts-catalog`; `ShortsPlatformTag` from `@/lib/vault/shorts-types`; `ShortsScriptCard` from `@/components/vault/ShortsScriptCard`; `VaultStateResponse` from `@/lib/vault/types`; `NichePicker`, `SelectableChip`, `Skeleton`, `InlineError`, `PageHeader`, `TutorialVideoSection`; `useSearch` from `@/context/SearchContext`.
- Produces: the `/shorts-vault` route and a `PREMIUM_FEATURES` entry pointing at it.

- [ ] **Step 1: Widen the state route's ID check**

In `src/app/api/vault/state/route.ts`, change the import and the one condition. The import line becomes:

```ts
import { isVaultEntryId } from "@/lib/vault/catalog";
import { isShortsScriptId } from "@/lib/vault/shorts-catalog";
```

And inside `POST`, the validation becomes:

```ts
    if (!entryId || (!isVaultEntryId(entryId) && !isShortsScriptId(entryId))) {
      return NextResponse.json({ error: "Valid entry required" }, { status: 400 });
    }
```

Change nothing else in this file. `GET` already returns every saved and used ID for the user, and each page looks up only the IDs it knows about.

- [ ] **Step 2: Register the nav entry**

In `src/lib/premium-features.ts`, add `Clapperboard` to the lucide import and append one entry to `PREMIUM_FEATURES`:

```ts
import { Scan, Sparkles, Rocket, Flame, Library, Clapperboard, type LucideIcon } from "lucide-react";
```

```ts
    {
        path: "/shorts-vault",
        label: "Viral Shorts Vault",
        description: "40 faceless scripts for TikTok, Reels, and Shorts.",
        icon: Clapperboard,
    },
```

- [ ] **Step 3: Write the page**

`src/app/shorts-vault/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { TutorialVideoSection } from "@/components/ui/tutorial-video-section";
import { NichePicker } from "@/components/ui/niche-picker";
import { SelectableChip } from "@/components/ui/selectable-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/InlineError";
import { ShortsScriptCard } from "@/components/vault/ShortsScriptCard";
import { useSearch } from "@/context/SearchContext";
import { APP_NICHES, type NicheId } from "@/lib/niches";
import { applyAffiliateLinkToScript, getShortsForNiche } from "@/lib/vault/shorts-catalog";
import type { ShortsPlatformTag } from "@/lib/vault/shorts-types";
import type { VaultStateResponse } from "@/lib/vault/types";

const NICHE_KEY = "acw.shorts-vault.niche";
const PLATFORM_KEY = "acw.shorts-vault.platform";

type PlatformFilter = ShortsPlatformTag | "all";

const PLATFORM_OPTIONS: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tiktok", label: "TikTok" },
  { value: "reels", label: "Reels" },
  { value: "shorts", label: "Shorts" },
];

function isNicheId(value: string): value is NicheId {
  return APP_NICHES.some((n) => n.id === value);
}

function isPlatformFilter(value: string): value is PlatformFilter {
  return PLATFORM_OPTIONS.some((option) => option.value === value);
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

function readStoredPlatform(): PlatformFilter {
  if (typeof window === "undefined") return "all";
  try {
    const raw = localStorage.getItem(PLATFORM_KEY);
    if (raw && isPlatformFilter(raw)) return raw;
  } catch {
    // ignore
  }
  return "all";
}

export default function ShortsVaultPage() {
  const { affiliateLink } = useSearch();
  const [niche, setNiche] = useState<NicheId>("make_money_online");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [hideUsed, setHideUsed] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setNiche(readStoredNiche());
    setPlatform(readStoredPlatform());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(NICHE_KEY, niche);
      localStorage.setItem(PLATFORM_KEY, platform);
    } catch {
      // ignore
    }
  }, [hydrated, niche, platform]);

  const loadState = useCallback(async () => {
    setError(null);
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    loadState();
  }, [hydrated, loadState]);

  const nicheScripts = useMemo(
    () =>
      getShortsForNiche(niche, platform).map((script) =>
        applyAffiliateLinkToScript(script, affiliateLink || ""),
      ),
    [niche, platform, affiliateLink],
  );

  const nicheTotal = useMemo(() => getShortsForNiche(niche).length, [niche]);
  const usedCount = useMemo(
    () => getShortsForNiche(niche).filter((script) => used.has(script.id)).length,
    [niche, used],
  );

  const visibleScripts = useMemo(
    () =>
      nicheScripts.filter((script) => {
        if (savedOnly && !saved.has(script.id)) return false;
        if (hideUsed && used.has(script.id)) return false;
        return true;
      }),
    [nicheScripts, savedOnly, hideUsed, saved, used],
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6 pb-16"
    >
      <PageHeader
        eyebrow="PREMIUM"
        title={
          <>
            Viral Shorts <span className="text-gradient">Vault</span>
          </>
        }
        subtitle="40 faceless scripts for TikTok, Reels, and Shorts. Pick one, read it, post it. No camera needed."
      />

      <TutorialVideoSection
        title="How the Shorts Vault Works"
        description="Choose a niche, copy a full script with its hook, beats, caption, and hashtags, then record it faceless with stock footage or a screen recording."
      />

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">1. Choose your niche</h2>
        <NichePicker value={niche} onChange={setNiche} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">2. Filter the library</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((option) => (
            <SelectableChip
              key={option.value}
              label={option.label}
              selected={platform === option.value}
              onClick={() => setPlatform(option.value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectableChip
            label="Saved only"
            selected={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
          />
          <SelectableChip
            label="Hide used"
            selected={hideUsed}
            onClick={() => setHideUsed((v) => !v)}
          />
        </div>
        <p className="text-sm text-text-muted">
          {usedCount} of {nicheTotal} used
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="ds-h5">3. Copy and film</h2>

        {error ? (
          <div className="flex flex-col gap-3">
            <InlineError message={error} />
            <button type="button" className="btn-secondary w-fit" onClick={loadState}>
              Try again
            </button>
          </div>
        ) : null}

        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}

        {!loading && visibleScripts.length === 0 && (
          <div className="card-base p-8 text-center text-sm text-text-muted">
            No scripts match these filters. Try another niche or clear Saved only / Hide used.
          </div>
        )}

        {!loading && visibleScripts.length > 0 && (
          <div className="flex flex-col gap-4">
            {visibleScripts.map((script) => (
              <ShortsScriptCard
                key={script.id}
                script={script}
                saved={saved.has(script.id)}
                used={used.has(script.id)}
                disabled={pendingId === script.id}
                onToggleSaved={() => patchState(script.id, { saved: !saved.has(script.id) })}
                onToggleUsed={() => patchState(script.id, { used: !used.has(script.id) })}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
```

- [ ] **Step 4: Type check and lint**

Run: `npx tsc --noEmit && npm run lint`

Expected: no output from tsc, no new lint errors.

- [ ] **Step 5: Build**

Run: `npm run build`

Expected: succeeds, and the route list includes `/shorts-vault`.

- [ ] **Step 6: Commit**

```bash
git add src/app/shorts-vault/page.tsx src/lib/premium-features.ts src/app/api/vault/state/route.ts
git commit -m "feat: add Viral Shorts Vault page, nav entry, and shorts state support"
```

---

### Task 12: Full verification pass

**Files:** none created or modified unless a check fails.

- [ ] **Step 1: Validate both content sets**

Run: `npm run validate:shorts && npm run validate:vault`

Expected:
```
Shorts validation passed: 40 scripts across 8 niches.
Vault validation passed: 160 entries across 8 niches.
```

The second line passing proves shorts never leaked into `VAULT_ENTRIES`.

- [ ] **Step 2: Type check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`

Expected: all three clean.

- [ ] **Step 3: Browser smoke on `/shorts-vault`**

Start `npm run dev`, sign in, and confirm each of these:

- The page renders, and "Viral Shorts Vault" appears in the desktop sidebar under Premium Features, in the mobile bottom-nav More sheet, and in the dashboard Premium Upgrades widget.
- Each niche shows 5 scripts. Every one shows a hook block, timecoded beats, CTA, caption, hashtags, shoot notes, and sound notes.
- Platform chips filter correctly, and a script tagged for several platforms appears under each of its tags.
- Reloading the page preserves the selected niche and platform.
- With an affiliate link set in the app, the link appears inside the caption. With it cleared, the caption reads cleanly with no leftover `__LINK__` and no double spaces.
- Copy full script pastes the documented layout. Copy caption, Copy hashtags, and Copy hook each copy only their field.
- Save and Mark used survive a reload. The "X of Y used" counter updates. Saved only and Hide used filter correctly.

- [ ] **Step 4: Confirm the existing vault is unaffected**

- `/vault` still lists only Quora and Pinterest entries under its All filter.
- Saving an entry on `/vault` and a script on `/shorts-vault` both persist, and neither appears on the other page.

- [ ] **Step 5: Confirm graceful degradation**

In devtools, block `/api/vault/state` and reload `/shorts-vault`. Expected: the inline error appears and scrolls into view, and scripts still render and copy normally.

- [ ] **Step 6: Commit any fixes**

If any step required a change, commit it with a message describing the fix. If nothing changed, there is nothing to commit.

---

## Notes for the executing agent

- Tasks 3 through 9 are independent and safe to dispatch in parallel. Tasks 1, 2, 10, 11, and 12 are sequential.
- The content tasks are the bulk of the work. Resist the urge to write all seven niches in one pass; the per-niche boundary exists so a reviewer can reject one niche's voice without discarding the rest.
- Do not stage `src/lib/vault/content/*.ts`, `src/lib/vault/types.ts`, `src/lib/vault/catalog.ts`, `src/app/vault/`, `src/components/vault/VaultEntryCard.tsx`, or `supabase/migrations/20260812000002_vault_entry_states.sql`. Those belong to the pre-existing uncommitted vault work, which the user chose to leave uncommitted. Only `src/app/api/vault/state/route.ts` gets committed in Task 11, and only because this feature modifies it.
