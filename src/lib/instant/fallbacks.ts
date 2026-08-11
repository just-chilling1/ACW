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

function buildFallbackPostContent(snapshot: OfferSnapshot, angle: string, offerUrl: string, index: number): string {
    const pain = snapshot.painPoints[index % snapshot.painPoints.length];
    const benefit = snapshot.primaryBenefits[index % snapshot.primaryBenefits.length];
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

export function buildFallbackHooks(snapshot: OfferSnapshot) {
    const categories = ["Curiosity", "Problem", "Benefit", "Question", "Contrarian", "Beginner", "Mistake", "Story", "Practical tip", "What I wish I knew"];
    return categories.map((category, i) => ({
        content: `${category}: What if ${snapshot.mainPromise.toLowerCase()} was simpler than you think?`,
        meta: { category, recommended: i === 0 },
    }));
}

export function buildFallbackReplies(snapshot: OfferSnapshot, offerUrl: string) {
    const triggers = [
        { trigger: "How does this work?", style: "interested" },
        { trigger: "How much does it cost?", style: "price" },
        { trigger: "Is this legit?", style: "skeptical" },
        { trigger: "Where can I learn more?", style: "learn_more" },
        { trigger: "Has anyone tried this?", style: "generic" },
        { trigger: "Does this actually work?", style: "skeptical" },
        { trigger: "What's included?", style: "interested" },
        { trigger: "Is there a free trial?", style: "price" },
    ];
    return triggers.map((t, i) => ({
        title: t.trigger,
        content: buildFallbackReplyContent(snapshot, offerUrl, t.style, i),
        meta: { triggerComment: t.trigger, style: t.style },
    }));
}

function buildFallbackReplyContent(snapshot: OfferSnapshot, offerUrl: string, style: string, index: number): string {
    switch (style) {
        case "price":
            return `Good question — pricing details are on the official page. ${snapshot.productName} covers ${snapshot.mainPromise.toLowerCase()}. Here's where to check: ${offerUrl}`;
        case "skeptical":
            return `Fair to ask. ${snapshot.productName} is a resource for ${snapshot.targetAudience.toLowerCase()} — it focuses on ${snapshot.primaryBenefits[0]?.toLowerCase() || "practical guidance"}. Worth reviewing the details yourself: ${offerUrl}`;
        case "learn_more":
            return `Sure — ${snapshot.productName} breaks down ${snapshot.mainPromise.toLowerCase()} step by step. Full details here: ${offerUrl}`;
        default:
            return `${snapshot.productName} is designed to help with ${snapshot.painPoints[index % snapshot.painPoints.length]?.toLowerCase() || "getting started"}. It covers ${snapshot.mainPromise.toLowerCase()}. More info: ${offerUrl}`;
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
