"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid, Radar, LogOut, ChevronRight, GraduationCap, Sparkles,
  Search, MessageSquare, Brain, ExternalLink, Link2,
  PanelLeftClose, PanelLeftOpen, Lock, Check, HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { clsx } from "clsx";
import { BrandLogo } from "@/components/ui/brand-logo";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import { isNavPathActive } from "@/lib/nav-active";
import {
  getWorkflowProgress,
  isWorkflowStepCompleted,
  isWorkflowStepLocked,
} from "@/lib/workflow-progress";
import { EXCLUSIVE_OFFERS } from "@/lib/exclusive-offers";

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  requiresWorkflowStep?: number;
  stepIndex?: number;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    items: [
      { path: "/dashboard", label: "Home", icon: LayoutGrid },
      { path: "/links", label: "Links Library", icon: Link2 },
    ],
  },
  {
    label: "Generate",
    items: [
      { path: "/search", label: "Step 1: Enter Topic", icon: Search, stepIndex: 1 },
      { path: "/analysis", label: "Step 2: Check Demand", icon: Brain, requiresWorkflowStep: 1, stepIndex: 2 },
      { path: "/radar", label: "Step 3: Find Ads", icon: Radar, requiresWorkflowStep: 2, stepIndex: 3 },
      { path: "/replies", label: "Step 4: Create Replies", icon: MessageSquare, requiresWorkflowStep: 3, stepIndex: 4 },
    ],
  },
  {
    label: "Academy",
    items: [{ path: "/training", label: "Training", icon: GraduationCap }],
  },
  {
    label: "Support",
    items: [{ path: "/support", label: "Support", icon: HelpCircle }],
  },
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
    step1Completed,
    analysisByVariation,
    selectedAds,
  } = useSearch();
  const navRef = useRef<HTMLElement>(null);

  const workflowProgress = useMemo(
    () =>
      getWorkflowProgress(
        step1Completed,
        Object.keys(analysisByVariation).length > 0,
        selectedAds.length > 0
      ),
    [step1Completed, analysisByVariation, selectedAds.length]
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
    (step: NavItem, collapsedView: boolean) => {
      const isActive = isNavPathActive(pathname, step.path);
      const Icon = step.icon;
      const locked = isWorkflowStepLocked(step.requiresWorkflowStep, workflowProgress);
      const completed =
        isWorkflowStepCompleted(step.stepIndex, workflowProgress) && !isActive && !locked;

      if (locked) {
        const fadedLocked = step.requiresWorkflowStep != null;
        return (
          <div
            key={step.path}
            title="Complete the previous step first"
            className={clsx(
              "command-nav-link shrink-0 nav-locked",
              fadedLocked && "nav-locked-faded",
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
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--success-bg-medium)] text-[var(--success)]">
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
              collapsed ? "w-full justify-center" : "min-w-0 flex-1 pt-1"
            )}
            title="AI CashWave"
          >
            <BrandLogo
              variant={collapsed ? "mark" : "wordmark"}
              size="sm"
              priority
            />
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
        className="relative z-10 flex min-h-0 w-full min-w-0 flex-col overflow-y-auto overscroll-y-contain touch-pan-y"
      >
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div
            key={section.label ?? `nav-section-${sectionIndex}`}
            className={clsx("flex flex-col gap-1", sectionIndex > 0 && "mt-3")}
          >
            {!collapsed && section.label && (
              <span className="mb-1 shrink-0 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {section.label}
              </span>
            )}
            {section.items.map((step) => renderStepLink(step, collapsed))}
          </div>
        ))}

        {!collapsed && (
          <>
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
                    const isActive = isNavPathActive(pathname, step.path);
                    const Icon = step.icon;
                    return (
                      <Link
                        key={step.path}
                        href={step.path}
                        className={clsx(
                          "premium-sidebar-item group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium tracking-wide",
                          isActive ? "is-active" : "text-text-secondary"
                        )}
                      >
                        <Icon
                          size={16}
                          strokeWidth={1.5}
                          className={clsx(
                            "transition-colors duration-180",
                            isActive ? "text-[var(--gold)]" : "text-[var(--gold)]/65 group-hover:text-[var(--gold)]"
                          )}
                        />
                        <span>{step.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mx-0.5 mb-1 p-1.5">
              <div className="exclusive-offers-section">
                <span className="exclusive-offers-section__header">Exclusive Offers</span>
                <div className="exclusive-offers-section__list">
                  {EXCLUSIVE_OFFERS.map((promo) => (
                    <a
                      key={promo.url}
                      href={promo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="exclusive-offer-link"
                      title={`${promo.title} (opens in new tab)`}
                    >
                      <span className="min-w-0 flex-1">{promo.title}</span>
                      <ExternalLink size={14} strokeWidth={1.75} />
                    </a>
                  ))}
                </div>
                <p className="exclusive-offers-section__note">All links open in a new tab</p>
              </div>
            </div>
          </>
        )}

        {collapsed && (
          <div className="premium-nav-section mt-2 flex shrink-0 flex-col gap-1 p-1">
            {PREMIUM_FEATURES.map((step) => {
              const isActive = isNavPathActive(pathname, step.path);
              const Icon = step.icon;
              return (
                <Link
                  key={step.path}
                  href={step.path}
                  title={step.label}
                  className={clsx(
                    "premium-sidebar-item group flex items-center justify-center rounded-[var(--radius-md)] py-3",
                    isActive ? "is-active text-[var(--gold)]" : "text-[var(--gold)]/65"
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
            "command-nav-link nav-danger w-full",
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
