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
        description: "Ready-made campaigns you can post right away.",
        icon: Scan,
    },
    {
        path: "/instant",
        label: "Instant Income",
        description: "Simple posts and links that can start earning fast.",
        icon: Sparkles,
    },
    {
        path: "/autopilot",
        label: "Automated Profits",
        description: "Set it up once and let it keep working for you.",
        icon: Rocket,
    },
];
