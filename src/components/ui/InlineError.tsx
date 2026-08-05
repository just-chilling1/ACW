"use client";

import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export function InlineError({
    message,
    className,
}: {
    message: string;
    className?: string;
}) {
    if (!message) return null;

    return (
        <div
            role="alert"
            className={clsx(
                "error-banner items-start",
                className
            )}
        >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
            <span className="leading-snug">{message}</span>
        </div>
    );
}
