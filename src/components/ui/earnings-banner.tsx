"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

const CTA_URL = "https://www.breakoutai.net/5k-passive-9";

interface EarningsBannerProps {
    onDismiss?: () => void;
    compact?: boolean;
}

export function EarningsBanner({ onDismiss, compact = false }: EarningsBannerProps) {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    const handleDismiss = () => {
        setVisible(false);
        onDismiss?.();
    };

    return (
        <div
            className={clsx(
                "relative w-full rounded-xl border border-[rgba(234,179,8,0.4)] bg-gradient-to-b from-[#101726] to-[#0b0f18] text-center",
                compact ? "px-4 py-4 sm:px-6 sm:py-5" : "px-5 py-6 sm:px-8 sm:py-8"
            )}
        >
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss offer"
                className="absolute right-2 top-2 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
                <X size={compact ? 14 : 16} strokeWidth={1.75} />
            </button>

            <span className="mb-2 inline-block rounded-md bg-[var(--danger)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white sm:text-xs">
                Free Training
            </span>

            <h3
                className={clsx(
                    "mx-auto max-w-3xl font-bold uppercase leading-snug text-white",
                    compact ? "mb-1.5 text-base sm:text-xl" : "mb-2 text-xl sm:text-2xl md:text-3xl"
                )}
            >
                Multiply Your Earnings To{" "}
                <span className="text-[var(--gold)]">$1,000 – $5,000</span> A Day
            </h3>

            {!compact && (
                <p className="mx-auto mb-4 max-w-2xl text-sm font-medium leading-relaxed text-[#d8e9fb] sm:text-base">
                    CashTap AI is powerful — watch this free training to automate your entire workflow and unlock your full potential.
                </p>
            )}

            {compact && (
                <p className="mx-auto mb-3 max-w-2xl text-xs font-semibold leading-snug text-[#d8e9fb] sm:text-sm">
                    Watch this free training to automate your workflow and unlock $1k–$5k/day potential.
                </p>
            )}

            <a
                href={CTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] font-bold uppercase text-[#1a1305] shadow-lg shadow-[rgba(251,191,36,0.3)] transition-all hover:scale-[1.03] hover:shadow-[rgba(251,191,36,0.5)]",
                    compact ? "min-h-[44px] px-5 py-2.5 text-sm" : "min-h-[52px] px-8 py-3 text-base"
                )}
            >
                Click Here To Learn How
            </a>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[var(--danger)] sm:text-xs">
                Warning: this will be taken down soon
            </p>
        </div>
    );
}
