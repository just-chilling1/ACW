import { Scan, Sparkles, Rocket, Flame, Library, Clapperboard, type LucideIcon } from "lucide-react";

export type PremiumFeature = {
    path: string;
    label: string;
    description: string;
    icon: LucideIcon;
};

/**
 * Single source of truth for premium features — used by the desktop
 * sidebar, mobile nav, and the dashboard Premium Upgrades widget.
 */
export const PREMIUM_FEATURES: PremiumFeature[] = [
    {
        path: "/dfy",
        label: "DFY Campaign Builder",
        description: "Your complete promotional campaign — built for you.",
        icon: Scan,
    },
    {
        path: "/instant",
        label: "Instant Income",
        description: "Turn your offer into ready-to-use promotions.",
        icon: Sparkles,
    },
    {
        path: "/autopilot",
        label: "Automated Profits",
        description: "Build your Traffic Machine — we tell you what to do next.",
        icon: Rocket,
    },
    {
        path: "/hot-threads",
        label: "Hot Threads & Offers",
        description: "Daily hot posts and replies for your niche.",
        icon: Flame,
    },
    {
        path: "/vault",
        label: "Quora + Pinterest Vault",
        description: "160 ready-to-post answers and pins for your niche.",
        icon: Library,
    },
    {
        path: "/shorts-vault",
        label: "Viral Shorts Vault",
        description: "40 faceless scripts for TikTok, Reels, and Shorts.",
        icon: Clapperboard,
    },
];
