"use client";

import { CheckCircle2, Eye, ExternalLink, Undo2 } from "lucide-react";
import { CopyButton } from "@/components/dfy/copy-button";
import { isRealPostUrl } from "@/lib/dfy/post-url";

export type ReplyCardData = {
    id: string;
    title: string;
    context?: string;
    platform?: string;
    url: string;
    body: string;
    style?: string;
    nicheLabel?: string;
};

type ReplyCardProps = {
    reply: ReplyCardData;
    done?: boolean;
    onView?: (reply: ReplyCardData) => void;
    onToggleDone?: (replyId: string) => void;
};

export function ReplyCard({ reply, done = false, onView, onToggleDone }: ReplyCardProps) {
    const canOpenPost = isRealPostUrl(reply.url);
    const catalogMode = typeof onView === "function";

    if (!catalogMode) {
        return (
            <article className="dfy-reply-card flex flex-col gap-3 p-4 sm:p-5">
                <div className="min-w-0 space-y-2">
                    {reply.platform ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="dfy-platform-badge">{reply.platform}</span>
                            {reply.style ? (
                                <span className="text-xs font-medium capitalize text-text-muted">
                                    {reply.style.replace(/_/g, " ")}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                    <h3 className="text-sm font-semibold leading-snug text-text-primary sm:text-base">
                        {reply.title || "Untitled thread"}
                    </h3>
                    {reply.context ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
                            {reply.context}
                        </p>
                    ) : null}
                </div>

                <div className="dfy-reply-body p-3.5 sm:p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                        {reply.body}
                    </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2">
                    <CopyButton
                        text={reply.body}
                        label="Copy Reply"
                        variant="primary"
                        className="min-h-[44px]"
                    />
                    {canOpenPost ? (
                        <a
                            href={reply.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-sm"
                        >
                            <ExternalLink size={14} />
                            Go to Post
                        </a>
                    ) : null}
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
                    {reply.nicheLabel ? (
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[var(--gold-text)]">
                            {reply.nicheLabel}
                        </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                        {reply.platform ? (
                            <span className="dfy-platform-badge">{reply.platform}</span>
                        ) : null}
                        {reply.style ? (
                            <span className="text-xs font-medium capitalize text-text-muted">
                                {reply.style.replace(/_/g, " ")}
                            </span>
                        ) : null}
                    </div>
                </div>

                <h3 className="text-sm font-semibold leading-snug text-text-primary sm:text-base">
                    {reply.title || "Untitled thread"}
                </h3>
            </div>

            <div className="mt-auto flex flex-col gap-2">
                <button
                    type="button"
                    className="btn-secondary flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
                    onClick={() => onView(reply)}
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
                        onClick={() => onToggleDone(reply.id)}
                        aria-label={done ? "Mark this reply as not done" : "Mark this reply as done"}
                    >
                        {done ? <Undo2 size={15} strokeWidth={2} aria-hidden /> : <CheckCircle2 size={15} aria-hidden />}
                        {done ? "Mark not done" : "Mark done"}
                    </button>
                ) : null}
            </div>
        </article>
    );
}
