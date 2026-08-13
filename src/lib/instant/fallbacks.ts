import type { OfferSnapshot } from "@/lib/dfy/types";
import type { QuickPlanDay } from "./types";

export function buildManualOfferSnapshot(description: string, niche?: string): OfferSnapshot {
    const name = description.split(/[.!?]/)[0]?.slice(0, 80) || "Your Offer";
    return {
        productName: name,
        category: niche || "Digital Product",
        mainPromise: description.slice(0, 200),
        primaryBenefits: ["Easy to get started", "Practical approach", "Beginner-friendly"],
        secondaryBenefits: ["Flexible", "Step-by-step guidance"],
        targetAudience: niche ? `People interested in ${niche}` : "Beginners looking for a simple starting point",
        buyerIntent: "Moderate — exploring options",
        painPoints: ["Unsure where to start", "Overwhelmed by options"],
        desiredOutcome: "Clear next steps and confidence",
        objections: ["Is this legit?", "Will it work for me?"],
        strongestAngle: "Simple beginner-friendly approach",
        contentAngles: ["problem/solution", "beginner education", "tips", "FAQ", "curiosity"],
        ctaStyle: "Educational + soft resource recommendation",
        promotionChannels: ["Facebook groups", "Reddit", "Q&A sites", "Social"],
        recommendedAudienceMode: "auto",
        promotionStyle: "Educational + problem/solution",
    };
}

export function buildFallbackPosts(snapshot: OfferSnapshot, offerUrl: string) {
    const angles = ["problem/solution", "educational", "beginner", "curiosity", "mistake", "checklist", "comparison", "FAQ", "story-style", "resource"];
    const platforms = ["Facebook Groups", "Reddit", "Q&A", "Social", "LinkedIn"];
    return angles.map((angle, i) => ({
        platform: platforms[i % platforms.length],
        title: `${angle.charAt(0).toUpperCase() + angle.slice(1)} post`,
        content: buildFallbackPostContent(snapshot, angle, offerUrl, i),
        angle,
        cta: i % 3 === 0 ? `Learn more: ${offerUrl}` : "Want the details? Ask in comments.",
        why: `This ${angle} angle helps ${snapshot.targetAudience.toLowerCase()} without feeling pushy.`,
        include_link: i % 3 !== 2,
        meta: { style: angle, recommended: i === 0 },
    }));
}

/** Natural ready-to-copy post body. Angle is used only to pick tone — never printed as a label. */
export function buildFallbackPostContent(snapshot: OfferSnapshot, angle: string, offerUrl: string, index: number): string {
    const pain = snapshot.painPoints[index % Math.max(snapshot.painPoints.length, 1)] || "getting started";
    const benefit = snapshot.primaryBenefits[index % Math.max(snapshot.primaryBenefits.length, 1)] || snapshot.mainPromise;
    switch (angle) {
        case "problem/solution":
            return `Many people struggle with ${pain.toLowerCase()}. One approach worth exploring: ${snapshot.productName} focuses on ${benefit.toLowerCase()}. If you're interested in ${snapshot.mainPromise.toLowerCase()}, it may be worth a look: ${offerUrl}`;
        case "educational":
            return `Quick tip for anyone dealing with ${pain.toLowerCase()}: start with one clear step rather than trying everything at once. ${snapshot.productName} breaks down ${snapshot.mainPromise.toLowerCase()} in a beginner-friendly way.`;
        case "beginner":
            return `If you're new to ${snapshot.category.toLowerCase()}, here's a simple starting point: focus on ${benefit.toLowerCase()}. ${snapshot.productName} is designed for ${snapshot.targetAudience.toLowerCase()}.`;
        case "curiosity":
            return `What if ${pain.toLowerCase()} had a simpler path than most people assume? ${snapshot.productName} explores ${snapshot.mainPromise.toLowerCase()} — worth checking out if that resonates.`;
        case "mistake":
            return `Common mistake: jumping into advanced tactics before mastering the basics. A better approach for ${snapshot.targetAudience.toLowerCase()}: ${benefit.toLowerCase()} first. ${snapshot.productName} walks through this step by step.`;
        default:
            return `${snapshot.productName} may help with ${pain.toLowerCase()} through ${benefit.toLowerCase()}. ${index % 2 === 0 ? `Resource: ${offerUrl}` : "Happy to share more if anyone's interested."}`;
    }
}

/** Detects stub copy that leaked angle labels into the post body (not ready to publish). */
export function isAngleLabelStub(content: string): boolean {
    const t = content.trim();
    if (/\bangle for\b/i.test(t)) return true;
    if (/^(problem\/solution|educational|beginner|curiosity|mistake|checklist|comparison|faq|story-style|resource)\b/i.test(t)) {
        return true;
    }
    // Legacy calendar stubs: "Day 3 (Wed): problem/solution — ..."
    if (/^day\s+\d+\s*\([^)]+\):\s*[a-z0-9 /_-]+\s+[—-]/i.test(t)) return true;
    return false;
}

/** Prefer stored content; rewrite known stubs into natural ready-to-copy posts. */
export function resolveReadyPostContent(
    snapshot: OfferSnapshot,
    offerUrl: string,
    content: string,
    angle: string | null | undefined,
    index: number,
): string {
    if (!isAngleLabelStub(content)) return content;
    return buildFallbackPostContent(snapshot, angle || "problem/solution", offerUrl, index);
}

export function buildFallbackHooks(snapshot: OfferSnapshot) {
    const categories = ["Curiosity", "Problem", "Benefit", "Question", "Contrarian", "Beginner", "Mistake", "Story", "Practical tip", "What I wish I knew"];
    return categories.map((category, i) => ({
        content: `${category}: What if ${snapshot.mainPromise.toLowerCase()} was simpler than you think?`,
        meta: { category, recommended: i === 0 },
    }));
}

export function buildFallbackReplies(snapshot: OfferSnapshot, offerUrl: string) {
    const triggers = [
        { trigger: "How does this work?", style: "how" },
        { trigger: "How often should I use it?", style: "frequency" },
        { trigger: "How much does it cost?", style: "price" },
        { trigger: "Is this legit?", style: "skeptical" },
        { trigger: "Where can I learn more?", style: "learn_more" },
        { trigger: "Has anyone tried this?", style: "generic" },
        { trigger: "Does this actually work?", style: "skeptical" },
        { trigger: "What's included?", style: "whats_included" },
        { trigger: "Does this work for beginners?", style: "beginner" },
        { trigger: "Is there a free trial?", style: "price" },
    ];
    return triggers.map((t, i) => ({
        title: t.trigger,
        content: buildFallbackReplyContent(snapshot, offerUrl, t.style, i),
        meta: { triggerComment: t.trigger, style: t.style },
    }));
}

function buildFallbackReplyContent(snapshot: OfferSnapshot, offerUrl: string, style: string, index: number): string {
    const product = snapshot.productName;
    const promise = snapshot.mainPromise.replace(/[.]+$/, "").toLowerCase();
    const audience = snapshot.targetAudience.toLowerCase();
    const benefit = (snapshot.primaryBenefits[0] || "practical guidance").replace(/[.]+$/, "").toLowerCase();
    const pain = (snapshot.painPoints[index % snapshot.painPoints.length] || "getting started").replace(/[.]+$/, "").toLowerCase();

    switch (style) {
        case "frequency":
            return `I'd follow the recommended schedule on the ${product} page rather than guessing — it usually lists how often to use it clearly. Check here: ${offerUrl}`;
        case "price":
            return `Pricing is on the official page (it can change, so that's the accurate source). ${product} focuses on ${promise}. Details: ${offerUrl}`;
        case "skeptical":
            return `Fair question. ${product} is aimed at ${audience} and focuses on ${benefit}. Best to review the page yourself and decide if it fits: ${offerUrl}`;
        case "learn_more":
            return `Sure — ${product} walks through ${promise} in a straightforward way. Full details here: ${offerUrl}`;
        case "beginner":
            return `Yes — it's geared toward ${audience}, especially if you're still figuring out ${pain}. ${product} keeps things focused on ${benefit}. More here: ${offerUrl}`;
        case "whats_included":
            return `What's included is listed on the official page so you get the current package details. ${product} is built around ${promise}: ${offerUrl}`;
        case "how":
            return `Short version: ${product} is set up to help with ${promise}, with an emphasis on ${benefit}. The page has the step-by-step: ${offerUrl}`;
        default:
            return `Good question. For people dealing with ${pain}, ${product} focuses on ${promise}. More info: ${offerUrl}`;
    }
}

export function buildFallbackCtas(snapshot: OfferSnapshot, offerUrl: string) {
    const types = ["Soft", "Educational", "Resource", "Curiosity", "Direct", "Conversation"];
    return types.map((type, i) => ({
        content: type === "Direct"
            ? `Take a look at ${snapshot.productName}: ${offerUrl}`
            : type === "Educational"
                ? `See how ${snapshot.mainPromise.toLowerCase()} works: ${offerUrl}`
                : `Explore the resource: ${offerUrl}`,
        meta: { type, recommended: i === 1 },
    }));
}

export function buildFallbackAngles(snapshot: OfferSnapshot) {
    const angles = [
        { title: "Beginner", description: `Position ${snapshot.productName} as a simple starting point for people who feel overwhelmed.` },
        { title: "Problem/Solution", description: `Focus on ${snapshot.painPoints[0]?.toLowerCase() || "the main problem"} your audience is trying to solve.` },
        { title: "Education", description: "Teach something useful first, then introduce the offer as a resource." },
        { title: "Curiosity", description: "Highlight an interesting concept that makes people want to learn more." },
        { title: "Comparison", description: "Compare common approaches and explain where this offer fits." },
    ];
    return angles.map((a) => ({
        title: a.title,
        content: a.description,
        angle: a.title.toLowerCase().replace("/", "_"),
        meta: { angleType: a.title },
    }));
}

export function buildFallbackQuickPlan(snapshot: OfferSnapshot): QuickPlanDay[] {
    return [
        {
            day: 1,
            label: "Today",
            actions: [
                { label: "Publish your strongest post", type: "copy" },
                { label: "Use your best hook in the opening", type: "copy" },
                { label: "Join or find relevant conversations in your niche", type: "info" },
            ],
        },
        {
            day: 2,
            label: "Tomorrow",
            actions: [
                { label: "Publish an alternate angle post", type: "copy" },
                { label: "Respond to interested people with ready-made replies", type: "view" },
            ],
        },
        {
            day: 3,
            label: "Day 3",
            actions: [
                { label: "Share an educational post (softer promotion)", type: "copy" },
            ],
        },
    ];
}
