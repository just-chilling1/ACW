import type { OfferSnapshot } from "@/lib/dfy/types";
import type { SourceType, TrafficSource } from "./sources";
import type { SubmissionPack, SubmissionPackField } from "./types";

function linkify(text: string, url: string): string {
  return text.replace(/\{LINK\}/g, url || "[YOUR_LINK]");
}

function productBits(snapshot?: OfferSnapshot) {
  const productName = snapshot?.productName || "this resource";
  const promise = snapshot?.mainPromise || "practical results";
  const audience = snapshot?.targetAudience || "people in this niche";
  const angle = snapshot?.strongestAngle || "";
  return { productName, promise, audience, angle };
}

function buildCopyAll(fields: SubmissionPackField[]): string {
  return fields
    .filter((f) => f.value.trim())
    .map((f) => `${f.label}:\n${f.value}`)
    .join("\n\n");
}

function defaultTips(type: SourceType): string[] {
  switch (type) {
    case "Forum":
      return [
        "Be helpful first — don't drop a bare link.",
        "Add your link in your signature or naturally in a reply.",
        "Avoid posting the same message in every thread.",
      ];
    case "Q&A":
      return [
        "Write a real answer people would upvote.",
        "Mention your link as an optional resource, not the whole answer.",
        "Skip questions that don't match your niche.",
      ];
    case "Directory":
      return [
        "Fill every required field accurately.",
        "Use clear keywords that match what buyers search.",
        "Save a confirmation email if they send one.",
      ];
    case "Social":
      return [
        "Lead with value, not a hard sell.",
        "Follow each community's posting rules.",
        "One strong post beats five spammy ones.",
      ];
    case "Blog":
      return [
        "Write for the reader first; place the link once where it helps.",
        "Use a clear title people would click.",
        "Publish, then share the article on one social channel.",
      ];
    case "Classified":
      return [
        "Keep the ad honest and specific.",
        "Repost only as often as the site allows.",
        "Don't promise guaranteed income or results.",
      ];
    default:
      return ["Be helpful.", "Follow the site rules.", "Don't spam."];
  }
}

function fieldsForType(
  type: SourceType,
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
): SubmissionPackField[] {
  const { productName, promise, audience, angle } = productBits(snapshot);
  const blurb = linkify(source.description, offerUrl);
  const niche = source.niche.toLowerCase();

  switch (type) {
    case "Forum":
      return [
        {
          key: "signature",
          label: "Profile bio / signature",
          value: `${productName} — ${promise}. Free guide: ${offerUrl}`,
        },
        {
          key: "replyText",
          label: "Reply text",
          value: `I've been digging into this too. ${blurb}${angle ? ` ${angle}` : ""} Happy to share what helped.`,
        },
        {
          key: "threadTitle",
          label: "New thread title",
          value: `What actually helped with ${niche}? Sharing a free guide`,
        },
        {
          key: "threadBody",
          label: "New thread body",
          value: `Hey everyone — I put together notes on ${promise.toLowerCase()} for ${audience.toLowerCase()}.\n\n${blurb}\n\nCurious what else has worked for you.`,
        },
      ];
    case "Q&A":
      return [
        {
          key: "answer",
          label: "Your answer",
          value: `Here's what I'd focus on for ${niche}:\n\n1) Start with one clear habit or step.\n2) Track what works for a week.\n3) Use a simple guide if you want the full breakdown.\n\n${blurb}${angle ? `\n\n${angle}` : ""}`,
        },
        {
          key: "profileBlurb",
          label: "Profile blurb",
          value: `Helping ${audience.toLowerCase()} with ${niche}. Free resource: ${offerUrl}`,
        },
      ];
    case "Directory":
      return [
        {
          key: "listingTitle",
          label: "Listing title",
          value: `${productName} — ${promise}`.slice(0, 120),
        },
        {
          key: "shortDescription",
          label: "Short description",
          value: blurb.slice(0, 200),
        },
        {
          key: "longDescription",
          label: "Long description",
          value: [
            blurb,
            `Built for ${audience.toLowerCase()}.`,
            angle,
            `Learn more: ${offerUrl}`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        {
          key: "keywords",
          label: "Keywords",
          value: [niche, productName, "free guide", source.type.toLowerCase()]
            .join(", ")
            .toLowerCase(),
        },
      ];
    case "Social":
      return [
        {
          key: "postText",
          label: "Post / pin text",
          value: blurb,
        },
        {
          key: "caption",
          label: "Caption",
          value: `${promise} — for ${audience.toLowerCase()}. Details: ${offerUrl}`,
        },
        {
          key: "profileBio",
          label: "Profile bio line",
          value: `${productName} | ${promise} → ${offerUrl}`,
        },
      ];
    case "Blog":
      return [
        {
          key: "articleTitle",
          label: "Article title",
          value: `How ${audience} can get ${promise.toLowerCase()} (without the fluff)`,
        },
        {
          key: "intro",
          label: "Intro paragraph",
          value: `If you're working on ${niche}, you don't need another complicated system. Here's a practical path toward ${promise.toLowerCase()} — and a free resource if you want the full steps: ${offerUrl}`,
        },
        {
          key: "linkPlacement",
          label: "Where to put the link",
          value: `Place your link once near the end: "If you want the full walkthrough, I put it here: ${offerUrl}"`,
        },
        {
          key: "authorBio",
          label: "Author bio",
          value: `I write about ${niche} for ${audience.toLowerCase()}. Free guide: ${offerUrl}`,
        },
      ];
    case "Classified":
      return [
        {
          key: "adTitle",
          label: "Ad title",
          value: `${productName} — free guide for ${niche}`.slice(0, 70),
        },
        {
          key: "adBody",
          label: "Ad body",
          value: `${blurb}\n\nBuilt for ${audience.toLowerCase()}.\n\nDetails: ${offerUrl}`,
        },
      ];
    default:
      return [
        { key: "headline", label: "Headline", value: `${productName} — ${promise}` },
        { key: "description", label: "Description", value: blurb },
      ];
  }
}

export function buildSubmissionPack(
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
  whyOverride?: string,
): SubmissionPack {
  const fields = fieldsForType(source.type, source, offerUrl, snapshot);
  const whyThisSource =
    whyOverride ||
    `${source.name} fits ${source.niche} and usually takes about ${source.time.replace(/minutes?/i, "min")}.`;

  return {
    version: 2,
    sourceType: source.type,
    fields,
    copyAll: buildCopyAll(fields),
    whyThisSource,
    tips: defaultTips(source.type),
    estimatedTraffic: source.traffic,
    generatedBy: "fallback",
  };
}

function normalizeFields(
  type: SourceType,
  parsed: Record<string, unknown>,
  fallback: SubmissionPack,
): SubmissionPackField[] {
  const byKey = new Map(fallback.fields.map((f) => [f.key, f]));
  const keys = fallback.fields.map((f) => f.key);
  return keys.map((key) => {
    const label = byKey.get(key)?.label || key;
    const raw = parsed[key];
    const value = typeof raw === "string" && raw.trim() ? raw.trim() : byKey.get(key)?.value || "";
    return { key, label, value };
  });
}

export function isSubmissionPack(value: unknown): value is SubmissionPack {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 2 && Array.isArray(v.fields);
}

/** Accept legacy thin kits stored on activations. */
export function coerceSubmissionPack(
  value: unknown,
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
): SubmissionPack {
  if (isSubmissionPack(value)) return value;
  const fallback = buildSubmissionPack(source, offerUrl, snapshot);
  if (!value || typeof value !== "object") return fallback;

  const legacy = value as Record<string, unknown>;
  const headline = typeof legacy.headline === "string" ? legacy.headline : "";
  const shortDescription =
    typeof legacy.shortDescription === "string" ? legacy.shortDescription : "";
  const longDescription =
    typeof legacy.longDescription === "string" ? legacy.longDescription : "";
  const copyAll = typeof legacy.copyAll === "string" ? legacy.copyAll : "";

  if (!headline && !shortDescription) return fallback;

  const fields: SubmissionPackField[] = [
    { key: "headline", label: "Headline", value: headline || fallback.fields[0]?.value || "" },
    {
      key: "shortDescription",
      label: "Description",
      value: shortDescription || fallback.fields[1]?.value || "",
    },
  ];
  if (longDescription) {
    fields.push({ key: "longDescription", label: "Long description", value: longDescription });
  }

  return {
    ...fallback,
    fields,
    copyAll: copyAll || buildCopyAll(fields),
    generatedBy: "fallback",
  };
}

export async function generateSubmissionPackWithAi(
  source: TrafficSource,
  offerUrl: string,
  snapshot?: OfferSnapshot,
  whyOverride?: string,
): Promise<SubmissionPack> {
  const fallback = buildSubmissionPack(source, offerUrl, snapshot, whyOverride);
  try {
    const { callChatGPT } = await import("@/lib/llm");
    const { productName, promise, audience, angle } = productBits(snapshot);
    const fieldKeys = fallback.fields.map((f) => `"${f.key}": string`).join(",\n  ");

    const prompt = `Write ready-to-paste submission copy for this traffic source. Return ONLY JSON:
{
  ${fieldKeys},
  "whyThisSource": string (one plain sentence),
  "tips": string[2-3] (short, non-technical, anti-spam)
}
Rules:
- Include the URL ${offerUrl} where a link belongs
- Sound helpful and human, not salesy
- Match the platform type: ${source.type}
- No guarantees of income or medical results
Source: ${source.name}
Niche: ${source.niche}
Product: ${productName}
Promise: ${promise}
Audience: ${audience}
Angle: ${angle}
Template seed: ${linkify(source.description, offerUrl)}`;

    const raw = await callChatGPT([{ role: "user", content: prompt }]);
    const { parseJsonFromLlm } = await import("@/lib/dfy/parse-json");
    const parsed = parseJsonFromLlm<Record<string, unknown>>(raw, {});
    if (!parsed || typeof parsed !== "object") return fallback;

    const fields = normalizeFields(source.type, parsed, fallback);
    if (!fields.some((f) => f.value.trim())) return fallback;

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 3)
      : fallback.tips;
    const whyThisSource =
      typeof parsed.whyThisSource === "string" && parsed.whyThisSource.trim()
        ? parsed.whyThisSource.trim()
        : fallback.whyThisSource;

    return {
      version: 2,
      sourceType: source.type,
      fields,
      copyAll: buildCopyAll(fields),
      whyThisSource,
      tips: tips.length > 0 ? tips : fallback.tips,
      estimatedTraffic: source.traffic,
      generatedBy: "ai",
    };
  } catch {
    return fallback;
  }
}

export function weekOneSourceIds(planDays: { sourceIds: string[] }[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const day of planDays) {
    for (const id of day.sourceIds || []) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}
