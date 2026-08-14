import type { NicheId } from "@/lib/niches";

export const INSTANT_POST_STYLES = [
    "helpful",
    "short",
    "detailed",
    "curiosity",
    "empathetic",
    "expert",
    "soft_sell",
    "skeptical_friend",
] as const;

export type InstantPostStyle = (typeof INSTANT_POST_STYLES)[number];

export type InstantFacebookPost = {
    id: string;
    niche: NicheId;
    style: InstantPostStyle;
    title: string;
    body: string;
};
