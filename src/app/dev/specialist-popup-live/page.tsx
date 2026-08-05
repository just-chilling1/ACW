"use client";

import { SpecialistWelcomePopup } from "@/components/ui/specialist-welcome-popup";

/**
 * Development-only END-TO-END gate check.
 * Mounts the popup exactly like production (no forceOpen): it should appear
 * ONLY when the eligibility API returns eligible (US/CA IP + Mon–Fri
 * 08:30–17:30 PT). Outside those conditions this page must stay empty.
 */
export default function SpecialistPopupLiveGatePage() {
    return (
        <div className="min-h-dvh flex items-center justify-center p-6 text-text-primary">
            <div className="max-w-md text-center space-y-3">
                <p className="ds-annotation text-text-tertiary">
                    Dev live-gate check
                </p>
                <h1 className="text-2xl font-bold">Production Gating Test</h1>
                <p className="ds-body-sm text-text-secondary">
                    The popup below uses the REAL eligibility gate. It should only
                    appear if your IP is US/CA and it is Mon–Fri 08:30–17:30 PT
                    right now.
                </p>
            </div>
            <SpecialistWelcomePopup />
        </div>
    );
}
