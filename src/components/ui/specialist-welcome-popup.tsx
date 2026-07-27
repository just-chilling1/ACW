"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Phone, X } from "lucide-react";

const SESSION_DISMISS_KEY = "cashtap_specialist_popup_dismissed";
const COUNTDOWN_MS = 10 * 60 * 1000;
const PHONE_DISPLAY = "425-458-1656";
const PHONE_TEL = "tel:+14254581656";

const BENEFITS = [
    "Skip all the learning curve and all the wait",
    "Get results from day zero",
    "Scale your results to $1,000 – $2,000 per day",
] as const;

type EligibilityResponse = {
    eligible: boolean;
    country: string | null;
    closesInMs?: number;
};

function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function subscribeNoop() {
    return () => {};
}

/** Client-only gate — avoids SSR/portal hydration mismatch. */
function useIsClient() {
    return useSyncExternalStore(subscribeNoop, () => true, () => false);
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

    const expired = remainingMs <= 0;
    const countdown = formatCountdown(remainingMs);

    return createPortal(
        <AnimatePresence>
            {open ? (
                <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
                    <motion.button
                        type="button"
                        aria-label="Close welcome offer"
                        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
                        onClick={dismiss}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />

                    <motion.div
                        key="specialist-welcome-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden border border-accent/35 bg-[#0c0e14] shadow-[0_-8px_40px_rgba(0,0,0,0.55),0_0_40px_rgba(234,179,8,0.12)] max-sm:rounded-t-[1.35rem] sm:max-h-[min(90dvh,40rem)] sm:rounded-2xl max-sm:max-h-[min(94dvh,100%)] max-sm:h-auto"
                        onClick={(e) => e.stopPropagation()}
                        initial={
                            reduceMotion
                                ? false
                                : { opacity: 0, y: 28, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                            reduceMotion
                                ? undefined
                                : { opacity: 0, y: 20, scale: 0.98 }
                        }
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    >
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(234,179,8,0.16),transparent_55%),radial-gradient(80%_60%_at_100%_100%,rgba(16,185,129,0.08),transparent_50%)]"
                        />

                        <div
                            aria-hidden
                            className="relative z-10 flex justify-center pt-2.5 sm:hidden"
                        >
                            <span className="h-1 w-10 rounded-full bg-white/20" />
                        </div>

                        <div className="relative z-10 shrink-0 flex items-start gap-3 px-4 sm:px-5 pt-[max(0.35rem,env(safe-area-inset-top))] sm:pt-5 pb-2">
                            <div className="min-w-0 flex-1 pt-0.5 pr-2">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted mb-1.5">
                                    Welcome to
                                </p>
                                <h2
                                    id={titleId}
                                    className="brand-font text-[1.7rem] sm:text-[2rem] font-black text-accent leading-none tracking-tight"
                                >
                                    CashTap AI
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={dismiss}
                                aria-label="Close"
                                className="w-11 h-11 shrink-0 -mr-1 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 pb-4 space-y-5"
                            style={{ WebkitOverflowScrolling: "touch" }}
                        >
                            {/* Primary message */}
                            <div className="space-y-2">
                                <p className="brand-font text-lg sm:text-xl font-bold text-text-primary leading-snug tracking-tight">
                                    You&apos;ve been assigned a dedicated Start-Up
                                    Specialist.
                                </p>
                                <p className="text-[14px] sm:text-[15px] leading-relaxed text-text-secondary">
                                    As part of our commitment to your success — to
                                    fast-track your results and skip the learning
                                    curve.
                                </p>
                            </div>

                            {/* Secondary: benefits — no card chrome */}
                            <div>
                                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-2.5">
                                    Who will help you
                                </p>
                                <ul className="space-y-2.5">
                                    {BENEFITS.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-2.5 text-[14px] sm:text-[15px] text-text-secondary leading-snug"
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
                            </div>

                            {/* Tertiary value beat */}
                            <div className="border-t border-white/8 pt-4">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-1.5">
                                    Plus
                                </p>
                                <p className="text-[15px] sm:text-base font-semibold text-text-primary leading-snug">
                                    He&apos;ll unlock our secret vault bonuses for you
                                    — free.
                                </p>
                                <p className="text-[13px] text-text-muted mt-1">
                                    Worth over{" "}
                                    <span className="font-semibold text-text-secondary tabular-nums">
                                        $11,385.32
                                    </span>{" "}
                                    retail
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 shrink-0 border-t border-white/10 bg-[#0a0c11]/95 backdrop-blur-md px-4 sm:px-5 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] space-y-2.5">
                            <a
                                href={PHONE_TEL}
                                className="group flex w-full min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-r from-accent to-[#ca9a06] px-4 py-2.5 text-white shadow-[0_4px_20px_rgba(234,179,8,0.28)] transition-all hover:brightness-110 active:scale-[0.98] touch-manipulation select-none"
                            >
                                <span className="flex items-center gap-2 text-[13px] font-semibold tracking-wide uppercase opacity-95">
                                    <Phone size={16} className="shrink-0" />
                                    Call now
                                    <span className="normal-case tracking-normal font-medium opacity-80">
                                        · tap to call
                                    </span>
                                </span>
                                <span className="text-[1.35rem] sm:text-2xl font-black tabular-nums tracking-wide leading-none">
                                    {PHONE_DISPLAY}
                                </span>
                            </a>

                            <div className="text-center px-1">
                                <p className="text-[13px] text-text-secondary leading-snug">
                                    Call immediately to finalize your setup and claim
                                    your Secret Vault Code.
                                </p>
                                {expired ? (
                                    <p className="mt-1 text-[12px] font-medium text-error">
                                        Offer window ended — call now to still claim
                                        your bonuses.
                                    </p>
                                ) : (
                                    <p className="mt-1 text-[12px] text-text-muted leading-snug">
                                        Temporary code expires when this page closes.
                                        Call within{" "}
                                        <motion.span
                                            key={countdown}
                                            className="inline-block tabular-nums font-bold text-accent"
                                            initial={
                                                reduceMotion
                                                    ? false
                                                    : { scale: 1.06 }
                                            }
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {countdown}
                                        </motion.span>{" "}
                                        to secure your bonuses.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}
