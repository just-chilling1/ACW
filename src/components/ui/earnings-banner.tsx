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
                "promo-card relative w-full text-center",
                compact ? "px-4 py-4 sm:px-6 sm:py-5" : "px-5 py-6 sm:px-8 sm:py-8"
            )}
        >
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss offer"
                className="btn-icon absolute right-2 top-2 h-9 w-9 min-h-0 min-w-0"
            >
                <X size={compact ? 14 : 16} strokeWidth={1.75} />
            </button>

            <span className="badge-danger mb-2 inline-block px-2.5 py-0.5 sm:text-xs">
                Free Training
            </span>

            <h3
                className={clsx(
                    "mx-auto max-w-3xl font-bold uppercase leading-snug text-text-primary",
                    compact ? "mb-1.5 text-base sm:text-xl" : "mb-2 text-xl sm:text-2xl md:text-3xl"
                )}
            >
                Multiply Your Earnings To{" "}
                <span className="text-[var(--gold)]">$1,000 – $5,000</span> A Day
            </h3>

            {!compact && (
                <p className="ds-subtitle mx-auto mb-4 max-w-2xl sm:text-base">
                    AI CashWave is powerful — watch this free training to automate your entire workflow and unlock your full potential.
                </p>
            )}

            {compact && (
                <p className="ds-body-sm mx-auto mb-3 max-w-2xl font-semibold text-text-secondary sm:text-sm">
                    Watch this free training to automate your workflow and unlock $1k–$5k/day potential.
                </p>
            )}

            <a
                href={CTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    "btn-primary uppercase",
                    compact ? "min-h-[44px] px-5 py-2.5 text-sm" : "min-h-[52px] px-8 py-3 text-base"
                )}
            >
                Click Here To Learn How
            </a>

            <p className="ds-annotation mt-2 text-[var(--danger)] sm:text-xs">
                Warning: this will be taken down soon
            </p>
        </div>
    );
}
