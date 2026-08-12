"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Flame } from "lucide-react";
import { clsx } from "clsx";
import { PlatformBadge } from "@/components/ui/platform-badge";
import type { HotThreadItem } from "@/lib/hot-threads/types";

const REPLY_LABELS = ["Short", "Detailed", "Curiosity"] as const;

interface HotThreadCardProps {
  item: HotThreadItem;
  index: number;
  featured?: boolean;
}

export function HotThreadCard({ item, index, featured = false }: HotThreadCardProps) {
  const [replyIndex, setReplyIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(featured);

  const replies = item.replies?.length ? item.replies : ["No reply available yet."];
  const activeReply = replies[Math.min(replyIndex, replies.length - 1)];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeReply);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      className={clsx(
        "flex flex-col gap-4 p-5",
        featured
          ? "rounded-[var(--radius-lg)] border border-[var(--accent-border-strong)] bg-[var(--accent-bg-faint)] shadow-[0_0_0_1px_var(--accent-border-soft)]"
          : "card-base",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {featured ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)]">
              <Flame size={14} />
              Top pick today
            </span>
          ) : (
            <span className="text-xs font-semibold text-text-muted">#{index + 1}</span>
          )}
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
            className={clsx(
              "shrink-0 px-3 py-1.5 text-xs",
              featured ? "btn-primary" : "btn-secondary",
            )}
          >
            Open thread
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {item.title && (
        <h3 className={clsx("leading-snug", featured ? "ds-h4" : "ds-h5")}>{item.title}</h3>
      )}
      <p
        className={clsx(
          "text-sm text-text-secondary",
          featured ? "line-clamp-5" : "line-clamp-2",
        )}
      >
        {item.text}
      </p>

      <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
        {showAllReplies && replies.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {REPLY_LABELS.slice(0, replies.length).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setReplyIndex(i)}
                className={clsx("btn-chip text-xs", replyIndex === i && "btn-chip-active")}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p
          className={clsx(
            "whitespace-pre-wrap text-sm leading-relaxed text-text-primary",
            !featured && !showAllReplies && "line-clamp-3",
          )}
        >
          {activeReply}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleCopy} className="btn-primary w-fit">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy reply"}
          </button>
          {!featured && replies.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllReplies((v) => !v)}
              className="btn-secondary text-xs"
            >
              {showAllReplies ? "Hide styles" : "More reply styles"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
