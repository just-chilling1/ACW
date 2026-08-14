"use client";

import { CheckCircle2, Eye, Undo2 } from "lucide-react";
import { CopyButton } from "@/components/dfy/copy-button";

export type InstantPostCardData = {
    id: string;
    title: string;
    body: string;
    style?: string;
    nicheLabel?: string;
    platform?: string;
};

type InstantPostCardProps = {
    post: InstantPostCardData;
    done?: boolean;
    onView?: (post: InstantPostCardData) => void;
    onToggleDone?: (postId: string) => void;
};

export function InstantPostCard({
    post,
    done = false,
    onView,
    onToggleDone,
}: InstantPostCardProps) {
    const catalogMode = typeof onView === "function";

    if (!catalogMode) {
        return (
            <article className="dfy-reply-card flex flex-col gap-3 p-4 sm:p-5">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="dfy-platform-badge">{post.platform || "Facebook"}</span>
                        {post.style ? (
                            <span className="text-xs font-medium capitalize text-text-muted">
                                {post.style.replace(/_/g, " ")}
                            </span>
                        ) : null}
                    </div>
                    <h3 className="text-sm font-semibold leading-snug text-text-primary sm:text-base">
                        {post.title || "Facebook post"}
                    </h3>
                </div>

                <div className="dfy-reply-body p-3.5 sm:p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                        {post.body}
                    </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                    <CopyButton
                        text={post.body}
                        label="Copy Post"
                        variant="primary"
                        className="min-h-[44px]"
                    />
                </div>
            </article>
        );
    }

    return (
        <article
            className={`dfy-reply-card relative flex flex-col gap-3 p-4 sm:p-5 ${done ? "dfy-reply-card--done" : ""}`}
        >
            {done ? (
                <span className="dfy-done-badge absolute right-4 top-4 z-[1]">
                    <CheckCircle2 size={14} strokeWidth={2.25} aria-hidden />
                    Done
                </span>
            ) : null}

            <div className={`dfy-reply-card__content min-w-0 space-y-2 ${done ? "pr-16" : ""}`}>
                <div className="space-y-1.5">
                    {post.nicheLabel ? (
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[var(--gold-text)]">
                            {post.nicheLabel}
                        </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="dfy-platform-badge">{post.platform || "Facebook"}</span>
                        {post.style ? (
                            <span className="text-xs font-medium capitalize text-text-muted">
                                {post.style.replace(/_/g, " ")}
                            </span>
                        ) : null}
                    </div>
                </div>

                <h3 className="text-sm font-semibold leading-snug text-text-primary sm:text-base">
                    {post.title || "Facebook post"}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
                    {post.body}
                </p>
            </div>

            <div className="mt-auto flex flex-col gap-2">
                <button
                    type="button"
                    className="btn-secondary flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                    onClick={() => onView(post)}
                >
                    <Eye size={15} />
                    View
                </button>
                {onToggleDone ? (
                    <button
                        type="button"
                        className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-xl)] px-4 py-2.5 text-sm font-semibold transition ${
                            done ? "dfy-undo-done-btn" : "btn-primary"
                        }`}
                        onClick={() => onToggleDone(post.id)}
                        aria-label={done ? "Mark this post as not done" : "Mark this post as done"}
                    >
                        {done ? (
                            <Undo2 size={15} strokeWidth={2} aria-hidden />
                        ) : (
                            <CheckCircle2 size={15} aria-hidden />
                        )}
                        {done ? "Mark not done" : "Mark done"}
                    </button>
                ) : null}
            </div>
        </article>
    );
}
