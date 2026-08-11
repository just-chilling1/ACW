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
];
