import { APP_NICHES, detectNicheFromText, type NicheId } from "@/lib/niches";
import type { OfferSnapshot, SocialPost } from "./types";

const FALLBACK_POSTS: Record<NicheId, SocialPost[]> = {
    weight_loss: [
        { id: "fb-wl-1", platform: "Reddit", title: "Best natural appetite suppressant that actually works?", text: "I've tried a few supplements for appetite control but nothing stuck. Looking for honest recommendations for natural options that help with cravings.", url: "https://www.reddit.com/r/Supplements/", engagement: 342 },
        { id: "fb-wl-2", platform: "Reddit", title: "Wegovy alternatives for appetite control?", text: "Looking for natural or over-the-counter alternatives for appetite control. What has worked for you without harsh side effects?", url: "https://www.reddit.com/r/loseit/", engagement: 521 },
        { id: "fb-wl-3", platform: "Reddit", title: "How do you stop late-night snacking?", text: "My biggest struggle is cravings after dinner. What methods or products actually helped you control appetite?", url: "https://www.reddit.com/r/intermittentfasting/", engagement: 456 },
        { id: "fb-wl-4", platform: "Reddit", title: "Need help starting a sustainable weight loss plan", text: "Complete beginner here. Overwhelmed by conflicting advice. What simple approach would you recommend?", url: "https://www.reddit.com/r/loseit/", engagement: 287 },
        { id: "fb-wl-5", platform: "Reddit", title: "Appetite suppression vs metabolism — what works better?", text: "Debating whether to focus on eating less or boosting metabolism. What approach gave you the best results?", url: "https://www.reddit.com/r/nutrition/", engagement: 198 },
    ],
    make_money_online: [
        { id: "fb-mmo-1", platform: "Reddit", title: "Real talk — who is actually making money with a side hustle?", text: "I want to hear from people who are ACTUALLY making money online. Real numbers, real methods. What are you doing?", url: "https://www.reddit.com/r/sidehustle/", engagement: 723 },
        { id: "fb-mmo-2", platform: "Reddit", title: "Best beginner-friendly online income method in 2026?", text: "Starting from zero. No tech background. What would you recommend for someone who wants realistic side income?", url: "https://www.reddit.com/r/passive_income/", engagement: 892 },
        { id: "fb-mmo-3", platform: "Reddit", title: "How to make money with AI tools — honest experiences?", text: "Curious about real experiences using AI for income. Not hype — what tools and workflows actually generate money?", url: "https://www.reddit.com/r/Entrepreneur/", engagement: 512 },
        { id: "fb-mmo-4", platform: "Reddit", title: "Need help choosing an online income path", text: "I have 1-2 hours a day. Looking for realistic online income. What actually worked for you?", url: "https://www.reddit.com/r/beermoney/", engagement: 445 },
        { id: "fb-mmo-5", platform: "Reddit", title: "Is passive income actually possible for beginners?", text: "Skeptical but curious. Has anyone built a sustainable online income stream from scratch?", url: "https://www.reddit.com/r/passive_income/", engagement: 367 },
    ],
    health_fitness: [
        { id: "fb-hf-1", platform: "Reddit", title: "Natural supplements for energy and joint pain?", text: "Dealing with afternoon crashes and stiff joints. Looking for natural options that actually help day-to-day.", url: "https://www.reddit.com/r/Supplements/", engagement: 334 },
        { id: "fb-hf-2", platform: "Reddit", title: "Best beginner workout routine without a gym?", text: "Want to get in shape but hate the gym. What simple routines actually work for busy people?", url: "https://www.reddit.com/r/Fitness/", engagement: 478 },
        { id: "fb-hf-3", platform: "Reddit", title: "Gut health recommendations that actually helped?", text: "Bloating after meals and low energy. What changed things for you — diet, supplements, or something else?", url: "https://www.reddit.com/r/nutrition/", engagement: 289 },
        { id: "fb-hf-4", platform: "Reddit", title: "How to improve sleep quality naturally?", text: "Tried melatonin and sleep apps. Still waking up tired. What actually improved your sleep?", url: "https://www.reddit.com/r/sleep/", engagement: 412 },
        { id: "fb-hf-5", platform: "Reddit", title: "Mobility exercises for people who sit all day?", text: "Desk job is wrecking my back and hips. What daily routine helped you feel better?", url: "https://www.reddit.com/r/flexibility/", engagement: 256 },
    ],
    beauty_skincare: [
        { id: "fb-bs-1", platform: "Reddit", title: "Skincare routine for acne scars — what worked?", text: "Been dealing with acne scars for years. What products or routines actually made a visible difference?", url: "https://www.reddit.com/r/SkincareAddiction/", engagement: 567 },
        { id: "fb-bs-2", platform: "Reddit", title: "Anti-aging products worth the money?", text: "Overwhelmed by serums and creams. What actually helped with fine lines and dull skin?", url: "https://www.reddit.com/r/30PlusSkinCare/", engagement: 423 },
        { id: "fb-bs-3", platform: "Reddit", title: "Best budget skincare for dry skin?", text: "My skin is flaky and nothing seems to hydrate it. Affordable recommendations please.", url: "https://www.reddit.com/r/SkincareAddiction/", engagement: 345 },
        { id: "fb-bs-4", platform: "Reddit", title: "How to simplify an overwhelming skincare routine?", text: "Using too many products with no results. What minimal routine actually worked for you?", url: "https://www.reddit.com/r/beauty/", engagement: 278 },
        { id: "fb-bs-5", platform: "Reddit", title: "Dark circles and under-eye bags — any solutions?", text: "Tried caffeine creams and cold spoons. Has anything actually helped your under-eye area?", url: "https://www.reddit.com/r/SkincareAddiction/", engagement: 312 },
    ],
    relationships: [
        { id: "fb-rel-1", platform: "Reddit", title: "How to rebuild communication in a struggling marriage?", text: "We keep having the same arguments. Looking for practical advice or resources that helped couples reconnect.", url: "https://www.reddit.com/r/Marriage/", engagement: 445 },
        { id: "fb-rel-2", platform: "Reddit", title: "Dating advice for people tired of toxic patterns?", text: "I keep attracting the wrong people. What mindset or approach helped you find healthier relationships?", url: "https://www.reddit.com/r/dating/", engagement: 389 },
        { id: "fb-rel-3", platform: "Reddit", title: "How to bring back the spark in a long-term relationship?", text: "Feeling like roommates instead of partners. What actually helped you reconnect?", url: "https://www.reddit.com/r/relationships/", engagement: 512 },
        { id: "fb-rel-4", platform: "Reddit", title: "Best books or courses on communication skills?", text: "Want to improve how I communicate with my partner. What resources made a real difference?", url: "https://www.reddit.com/r/relationship_advice/", engagement: 267 },
        { id: "fb-rel-5", platform: "Reddit", title: "Single for years — how did you meet someone compatible?", text: "Starting to lose hope. What changed for you when you finally found a healthy relationship?", url: "https://www.reddit.com/r/datingoverthirty/", engagement: 334 },
    ],
    tech_gadgets: [
        { id: "fb-tg-1", platform: "Reddit", title: "Best VPN for streaming that still works?", text: "My VPN keeps getting blocked by Netflix. What service actually works reliably for streaming?", url: "https://www.reddit.com/r/VPN/", engagement: 834 },
        { id: "fb-tg-2", platform: "Reddit", title: "Best cheap VPN right now?", text: "Looking for a reliable VPN without breaking the bank. What's the best option for the price?", url: "https://www.reddit.com/r/VPN/", engagement: 612 },
        { id: "fb-tg-3", platform: "Reddit", title: "How to boost home wifi speed?", text: "Working from home and my wifi is terrible. What device or setup actually helped?", url: "https://www.reddit.com/r/HomeNetworking/", engagement: 478 },
        { id: "fb-tg-4", platform: "Reddit", title: "Best ergonomic setup for back pain?", text: "Sitting 8+ hours and my back is killing me. What tech or gear made a difference?", url: "https://www.reddit.com/r/OfficeChairs/", engagement: 567 },
        { id: "fb-tg-5", platform: "Reddit", title: "Email marketing tool for solo creators?", text: "Comparing ConvertKit, Beehiiv, and MailerLite. What's best for a beginner with ~1,000 subscribers?", url: "https://www.reddit.com/r/Emailmarketing/", engagement: 345 },
    ],
    pets: [
        { id: "fb-pet-1", platform: "Reddit", title: "Best training approach for a reactive puppy?", text: "First-time dog owner with a reactive pup. What methods or programs actually helped?", url: "https://www.reddit.com/r/Dogtraining/", engagement: 423 },
        { id: "fb-pet-2", platform: "Reddit", title: "Cat food recommendations for picky eaters?", text: "My cat refuses most foods. What brands or approaches worked for picky cats?", url: "https://www.reddit.com/r/CatAdvice/", engagement: 312 },
        { id: "fb-pet-3", platform: "Reddit", title: "How to stop a dog from barking at everything?", text: "Neighborhood walks are stressful. What training tips or tools helped reduce barking?", url: "https://www.reddit.com/r/Dogtraining/", engagement: 389 },
        { id: "fb-pet-4", platform: "Reddit", title: "Natural supplements for older dogs with joint pain?", text: "My senior dog is slowing down. What helped improve mobility without harsh meds?", url: "https://www.reddit.com/r/dogs/", engagement: 278 },
        { id: "fb-pet-5", platform: "Reddit", title: "Best resources for new pet owners?", text: "Just got my first pet and feeling overwhelmed. What guides or products made things easier?", url: "https://www.reddit.com/r/Pets/", engagement: 245 },
    ],
    home_garden: [
        { id: "fb-hg-1", platform: "Reddit", title: "Best beginner garden setup for herbs and vegetables?", text: "Complete beginner wanting to grow my own herbs and veggies. What's the simplest way to start?", url: "https://www.reddit.com/r/gardening/", engagement: 512 },
        { id: "fb-hg-2", platform: "Reddit", title: "Medicinal plants worth growing at home?", text: "Interested in growing useful plants at home for health and cooking. What would you recommend for beginners?", url: "https://www.reddit.com/r/herbs/", engagement: 445 },
        { id: "fb-hg-3", platform: "Reddit", title: "Small space gardening tips?", text: "Only have a balcony but want to grow something useful. What worked in a small space?", url: "https://www.reddit.com/r/gardening/", engagement: 367 },
        { id: "fb-hg-4", platform: "Reddit", title: "How to start a survival or medicinal garden?", text: "Want to grow practical plants for emergencies and natural remedies. Where do beginners start?", url: "https://www.reddit.com/r/preppers/", engagement: 423 },
        { id: "fb-hg-5", platform: "Reddit", title: "Best resources for learning homestead gardening?", text: "Looking for a step-by-step guide to growing useful plants at home. Any kits or courses worth it?", url: "https://www.reddit.com/r/homestead/", engagement: 289 },
    ],
};

export function detectOfferNiche(snapshot: OfferSnapshot, audienceMode?: string): NicheId {
    if (audienceMode && audienceMode !== "auto") {
        const niche = APP_NICHES.find((n) => n.id === audienceMode);
        if (niche) return niche.id;
    }

    const combined = [
        snapshot.productName,
        snapshot.category,
        snapshot.mainPromise,
        ...snapshot.painPoints,
        ...snapshot.primaryBenefits,
    ].join(" ");

    return detectNicheFromText(combined);
}

export function getFallbackPostsForOffer(snapshot: OfferSnapshot, audienceMode?: string): SocialPost[] {
    const nicheId = detectOfferNiche(snapshot, audienceMode);
    return FALLBACK_POSTS[nicheId];
}

export function buildOfferRelevanceTerms(snapshot: OfferSnapshot): string[] {
    return [
        snapshot.productName,
        snapshot.category,
        snapshot.mainPromise,
        ...snapshot.painPoints,
        ...snapshot.primaryBenefits,
        ...snapshot.contentAngles,
    ]
        .flatMap((t) => t.toLowerCase().split(/\s+/))
        .filter((w) => w.length > 3);
}

export function scoreOfferRelevance(text: string, snapshot: OfferSnapshot): number {
    const lower = text.toLowerCase();
    const terms = buildOfferRelevanceTerms(snapshot);
    let score = 0;

    for (const term of terms) {
        if (term.length > 4 && lower.includes(term)) score += 12;
        else if (term.length > 3 && lower.includes(term.slice(0, Math.min(term.length, 8)))) score += 6;
    }

    const niche = APP_NICHES.find((n) => n.id === detectOfferNiche(snapshot));
    if (niche) {
        for (const term of niche.searchTerms) {
            if (lower.includes(term)) score += 8;
        }
    }

    if (/best|recommend|how|help|looking|need|advice|which|what|review|worth/.test(lower)) score += 10;
    return score;
}
