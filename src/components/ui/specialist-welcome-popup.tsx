"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock3, FastForward, Phone, TrendingUp, Vault, Wallet, X } from "lucide-react";

const SESSION_DISMISS_KEY = "cashtap_specialist_popup_dismissed";
const COUNTDOWN_MS = 10 * 60 * 1000;
const PHONE_DISPLAY = "425-458-1656";
const PHONE_TEL = "tel:+14254581656";

const BENEFITS = [
    { icon: FastForward, text: "Skip all the learning curve and all the wait" },
    { icon: Clock3, text: "Get results from day zero" },
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
    const [windowClosesInMs, setWindowClosesInMs] = useState<number | null>(null);
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
                setWindowClosesInMs(
                    typeof data.closesInMs === "number" ? data.closesInMs : null
                );
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

    // Hard stop: auto-hide the moment the PT business window ends (e.g. user
    // opened it at 17:29 and kept the page open past 17:30).
    useEffect(() => {
        if (!eligibleOpen || forceOpen || windowClosesInMs == null) return;
        const id = window.setTimeout(
            () => setEligibleOpen(false),
            Math.max(0, windowClosesInMs)
        );
        return () => window.clearTimeout(id);
    }, [eligibleOpen, forceOpen, windowClosesInMs]);

    // Re-validate when the tab regains focus (background timers can be
    // throttled; a user returning next morning must not see a stale popup).
    useEffect(() => {
        if (!eligibleOpen || forceOpen) return;

        const revalidate = async () => {
            if (document.visibilityState !== "visible") return;
            try {
                const res = await fetch("/api/eligibility/specialist-popup", {
                    method: "GET",
                    cache: "no-store",
                });
                if (!res.ok) return;
                const data = (await res.json()) as EligibilityResponse;
                if (!data.eligible) setEligibleOpen(false);
            } catch {
                // keep current state on network failure
            }
        };

        document.addEventListener("visibilitychange", revalidate);
        return () =>
            document.removeEventListener("visibilitychange", revalidate);
    }, [eligibleOpen, forceOpen]);

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
    const urgent = totalSeconds <= 120;
    const progressPct = (remainingMs / COUNTDOWN_MS) * 100;

    return createPortal(
        <AnimatePresence>
            {open ? (
                <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
                    <motion.button
                        type="button"
                        aria-label="Close welcome offer"
                        className="absolute inset-0 bg-black/30"
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
                        className="relative z-10 w-full max-w-[24.5rem] sm:max-w-[30rem] max-sm:rounded-t-3xl sm:rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
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
                        <div className="relative flex max-h-[min(96dvh,46rem)] flex-col overflow-hidden max-sm:rounded-t-3xl sm:rounded-3xl">
                            {/* Header: brand row */}
                            <div className="relative z-10 flex shrink-0 items-center gap-2 px-5 pt-[max(1.1rem,env(safe-area-inset-top))] sm:px-7 sm:pt-5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                    <Wallet size={15} strokeWidth={2.5} />
                                </span>
                                <span className="brand-font text-[13px] font-black tracking-wide text-gray-900 uppercase">
                                    CashTap <span className="text-emerald-600">AI</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    aria-label="Close"
                                    className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 touch-manipulation"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content — sized to fit a phone screen without scrolling */}
                            <div
                                className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-2 pt-3 sm:px-9"
                                style={{ WebkitOverflowScrolling: "touch" }}
                            >
                                {/* Title */}
                                <h2
                                    id={titleId}
                                    className="brand-font text-center text-[1.45rem] sm:text-[1.6rem] font-black uppercase leading-tight tracking-tight text-gray-900"
                                >
                                    Welcome To CashTap AI
                                </h2>

                                {/* Intro copy */}
                                <div className="mx-auto mt-2 max-w-[22rem] space-y-0.5 text-center text-[12.5px] leading-[1.6] text-gray-500">
                                    <p>
                                        As part of our commitment to{" "}
                                        <span className="font-semibold text-gray-800">
                                            YOUR
                                        </span>{" "}
                                        success…
                                    </p>
                                    <p>
                                        …And to fast-track your results and skip the
                                        learning curve.
                                    </p>
                                </div>
                                <p className="mx-auto mt-2.5 max-w-[20rem] text-center text-[14px] font-bold leading-snug text-gray-900">
                                    You have been assigned a dedicated Start-Up
                                    Specialist.
                                </p>

                                {/* Benefits */}
                                <p className="mt-4 text-center text-[10.5px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                    Who will help you
                                </p>
                                <ul className="mx-auto mt-2.5 max-w-[21rem] space-y-2.5">
                                    {BENEFITS.map(({ icon: Icon, text }) => (
                                        <li
                                            key={text}
                                            className="flex items-center gap-3 text-[13.5px] font-medium leading-snug text-gray-800"
                                        >
                                            <Icon
                                                size={19}
                                                strokeWidth={1.8}
                                                className="shrink-0 text-gray-900"
                                            />
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* PLUS — vault bonus */}
                                <div className="mx-auto mt-4 flex max-w-[22rem] items-center gap-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                                    <Vault
                                        size={34}
                                        strokeWidth={1.4}
                                        className="shrink-0 text-emerald-700"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                            Plus
                                        </p>
                                        <p className="mt-0.5 text-[13.5px] font-bold leading-snug text-gray-900">
                                            He will unlock our secret vault bonuses
                                            for you for FREE
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-gray-500">
                                            Worth over{" "}
                                            <span className="font-bold text-gray-900 tabular-nums">
                                                $11,385.32
                                            </span>{" "}
                                            in retail value
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA dock with urgency timer */}
                            <div className="relative z-10 shrink-0 px-6 pt-3 pb-[max(1.15rem,env(safe-area-inset-bottom))] sm:px-9">
                                <a
                                    href={PHONE_TEL}
                                    className="group relative flex w-full min-h-[54px] items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-emerald-600 px-5 text-white transition-all hover:bg-emerald-700 active:scale-[0.985] touch-manipulation select-none motion-safe:animate-[cta-pulse-green_2.2s_ease-in-out_infinite] shadow-[0_8px_24px_rgba(5,150,105,0.35)]"
                                >
                                    <span
                                        aria-hidden
                                        className="absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/20 blur-md motion-safe:animate-[sheen_3s_ease-in-out_infinite]"
                                    />
                                    <Phone size={18} strokeWidth={2.4} className="shrink-0" />
                                    <span className="brand-font text-[1.15rem] font-black tabular-nums tracking-tight">
                                        Call Now: {PHONE_DISPLAY}
                                    </span>
                                    <span className="text-[10px] font-semibold opacity-85 whitespace-nowrap">
                                        tap to call
                                    </span>
                                </a>

                                {/* Timer + expiry note */}
                                <div className="mt-2.5 flex items-center justify-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                        Code expires in
                                    </span>
                                    <span
                                        className={`brand-font rounded-md px-1.5 py-0.5 text-[0.95rem] font-black leading-none tabular-nums ${
                                            urgent
                                                ? "bg-red-50 text-red-600"
                                                : "bg-emerald-50 text-emerald-700"
                                        }`}
                                    >
                                        {mm}:{ss}
                                    </span>
                                </div>
                                <div className="mx-auto mt-2 h-[3px] w-full max-w-[20rem] overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
                                            urgent ? "bg-red-500" : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                                <p className="mx-auto mt-2.5 max-w-[22rem] text-center text-[10.5px] leading-[1.55] text-gray-400">
                                    Call immediately to finalize your setup and claim
                                    your Secret Vault Code. (Your temporary code
                                    expires when this page closes. Call within the
                                    next 10 minutes to secure your bonuses!)
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
