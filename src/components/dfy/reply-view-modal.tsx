"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ExternalLink, X } from "lucide-react";
import { CopyButton } from "@/components/dfy/copy-button";
import { isRealPostUrl } from "@/lib/dfy/post-url";
import type { ReplyCardData } from "@/components/dfy/reply-card";

type ReplyViewModalProps = {
    reply: ReplyCardData | null;
    done: boolean;
    onClose: () => void;
    onToggleDone: (replyId: string) => void;
};

export function ReplyViewModal({ reply, done, onClose, onToggleDone }: ReplyViewModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (!reply) return;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [reply, handleKeyDown]);

    if (!mounted || !reply) return null;

    const canOpenPost = isRealPostUrl(reply.url);

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button
                type="button"
                aria-label="Close reply"
                className="absolute inset-0 overlay-scrim"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="dfy-reply-modal-title"
                className="dfy-reply-modal relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[var(--elevation-3)] sm:rounded-[var(--radius-2xl)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            {reply.platform ? (
                                <span className="dfy-platform-badge">{reply.platform}</span>
                            ) : null}
                            {reply.style ? (
                                <span className="text-xs font-medium capitalize text-text-muted">
                                    {reply.style.replace(/_/g, " ")}
                                </span>
                            ) : null}
                            {done ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold-text)]">
                                    <CheckCircle2 size={12} />
                                    Done
                                </span>
                            ) : null}
                        </div>
                        <h2
                            id="dfy-reply-modal-title"
                            className="text-base font-semibold leading-snug text-text-primary"
                        >
                            {reply.title || "Untitled thread"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="btn-icon h-10 w-10 min-h-0 min-w-0 shrink-0 rounded-full"
                    >
                        <X size={18} strokeWidth={1.75} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
                    {reply.context ? (
                        <p className="text-sm leading-relaxed text-text-secondary">{reply.context}</p>
                    ) : null}
                    <div className="dfy-reply-body p-3.5 sm:p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                            {reply.body}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--border-subtle)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-5">
                    <CopyButton
                        text={reply.body}
                        label="Copy Reply"
                        variant="primary"
                        className="min-h-[44px] flex-1"
                    />
                    {canOpenPost ? (
                        <a
                            href={reply.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex min-h-[44px] flex-1 items-center justify-center gap-2 px-4 py-2 text-sm"
                        >
                            <ExternalLink size={14} />
                            Go to Post
                        </a>
                    ) : null}
                    <button
                        type="button"
                        className="btn-secondary min-h-[44px] flex-1 px-4 py-2 text-sm"
                        onClick={() => onToggleDone(reply.id)}
                    >
                        {done ? "Undo done" : "Mark done"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
