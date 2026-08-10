"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

type CopyButtonProps = {
    text: string;
    label?: string;
    copiedLabel?: string;
    className?: string;
    variant?: "primary" | "secondary";
};

export function CopyButton({
    text,
    label = "Copy",
    copiedLabel = "Copied",
    className,
    variant = "secondary",
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        } catch {
            /* ignore */
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={clsx(
                variant === "primary" ? "btn-primary" : "btn-secondary",
                "px-3 py-2 text-xs sm:text-sm",
                className,
            )}
        >
            {copied ? (
                <>
                    <Check size={14} strokeWidth={2} className="text-[var(--success)]" />
                    {copiedLabel}
                </>
            ) : (
                <>
                    <Copy size={14} strokeWidth={1.75} />
                    {label}
                </>
            )}
        </button>
    );
}
