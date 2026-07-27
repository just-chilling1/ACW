"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SpecialistWelcomePopup } from "@/components/ui/specialist-welcome-popup";

/**
 * Public iframe embed for the Start-Up Specialist popup.
 *
 * Usage on any external website:
 *   <iframe src="https://cashtapaiaccess.com/embed/specialist-popup" ...>
 *
 * Runs the exact production gate (US/CA IP + Mon–Fri 08:30–17:30 PT via the
 * eligibility API), the 10-minute countdown, and CTA click tracking. Posts
 * `{ type: "cashtap-specialist-popup", open: boolean }` to the parent window
 * so the host page can show/hide the iframe. See EMBED.md for the snippet.
 */

function EmbedInner() {
    const searchParams = useSearchParams();
    // Dev-only visual preview; ignored in production builds.
    const preview =
        process.env.NODE_ENV === "development" &&
        searchParams.get("preview") === "1";

    useEffect(() => {
        // Keep the iframe transparent so only the popup is visible on the host page.
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
    }, []);

    const notifyParent = useCallback((open: boolean) => {
        try {
            window.parent?.postMessage(
                { type: "cashtap-specialist-popup", open },
                "*"
            );
        } catch {
            // host page may block messaging; popup still works standalone
        }
    }, []);

    return (
        <SpecialistWelcomePopup forceOpen={preview} onOpenChange={notifyParent} />
    );
}

export default function SpecialistPopupEmbedPage() {
    return (
        <Suspense fallback={null}>
            <EmbedInner />
        </Suspense>
    );
}
