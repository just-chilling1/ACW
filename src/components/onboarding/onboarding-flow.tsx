"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { supabase } from "@/lib/supabase";
import {
    onboardingContent,
    ONBOARDING_PRODUCT_NAME,
} from "@/config/onboarding-content";

export function OnboardingFlow() {
    const cfg = onboardingContent.activation;

    const [firstName, setFirstName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activationStep, setActivationStep] = useState(0);

    useEffect(() => {
        const timers = cfg.infoSteps.map((_, i) =>
            window.setTimeout(() => setActivationStep(i + 1), 600 * (i + 1))
        );
        return () => timers.forEach(window.clearTimeout);
    }, [cfg.infoSteps]);

    const handleActivate = async () => {
        const trimmed = firstName.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName: trimmed }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { error?: string } | null;
                setError(payload?.error ?? "Could not activate your system. Please try again.");
                return;
            }

            await supabase.auth.refreshSession();
            window.location.assign(onboardingContent.dashboardRoute);
        } catch {
            setError("Could not activate your system. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex h-dvh overflow-hidden">
            <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-8 backdrop-blur-xl lg:flex">
                <div className="flex flex-col gap-2">
                    <BrandLogo variant="wordmark" size="sm" priority />
                    <p className="text-sm text-text-secondary">{onboardingContent.productTagline}</p>
                </div>

                <ul className="mt-10 space-y-3">
                    {cfg.sidebarStatus.map((item, i) => (
                        <li
                            key={item.label}
                            className={`rounded-[var(--radius-lg)] border p-4 transition-all duration-500 ${
                                activationStep > i
                                    ? "translate-x-0 border-accent/30 bg-accent/10 opacity-100"
                                    : "border-[var(--border-subtle)] bg-[var(--surface-2)]"
                            }`}
                        >
                            <p className="text-xs font-medium text-text-muted">{item.label}</p>
                            <p className="text-sm font-bold text-accent">{item.status}</p>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="flex flex-1 min-h-0 flex-col overflow-y-auto">
                <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12 sm:px-10">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <BrandLogo variant="mark" size="sm" priority />
                        <div>
                            <p className="text-base font-black text-text-primary">{ONBOARDING_PRODUCT_NAME}</p>
                            <p className="text-xs text-text-secondary">{onboardingContent.productTagline}</p>
                        </div>
                    </div>

                    <h1 className="ds-h1 text-[clamp(1.75rem,4vw,2.5rem)]">{cfg.headline}</h1>
                    <p className="mt-3 ds-subtitle text-lg">{cfg.subheadline}</p>

                    <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={cfg.inputPlaceholder}
                        autoComplete="given-name"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && firstName.trim() && !submitting) {
                                void handleActivate();
                            }
                        }}
                        className="input-base mt-8 h-16 px-5 text-xl"
                    />

                    <div className="card-base mt-8">
                        <p className="mb-4 ds-h6">{cfg.infoTitle}</p>
                        <ol className="space-y-3">
                            {cfg.infoSteps.map((step, i) => (
                                <li
                                    key={step}
                                    className={`flex items-start gap-3 text-sm transition-all duration-500 ${
                                        activationStep > i ? "text-text-secondary" : "text-text-muted"
                                    }`}
                                >
                                    <span
                                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                            activationStep > i
                                                ? "bg-accent text-[var(--text-on-accent)]"
                                                : "bg-[var(--surface-3)] text-text-muted"
                                        }`}
                                    >
                                        {activationStep > i ? <Check size={14} strokeWidth={3} /> : i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    <p className="mt-5 text-sm font-medium text-accent">{cfg.note}</p>

                    {error ? (
                        <p className="mt-5 text-sm font-medium text-[var(--danger)]">{error}</p>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => void handleActivate()}
                        disabled={!firstName.trim() || submitting}
                        className="btn-primary mt-8 h-16 w-full text-xl font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Activating…" : cfg.ctaLabel}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default OnboardingFlow;
