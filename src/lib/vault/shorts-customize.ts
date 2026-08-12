import { analyzeOffer } from "@/lib/dfy/offer-analyze";
import { parseJsonFromLlm } from "@/lib/dfy/parse-json";
import type { OfferSnapshot } from "@/lib/dfy/types";
import { callChatGPT } from "@/lib/llm";
import type { NicheId } from "@/lib/niches";
import { isValidPackScript } from "@/lib/vault/shorts-packs";
import type { ShortsScript } from "@/lib/vault/shorts-types";

function buildRewritePrompt(
  seed: ShortsScript,
  offer: OfferSnapshot,
  affiliateLink: string,
): string {
  return `Rewrite this faceless short-form video script so it promotes THIS specific offer while keeping the same structure.

OFFER
- Product: ${offer.productName}
- Promise: ${offer.mainPromise}
- Audience: ${offer.targetAudience}
- Strongest angle: ${offer.strongestAngle}
- Pain points: ${offer.painPoints.join("; ")}
- Benefits: ${offer.primaryBenefits.join("; ")}
- Affiliate URL (must appear exactly once in caption only): ${affiliateLink}

SEED SCRIPT (JSON)
${JSON.stringify(seed, null, 2)}

Return ONLY JSON matching this shape:
{
  "id": "${seed.id}",
  "nicheId": "${seed.nicheId}",
  "angle": string,
  "format": "${seed.format}",
  "title": string,
  "platforms": ${JSON.stringify(seed.platforms)},
  "durationSeconds": ${seed.durationSeconds},
  "hook": string,
  "beats": [{ "timecode": string, "voiceover": string, "onScreen": string, "visual": string }],
  "cta": string,
  "caption": string,
  "hashtags": string[],
  "visualStyle": string,
  "soundNote": string
}

Rules:
- Keep id, nicheId, format, platforms, durationSeconds exactly as given.
- Keep the same number of beats and the same timecode strings as the seed.
- hook max 140 characters. Make it specific to this offer's audience/pain.
- Rewrite voiceovers, on-screen text, visuals, title, angle, CTA, caption, hashtags, visualStyle, soundNote for this offer.
- Faceless only: stock footage, screen recording, or text on screen.
- Spoken fields (hook, voiceover, onScreen, cta) must NOT contain URLs or "__LINK__".
- cta is a spoken bio close that references this offer softly (no raw URL).
- caption must include the affiliate URL exactly once as plain text, and no "__LINK__".
- 3-8 hashtags, no leading "#".
- No fake testimonials, guarantees, or medical/income promises.
- Plain, concrete language.`;
}

function mergeRewrite(seed: ShortsScript, partial: Partial<ShortsScript>): ShortsScript {
  return {
    ...seed,
    angle: typeof partial.angle === "string" && partial.angle.trim() ? partial.angle.trim() : seed.angle,
    title: typeof partial.title === "string" && partial.title.trim() ? partial.title.trim() : seed.title,
    hook: typeof partial.hook === "string" && partial.hook.trim() ? partial.hook.trim() : seed.hook,
    beats: Array.isArray(partial.beats) && partial.beats.length === seed.beats.length
      ? partial.beats.map((beat, index) => ({
          timecode: seed.beats[index].timecode,
          voiceover: typeof beat?.voiceover === "string" ? beat.voiceover.trim() : seed.beats[index].voiceover,
          onScreen: typeof beat?.onScreen === "string" ? beat.onScreen.trim() : seed.beats[index].onScreen,
          visual: typeof beat?.visual === "string" ? beat.visual.trim() : seed.beats[index].visual,
        }))
      : seed.beats,
    cta: typeof partial.cta === "string" && partial.cta.trim() ? partial.cta.trim() : seed.cta,
    caption: typeof partial.caption === "string" && partial.caption.trim() ? partial.caption.trim() : seed.caption,
    hashtags: Array.isArray(partial.hashtags) && partial.hashtags.length
      ? partial.hashtags.map((tag) => String(tag).replace(/^#/, "").trim()).filter(Boolean).slice(0, 8)
      : seed.hashtags,
    visualStyle:
      typeof partial.visualStyle === "string" && partial.visualStyle.trim()
        ? partial.visualStyle.trim()
        : seed.visualStyle,
    soundNote:
      typeof partial.soundNote === "string" && partial.soundNote.trim()
        ? partial.soundNote.trim()
        : seed.soundNote,
    id: seed.id,
    nicheId: seed.nicheId,
    format: seed.format,
    platforms: seed.platforms,
    durationSeconds: seed.durationSeconds,
  };
}

function fallbackOfferAwareScript(
  seed: ShortsScript,
  offer: OfferSnapshot,
  affiliateLink: string,
): ShortsScript {
  const product = offer.productName || "this resource";
  const captionBase = seed.caption.includes("__LINK__")
    ? seed.caption.replace("__LINK__", affiliateLink)
    : `${seed.caption.trim()} Learn more: ${affiliateLink}`;

  return {
    ...seed,
    angle: offer.strongestAngle || seed.angle,
    title: `${seed.title} (${product})`,
    hook: `If ${offer.targetAudience.toLowerCase()} keeps hitting the same wall, this is the pattern most people miss.`.slice(
      0,
      140,
    ),
    cta: `I put the ${product} walkthrough in my bio if you want the steps written out.`,
    caption: captionBase.includes(affiliateLink)
      ? captionBase
      : `${captionBase} ${affiliateLink}`,
    hashtags: seed.hashtags,
  };
}

async function rewriteOnce(
  seed: ShortsScript,
  offer: OfferSnapshot,
  affiliateLink: string,
): Promise<ShortsScript> {
  const raw = await callChatGPT([
    { role: "user", content: buildRewritePrompt(seed, offer, affiliateLink) },
  ]);
  const parsed = parseJsonFromLlm<Partial<ShortsScript>>(raw, {});
  return mergeRewrite(seed, parsed);
}

export async function customizeShortsScript(opts: {
  seed: ShortsScript;
  affiliateLink: string;
  nicheId: NicheId;
}): Promise<{ script: ShortsScript; offerSnapshot: OfferSnapshot }> {
  const { seed, affiliateLink, nicheId } = opts;

  let offer: OfferSnapshot;
  try {
    offer = await analyzeOffer(affiliateLink, nicheId);
  } catch {
    offer = {
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
      promotionChannels: ["TikTok", "Reels", "Shorts"],
      recommendedAudienceMode: nicheId,
      promotionStyle: "Educational + problem/solution",
    };
  }

  const validate = (script: ShortsScript) =>
    isValidPackScript(script, {
      affiliateLink,
      sourceScriptId: seed.id,
      nicheId,
    });

  try {
    let rewritten = await rewriteOnce(seed, offer, affiliateLink);
    if (!validate(rewritten)) {
      rewritten = await rewriteOnce(seed, offer, affiliateLink);
    }
    if (!validate(rewritten)) {
      const fallback = fallbackOfferAwareScript(seed, offer, affiliateLink);
      if (!validate(fallback)) {
        throw new Error("Customized script failed validation");
      }
      return { script: fallback, offerSnapshot: offer };
    }
    return { script: rewritten, offerSnapshot: offer };
  } catch (error) {
    const fallback = fallbackOfferAwareScript(seed, offer, affiliateLink);
    if (!validate(fallback)) {
      throw error instanceof Error ? error : new Error("Customize failed");
    }
    return { script: fallback, offerSnapshot: offer };
  }
}
