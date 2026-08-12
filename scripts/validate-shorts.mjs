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
