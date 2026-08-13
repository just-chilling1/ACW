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
        <article className="dfy-reply-card flex flex-col gap-3 p-4 sm:p-5">
            <div className="min-w-0 space-y-2">
                {reply.platform ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="dfy-platform-badge">{reply.platform}</span>
                        {reply.style ? (
                            <span className="text-xs font-medium text-text-muted capitalize">
                                {reply.style}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                <h3 className="text-sm sm:text-base font-semibold text-text-primary leading-snug">
                    {reply.title || "Untitled thread"}
                </h3>
                {reply.context ? (
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {reply.context}
                    </p>
                ) : null}
            </div>

            <div className="dfy-reply-body p-3.5 sm:p-4">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
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
