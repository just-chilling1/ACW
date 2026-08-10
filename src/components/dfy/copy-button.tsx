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

async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            /* fall through to legacy copy */
        }
    }

    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}

export function CopyButton({
    text,
    label = "Copy",
    copiedLabel = "Copied",
    className,
    variant = "secondary",
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!text?.trim()) {
            setFailed(true);
            window.setTimeout(() => setFailed(false), 1600);
            return;
        }
        const ok = await copyToClipboard(text);
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        } else {
            setFailed(true);
            window.setTimeout(() => setFailed(false), 1600);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={clsx(
                variant === "primary" ? "btn-primary" : "btn-secondary",
                "shrink-0 px-3 py-2 text-xs sm:text-sm",
                className,
            )}
        >
            {copied ? (
                <>
                    <Check size={14} strokeWidth={2} className="text-[var(--success)]" />
                    {copiedLabel}
                </>
            ) : failed ? (
                <>
                    <Copy size={14} strokeWidth={1.75} />
                    Copy failed
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
