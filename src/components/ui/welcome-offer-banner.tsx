"use client";

import { useState } from "react";
import { ArrowRight, Gift, Star } from "lucide-react";
import { clsx } from "clsx";
import { Callout } from "@/components/ui/callout";

const CTA_URL = "https://www.breakoutai.net/5k-passive-9";

interface WelcomeOfferBannerProps {
    onDismiss?: () => void;
    compact?: boolean;
}

export function WelcomeOfferBanner({ onDismiss, compact = false }: WelcomeOfferBannerProps) {
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
                    {!compact && <Gift size={16} strokeWidth={2} />}
                    Claim My Free Spot
                    <ArrowRight size={compact ? 14 : 16} strokeWidth={2} />
                </a>
            }
        >
            <span className="page-eyebrow text-[var(--danger)]!">Free Training</span>

            {!compact && (
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--success)]">
                    ✨ You&apos;ve Been Selected ✨
                </p>
            )}

            <h3
                className={clsx(
                    "font-semibold text-text-primary leading-snug",
                    compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"
                )}
            >
                {compact ? (
                    <>
                        Free Training: <span className="text-gradient">$1k–$5k/Day</span>
                    </>
                ) : (
                    "Limited Free Training"
                )}
            </h3>

            {!compact ? (
                <>
                    <p className="text-sm font-medium text-text-primary">
                        Learn How To Make <span className="text-gradient">$1,000</span> —{" "}
                        <span className="text-gradient">$5,000</span> Per Day
                    </p>
                    <p className="text-xs text-text-muted">With no extra work</p>

                    <div className="w-full max-w-md">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                            <span>🔥 Spots Filling Fast</span>
                            <span className="text-text-muted">
                                <span className="font-bold text-text-primary">8</span> / 10 Claimed
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                            <div className="h-full w-[80%] rounded-full bg-[var(--danger)]" />
                        </div>
                        <p className="mt-1.5 text-[12px] font-medium text-[var(--success)]">
                            Only 2 FREE spots remaining!
                        </p>
                    </div>

                    <ul className="flex max-w-md flex-col gap-2 text-sm text-text-secondary">
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

                    <p className="text-[11px] text-text-muted">100% Free — No credit card required</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--danger)]">
                        Warning: this will be taken down soon
                    </p>
                </>
            ) : (
                <p className="text-[11px] font-medium text-text-secondary">
                    Learn how to make <span className="text-gradient">$1k–$5k/day</span> with no extra work
                </p>
            )}
        </Callout>
    );
}
