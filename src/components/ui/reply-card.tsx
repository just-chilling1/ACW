"use client";

import { Check, Copy } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

type ReplyCardProps = {
  styleLabel?: string;
  text: string;
  className?: string;
};

export function ReplyCard({ styleLabel, text, className }: ReplyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <article className={clsx("card-base flex flex-col gap-3 p-4!", className)}>
      {styleLabel ? (
        <span className="page-eyebrow text-[10px]! tracking-[0.12em]!">{styleLabel}</span>
      ) : null}
      <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{text}</p>
      <div className="flex justify-end border-t border-[var(--border-subtle)] pt-3">
        <button type="button" onClick={handleCopy} className="btn-secondary px-3 py-2 text-xs">
          {copied ? (
            <>
              <Check size={14} strokeWidth={2} className="text-[var(--success)]" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </div>
    </article>
  );
}
