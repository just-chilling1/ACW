"use client";

import { Check, Copy } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

type PostCardProps = {
  niche: string;
  text: string;
  className?: string;
  onCopy?: (text: string) => void;
};

export function PostCard({ niche, text, className, onCopy }: PostCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopy?.(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <article className={clsx("card-base flex h-full flex-col gap-3 p-4!", className)}>
      <span className="w-fit rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {niche}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{text}</p>
      <button type="button" onClick={handleCopy} className="btn-secondary mt-auto w-full text-xs">
        {copied ? (
          <>
            <Check size={14} className="text-[var(--success)]" />
            Copied
          </>
        ) : (
          <>
            <Copy size={14} strokeWidth={1.75} />
            Copy post
          </>
        )}
      </button>
    </article>
  );
}
