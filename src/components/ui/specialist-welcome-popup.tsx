"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gift, Phone, Rocket, Target, TrendingUp, X, Zap } from "lucide-react";

const SESSION_DISMISS_KEY = "cashtap_specialist_popup_dismissed";
const COUNTDOWN_MS = 10 * 60 * 1000;
const PHONE_DISPLAY = "425-458-1656";
const PHONE_TEL = "tel:+14254581656";

const BENEFITS = [
    { icon: Zap, text: "Skip all the learning curve and all the wait" },
    { icon: Rocket, text: "Get results from day zero" },
    { icon: TrendingUp, text: "Scale your results to $1,000 - $2,000 per day" },
] as const;

type EligibilityResponse = {
    eligible: boolean;
    country: string | null;
    closesInMs?: number;
};

function subscribeNoop() {
    return () => {};
}

/** Client-only gate — avoids SSR/portal hydration mismatch. */
function useIsClient() {
    return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

function TimerCell({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.03]" />
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={value}
                        initial={{ y: -14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 14, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="brand-font text-xl font-black tabular-nums text-text-primary"
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {label}
            </span>
        </div>
    );
}

type SpecialistWelcomePopupProps = {
    /** Dev/preview only — skip geo/hours fetch and open immediately. */
    forceOpen?: boolean;
};

export function SpecialistWelcomePopup({ forceOpen = false }: SpecialistWelcomePopupProps) {
    const titleId = useId();
    const isClient = useIsClient();
    const reduceMotion = useReducedMotion();
    const [eligibleOpen, setEligibleOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [remainingMs, setRemainingMs] = useState(COUNTDOWN_MS);
    const open = !dismissed && (forceOpen || eligibleOpen);

    useEffect(() => {
        if (!isClient || forceOpen) return;

        try {
            if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") return;
        } catch {
            // sessionStorage may be blocked; continue and gate on eligibility only
        }

        let cancelled = false;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch("/api/eligibility/specialist-popup", {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });
                if (!res.ok || cancelled) return;

                const data = (await res.json()) as EligibilityResponse;
                if (cancelled || !data.eligible) return;

                setRemainingMs(COUNTDOWN_MS);
                setEligibleOpen(true);
            } catch {
                // Network/abort — never show on failure (safe default)
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [forceOpen, isClient]);

    const dismiss = useCallback(() => {
        setDismissed(true);
        if (forceOpen) return;
        try {
            sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
        } catch {
            // ignore
        }
    }, [forceOpen]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") dismiss();
        },
        [dismiss]
    );

    // Robust scroll lock for iOS Safari (overflow:hidden alone is not enough).
    useEffect(() => {
        if (!open) return;

        const scrollY = window.scrollY;
        const { style } = document.body;
        const prev = {
            overflow: style.overflow,
            position: style.position,
            top: style.top,
            left: style.left,
            right: style.right,
            width: style.width,
        };

        style.overflow = "hidden";
        style.position = "fixed";
        style.top = `-${scrollY}px`;
        style.left = "0";
        style.right = "0";
        style.width = "100%";

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            style.overflow = prev.overflow;
            style.position = prev.position;
            style.top = prev.top;
            style.left = prev.left;
            style.right = prev.right;
            style.width = prev.width;
            window.scrollTo(0, scrollY);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, handleKeyDown]);

    useEffect(() => {
        if (!open) return;

        const startedAt = Date.now();
        const tick = () => {
            setRemainingMs(Math.max(0, COUNTDOWN_MS - (Date.now() - startedAt)));
        };

        tick();
        const id = window.setInterval(tick, 250);
        return () => window.clearInterval(id);
    }, [open]);

    if (!isClient) return null;

    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");

    return createPortal(
        <AnimatePresence>
            {open ? (
                <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
                    <motion.button
                        type="button"
                        aria-label="Close welcome offer"
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={dismiss}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />

                    {/* Gradient border frame */}
                    <motion.div
                        key="specialist-welcome-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="relative z-10 w-full max-w-[26.5rem] p-[1px] max-sm:rounded-t-[1.6rem] sm:rounded-[1.6rem] bg-gradient-to-b from-accent/70 via-white/12 to-white/5 shadow-[0_-12px_60px_rgba(0,0,0,0.7),0_0_60px_rgba(234,179,8,0.14)]"
                        onClick={(e) => e.stopPropagation()}
                        initial={
                            reduceMotion ? false : { opacity: 0, y: 36, scale: 0.97 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                            reduceMotion ? undefined : { opacity: 0, y: 24, scale: 0.97 }
                        }
                        transition={{ type: "spring", stiffness: 340, damping: 30 }}
                    >
                        <div className="relative flex max-h-[min(94dvh,46rem)] flex-col overflow-hidden max-sm:rounded-t-[calc(1.6rem-1px)] sm:rounded-[calc(1.6rem-1px)] bg-[#0B0C10]">
                            {/* Atmosphere: gold aurora + fine grid */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0"
                            >
                                <div className="absolute -top-24 left-1/2 h-64 w-[130%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,rgba(234,179,8,0.22),rgba(234,179,8,0.05)_60%,transparent)] blur-2xl" />
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(80%_50%_at_50%_0%,black,transparent)]" />
                            </div>

                            <button
                                type="button"
                                onClick={dismiss}
                                aria-label="Close"
                                className="absolute right-2.5 top-[max(0.625rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15 touch-manipulation"
                            >
                                <X size={19} />
                            </button>

                            {/* Scrollable content */}
                            <div
                                className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:pt-7"
                                style={{ WebkitOverflowScrolling: "touch" }}
                            >
                                {/* Brand mark */}
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-muted shadow-[0_8px_24px_rgba(234,179,8,0.35)]">
                                    <Target size={22} className="text-white" />
                                </div>

                                <h2
                                    id={titleId}
                                    className="brand-font mx-auto mt-1 max-w-[19rem] text-center text-[1.6rem] leading-[1.12] font-black tracking-tight text-text-primary sm:text-[1.8rem]"
                                >
                                    Welcome To{" "}
                                    <span className="bg-gradient-to-r from-accent to-[#fde047] bg-clip-text text-transparent">
                                        CashTap AI
                                    </span>
                                </h2>

                                <div className="mx-auto mt-3.5 max-w-[21rem] space-y-1.5 text-center text-[13.5px] leading-relaxed text-text-secondary">
                                    <p>
                                        As part of our commitment to{" "}
                                        <span className="font-bold text-text-primary">
                                            YOUR
                                        </span>{" "}
                                        success…
                                    </p>
                                    <p>
                                        …And to fast-track your results and skip the
                                        learning curve.
                                    </p>
                                    <p className="font-semibold text-text-primary">
                                        You have been assigned a dedicated Start-Up
                                        Specialist.
                                    </p>
                                </div>

                                {/* Benefits */}
                                <p className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                                    Who will help you:
                                </p>
                                <div className="space-y-2">
                                    {BENEFITS.map(({ icon: Icon, text }) => (
                                        <div
                                            key={text}
                                            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                                                <Icon size={15} />
                                            </span>
                                            <span className="text-[13.5px] font-medium leading-snug text-text-primary">
                                                {text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* PLUS / vault value strip */}
                                <p className="mt-4 mb-2 text-center text-[11px] font-black uppercase tracking-[0.3em] text-accent">
                                    Plus
                                </p>
                                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-accent/[0.14] to-accent/[0.04] px-3.5 py-3 ring-1 ring-inset ring-accent/25">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-black">
                                        <Gift size={15} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13.5px] font-bold leading-tight text-text-primary">
                                            He will unlock our secret vault bonuses
                                            for you for FREE
                                        </p>
                                        <p className="mt-0.5 text-[11.5px] text-text-secondary">
                                            Worth over{" "}
                                            <span className="font-bold text-accent tabular-nums">
                                                $11,385.32
                                            </span>{" "}
                                            in retail value
                                        </p>
                                    </div>
                                </div>

                                {/* Countdown */}
                                <div className="mt-5">
                                    <p className="mx-auto max-w-[21rem] text-center text-[11.5px] leading-relaxed text-text-muted">
                                        (Your temporary code expires when this page
                                        closes.
                                        <br />
                                        Call within the next 10 minutes to secure
                                        your bonuses!)
                                    </p>
                                    <div className="mt-2.5 flex items-start justify-center gap-2">
                                        <TimerCell value={mm} label="Min" />
                                        <span className="brand-font pt-2.5 text-xl font-black text-text-muted">
                                            :
                                        </span>
                                        <TimerCell value={ss} label="Sec" />
                                    </div>
                                </div>
                            </div>

                            {/* CTA dock */}
                            <div className="relative z-10 shrink-0 border-t border-white/[0.07] bg-[#0D0E13]/95 px-5 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
                                <a
                                    href={PHONE_TEL}
                                    className="group relative flex w-full min-h-[58px] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-accent via-[#f5c211] to-[#ca9a06] px-5 text-white shadow-[0_10px_30px_rgba(234,179,8,0.35)] transition-all hover:brightness-110 active:scale-[0.985] touch-manipulation select-none"
                                >
                                    {/* sheen */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 blur-md motion-safe:animate-[sheen_2.6s_ease-in-out_infinite]"
                                    />
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/15">
                                        <Phone size={19} />
                                    </span>
                                    <span className="flex flex-col items-start leading-none">
                                        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] opacity-90">
                                            📞 Call Now — tap to call
                                        </span>
                                        <span className="brand-font mt-1 text-[1.4rem] font-black tabular-nums tracking-wide">
                                            {PHONE_DISPLAY}
                                        </span>
                                    </span>
                                </a>
                                <p className="mt-2 text-center text-[11.5px] leading-snug text-text-secondary">
                                    Call immediately to finalize your setup and claim
                                    your Secret Vault Code
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}
