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

                        <div className="relative z-10 shrink-0 flex items-start gap-2 px-4 sm:px-5 pt-[max(0.25rem,env(safe-area-inset-top))] sm:pt-5 pb-3 border-b border-white/8">
                            <div className="min-w-0 flex-1 pt-0.5">
                                <p className="page-eyebrow mb-1">Dedicated Support</p>
                                <h2
                                    id={titleId}
                                    className="brand-font text-[1.25rem] xs:text-[1.35rem] sm:text-2xl font-black text-text-primary leading-[1.15] tracking-tight"
                                >
                                    Welcome To{" "}
                                    <span className="text-accent">CashTap AI</span>
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={dismiss}
                                aria-label="Close"
                                className="w-11 h-11 shrink-0 -mr-1 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-3.5 space-y-3 sm:space-y-3.5"
                            style={{ WebkitOverflowScrolling: "touch" }}
                        >
                            <div className="space-y-1.5 text-[14px] sm:text-[15px] leading-relaxed text-text-secondary">
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
                                <p className="font-semibold text-text-primary pt-0.5">
                                    You have been assigned a dedicated Start-Up
                                    Specialist.
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 sm:p-3.5">
                                <p className="ds-h4 text-accent mb-2">
                                    Who will help you
                                </p>
                                <ul className="space-y-2">
                                    {BENEFITS.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-2.5 text-[14px] sm:text-[15px] text-text-primary leading-snug"
                                        >
                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                                                <Check size={13} strokeWidth={3} />
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-xl border border-accent/30 bg-accent/[0.07] px-3 py-3 sm:px-3.5 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent mb-1">
                                    Plus
                                </p>
                                <p className="text-[14px] sm:text-[15px] font-semibold text-text-primary leading-snug">
                                    He will unlock our secret vault bonuses for you
                                    for{" "}
                                    <span className="text-success font-bold">
                                        FREE
                                    </span>
                                </p>
                                <p className="text-[12px] text-text-muted mt-1">
                                    Worth over{" "}
                                    <span className="font-bold text-text-primary tabular-nums">
                                        $11,385.32
                                    </span>{" "}
                                    in retail value
                                </p>
                            </div>

                            <p className="text-center text-[13px] text-text-secondary leading-relaxed px-1 pb-0.5">
                                Call immediately to finalize your setup and claim
                                your Secret Vault Code.
                            </p>
                        </div>

                        <div className="relative z-10 shrink-0 border-t border-white/10 bg-[#0a0c11]/95 backdrop-blur-md px-4 sm:px-5 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2">
                            <div
                                className={`rounded-xl px-3 py-2 text-center border ${
                                    expired
                                        ? "border-error/35 bg-error/10"
                                        : "border-error/25 bg-error/[0.08]"
                                }`}
                            >
                                <p className="text-[11px] text-text-secondary leading-snug">
                                    Your temporary code expires when this page
                                    closes.
                                </p>
                                {expired ? (
                                    <p className="mt-1 text-[13px] sm:text-sm font-bold text-error">
                                        Offer window ended — call now to still claim
                                        your bonuses!
                                    </p>
                                ) : (
                                    <p className="mt-1 text-[13px] sm:text-sm font-bold text-text-primary">
                                        Call within the next{" "}
                                        <motion.span
                                            key={countdown}
                                            className="inline-block tabular-nums text-accent"
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
                                        to secure your bonuses!
                                    </p>
                                )}
                            </div>

                            <a
                                href={PHONE_TEL}
                                className="group flex w-full min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-r from-accent to-[#ca9a06] px-4 py-2.5 text-white shadow-[0_4px_20px_rgba(234,179,8,0.28)] transition-all hover:brightness-110 active:scale-[0.98] touch-manipulation select-none"
                            >
                                <span className="flex items-center gap-2 text-[15px] sm:text-base font-bold tracking-wide">
                                    <Phone size={18} className="shrink-0" />
                                    Call Now
                                    <span className="text-[11px] font-semibold opacity-90 normal-case tracking-normal">
                                        · tap to call
                                    </span>
                                </span>
                                <span className="text-lg sm:text-xl font-black tabular-nums tracking-wide">
                                    {PHONE_DISPLAY}
                                </span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}
