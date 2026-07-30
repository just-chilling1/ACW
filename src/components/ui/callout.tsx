"use client";

import { clsx } from "clsx";
import { Flame, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type CalloutProps = {
  variant?: "promo" | "info";
  children: ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: ReactNode;
};

export function Callout({
  variant = "info",
  children,
  className,
  dismissible,
  onDismiss,
  actions,
}: CalloutProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const Icon = variant === "promo" ? Flame : Info;

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-[var(--radius-lg)] border p-5 md:p-6",
        variant === "promo"
          ? "border-[rgba(234,179,8,0.28)] bg-[rgba(234,179,8,0.06)]"
          : "border-[var(--border-subtle)] bg-[var(--surface-2)]",
        className
      )}
    >
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-white/5 hover:text-white"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      ) : null}
      <div className="flex gap-3">
        <div
          className={clsx(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
            variant === "promo" ? "bg-[rgba(234,179,8,0.15)] text-[var(--gold)]" : "bg-white/5 text-text-secondary"
          )}
        >
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <div className={clsx("min-w-0 flex-1 space-y-3 text-sm leading-relaxed text-text-secondary", dismissible && "pr-8")}>
          {children}
          {actions ? <div className="pt-1">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
