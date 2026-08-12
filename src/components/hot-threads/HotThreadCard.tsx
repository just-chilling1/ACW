"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { PlatformBadge } from "@/components/ui/platform-badge";
import type { HotThreadItem } from "@/lib/hot-threads/types";

const REPLY_LABELS = ["Short", "Detailed", "Curiosity"] as const;

interface HotThreadCardProps {
  item: HotThreadItem;
  index: number;
}

export function HotThreadCard({ item, index }: HotThreadCardProps) {
  const [replyIndex, setReplyIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const replies = item.replies?.length ? item.replies : ["No reply available yet."];
  const activeReply = replies[Math.min(replyIndex, replies.length - 1)];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeReply);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="card-base flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">#{index + 1}</span>
          <PlatformBadge platform={item.platform} />
          {item.engagement != null && item.engagement !== "" && (
            <span className="text-[10px] tabular-nums text-text-muted">
              {typeof item.engagement === "number"
                ? `${item.engagement.toLocaleString()} engagements`
                : String(item.engagement)}
            </span>
          )}
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
          >
            Open thread
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {item.title && <h3 className="ds-h5 leading-snug">{item.title}</h3>}
      <p className="line-clamp-4 text-sm text-text-secondary">{item.text}</p>

      <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex flex-wrap gap-2">
          {REPLY_LABELS.slice(0, replies.length).map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setReplyIndex(i)}
              className={clsx(
                "btn-chip text-xs",
                replyIndex === i && "btn-chip-active",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{activeReply}</p>
        <button type="button" onClick={handleCopy} className="btn-primary w-fit">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy reply"}
        </button>
      </div>
    </article>
  );
}
