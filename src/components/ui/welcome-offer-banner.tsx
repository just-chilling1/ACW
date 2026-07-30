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

            {!compact && (
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--success)]">
                    ✨ You&apos;ve Been Selected ✨
                </p>
            )}

            <h3
                className={clsx(
                    "mx-auto max-w-3xl font-bold uppercase leading-snug text-white",
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
                    <p className="mx-auto mb-1 max-w-2xl text-sm font-semibold text-white sm:text-base">
                        Learn How To Make <span className="text-[var(--gold)]">$1,000</span> —{" "}
                        <span className="text-[var(--gold)]">$5,000</span> Per Day
                    </p>
                    <p className="mb-4 text-xs text-white/60">With no extra work</p>

                    <div className="mx-auto mb-4 w-full max-w-md">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--gold)]">
                            <span>🔥 Spots Filling Fast</span>
                            <span className="text-white/70">
                                <span className="font-black text-white">8</span> / 10 Claimed
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e211e]">
                            <div className="h-full w-[80%] rounded-full bg-[var(--danger)]" />
                        </div>
                        <p className="mt-1.5 text-[12px] font-semibold text-[var(--success)]">
                            Only 2 FREE spots remaining!
                        </p>
                    </div>

                    <ul className="mx-auto mb-5 flex max-w-md flex-col gap-2 text-left text-sm text-white/80">
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
                <p className="mx-auto mb-3 max-w-2xl text-xs font-semibold text-white/80 sm:text-sm">
                    Learn how to make <span className="text-[var(--gold)]">$1k–$5k/day</span> with no extra work
                </p>
            )}

            <a
                href={CTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] font-bold uppercase text-[#1a1305] shadow-lg shadow-[rgba(251,191,36,0.3)] transition-all hover:scale-[1.03] hover:shadow-[rgba(251,191,36,0.5)]",
                    compact ? "min-h-[44px] px-5 py-2.5 text-sm" : "min-h-[52px] px-8 py-3 text-base"
                )}
            >
                {!compact && <Gift size={16} strokeWidth={2} />}
                Claim My Free Spot
            </a>

            {!compact && (
                <>
                    <p className="mt-3 text-[11px] text-white/50">100% Free — No credit card required</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[var(--danger)] sm:text-xs">
                        Warning: this will be taken down soon
                    </p>
                </>
            )}
        </div>
    );
}
