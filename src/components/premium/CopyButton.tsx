"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { clsx } from "clsx";

type Props = {
    text: string;
    label?: string;
    className?: string;
    compact?: boolean;
};

export function CopyButton({ text, label = "Copy", className, compact }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={clsx(
                "flex items-center gap-1.5 font-semibold transition-all",
                copied ? "status-success" : compact ? "btn-secondary px-2 py-1 text-[10px]" : "btn-secondary",
                className
            )}
        >
            {copied ? <Check size={compact ? 10 : 14} /> : <Copy size={compact ? 10 : 14} />}
            <span>{copied ? "Copied!" : label}</span>
        </button>
    );
}
