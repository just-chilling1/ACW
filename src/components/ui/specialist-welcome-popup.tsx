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
    "Scale your results to $1,000 - $2,000 per day",
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

/** Hairline divider with a centered small-caps label. */
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/12" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent/90">
                {children}
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/12" />
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
                        className="relative z-10 w-full max-w-[24.5rem] sm:max-w-[34rem] p-[1px] max-sm:rounded-t-[1.5rem] sm:rounded-[1.5rem] bg-gradient-to-b from-accent/50 via-white/10 to-transparent shadow-[0_-16px_70px_rgba(0,0,0,0.8)]"
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
                        <div className="relative flex max-h-[min(96dvh,44rem)] flex-col overflow-hidden max-sm:rounded-t-[calc(1.5rem-1px)] sm:rounded-[calc(1.5rem-1px)] bg-[#0B0C0F]">
                            {/* Soft gold aurora */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(234,179,8,0.13),transparent_70%)]"
                            />

                            <button
                                type="button"
                                onClick={dismiss}
                                aria-label="Close"
                                className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white active:bg-white/15 touch-manipulation"
                            >
                                <X size={18} />
                            </button>

                            {/* Content — sized to fit a phone screen without scrolling */}
                            <div
                                className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-1 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 sm:pt-7"
                                style={{ WebkitOverflowScrolling: "touch" }}
                            >
                                {/* Title */}
                                <p className="text-center text-[10px] font-bold uppercase tracking-[0.34em] text-text-muted">
                                    Welcome To
                                </p>
                                <h2
                                    id={titleId}
                                    className="brand-font mt-1.5 text-center text-[1.9rem] sm:text-[2.1rem] font-black leading-none tracking-tight"
                                >
                                    <span className="bg-gradient-to-b from-[#fde047] via-accent to-[#b8860b] bg-clip-text text-transparent">
                                        CashTap AI
                                    </span>
                                </h2>

                                {/* Intro copy */}
                                <div className="mx-auto mt-5 max-w-[21rem] space-y-1.5 text-center text-[12.5px] leading-[1.6] text-text-secondary">
                                    <p>
                                        As part of our commitment to{" "}
                                        <span className="font-semibold text-text-primary">
                                            YOUR
                                        </span>{" "}
                                        success…
                                    </p>
                                    <p>
                                        …And to fast-track your results and skip the
                                        learning curve.
                                    </p>
                                </div>
                                <p className="mx-auto mt-3 max-w-[19rem] text-center text-[14.5px] font-semibold leading-snug text-text-primary">
                                    You have been assigned a dedicated
                                    <br />
                                    Start-Up Specialist.
                                </p>

                                {/* Two columns on desktop, stacked on mobile */}
                                <div className="mt-6 grid gap-6 sm:grid-cols-[1.15fr_auto_1fr] sm:items-start sm:gap-6">
                                    <div>
                                        <SectionLabel>
                                            Who will help you
                                        </SectionLabel>
                                        <ul className="mx-auto mt-3 max-w-[19.5rem] space-y-2 sm:mx-0 sm:max-w-none">
                                            {BENEFITS.map((item) => (
                                                <li
                                                    key={item}
                                                    className="flex items-start gap-2.5 text-[13px] leading-snug text-text-primary/90"
                                                >
                                                    <span className="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                                                        <Check
                                                            size={9}
                                                            strokeWidth={3.5}
                                                            className="text-accent"
                                                        />
                                                    </span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div
                                        aria-hidden
                                        className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-white/12 to-transparent sm:block"
                                    />

                                    <div>
                                        <SectionLabel>Plus</SectionLabel>
                                        <p className="mx-auto mt-3 max-w-[19.5rem] text-center text-[13.5px] font-semibold leading-relaxed text-text-primary sm:mx-0 sm:max-w-none sm:text-left">
                                            He will unlock our secret vault bonuses
                                            for you for{" "}
                                            <span className="text-accent">FREE</span>
                                        </p>
                                        <p className="mt-1.5 text-center text-[12px] leading-relaxed text-text-muted sm:text-left">
                                            Worth over{" "}
                                            <span className="brand-font font-bold tabular-nums text-text-primary">
                                                $11,385.32
                                            </span>{" "}
                                            in retail value
                                        </p>
                                    </div>
                                </div>

                                {/* Expiry note */}
                                <p className="mx-auto mt-6 max-w-[21rem] text-center text-[11px] leading-[1.6] text-text-muted sm:max-w-none">
                                    (Your temporary code expires when this page
                                    closes. Call within the next 10 minutes to secure
                                    your bonuses!)
                                </p>
                            </div>

                            {/* CTA dock with urgency timer */}
                            <div className="relative z-10 shrink-0 border-t border-white/[0.07] px-6 pt-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
                                {/* Timer: label + segmented digits + draining bar */}
                                <div className="mb-3.5">
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">
                                            Code expires in
                                        </span>
                                        <div
                                            className={`flex items-center gap-1 ${
                                                urgent ? "text-error" : "text-accent"
                                            }`}
                                        >
                                            <span
                                                className={`brand-font rounded-md border px-1.5 py-0.5 text-[1.05rem] font-black leading-none tabular-nums ${
                                                    urgent
                                                        ? "border-error/40 bg-error/10"
                                                        : "border-accent/30 bg-accent/[0.08]"
                                                }`}
                                            >
                                                {mm}
                                            </span>
                                            <span className="brand-font text-[1rem] font-black leading-none opacity-70 motion-safe:animate-pulse">
                                                :
                                            </span>
                                            <span
                                                className={`brand-font rounded-md border px-1.5 py-0.5 text-[1.05rem] font-black leading-none tabular-nums ${
                                                    urgent
                                                        ? "border-error/40 bg-error/10"
                                                        : "border-accent/30 bg-accent/[0.08]"
                                                }`}
                                            >
                                                {ss}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mx-auto mt-2.5 h-[3px] w-full max-w-[22rem] overflow-hidden rounded-full bg-white/[0.07]">
                                        <div
                                            className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
                                                urgent
                                                    ? "bg-gradient-to-r from-error to-[#f87171]"
                                                    : "bg-gradient-to-r from-accent to-[#fde047]"
                                            }`}
                                            style={{
                                                width: `${progressPct}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <a
                                    href={PHONE_TEL}
                                    className="group relative flex w-full min-h-[56px] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-b from-[#f5c211] to-[#d4a406] px-5 text-black transition-all hover:brightness-105 active:scale-[0.985] touch-manipulation select-none motion-safe:animate-[cta-pulse_2.2s_ease-in-out_infinite] shadow-[0_10px_28px_rgba(234,179,8,0.32),inset_0_1px_0_rgba(255,255,255,0.35)]"
                                >
                                    <span
                                        aria-hidden
                                        className="absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/30 blur-md motion-safe:animate-[sheen_3s_ease-in-out_infinite]"
                                    />
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/90 text-[#f5c211]">
                                        <Phone size={16} strokeWidth={2.5} />
                                    </span>
                                    <span className="flex flex-col items-start leading-none">
                                        <span className="text-[9.5px] font-black uppercase tracking-[0.2em] opacity-80">
                                            Call now · tap to call
                                        </span>
                                        <span className="brand-font mt-[3px] text-[1.35rem] font-black tabular-nums tracking-tight">
                                            {PHONE_DISPLAY}
                                        </span>
                                    </span>
                                </a>
                                <p className="mt-2.5 text-center text-[11px] leading-snug text-text-muted">
                                    Finalize your setup and claim your Secret Vault
                                    Code
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
