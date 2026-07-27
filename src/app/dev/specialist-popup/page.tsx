"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SpecialistWelcomePopup } from "@/components/ui/specialist-welcome-popup";
import {
    VariantConcierge,
    VariantCountdown,
    VariantSpecialistCard,
} from "@/components/ui/specialist-popup-variants";

/**
 * Development-only visual preview.
 *   /dev/specialist-popup             → current production design
 *   /dev/specialist-popup?v=a         → Variant A (VIP Concierge)
 *   /dev/specialist-popup?v=b         → Variant B (Countdown-first)
 *   /dev/specialist-popup?v=c         → Variant C (Specialist card)
 * Skips geo/IP and business-hours gates so you can inspect the UI.
 */

const VARIANTS = [
    { key: "", label: "Current" },
    { key: "a", label: "A · Concierge" },
    { key: "b", label: "B · Countdown" },
    { key: "c", label: "C · Specialist" },
] as const;

function PreviewInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const variant = (searchParams.get("v") ?? "").toLowerCase();

    return (
        <div className="min-h-dvh bg-page text-white">
            <div className="fixed left-1/2 top-3 z-[200] flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-black/80 p-1 backdrop-blur">
                {VARIANTS.map(({ key, label }) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() =>
                            router.replace(
                                key
                                    ? `/dev/specialist-popup?v=${key}`
                                    : "/dev/specialist-popup"
                            )
                        }
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                            variant === key
                                ? "bg-accent text-black"
                                : "text-white/60 hover:text-white"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {variant === "" ? (
                <>
                    <div className="flex min-h-dvh items-center justify-center p-6">
                        <div className="max-w-md space-y-3 text-center">
                            <p className="text-sm uppercase tracking-widest text-white/60">
                                Dev preview
                            </p>
                            <h1 className="text-2xl font-bold">
                                Start-Up Specialist Popup
                            </h1>
                            <p className="text-sm text-white/70">
                                Production users only see this when US/CA + Mon–Fri
                                08:30–17:30 PT.
                            </p>
                        </div>
                    </div>
                    <SpecialistWelcomePopup forceOpen />
                </>
            ) : (
                <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 backdrop-blur-[2px] sm:items-center sm:p-4">
                    {variant === "a" && <VariantConcierge />}
                    {variant === "b" && <VariantCountdown />}
                    {variant === "c" && <VariantSpecialistCard />}
                </div>
            )}
        </div>
    );
}

export default function SpecialistPopupPreviewPage() {
    return (
        <Suspense fallback={null}>
            <PreviewInner />
        </Suspense>
    );
}
