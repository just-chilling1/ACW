"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { Callout } from "@/components/ui/callout";

const CTA_URL = "https://www.breakoutai.net/5k-passive-9";

interface EarningsBannerProps {
    onDismiss?: () => void;
    compact?: boolean;
}

export function EarningsBanner({ onDismiss, compact = false }: EarningsBannerProps) {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <Callout
            variant="promo"
            dismissible
            onDismiss={() => {
                setVisible(false);
                onDismiss?.();
            }}
            className={clsx(compact && "p-3! md:p-3.5!")}
            actions={
                <a
                    href={CTA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx("btn-primary", compact ? "min-h-[40px] px-5 py-2 text-xs" : "min-h-[48px]")}
                >
                    Click Here To Learn How
                    <ArrowRight size={compact ? 14 : 16} strokeWidth={2} />
                </a>
            }
        >
            <span className="page-eyebrow text-[var(--danger)]!">Free Training</span>
            <h3
                className={clsx(
                    "mt-2 font-semibold text-text-primary leading-snug",
                    compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"
                )}
            >
                Multiply Your Earnings To{" "}
                <span className="text-gradient">$1,000 – $5,000</span> A Day
            </h3>
            {!compact && (
                <>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        CashTap AI is powerful — watch this free training to automate your entire workflow and unlock your full potential.
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--danger)]">
                        Warning: this will be taken down soon
                    </p>
                </>
            )}
        </Callout>
    );
}
