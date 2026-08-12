"use client";

import { Bookmark, Check, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton } from "@/components/dfy/copy-button";
import type { VaultEntry } from "@/lib/vault/types";

function PlatformLabel({ platform }: { platform: VaultEntry["platform"] }) {
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-text-muted">
      {platform === "quora" ? "Quora" : "Pinterest"}
    </span>
  );
}

export function VaultEntryCard({
  entry,
  saved,
  used,
  onToggleSaved,
  onToggleUsed,
  disabled,
  onCustomize,
  customizing,
  customizeError,
  showSavedUsed = true,
  onDelete,
  deleting,
  offerLabel,
}: {
  entry: VaultEntry;
  saved?: boolean;
  used?: boolean;
  onToggleSaved?: () => void;
  onToggleUsed?: () => void;
  disabled?: boolean;
  onCustomize?: () => void;
  customizing?: boolean;
  customizeError?: string | null;
  showSavedUsed?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
  offerLabel?: string;
}) {
  const openUrl = entry.platform === "quora" ? "https://www.quora.com" : "https://www.pinterest.com";
  const openLabel = entry.platform === "quora" ? "Open Quora" : "Open Pinterest";

  return (
    <article className={clsx("flex flex-col gap-4 p-5 card-base", used && "opacity-80")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformLabel platform={entry.platform} />
          <span className="text-xs font-semibold text-text-muted">{entry.angle}</span>
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
        >
          {openLabel}
          <ExternalLink size={12} />
        </a>
      </div>

      {entry.platform === "quora" ? (
        <>
          <h3 className="ds-h5 leading-snug">{entry.question}</h3>
          {offerLabel ? (
            <p className="text-xs font-semibold text-text-muted">Customized for {offerLabel}</p>
          ) : null}
          <p className="text-xs text-text-muted">
            Search Quora for: <span className="text-text-secondary">{entry.searchQuery}</span>
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{entry.answer}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={entry.answer} label="Copy answer" variant="primary" />
            <CopyButton text={entry.searchQuery} label="Copy search" />
          </div>
        </>
      ) : (
        <>
          <h3 className="ds-h5 leading-snug">{entry.pinTitle}</h3>
          {offerLabel ? (
            <p className="text-xs font-semibold text-text-muted">Customized for {offerLabel}</p>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
            {entry.pinDescription}
          </p>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Board
              </dt>
              <dd className="text-text-secondary">{entry.boardName}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Image concept
              </dt>
              <dd className="text-text-secondary">{entry.imageConcept}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={entry.pinDescription} label="Copy description" variant="primary" />
            <CopyButton text={entry.pinTitle} label="Copy title" />
            <CopyButton text={entry.boardName} label="Copy board" />
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
        {onCustomize ? (
          <button
            type="button"
            disabled={disabled || customizing}
            onClick={onCustomize}
            className="btn-secondary text-xs"
          >
            <Sparkles size={14} />
            {customizing ? "Customizing…" : "Customize to my offer"}
          </button>
        ) : null}
        {showSavedUsed && onToggleSaved ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onToggleSaved}
            className={clsx("btn-secondary text-xs", saved && "btn-chip-active")}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </button>
        ) : null}
        {showSavedUsed && onToggleUsed ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onToggleUsed}
            className={clsx("btn-secondary text-xs", used && "btn-chip-active")}
          >
            <Check size={14} />
            {used ? "Used" : "Mark used"}
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            disabled={disabled || deleting}
            onClick={onDelete}
            className="btn-secondary text-xs"
          >
            <Trash2 size={14} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        ) : null}
      </div>
      {customizeError ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {customizeError}
        </p>
      ) : null}
    </article>
  );
}
