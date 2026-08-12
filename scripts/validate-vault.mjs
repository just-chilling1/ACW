import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "src", "lib", "vault", "content");

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

const MIN_ANSWER_WORDS = 180;
const MAX_PIN_TITLE = 100;
const MAX_PIN_DESCRIPTION = 500;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countPlaceholder(text) {
  return (text.match(/__LINK__/g) || []).length;
}

function normalizeCopy(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractBalanced(source, startIdx, openChar, closeChar) {
  if (source[startIdx] !== openChar) return null;
  let i = startIdx + 1;
  let depth = 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === "\\" && openChar === "`") {
      i += 2;
      continue;
    }
    if (ch === openChar && openChar !== closeChar) depth += 1;
    else if (ch === closeChar) {
      if (openChar === closeChar) {
        depth -= 1;
      } else {
        depth -= 1;
      }
    }
    i += 1;
  }
  if (depth !== 0) return null;
  return { value: source.slice(startIdx + 1, i - 1), end: i };
}

function extractStringAfter(block, key) {
  const re = new RegExp(`${key}:\\s*`);
  const match = re.exec(block);
  if (!match) return null;
  const idx = match.index + match[0].length;
  const ch = block[idx];
  if (ch === "`" || ch === '"' || ch === "'") {
    const close = ch;
    const extracted = extractBalanced(block, idx, close, close);
    return extracted ? extracted.value : null;
  }
  return null;
}

function parseEntries(source, fileName) {
  const entries = [];
  const objectRe = /\n  \{\n([\s\S]*?)\n  \},?/g;
  let match;
  while ((match = objectRe.exec(source))) {
    const block = match[1];
    const id = extractStringAfter(block, "id");
    const platform = extractStringAfter(block, "platform");
    const nicheId = extractStringAfter(block, "nicheId");
    if (!id || !platform || !nicheId) {
      throw new Error(`${fileName}: could not parse an entry block`);
    }
    const entry = { id, platform, nicheId, fileName };
    if (platform === "quora") {
      entry.answer = extractStringAfter(block, "answer") ?? "";
    } else if (platform === "pinterest") {
      entry.pinTitle = extractStringAfter(block, "pinTitle") ?? "";
      entry.pinDescription = extractStringAfter(block, "pinDescription") ?? "";
    }
    entries.push(entry);
  }
  return entries;
}

const errors = [];
const files = readdirSync(CONTENT_DIR).filter(
  (name) => name.endsWith(".ts") && name !== "index.ts",
);

const allEntries = [];
for (const fileName of files) {
  const source = readFileSync(join(CONTENT_DIR, fileName), "utf8").replace(/\r\n/g, "\n");
  allEntries.push(...parseEntries(source, fileName));
}

if (allEntries.length === 0) {
  errors.push("No vault entries parsed.");
}

const ids = allEntries.map((e) => e.id);
const seenIds = new Set();
for (const id of ids) {
  if (seenIds.has(id)) errors.push(`Duplicate id: ${id}`);
  seenIds.add(id);
}

const byNiche = new Map();
for (const entry of allEntries) {
  if (!byNiche.has(entry.nicheId)) byNiche.set(entry.nicheId, []);
  byNiche.get(entry.nicheId).push(entry);
}

for (const niche of EXPECTED_NICHES) {
  const list = byNiche.get(niche) || [];
  const quora = list.filter((e) => e.platform === "quora");
  const pins = list.filter((e) => e.platform === "pinterest");
  if (quora.length !== 10) {
    errors.push(`${niche}: expected 10 Quora entries, found ${quora.length}`);
  }
  if (pins.length !== 10) {
    errors.push(`${niche}: expected 10 Pinterest entries, found ${pins.length}`);
  }
}

for (const nicheId of byNiche.keys()) {
  if (!EXPECTED_NICHES.includes(nicheId)) {
    errors.push(`Unexpected nicheId: ${nicheId}`);
  }
}

const copySeen = new Map();
for (const entry of allEntries) {
  if (entry.platform === "quora") {
    const links = countPlaceholder(entry.answer);
    if (links !== 1) {
      errors.push(`${entry.id}: answer must contain __LINK__ exactly once (found ${links})`);
    }
    const words = wordCount(entry.answer);
    if (words < MIN_ANSWER_WORDS) {
      errors.push(`${entry.id}: answer has ${words} words, need at least ${MIN_ANSWER_WORDS}`);
    }
    const key = normalizeCopy(entry.answer);
    if (copySeen.has(key)) {
      errors.push(`${entry.id}: duplicate answer text (same as ${copySeen.get(key)})`);
    } else {
      copySeen.set(key, entry.id);
    }
  } else if (entry.platform === "pinterest") {
    const links = countPlaceholder(entry.pinDescription);
    if (links !== 1) {
      errors.push(`${entry.id}: pinDescription must contain __LINK__ exactly once (found ${links})`);
    }
    if (entry.pinTitle.length > MAX_PIN_TITLE) {
      errors.push(`${entry.id}: pinTitle is ${entry.pinTitle.length} chars, max ${MAX_PIN_TITLE}`);
    }
    if (entry.pinDescription.length > MAX_PIN_DESCRIPTION) {
      errors.push(
        `${entry.id}: pinDescription is ${entry.pinDescription.length} chars, max ${MAX_PIN_DESCRIPTION}`,
      );
    }
    const key = normalizeCopy(entry.pinDescription);
    if (copySeen.has(key)) {
      errors.push(`${entry.id}: duplicate pin description (same as ${copySeen.get(key)})`);
    } else {
      copySeen.set(key, entry.id);
    }
  } else {
    errors.push(`${entry.id}: unknown platform ${entry.platform}`);
  }
}

if (errors.length) {
  console.error(`Vault validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Vault validation passed: ${allEntries.length} entries across ${EXPECTED_NICHES.length} niches.`,
);
