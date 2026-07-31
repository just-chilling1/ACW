"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid, Radar, LogOut, ChevronRight, GraduationCap, Sparkles,
  Search, MessageSquare, Brain, TrendingUp, ExternalLink,
  PanelLeftClose, PanelLeftOpen, Lock, Check, HelpCircle
} from "lucide-react";
import Image from "next/image";
import { useSearch } from "@/context/SearchContext";
import { clsx } from "clsx";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import {
  getWorkflowProgress,
  isWorkflowStepCompleted,
  isWorkflowStepLocked,
} from "@/lib/workflow-progress";

const STEPS = [
  { path: "/dashboard", label: "Home", icon: LayoutGrid },
  { path: "/search", label: "Step 1: Enter Topic", icon: Search, stepIndex: 1 },
  { path: "/analysis", label: "Step 2: Check Demand", icon: Brain, requiresWorkflowStep: 1, stepIndex: 2 },
  { path: "/radar", label: "Step 3: Find Ads", icon: Radar, requiresWorkflowStep: 2, stepIndex: 3 },
  { path: "/replies", label: "Step 4: Create Replies", icon: MessageSquare, requiresWorkflowStep: 3, stepIndex: 4 },
  { path: "/training", label: "Training", icon: GraduationCap },
  { path: "/scale-training", label: "Scale to $1k–$5k/day", icon: TrendingUp },
  { path: "/support", label: "Support", icon: HelpCircle },
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

  const progress = (Math.min(workflowProgress, 4) / 4) * 100;

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

  const renderStepLink = useCallback(
    (step: (typeof STEPS)[number], collapsedView: boolean) => {
      const isActive = pathname === step.path;
      const Icon = step.icon;
      const locked = isWorkflowStepLocked(step.requiresWorkflowStep, workflowProgress);
      const completed =
        isWorkflowStepCompleted(step.stepIndex, workflowProgress) && !isActive && !locked;

      if (locked) {
        return (
          <div
            key={step.path}
            title="Complete the previous step first"
            className={clsx(
              "command-nav-link shrink-0 cursor-not-allowed opacity-40",
              collapsedView ? "justify-center px-0" : "whitespace-nowrap"
            )}
          >
            <div className={clsx("flex items-center", collapsedView ? "justify-center" : "gap-3")}>
              <Lock size={18} strokeWidth={1.75} className="text-text-muted" />
              {!collapsedView && (
                <span className="text-sm font-medium text-text-muted">{step.label}</span>
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
            "command-nav-link group shrink-0",
            collapsedView ? "justify-center px-0" : "whitespace-nowrap",
            isActive && "active"
          )}
        >
          <div className={clsx("flex items-center", collapsedView ? "justify-center" : "gap-3")}>
            {completed ? (
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[rgba(16,185,129,0.15)] text-[var(--success)]">
                <Check size={12} strokeWidth={2.5} />
              </span>
            ) : (
              <Icon
                size={18}
                strokeWidth={1.75}
                className={clsx(isActive ? "text-[var(--gold)]" : "text-text-muted group-hover:text-text-primary")}
              />
            )}
            {!collapsedView && (
              <span className="text-sm font-medium tracking-wide">{step.label}</span>
            )}
          </div>
          {!collapsedView && isActive && (
            <ChevronRight size={14} strokeWidth={1.75} className="ml-auto text-[var(--gold)]" />
          )}
        </Link>
      );
    },
    [pathname, workflowProgress]
  );

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-40 hidden h-dvh grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden border-r border-[var(--border-subtle)] p-3 transition-[width] duration-300 lg:grid",
        "bg-[var(--sidebar-bg)] backdrop-blur-xl",
        collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]"
      )}
    >
      <div className="absolute left-0 top-0 z-0 h-full w-0.5 bg-[var(--border-subtle)]">
        <div
          className="w-full transition-[height] duration-500 ease-out"
          style={{ height: `${progress}%`, background: "var(--grad-brand)" }}
        />
      </div>

      <div className="relative z-10 flex shrink-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            href="/dashboard"
            className={clsx(
              "group flex min-w-0 items-center",
              collapsed ? "w-full justify-center" : "mx-auto w-[85%] pt-1"
            )}
            title="CashTap AI"
          >
            {collapsed ? (
              <Image
                src="/logo-mark.png"
                alt="CashTap AI"
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-muted hover:bg-[var(--surface-3)] hover:text-text-primary"
            >
              <PanelLeftClose size={18} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-muted hover:bg-[var(--surface-3)] hover:text-text-primary"
          >
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav
        ref={navRef}
        className="relative z-10 flex min-h-0 w-full min-w-0 flex-col gap-1 overflow-y-auto overscroll-y-contain touch-pan-y"
      >
        {!collapsed && (
          <span className="mb-1 shrink-0 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Navigation
          </span>
        )}

        {STEPS.map((step) => renderStepLink(step, collapsed))}

        {!collapsed && (
          <>
            <div className="mx-1 mt-3 flex flex-col gap-2">
              {EXCLUSIVE_OFFERS.map((promo) => (
                <a
                  key={promo.url}
                  href={promo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[rgba(234,179,8,0.22)] bg-[var(--surface-2)] p-3 transition-colors hover:border-[rgba(234,179,8,0.4)]"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12px] font-semibold leading-tight text-[var(--gold)]">
                      {promo.title}
                    </span>
                    <span className="text-[10px] font-medium text-text-muted">Opens in new tab</span>
                  </div>
                  <ExternalLink size={14} strokeWidth={1.75} className="shrink-0 text-[var(--gold)]" />
                </a>
              ))}
            </div>

            <div className="mx-0.5 mt-3 mb-1 p-1.5">
              <div className="premium-nav-section p-2">
                <div className="flex items-center gap-2 px-2.5 pb-2 pt-1.5">
                  <Sparkles className="text-[var(--gold)]" size={14} strokeWidth={1.75} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
                    Premium Features
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {PREMIUM_FEATURES.map((step) => {
                    const isActive = pathname === step.path;
                    const Icon = step.icon;
                    return (
                      <Link
                        key={step.path}
                        href={step.path}
                        className={clsx(
                          "premium-sidebar-item flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium tracking-wide",
                          isActive ? "is-active" : "text-text-secondary"
                        )}
                      >
                        <Icon size={16} strokeWidth={1.5} className={isActive ? "text-[var(--gold)]" : "text-[var(--gold)]/70"} />
                        <span>{step.label}</span>
                      </Link>
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
                    "premium-sidebar-item flex items-center justify-center rounded-[var(--radius-md)] py-3",
                    isActive ? "is-active text-[var(--gold)]" : "text-[var(--gold)]/70"
                  )}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="relative z-10 shrink-0 border-t border-[var(--border-subtle)] pt-2">
        <button
          type="button"
          onClick={resetSession}
          title="Logout"
          className={clsx(
            "command-nav-link w-full text-red-400/70 hover:bg-red-500/5 hover:text-red-400",
            collapsed ? "justify-center px-0" : "whitespace-nowrap"
          )}
        >
          <div className={clsx("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <LogOut size={18} strokeWidth={1.75} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </div>
        </button>
      </div>
    </aside>
  );
}
