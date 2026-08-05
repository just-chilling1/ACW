"use client";

import { useState } from "react";
import { Gift, Star, X } from "lucide-react";
import { clsx } from "clsx";

const CTA_URL = "https://www.breakoutai.net/5k-passive-9";

interface WelcomeOfferBannerProps {
    onDismiss?: () => void;
    compact?: boolean;
}

export function WelcomeOfferBanner({ onDismiss, compact = false }: WelcomeOfferBannerProps) {
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

            {!compact && (
                <p className="ds-annotation mb-2 text-[var(--success)]">
                    ✨ You&apos;ve Been Selected ✨
                </p>
            )}

            <h3
                className={clsx(
                    "mx-auto max-w-3xl font-bold uppercase leading-snug text-text-primary",
                    compact ? "mb-1.5 text-base sm:text-xl" : "mb-2 text-xl sm:text-2xl md:text-3xl"
                )}
            >
                {compact ? (
                    <>
                        Free Training: <span className="text-[var(--gold)]">$1k–$5k/Day</span>
                    </>
                ) : (
                    "Limited Free Training"
                )}
            </h3>

            {!compact ? (
                <>
                    <p className="ds-body-sm mx-auto mb-1 max-w-2xl font-semibold sm:text-base">
                        Learn How To Make <span className="text-[var(--gold)]">$1,000</span> —{" "}
                        <span className="text-[var(--gold)]">$5,000</span> Per Day
                    </p>
                    <p className="ds-caption mb-4">With no extra work</p>

                    <div className="mx-auto mb-4 w-full max-w-md">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--gold)]">
                            <span>🔥 Spots Filling Fast</span>
                            <span className="text-text-secondary">
                                <span className="font-black text-text-primary">8</span> / 10 Claimed
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--promo-track-bg)]">
                            <div className="h-full w-[80%] rounded-full bg-[var(--danger)]" />
                        </div>
                        <p className="mt-1.5 text-[12px] font-semibold text-[var(--success)]">
                            Only 2 FREE spots remaining!
                        </p>
                    </div>

                    <ul className="mx-auto mb-5 flex max-w-md flex-col gap-2 text-left text-sm text-text-secondary">
                        {[
                            "Fully automated income system revealed",
                            "No tech skills or experience needed",
                            "Works in just 20 minutes per day",
                        ].map((text) => (
                            <li key={text} className="flex items-center gap-2">
                                <Star size={14} strokeWidth={1.75} className="shrink-0 text-[var(--gold)]" />
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <p className="ds-body-sm mx-auto mb-3 max-w-2xl font-semibold text-text-secondary sm:text-sm">
                    Learn how to make <span className="text-[var(--gold)]">$1k–$5k/day</span> with no extra work
                </p>
            )}

            <a
                href={CTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    "btn-primary gap-2 uppercase",
                    compact ? "min-h-[44px] px-5 py-2.5 text-sm" : "min-h-[52px] px-8 py-3 text-base"
                )}
            >
                {!compact && <Gift size={16} strokeWidth={2} />}
                Claim My Free Spot
            </a>

            {!compact && (
                <>
                    <p className="ds-caption mt-3">100% Free — No credit card required</p>
                    <p className="ds-annotation mt-2 text-[var(--danger)] sm:text-xs">
                        Warning: this will be taken down soon
                    </p>
                </>
            )}
        </div>
    );
}
