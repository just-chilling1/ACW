"use client";

import { Bookmark, Check, Clock, Sparkles, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton } from "@/components/dfy/copy-button";
import {
  formatHashtags,
  formatScriptForCopy,
  platformLabel,
} from "@/lib/vault/shorts-format";
import type { ShortsScript } from "@/lib/vault/shorts-types";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-text-muted">
      {children}
    </span>
  );
}

export function ShortsScriptCard({
  script,
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
  script: ShortsScript;
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
  const hookEnd = script.beats[0]?.timecode.split("-")[0] ?? "0:00";

  return (
    <article className={clsx("flex flex-col gap-4 p-5 card-base", used && "opacity-80")}>
      <div className="flex flex-wrap items-center gap-2">
        {script.platforms.map((tag) => (
          <Badge key={tag}>{platformLabel(tag)}</Badge>
        ))}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
          <Clock size={12} />
          {script.durationSeconds}s
        </span>
        <span className="text-xs font-semibold text-text-muted">{script.format}</span>
        <span className="text-xs text-text-muted">{script.angle}</span>
      </div>

      <h3 className="ds-h5 leading-snug">{script.title}</h3>
      {offerLabel ? (
        <p className="text-xs font-semibold text-text-muted">Customized for {offerLabel}</p>
      ) : null}

      <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Hook · 0:00-{hookEnd}
        </p>
        <p className="mt-1 text-base font-semibold leading-snug text-text-primary">
          {script.hook}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {script.beats.map((beat, index) => (
          <li
            key={`${script.id}-beat-${index}`}
            className="border-l-2 border-[var(--border-subtle)] pl-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {beat.timecode}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-primary">{beat.voiceover}</p>
            <p className="mt-1 text-xs text-text-secondary">
              <span className="font-semibold">On screen:</span> {beat.onScreen}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              <span className="font-semibold">Show:</span> {beat.visual}
            </p>
          </li>
        ))}
      </ol>

      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Spoken CTA
          </dt>
          <dd className="text-text-secondary">{script.cta}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Caption
          </dt>
          <dd className="whitespace-pre-wrap text-text-secondary">{script.caption}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Hashtags
          </dt>
          <dd className="text-text-secondary">{formatHashtags(script.hashtags)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            How to shoot it
          </dt>
          <dd className="text-text-secondary">{script.visualStyle}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Sound
          </dt>
          <dd className="text-text-secondary">{script.soundNote}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <CopyButton
          text={formatScriptForCopy(script)}
          label="Copy full script"
          variant="primary"
        />
        <CopyButton text={script.caption} label="Copy caption" />
        <CopyButton text={formatHashtags(script.hashtags)} label="Copy hashtags" />
        <CopyButton text={script.hook} label="Copy hook" />
      </div>

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
