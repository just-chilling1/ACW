import { callChatGPT } from "@/lib/llm";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import type { OfferSnapshot } from "@/lib/dfy/types";
import type { NicheId } from "@/lib/niches";
import { APP_NICHES } from "@/lib/niches";
import { sanitizeContent, SAFETY_RULES_PROMPT } from "@/lib/instant/safety";
import {
  buildFallbackPinterestPins,
  buildFallbackQuoraAnswers,
  type GeneratedPinterest,
  type GeneratedQuora,
} from "@/lib/vault/kit-fallbacks";

function nicheLabel(nicheId: string): string {
  return APP_NICHES.find((n) => n.id === nicheId)?.label || nicheId.replace(/_/g, " ");
}

function safeContent(text: string): string {
  return sanitizeContent(String(text || ""));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function generateQuoraAnswers(
  snapshot: OfferSnapshot,
  offerUrl: string,
  nicheId: NicheId | string,
): Promise<GeneratedQuora[]> {
  const niche = nicheLabel(nicheId);
  const prompt = `Create 6 ready-to-post Quora answers for promoting "${snapshot.productName}" in the "${niche}" niche.
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Benefits: ${snapshot.primaryBenefits.join(", ")}
Pain points: ${snapshot.painPoints.join(", ")}
Strongest angle: ${snapshot.strongestAngle}

Return ONLY JSON array:
[{"question":"...","searchQuery":"...","answer":"...","topics":["..."],"angle":"...","why":"..."}]

Rules:
- Each item is a realistic Quora question someone in ${niche} would ask, plus a helpful answer.
- Answer should be ≥180 words when possible. Lead with real help.
- Place the affiliate URL once in the last third as a soft resource continuation (not a hard sell).
- Vary angles: problem/solution, beginner, mistake, checklist, comparison, FAQ.
- Natural, non-spammy, no fake testimonials or guaranteed results.
- topics: 3-5 short topic strings.
${SAFETY_RULES_PROMPT}`;

  try {
    const raw = await callChatGPT([{ role: "user", content: prompt }]);
    const parsed = parseJsonFromLlm<GeneratedQuora[]>(raw, []);
    const cleaned = parsed
      .map((item) => ({
        question: safeContent(item.question),
        searchQuery: safeContent(item.searchQuery),
        answer: safeContent(item.answer),
        topics: Array.isArray(item.topics)
          ? item.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, 5)
          : [niche],
        angle: safeContent(item.angle) || "problem/solution",
        why: safeContent(item.why) || "Offer-aware Quora answer",
      }))
      .filter((item) => item.question && item.answer && wordCount(item.answer) >= 80);

    if (cleaned.length >= 4) {
      const fallbacks = buildFallbackQuoraAnswers(snapshot, offerUrl, nicheId);
      while (cleaned.length < 6) {
        cleaned.push(fallbacks[cleaned.length % fallbacks.length]);
      }
      return cleaned.slice(0, 6);
    }
  } catch {
    /* fallback */
  }

  return buildFallbackQuoraAnswers(snapshot, offerUrl, nicheId);
}

export async function generatePinterestPins(
  snapshot: OfferSnapshot,
  offerUrl: string,
  nicheId: NicheId | string,
): Promise<GeneratedPinterest[]> {
  const niche = nicheLabel(nicheId);
  const prompt = `Create 6 ready-to-post Pinterest pins for promoting "${snapshot.productName}" in the "${niche}" niche.
Offer URL: ${offerUrl}
Target audience: ${snapshot.targetAudience}
Main promise: ${snapshot.mainPromise}
Benefits: ${snapshot.primaryBenefits.join(", ")}
Pain points: ${snapshot.painPoints.join(", ")}

Return ONLY JSON array:
[{"pinTitle":"...","pinDescription":"...","boardName":"...","imageConcept":"...","keywords":["..."],"angle":"...","why":"..."}]

Rules:
- pinTitle ≤100 chars, pinDescription ≤500 chars.
- Include the affiliate URL once in the description as a soft next step.
- keywords: 4-8 short SEO-ish terms.
- Vary angles: curiosity, educational, checklist, beginner, resource, story-style.
- Useful first; not spammy. No fake claims.
${SAFETY_RULES_PROMPT}`;

  try {
    const raw = await callChatGPT([{ role: "user", content: prompt }]);
    const parsed = parseJsonFromLlm<GeneratedPinterest[]>(raw, []);
    const cleaned = parsed
      .map((item) => ({
        pinTitle: safeContent(item.pinTitle).slice(0, 100),
        pinDescription: safeContent(item.pinDescription).slice(0, 500),
        boardName: safeContent(item.boardName) || `${niche} Ideas`,
        imageConcept: safeContent(item.imageConcept) || `Clean ${niche} tip pin`,
        keywords: Array.isArray(item.keywords)
          ? item.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
          : [niche.toLowerCase(), "tips", "ideas", "beginner"],
        angle: safeContent(item.angle) || "educational",
        why: safeContent(item.why) || "Offer-aware Pinterest pin",
      }))
      .filter((item) => item.pinTitle && item.pinDescription && item.keywords.length >= 4);

    if (cleaned.length >= 4) {
      const fallbacks = buildFallbackPinterestPins(snapshot, offerUrl, nicheId);
      while (cleaned.length < 6) {
        cleaned.push(fallbacks[cleaned.length % fallbacks.length]);
      }
      return cleaned.slice(0, 6);
    }
  } catch {
    /* fallback */
  }

  return buildFallbackPinterestPins(snapshot, offerUrl, nicheId);
}
