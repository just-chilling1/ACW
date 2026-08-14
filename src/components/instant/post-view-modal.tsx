"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Undo2, X } from "lucide-react";
import { CopyButton } from "@/components/dfy/copy-button";
import type { InstantPostCardData } from "@/components/instant/post-card";

type InstantPostViewModalProps = {
    post: InstantPostCardData | null;
    done: boolean;
    onClose: () => void;
    onToggleDone: (postId: string) => void;
};

export function InstantPostViewModal({
    post,
    done,
    onClose,
    onToggleDone,
}: InstantPostViewModalProps) {
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
        if (!post) return;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [post, handleKeyDown]);

    if (!mounted || !post) return null;

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button
                type="button"
                aria-label="Close post"
                className="absolute inset-0 overlay-scrim"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="instant-post-modal-title"
                className="dfy-theme instant-theme dfy-reply-modal relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[var(--elevation-3)] sm:rounded-[var(--radius-2xl)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="dfy-platform-badge">{post.platform || "Facebook"}</span>
                            {post.style ? (
                                <span className="text-xs font-medium capitalize text-text-muted">
                                    {post.style.replace(/_/g, " ")}
                                </span>
                            ) : null}
                            {done ? (
                                <span className="dfy-done-badge">
                                    <CheckCircle2 size={14} strokeWidth={2.25} aria-hidden />
                                    Done
                                </span>
                            ) : null}
                        </div>
                        <h2
                            id="instant-post-modal-title"
                            className="text-base font-semibold leading-snug text-text-primary"
                        >
                            {post.title || "Facebook post"}
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
                    <div className="dfy-reply-modal-reply">
                        <p className="dfy-reply-modal-reply__label">Your Facebook post</p>
                        <div className="dfy-reply-body p-3.5 sm:p-4">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                                {post.body}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--border-subtle)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:px-5">
                    <CopyButton
                        text={post.body}
                        label="Copy Post"
                        variant="primary"
                        className="min-h-[44px] flex-1"
                    />
                    <button
                        type="button"
                        className={`min-h-[44px] flex-1 px-4 py-2 text-sm font-semibold ${
                            done ? "dfy-undo-done-btn" : "btn-primary"
                        }`}
                        onClick={() => onToggleDone(post.id)}
                        aria-label={done ? "Mark this post as not done" : "Mark this post as done"}
                    >
                        <span className="inline-flex items-center justify-center gap-2">
                            {done ? (
                                <Undo2 size={15} strokeWidth={2} aria-hidden />
                            ) : (
                                <CheckCircle2 size={15} aria-hidden />
                            )}
                            {done ? "Mark not done" : "Mark done"}
                        </span>
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
