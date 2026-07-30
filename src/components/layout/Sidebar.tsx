"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutGrid, Radar, LogOut, ChevronRight, GraduationCap, Sparkles,
    Search, MessageSquare, Brain, TrendingUp, ExternalLink,
    PanelLeftClose, PanelLeftOpen, Lock
} from "lucide-react";
import Image from "next/image";
import { useSearch } from "@/context/SearchContext";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import { getWorkflowProgress, isWorkflowStepLocked } from "@/lib/workflow-progress";

const STEPS = [
    { path: "/dashboard", label: "Home", icon: LayoutGrid },
    { path: "/search", label: "Step 1: Enter Topic", icon: Search },
    { path: "/analysis", label: "Step 2: Check Demand", icon: Brain, requiresWorkflowStep: 1 },
    { path: "/radar", label: "Step 3: Find Ads", icon: Radar, requiresWorkflowStep: 2 },
    { path: "/replies", label: "Step 4: Create Replies", icon: MessageSquare, requiresWorkflowStep: 3 },
    { path: "/training", label: "Training", icon: GraduationCap },
    { path: "/scale-training", label: "Scale to $1k–$5k/day", icon: TrendingUp },
];

const EXCLUSIVE_OFFERS = [
    { title: "Earn $400/Day Testing New Apps", url: "https://jvz4.com/c/3547097/442443/" },
    { title: "Get Paid To Copy & Paste", url: "https://jvz1.com/c/3547097/442055/" },
    { title: "Fast Cash Training", url: "https://www.breakoutai.net/5k-passive-9" },
];

export function Sidebar({
    collapsed = false,
    onToggleCollapse,
}: {
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}) {
    const pathname = usePathname();
    const {
        resetSession,
        variations,
        analysisByVariation,
        selectedAds,
    } = useSearch();
    const navRef = useRef<HTMLElement>(null);

    const workflowProgress = useMemo(
        () =>
            getWorkflowProgress(
                variations.length > 0,
                Object.keys(analysisByVariation).length > 0,
                selectedAds.length > 0
            ),
        [variations.length, analysisByVariation, selectedAds.length]
    );

    const workflowStepCount = 4;
    const progress = ((Math.min(workflowProgress, workflowStepCount)) / workflowStepCount) * 100;

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        const onWheel = (event: WheelEvent) => {
            if (nav.scrollHeight <= nav.clientHeight + 1) return;

            const atTop = nav.scrollTop <= 0;
            const atBottom = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1;

            if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) return;

            event.preventDefault();
            event.stopPropagation();
            nav.scrollTop += event.deltaY;
        };

        nav.addEventListener("wheel", onWheel, { passive: false });
        return () => nav.removeEventListener("wheel", onWheel);
    }, [collapsed]);

    const renderStepLink = useCallback((step: (typeof STEPS)[number], collapsedView: boolean) => {
        const isActive = pathname === step.path;
        const Icon = step.icon;
        const locked = isWorkflowStepLocked(step.requiresWorkflowStep, workflowProgress);

        if (locked) {
            return (
                <div
                    key={step.path}
                    title="Complete the previous step first"
                    className={clsx(
                        "command-nav-link group shrink-0 py-3.5 opacity-40 cursor-not-allowed",
                        collapsedView ? "justify-center px-0" : "whitespace-nowrap"
                    )}
                >
                    <div className={clsx("flex items-center", collapsedView ? "justify-center" : "gap-4")}>
                        <Lock size={18} className="text-text-muted" />
                        {!collapsedView && (
                            <span className="brand-font tracking-wide text-sm font-medium text-text-muted">
                                {step.label}
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <Link
                key={step.path}
                href={step.path}
                title={collapsedView ? step.label : undefined}
                className={clsx(
                    "command-nav-link group shrink-0 py-3.5",
                    collapsedView ? "justify-center px-0" : "whitespace-nowrap",
                    isActive && "active"
                )}
            >
                <div className={clsx("flex items-center", collapsedView ? "justify-center" : "gap-4")}>
                    <Icon size={18} className={clsx(isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary")} />
                    {!collapsedView && (
                        <span className="brand-font tracking-wide text-sm font-medium">{step.label}</span>
                    )}
                </div>
                {!collapsedView && isActive && <ChevronRight size={14} className="text-accent ml-auto" />}
            </Link>
        );
    }, [pathname, workflowProgress]);

    return (
        <aside
            className={clsx(
                "hidden lg:grid fixed inset-y-0 left-0 z-40 h-dvh overflow-hidden border-r border-border-dim bg-sidebar/90 backdrop-blur-md transition-[width] duration-300 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 p-4",
                collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]"
            )}
        >
            <div className="absolute left-0 top-0 w-0.5 h-full bg-border-dim z-0">
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${progress}%` }}
                    className="w-full bg-accent shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    transition={{ duration: 1, ease: "circOut" }}
                />
            </div>

            <div className="relative z-10 flex shrink-0 flex-col gap-3">
                <div className="flex items-center justify-between gap-2 px-1">
                    <Link
                        href="/dashboard"
                        className={clsx(
                            "flex items-center group min-w-0",
                            collapsed ? "justify-center w-full" : "w-[80%] mx-auto pt-1"
                        )}
                        title="CashTap AI"
                    >
                        {collapsed ? (
                            <Image
                                src="/logo-mark.png"
                                alt="CashTap AI"
                                width={40}
                                height={40}
                                className="h-10 w-10 object-contain"
                                priority
                            />
                        ) : (
                            <Image
                                src="/logo.png"
                                alt="CashTap AI"
                                width={220}
                                height={48}
                                className="h-auto w-full object-contain object-left"
                                priority
                            />
                        )}
                    </Link>

                    {!collapsed && onToggleCollapse && (
                        <button
                            type="button"
                            onClick={onToggleCollapse}
                            aria-label="Collapse sidebar"
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 shrink-0"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                </div>

                {collapsed && onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        aria-label="Expand sidebar"
                        className="mx-auto w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5"
                    >
                        <PanelLeftOpen size={18} />
                    </button>
                )}
            </div>

            <nav
                ref={navRef}
                className="relative z-10 flex min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y"
            >
                {!collapsed && (
                    <span className="shrink-0 text-[10px] font-black tracking-[0.3em] text-text-muted uppercase px-3 mb-1">
                        Navigation
                    </span>
                )}

                {STEPS.map((step) => renderStepLink(step, collapsed))}

                {!collapsed && (
                    <>
                        <div className="flex flex-col mx-1 mt-3 gap-2.5">
                            {EXCLUSIVE_OFFERS.map((promo) => (
                                <a
                                    key={promo.url}
                                    href={promo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-page/40 border border-accent/25 hover:border-accent/50 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="brand-font text-[12px] font-semibold text-accent leading-tight">{promo.title}</span>
                                        <span className="text-[10px] text-text-muted font-medium">Claim Now</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg border border-accent/30 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                                        <ExternalLink size={14} className="text-accent" />
                                    </div>
                                </a>
                            ))}
                        </div>

                        <div className="flex flex-col mx-1 mt-3">
                            <div className="premium-nav-section p-2">
                                <div className="flex items-center gap-2 px-2.5 pt-1.5 pb-2">
                                    <Sparkles className="text-accent animate-sparkle-pulse" size={14} strokeWidth={2} fill="currentColor" />
                                    <span className="text-[11px] font-bold tracking-[0.15em] text-accent uppercase">Premium Features</span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    {PREMIUM_FEATURES.map((step, index) => {
                                        const isActive = pathname === step.path;
                                        const Icon = step.icon;

                                        return (
                                            <motion.div
                                                key={step.path}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + index * 0.05 }}
                                            >
                                                <Link
                                                    href={step.path}
                                                    className={clsx(
                                                        "premium-sidebar-item flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium tracking-wide transition-all duration-300",
                                                        isActive ? "is-active" : "text-text-secondary"
                                                    )}
                                                >
                                                    <Icon size={16} strokeWidth={1.5} className={isActive ? "text-accent" : "text-accent/80"} />
                                                    <span>{step.label}</span>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activePremiumIndicator"
                                                            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                                                            style={{ boxShadow: "0 0 10px rgba(234, 179, 8, 0.7)" }}
                                                        />
                                                    )}
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {collapsed && (
                    <div className="premium-nav-section mt-2 flex shrink-0 flex-col gap-1 p-1">
                        {PREMIUM_FEATURES.map((step) => {
                            const isActive = pathname === step.path;
                            const Icon = step.icon;
                            return (
                                <Link
                                    key={step.path}
                                    href={step.path}
                                    title={step.label}
                                    className={clsx(
                                        "premium-sidebar-item flex items-center justify-center rounded-xl py-3 transition-all duration-300",
                                        isActive ? "is-active text-accent" : "text-accent/70"
                                    )}
                                >
                                    <Icon size={18} />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>

            <div className="relative z-10 shrink-0 border-t border-border-dim/40 pt-2">
                <button
                    type="button"
                    onClick={resetSession}
                    title="Logout"
                    className={clsx(
                        "command-nav-link group py-3.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all duration-300 w-full",
                        collapsed ? "justify-center px-0" : "whitespace-nowrap"
                    )}
                >
                    <div className={clsx("flex items-center", collapsed ? "justify-center" : "gap-4")}>
                        <LogOut size={18} />
                        {!collapsed && (
                            <span className="brand-font tracking-wide text-sm font-medium">Logout</span>
                        )}
                    </div>
                </button>
            </div>
        </aside>
    );
}
