"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, Flame } from "lucide-react";
import { clsx } from "clsx";
import { PlatformBadge } from "@/components/ui/platform-badge";
import {
  DISPLAY_LINK_LABEL,
  HOT_THREAD_REPLY_STYLES,
  LINK_PLACEHOLDER,
  type HotThreadItem,
} from "@/lib/hot-threads/types";

interface HotThreadCardProps {
  item: HotThreadItem;
  index: number;
  featured?: boolean;
}

function normalizeReplyForDisplay(reply: string): string {
  return reply.split(LINK_PLACEHOLDER).join(DISPLAY_LINK_LABEL);
}

function renderReplyWithLinkCue(reply: string): ReactNode {
  const text = normalizeReplyForDisplay(reply);
  const parts = text.split(DISPLAY_LINK_LABEL);
  if (parts.length === 1) return text;

  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? (
        <mark className="rounded-[var(--radius-sm)] bg-[var(--accent-bg-faint)] px-1 py-0.5 font-semibold text-[var(--gold-text)] not-italic">
          {DISPLAY_LINK_LABEL}
        </mark>
      ) : null}
    </span>
  ));
}

export function HotThreadCard({ item, index, featured = false }: HotThreadCardProps) {
  const [replyIndex, setReplyIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showStyles, setShowStyles] = useState(true);

  const replies = item.replies?.length ? item.replies : ["No reply available yet."];
  const styles = HOT_THREAD_REPLY_STYLES.slice(0, replies.length);
  const safeIndex = Math.min(replyIndex, replies.length - 1);
  const activeReply = normalizeReplyForDisplay(replies[safeIndex]);
  const activeStyle = styles[safeIndex] ?? HOT_THREAD_REPLY_STYLES[0];
  const hasLinkCue = activeReply.includes(DISPLAY_LINK_LABEL);

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
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gold-text)]">
              Your reply
            </p>
            <p className="text-xs text-text-muted">
              {activeStyle.label}
              {activeStyle.brief ? ` · ${activeStyle.brief}` : ""}
            </p>
          </div>
          {replies.length > 1 ? (
            <button
              type="button"
              onClick={() => setShowStyles((v) => !v)}
              className="btn-ghost px-2 py-1 text-xs"
            >
              {showStyles ? "Hide styles" : "Show styles"}
            </button>
          ) : null}
        </div>

        {showStyles && replies.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {styles.map((style, i) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setReplyIndex(i)}
                title={style.brief}
                className={clsx("btn-chip text-xs", safeIndex === i && "btn-chip-active")}
              >
                {style.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="rounded-[var(--radius-md)] border border-[var(--accent-border-soft)] bg-[var(--surface-2)] p-3 sm:p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
            {renderReplyWithLinkCue(replies[safeIndex])}
          </p>
        </div>

        {hasLinkCue ? (
          <p className="text-xs text-text-muted">
            When you post, replace{" "}
            <span className="font-semibold text-[var(--gold-text)]">{DISPLAY_LINK_LABEL}</span> with
            your affiliate URL.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleCopy} className="btn-primary w-fit">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy reply"}
          </button>
        </div>
      </div>
    </article>
  );
}
