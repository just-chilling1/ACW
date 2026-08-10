/** Shared niche list used across Instant Income, Autopilot, and DFY campaigns. */
export const APP_NICHES = [
    {
        id: "weight_loss",
        label: "Weight Loss",
        description: "People trying to lose weight, control appetite, and improve body composition.",
        searchTerms: ["weight loss", "appetite", "diet", "fat loss", "suppress"],
    },
    {
        id: "make_money_online",
        label: "Make Money Online",
        description: "Side hustlers, freelancers, and beginners looking for online income.",
        searchTerms: ["make money", "side hustle", "passive income", "earn online", "ai tool"],
    },
    {
        id: "health_fitness",
        label: "Health & Fitness",
        description: "People improving energy, mobility, supplements, and daily wellness.",
        searchTerms: ["health", "fitness", "energy", "joint pain", "supplement"],
    },
    {
        id: "beauty_skincare",
        label: "Beauty & Skincare",
        description: "Skincare routines, anti-aging, acne, and personal care buyers.",
        searchTerms: ["skincare", "beauty", "wrinkle", "acne", "skin"],
    },
    {
        id: "relationships",
        label: "Relationships",
        description: "Dating, marriage, communication, and relationship improvement.",
        searchTerms: ["relationship", "dating", "marriage", "partner"],
    },
    {
        id: "tech_gadgets",
        label: "Tech & Gadgets",
        description: "VPNs, smart home, productivity tools, and consumer tech.",
        searchTerms: ["vpn", "tech", "gadget", "wifi", "streaming"],
    },
    {
        id: "pets",
        label: "Pets",
        description: "Pet owners seeking training, nutrition, and pet care solutions.",
        searchTerms: ["pet", "dog", "cat", "puppy", "training"],
    },
    {
        id: "home_garden",
        label: "Home & Garden",
        description: "Gardening, homesteading, home improvement, and outdoor living.",
        searchTerms: ["garden", "home", "plant", "herb", "medicinal", "grow"],
    },
] as const;

export type NicheId = (typeof APP_NICHES)[number]["id"];

export function getNicheById(id: string) {
    return APP_NICHES.find((n) => n.id === id);
}

export function detectNicheFromText(text: string): NicheId {
    const lower = text.toLowerCase();
    let best: NicheId = "make_money_online";
    let bestScore = 0;

    for (const niche of APP_NICHES) {
        const score = niche.searchTerms.reduce(
            (acc, term) => acc + (lower.includes(term) ? term.length : 0),
            0,
        );
        if (score > bestScore) {
            bestScore = score;
            best = niche.id;
        }
    }

    return bestScore > 0 ? best : "make_money_online";
}
