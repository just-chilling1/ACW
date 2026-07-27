"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Phone, X } from "lucide-react";

const SESSION_DISMISS_KEY = "cashtap_specialist_popup_dismissed";
const COUNTDOWN_MS = 10 * 60 * 1000;
const PHONE_DISPLAY = "425-458-1656";
const PHONE_TEL = "tel:+14254581656";

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

export function SpecialistWelcomePopup() {
    const [open, setOpen] = useState(false);
    const [remainingMs, setRemainingMs] = useState(COUNTDOWN_MS);

    useEffect(() => {
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
                setOpen(true);
            } catch {
                // Network/abort — never show on failure (safe default)
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, []);

    const dismiss = useCallback(() => {
        setOpen(false);
        try {
            sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
        } catch {
            // ignore
        }
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") dismiss();
        },
        [dismiss]
    );

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, handleKeyDown]);

    useEffect(() => {
        if (!open) return;

        const startedAt = Date.now();
        const tick = () => {
            const left = COUNTDOWN_MS - (Date.now() - startedAt);
            setRemainingMs(Math.max(0, left));
        };

        tick();
        const id = window.setInterval(tick, 250);
        return () => window.clearInterval(id);
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    const expired = remainingMs <= 0;

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
            <button
                type="button"
                aria-label="Close welcome offer"
                className="absolute inset-0 bg-black/70"
                onClick={dismiss}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="specialist-welcome-title"
                className="relative z-10 flex flex-col w-full max-w-lg max-h-[min(92dvh,40rem)] overflow-hidden rounded-2xl border-2 border-[#fbbf24]/40 bg-gradient-to-b from-[#101726] to-[#0b0f18] shadow-[0_0_40px_rgba(251,191,36,0.12)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-2">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-400 mb-2">
                            Dedicated Support
                        </p>
                        <h2
                            id="specialist-welcome-title"
                            className="text-xl sm:text-2xl font-black uppercase text-white leading-tight"
                        >
                            Welcome To CashTap AI
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Close"
                        className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 space-y-4 text-left">
                    <p className="text-sm text-white/80 leading-relaxed">
                        As part of our commitment to{" "}
                        <span className="font-bold text-white">YOUR</span> success…
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                        …And to fast-track your results and skip the learning curve.
                    </p>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                        You have been assigned a dedicated Start-Up Specialist.
                    </p>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#fbbf24] mb-2">
                            Who will help you:
                        </p>
                        <ul className="space-y-2">
                            {[
                                "Skip all the learning curve and all the wait",
                                "Get results from day zero",
                                "Scale your results to $1,000 - $2,000 per day",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-2 text-sm text-white/90"
                                >
                                    <Check
                                        size={16}
                                        className="text-emerald-400 shrink-0 mt-0.5"
                                    />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 px-4 py-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#fbbf24] mb-1">
                            Plus
                        </p>
                        <p className="text-sm font-semibold text-white leading-snug">
                            He will unlock our secret vault bonuses for you for{" "}
                            <span className="text-emerald-400">FREE</span>
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                            Worth over{" "}
                            <span className="font-bold text-white">$11,385.32</span> in
                            retail value
                        </p>
                    </div>

                    <a
                        href={PHONE_TEL}
                        className="flex w-full items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(251,191,36,0.35)] active:scale-[0.98]"
                    >
                        <Phone size={18} />
                        Call Now: {PHONE_DISPLAY}
                        <span className="text-[10px] font-bold normal-case tracking-normal text-black/70">
                            (tap to call)
                        </span>
                    </a>

                    <p className="text-sm text-center text-white/85 leading-relaxed">
                        Call immediately to finalize your setup and claim your Secret
                        Vault Code
                    </p>

                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
                        <p className="text-xs text-white/70 leading-relaxed">
                            Your temporary code expires when this page closes.
                        </p>
                        {expired ? (
                            <p className="mt-2 text-sm font-bold text-red-400">
                                Offer window expired — call now to still claim your
                                bonuses!
                            </p>
                        ) : (
                            <p className="mt-2 text-sm font-bold text-white">
                                Call within the next{" "}
                                <span className="tabular-nums text-[#fbbf24]">
                                    {formatCountdown(remainingMs)}
                                </span>{" "}
                                to secure your bonuses!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
