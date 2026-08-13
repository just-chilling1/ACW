"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { PREMIUM_FEATURES } from "@/lib/premium-features";
import { isNavPathActive } from "@/lib/nav-active";
import { clsx } from "clsx";

export function PremiumUpgradesWidget() {
  const pathname = usePathname();

  return (
    <div className="premium-nav-section p-2">
      <div className="px-3 pb-3 pt-2.5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          Premium Upgrades
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
          Unlock the tools that drive the biggest results.
        </p>
      </div>

      <div className="space-y-2">
        {PREMIUM_FEATURES.map((feature) => {
          const isActive = isNavPathActive(pathname, feature.path);
          const Icon = feature.icon;

          return (
            <Link
              key={feature.path}
              href={feature.path}
              className={clsx("premium-upgrade-card group", isActive && "is-active")}
            >
              <div
                className={clsx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border transition-colors",
                  isActive
                    ? "border-[var(--accent-border-emphasis)] bg-[var(--accent-bg-medium)] text-[var(--gold)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--gold)]"
                )}
              >
                <Icon size={18} strokeWidth={1.5} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold tracking-wide text-text-primary">
                  {feature.label}
                </span>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{feature.description}</p>
              </div>

              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--gold)]">
                <ArrowRight size={14} strokeWidth={1.75} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
