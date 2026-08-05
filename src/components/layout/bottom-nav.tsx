"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutGrid, Search, Radar, MessageSquare, MoreHorizontal,
    Brain, GraduationCap, Sparkles,
    LogOut, ExternalLink, X, Headphones, ChevronRight, Lock
} from "lucide-react";
import { clsx } from "clsx";
import { useSearch } from "@/context/SearchContext";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import { getWorkflowProgress, isWorkflowStepLocked } from "@/lib/workflow-progress";
import { EXCLUSIVE_OFFERS } from "@/lib/exclusive-offers";

const MAIN_TABS = [
    { path: "/dashboard", label: "Home", icon: LayoutGrid },
    { path: "/search", label: "Search", icon: Search },
    { path: "/radar", label: "Find Ads", icon: Radar, requiresWorkflowStep: 2 },
    { path: "/replies", label: "Replies", icon: MessageSquare, requiresWorkflowStep: 3 },
];

const MORE_NAV = [
    { path: "/analysis", label: "Step 2: Check Demand", icon: Brain, requiresWorkflowStep: 1 },
    { path: "/training", label: "Training", icon: GraduationCap },
    { path: "/support", label: "Support", icon: Headphones },
];

const MORE_ROW =
    "flex items-center gap-2.5 min-h-[44px] py-2 px-2.5 rounded-[var(--radius-lg)] transition-colors [@media(max-height:740px)]:min-h-[40px] [@media(max-height:740px)]:py-1.5";
const MORE_SECTION_LABEL =
    "text-[10px] font-semibold tracking-[0.12em] text-text-muted uppercase px-1.5 mb-0.5 [@media(max-height:740px)]:text-[9px]";
const MORE_ITEM_TEXT =
    "text-[13px] font-medium flex-1 min-w-0 leading-snug [@media(max-height:740px)]:text-[12px]";

export function BottomNav() {
    const pathname = usePathname();
    const { resetSession, step1Completed, analysisByVariation, selectedAds } = useSearch();
    const [moreOpen, setMoreOpen] = useState(false);

    const workflowProgress = useMemo(
        () =>
            getWorkflowProgress(
                step1Completed,
                Object.keys(analysisByVariation).length > 0,
                selectedAds.length > 0
            ),
        [step1Completed, analysisByVariation, selectedAds.length]
    );

    useEffect(() => {
        setMoreOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!moreOpen) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [moreOpen]);

    const isMoreActive = MORE_NAV.some((item) => pathname === item.path)
        || PREMIUM_FEATURES.some((item) => pathname === item.path);

    return (
        <>
            <nav
                className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--chrome-bg)] backdrop-blur-md lg:hidden"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="grid grid-cols-5 h-16">
                    {MAIN_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = pathname === tab.path;
                        const locked = isWorkflowStepLocked(tab.requiresWorkflowStep, workflowProgress);

                        if (locked) {
                            const fadedLocked = (tab.requiresWorkflowStep ?? 0) >= 2;
                            return (
                                <div
                                    key={tab.path}
                                    title="Complete the previous step first"
                                    className={clsx(
                                        "relative flex flex-col items-center justify-center gap-1 nav-locked",
                                        fadedLocked && "nav-locked-faded"
                                    )}
                                >
                                    <Lock size={22} strokeWidth={1.8} />
                                    <span className="text-[11px] font-semibold leading-none">{tab.label}</span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={tab.path}
                                href={tab.path}
                                className={clsx(
                                    "relative flex flex-col items-center justify-center gap-1 transition-colors active:opacity-70",
                                    active ? "text-accent" : "text-text-muted"
                                )}
                            >
                                {active && (
                                    <span className="absolute top-0 inset-x-2 h-[3px] rounded-b-full bg-gradient-to-r from-accent to-accent-muted" />
                                )}
                                <Icon size={24} strokeWidth={active ? 2.2 : 1.8} />
                                <span className="text-[11px] font-semibold leading-none">{tab.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setMoreOpen(true)}
                        className={clsx(
                            "relative flex flex-col items-center justify-center gap-1 transition-colors active:opacity-70",
                            isMoreActive || moreOpen ? "text-accent" : "text-text-muted"
                        )}
                    >
                        {(isMoreActive || moreOpen) && (
                            <span className="absolute top-0 inset-x-2 h-[3px] rounded-b-full bg-gradient-to-r from-accent to-accent-muted" />
                        )}
                        <MoreHorizontal size={24} strokeWidth={isMoreActive ? 2.2 : 1.8} />
                        <span className="text-[11px] font-semibold leading-none">More</span>
                    </button>
                </div>
            </nav>

            {moreOpen && (
                <div className="lg:hidden fixed inset-0 z-[70]">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 overlay-scrim"
                        onClick={() => setMoreOpen(false)}
                    />
                    <div
                        className="absolute bottom-0 inset-x-0 mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border-t border-[var(--border-subtle)] bg-[var(--surface-1)] chrome-sheet max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-0.75rem))] supports-[height:100dvh]:max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-0.75rem))]"
                        role="dialog"
                        aria-modal="true"
                        aria-label="More menu"
                    >
                        <div className="relative shrink-0 px-4 pb-2 pt-2.5 [@media(max-height:740px)]:pb-1.5 [@media(max-height:740px)]:pt-2">
                            <div className="flex justify-center pb-2 [@media(max-height:740px)]:pb-1.5">
                                <div className="sheet-handle" />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="ds-h5 [@media(max-height:740px)]:text-sm">More</h2>
                                <button
                                    type="button"
                                    onClick={() => setMoreOpen(false)}
                                    aria-label="Close menu"
                                    className="btn-icon h-9 w-9 min-h-0 min-w-0 rounded-full [@media(max-height:740px)]:h-8 [@media(max-height:740px)]:w-8"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] touch-pan-y [@media(max-height:740px)]:px-2.5">
                            <div className="flex flex-col gap-4 [@media(max-height:740px)]:gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span className={MORE_SECTION_LABEL}>
                                    Navigation
                                </span>
                                {MORE_NAV.map((item) => {
                                    const Icon = item.icon;
                                    const active = pathname === item.path;
                                    const locked = isWorkflowStepLocked(item.requiresWorkflowStep, workflowProgress);

                                    if (locked) {
                                        return (
                                            <div
                                                key={item.path}
                                                title="Complete the previous step first"
                                                className={clsx(MORE_ROW, "nav-locked")}
                                            >
                                                <Lock size={16} className="shrink-0" />
                                                <span className={MORE_ITEM_TEXT}>{item.label}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setMoreOpen(false)}
                                            className={clsx(
                                                MORE_ROW,
                                                active ? "bg-accent/10 text-accent" : "text-text-secondary hover-surface"
                                            )}
                                        >
                                            <Icon size={16} className="shrink-0" />
                                            <span className={MORE_ITEM_TEXT}>{item.label}</span>
                                            <ChevronRight size={13} className="shrink-0 text-text-tertiary" />
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="premium-nav-section flex flex-col gap-0.5 p-1.5 [@media(max-height:740px)]:p-1">
                                <span className="flex items-center gap-1.5 px-1.5 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] [@media(max-height:740px)]:text-[9px]">
                                    <Sparkles size={11} className="shrink-0" strokeWidth={1.75} />
                                    Premium Features
                                </span>
                                {PREMIUM_FEATURES.map((item) => {
                                    const Icon = item.icon;
                                    const active = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setMoreOpen(false)}
                                            className={clsx(
                                                "premium-sidebar-item group",
                                                MORE_ROW,
                                                active ? "is-active" : "text-text-secondary"
                                            )}
                                        >
                                            <Icon size={16} className={clsx("shrink-0 transition-colors duration-180", active ? "text-accent" : "text-accent/65 group-hover:text-accent")} />
                                            <span className={MORE_ITEM_TEXT}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="exclusive-offers-section">
                                <span className={clsx("exclusive-offers-section__header", "[@media(max-height:740px)]:text-[10px]")}>
                                    Exclusive Offers
                                </span>
                                <div className="exclusive-offers-section__list">
                                    {EXCLUSIVE_OFFERS.map((promo) => (
                                        <a
                                            key={promo.url}
                                            href={promo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="exclusive-offer-link [@media(max-height:740px)]:py-2 [@media(max-height:740px)]:text-[11px]"
                                            title={`${promo.title} (opens in new tab)`}
                                        >
                                            <span className="min-w-0 truncate">{promo.title}</span>
                                            <ExternalLink size={13} strokeWidth={1.75} />
                                        </a>
                                    ))}
                                </div>
                                <p className="exclusive-offers-section__note">All links open in a new tab</p>
                            </div>

                            <div className="flex flex-col gap-0.5 border-t border-[var(--border-subtle)] pt-3 [@media(max-height:740px)]:pt-2">
                                <Link
                                    href="/support"
                                    className={clsx(MORE_ROW, "text-text-secondary hover-surface")}
                                >
                                    <Headphones size={16} className="shrink-0" />
                                    <span className={MORE_ITEM_TEXT}>Support Center</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetSession();
                                        setMoreOpen(false);
                                    }}
                                    className={clsx(MORE_ROW, "nav-danger")}
                                >
                                    <LogOut size={16} className="shrink-0" />
                                    <span className={MORE_ITEM_TEXT}>Logout</span>
                                </button>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
