"use client";

/**
 * Design explorations for the Start-Up Specialist popup.
 * Presentational only — rendered by the /dev/specialist-popup preview.
 * Countdown/dismiss wiring stays in SpecialistWelcomePopup; once a
 * variant is chosen its markup replaces the production dialog body.
 */

import { useEffect, useState } from "react";
import {
    ArrowRight,
    Check,
    Gift,
    Headset,
    Phone,
    PhoneCall,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";

const PHONE_DISPLAY = "425-458-1656";
const PHONE_TEL = "tel:+14254581656";
const COUNTDOWN_MS = 10 * 60 * 1000;

const BENEFITS = [
    "Skip all the learning curve and all the wait",
    "Get results from day zero",
    "Scale your results to $1,000 – $2,000 per day",
] as const;

function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useCountdown(): string {
    const [remaining, setRemaining] = useState(COUNTDOWN_MS);
    useEffect(() => {
        const startedAt = Date.now();
        const id = window.setInterval(() => {
            setRemaining(Math.max(0, COUNTDOWN_MS - (Date.now() - startedAt)));
        }, 250);
        return () => window.clearInterval(id);
    }, []);
    return formatCountdown(remaining);
}

/* ------------------------------------------------------------------ */
/* Variant A — VIP Concierge: quiet luxury, badge-led, minimal copy   */
/* ------------------------------------------------------------------ */

export function VariantConcierge({ onClose }: { onClose?: () => void }) {
    const countdown = useCountdown();

    return (
        <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] shadow-2xl max-sm:rounded-t-[1.35rem] max-sm:rounded-b-none">
            {/* Gold hairline crown */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-accent to-transparent" />

            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2.5 top-3.5 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
            >
                <X size={19} />
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-7 pb-5 text-center">
                {/* Badge */}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10 shadow-[0_0_30px_rgba(234,179,8,0.25)]">
                    <Headset size={26} className="text-accent" />
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                    Welcome to CashTap AI
                </p>
                <h2 className="brand-font mt-2 text-[1.45rem] sm:text-2xl font-black text-text-primary leading-tight tracking-tight">
                    Your dedicated
                    <br />
                    <span className="text-accent">Start-Up Specialist</span> is
                    ready
                </h2>
                <p className="mx-auto mt-2.5 max-w-[19rem] text-[13.5px] leading-relaxed text-text-secondary">
                    Skip the learning curve, get results from day zero, and scale
                    to $1,000 – $2,000 per day with one-on-one guidance.
                </p>

                {/* Single value line */}
                <div className="mx-auto mt-4 flex max-w-[20rem] items-center justify-center gap-2 rounded-full border border-accent/25 bg-accent/[0.06] px-4 py-2">
                    <Gift size={14} className="shrink-0 text-accent" />
                    <p className="text-[12.5px] text-text-secondary">
                        Secret vault bonuses —{" "}
                        <span className="font-bold text-text-primary">
                            $11,385.32
                        </span>{" "}
                        value, free
                    </p>
                </div>
            </div>

            <div className="shrink-0 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 space-y-3">
                <a
                    href={PHONE_TEL}
                    className="flex w-full min-h-[56px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-accent to-[#ca9a06] px-6 text-white shadow-[0_6px_24px_rgba(234,179,8,0.35)] transition-all hover:brightness-110 active:scale-[0.98] touch-manipulation"
                >
                    <Phone size={19} className="shrink-0" />
                    <span className="text-lg font-black tabular-nums tracking-wide">
                        {PHONE_DISPLAY}
                    </span>
                    <ArrowRight size={16} className="shrink-0 opacity-80" />
                </a>
                <p className="text-center text-[12px] leading-snug text-text-muted">
                    Tap to call and claim your Secret Vault Code ·{" "}
                    <span className="font-bold text-accent tabular-nums">
                        {countdown}
                    </span>{" "}
                    left
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Variant B — Countdown-first: urgency banner leads, punchy sections */
/* ------------------------------------------------------------------ */

export function VariantCountdown({ onClose }: { onClose?: () => void }) {
    const countdown = useCountdown();

    return (
        <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d12] shadow-2xl max-sm:rounded-t-[1.35rem] max-sm:rounded-b-none">
            {/* Urgency header */}
            <div className="shrink-0 bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#7f1d1d] px-4 py-2.5">
                <div className="flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-white">
                        Offer expires in{" "}
                        <span className="tabular-nums text-[#fde68a]">
                            {countdown}
                        </span>
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2 top-12 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
            >
                <X size={19} />
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                    Welcome to CashTap AI
                </p>
                <h2 className="brand-font mt-1.5 text-[1.5rem] sm:text-[1.7rem] font-black leading-[1.12] tracking-tight text-text-primary">
                    Claim your{" "}
                    <span className="text-accent">$11,385.32</span> Secret Vault
                    — free
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                    You&apos;ve been assigned a dedicated Start-Up Specialist to
                    finalize your setup and unlock your bonuses.
                </p>

                <ul className="mt-4 space-y-2">
                    {BENEFITS.map((item) => (
                        <li
                            key={item}
                            className="flex items-start gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[13.5px] text-text-primary leading-snug"
                        >
                            <Check
                                size={15}
                                strokeWidth={3}
                                className="mt-0.5 shrink-0 text-success"
                            />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#0e1016] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
                <a
                    href={PHONE_TEL}
                    className="flex w-full min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-r from-accent to-[#ca9a06] px-4 py-2 text-white shadow-[0_6px_24px_rgba(234,179,8,0.35)] transition-all hover:brightness-110 active:scale-[0.98] touch-manipulation"
                >
                    <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest opacity-95">
                        <PhoneCall size={14} /> Call now — tap to call
                    </span>
                    <span className="text-[1.4rem] font-black tabular-nums leading-none tracking-wide">
                        {PHONE_DISPLAY}
                    </span>
                </a>
                <p className="text-center text-[11.5px] leading-snug text-text-muted">
                    Your temporary code expires when this page closes.
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Variant C — Specialist card: personal, human, standing-by feel     */
/* ------------------------------------------------------------------ */

export function VariantSpecialistCard({ onClose }: { onClose?: () => void }) {
    const countdown = useCountdown();

    return (
        <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f13] shadow-2xl max-sm:rounded-t-[1.35rem] max-sm:rounded-b-none">
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2.5 top-2.5 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
            >
                <X size={19} />
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {/* Specialist identity strip */}
                <div className="flex items-center gap-3.5 border-b border-white/8 bg-gradient-to-b from-accent/[0.08] to-transparent px-5 pb-4 pt-6">
                    <div className="relative shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#a16207] text-white shadow-lg">
                            <Headset size={24} />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0d0f13] bg-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                            Welcome to CashTap AI
                        </p>
                        <p className="mt-0.5 text-[15.5px] font-bold text-text-primary leading-tight">
                            Your Start-Up Specialist
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-success">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                            </span>
                            Standing by now
                        </p>
                    </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                    <p className="text-[14px] leading-relaxed text-text-secondary">
                        As part of our commitment to{" "}
                        <span className="font-semibold text-text-primary">
                            your
                        </span>{" "}
                        success, he&apos;ll personally help you:
                    </p>

                    <ul className="space-y-2.5">
                        {BENEFITS.map((item) => (
                            <li
                                key={item}
                                className="flex items-start gap-2.5 text-[14px] text-text-primary leading-snug"
                            >
                                <Check
                                    size={16}
                                    strokeWidth={2.5}
                                    className="mt-0.5 shrink-0 text-success"
                                />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Vault ticket */}
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-accent/[0.05] px-3.5 py-3">
                        <Sparkles size={18} className="shrink-0 text-accent" />
                        <div className="min-w-0">
                            <p className="text-[13.5px] font-semibold text-text-primary leading-snug">
                                Secret Vault bonuses — free on this call
                            </p>
                            <p className="text-[12px] text-text-muted">
                                $11,385.32 retail value
                            </p>
                        </div>
                    </div>

                    <p className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
                        <ShieldCheck size={13} className="shrink-0 text-success" />
                        Your temporary code expires when this page closes.
                    </p>
                </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#0a0c10] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
                <a
                    href={PHONE_TEL}
                    className="flex w-full min-h-[56px] items-center justify-between rounded-xl bg-gradient-to-r from-accent to-[#ca9a06] px-5 text-white shadow-[0_6px_24px_rgba(234,179,8,0.32)] transition-all hover:brightness-110 active:scale-[0.98] touch-manipulation"
                >
                    <span className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                            <Phone size={17} />
                        </span>
                        <span className="flex flex-col leading-tight text-left">
                            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                                Tap to call
                            </span>
                            <span className="text-[1.15rem] font-black tabular-nums">
                                {PHONE_DISPLAY}
                            </span>
                        </span>
                    </span>
                    <span className="rounded-full bg-black/20 px-2.5 py-1 text-[12px] font-bold tabular-nums">
                        {countdown}
                    </span>
                </a>
                <p className="text-center text-[11.5px] leading-snug text-text-muted">
                    Call within 10 minutes to secure your bonuses.
                </p>
            </div>
        </div>
    );
}
