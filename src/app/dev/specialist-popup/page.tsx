"use client";

import { SpecialistWelcomePopup } from "@/components/ui/specialist-welcome-popup";

/**
 * Development-only visual preview.
 * Open http://localhost:3000/dev/specialist-popup
 * Skips geo/IP and business-hours gates so you can inspect the UI.
 */
export default function SpecialistPopupPreviewPage() {
    return (
        <div className="min-h-dvh bg-page text-white flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-3">
                <p className="text-sm text-white/60 uppercase tracking-widest">
                    Dev preview
                </p>
                <h1 className="text-2xl font-bold">Start-Up Specialist Popup</h1>
                <p className="text-sm text-white/70">
                    This route forces the popup open for local design review. Production
                    users only see it when US/CA + Mon–Fri 08:30–17:30 PT.
                </p>
            </div>
            <SpecialistWelcomePopup forceOpen />
        </div>
    );
}
