import { Scan, Sparkles, Rocket, type LucideIcon } from "lucide-react";

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
        label: "Done-For-You",
        description: "One-click AI campaign — keywords, posts, replies, and bonus content.",
        icon: Scan,
    },
    {
        path: "/instant",
        label: "Instant Income",
        description: "AI-personalized posts for Facebook, Reddit, Quora, and more.",
        icon: Sparkles,
    },
    {
        path: "/autopilot",
        label: "Automated Profits",
        description: "3 daily traffic sources with AI-written submission copy.",
        icon: Rocket,
    },
];
