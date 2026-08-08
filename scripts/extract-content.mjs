import fs from "fs";

const instant = fs.readFileSync("src/app/instant/page.tsx", "utf8");
const autopilot = fs.readFileSync("src/app/autopilot/page.tsx", "utf8");
const dfy = fs.readFileSync("src/app/dfy/page.tsx", "utf8");

function extractArray(src, startMarker) {
    const start = src.indexOf(startMarker);
    if (start === -1) return "";
    const open = src.indexOf("[", start);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === "[") depth++;
        if (src[i] === "]") {
            depth--;
            if (depth === 0) return src.slice(open + 1, i);
        }
    }
    return "";
}

function extractLines(file, startLine, endLine) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    return lines.slice(startLine - 1, endLine).join("\n");
}

let posts = extractLines("src/app/instant/page.tsx", 44, 122);
let sources = extractLines("src/app/autopilot/page.tsx", 54, 130);
const keywords = extractArray(dfy, "const KEYWORDS =");

fs.mkdirSync("src/lib/content", { recursive: true });

fs.writeFileSync(
    "src/lib/content/instant-posts.ts",
    `export interface FBPost { id: string; niche: string; text: string; }

export const INSTANT_NICHES = [
    "All Niches",
    "Weight Loss",
    "Make Money Online",
    "Health & Fitness",
    "Beauty & Skincare",
    "Relationships",
    "Tech & Gadgets",
    "Pets",
    "Home & Garden",
] as const;

export const INSTANT_POSTS: FBPost[] = [${posts}];
`
);

fs.writeFileSync(
    "src/lib/content/traffic-sources.ts",
    `export type SourceType = "Forum" | "Social" | "Directory" | "Blog" | "Q&A" | "Classified";
export type Difficulty = "Easy" | "Medium";

export interface TrafficSource {
    id: string;
    name: string;
    niche: string;
    type: SourceType;
    difficulty: Difficulty;
    traffic: string;
    time: string;
    url: string;
    description: string;
    instructions: string[];
}

export const AUTOPILOT_NICHES = [
    "All",
    "Weight Loss",
    "Make Money Online",
    "Health & Fitness",
    "Tech & Gadgets",
    "Beauty & Skincare",
    "Relationships",
    "Pets",
    "Home & Garden",
] as const;

export const TRAFFIC_SOURCES: TrafficSource[] = [${sources}];
`
);

const extraKeywords = `
    {
        label: "Best probiotic for gut health",
        search: "best probiotic gut health reddit 2024",
        niche: "Health & Fitness",
        description: "People seeking digestive health solutions with strong supplement buying intent."
    },
    {
        label: "How to start affiliate marketing with no money",
        search: "how to start affiliate marketing no money reddit",
        niche: "Make Money Online",
        description: "Beginners looking for low-cost ways to earn commissions online."
    },
    {
        label: "Best anti-aging cream for women over 50",
        search: "best anti aging cream women over 50 reddit",
        niche: "Beauty & Skincare",
        description: "Mature women researching proven skincare products before buying."
    },
    {
        label: "Best dog training program for beginners",
        search: "best dog training program beginners reddit",
        niche: "Pets",
        description: "Pet owners ready to invest in training solutions for behavior issues."
    },
    {
        label: "Best side hustle for retirees",
        search: "best side hustle retirees reddit 2024",
        niche: "Make Money Online",
        description: "Older adults looking for simple extra income without tech skills."
    },
    {
        label: "Best mattress for back pain",
        search: "best mattress back pain reddit under 500",
        niche: "Home & Garden",
        description: "Shoppers comparing sleep products with clear purchase intent."
    },
    {
        label: "Best online dating tips for men over 40",
        search: "online dating tips men over 40 reddit",
        niche: "Relationships",
        description: "Men seeking relationship advice and willing to try recommended programs."
    }`;

fs.writeFileSync(
    "src/lib/content/dfy-keywords.ts",
    `export interface DfyKeyword {
    label: string;
    search: string;
    niche: string;
    description: string;
}

export const DFY_KEYWORDS: DfyKeyword[] = [${keywords}${extraKeywords}
];
`
);

console.log("Extracted:", { posts: posts.length, sources: sources.length, keywords: keywords.length });
