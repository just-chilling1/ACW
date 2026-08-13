"use client";

import { ExternalLink } from "lucide-react";
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
};

type ReplyCardProps = {
    reply: ReplyCardData;
};

export function ReplyCard({ reply }: ReplyCardProps) {
    const canOpenPost = isRealPostUrl(reply.url);

    return (
        <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    {reply.platform ? (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                            {reply.platform}
                            {reply.style ? ` · ${reply.style}` : ""}
                        </p>
                    ) : null}
                    <h3 className="text-sm sm:text-base font-semibold text-text leading-snug">
                        {reply.title || "Untitled thread"}
                    </h3>
                    {reply.context ? (
                        <p className="mt-1.5 text-xs text-text-muted line-clamp-2">{reply.context}</p>
                    ) : null}
                </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-bg/60 border border-border/70 p-3">
                <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">{reply.body}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-auto">
                <CopyButton text={reply.body} label="Copy Reply" variant="primary" />
                {canOpenPost ? (
                    <a
                        href={reply.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm"
                    >
                        <ExternalLink size={14} />
                        Go to Post
                    </a>
                ) : null}
            </div>
        </article>
    );
}
