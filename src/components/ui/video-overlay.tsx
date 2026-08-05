"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, DollarSign, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toEmbedUrl } from "@/lib/video-thumbnails";

const WITHDRAW_URL = "https://jvz4.com/c/3547097/442443/";
const WITHDRAW_AMOUNT = "$214.36";

interface VideoOverlayProps {
    open: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
}

export function VideoOverlay({ open, onClose, videoUrl, title }: VideoOverlayProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, handleKeyDown]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4">
            <button
                type="button"
                aria-label="Close video"
                className="absolute inset-0 overlay-scrim"
                onClick={onClose}
            />

            <div
                className="relative z-10 flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-app)] shadow-[var(--elevation-3)] sm:h-[min(92dvh,56rem)] sm:rounded-[var(--radius-lg)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
                    <h2 className="truncate pr-2 text-sm font-semibold text-text-primary sm:text-base">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="btn-icon h-11 w-11 min-h-0 min-w-0 rounded-full"
                    >
                        <X size={20} strokeWidth={1.75} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 bg-black">
                    <iframe
                        src={toEmbedUrl(videoUrl)}
                        className="h-full w-full border-0"
                        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                        allowFullScreen
                        title={title}
                    />
                </div>

                <div className="relative shrink-0 overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
                                <span className="page-eyebrow text-[var(--success)]!">
                                    Account Verified
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle2 size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--success)]" />
                                <div>
                                    <p className="text-sm font-semibold leading-tight text-text-primary">
                                        Congratulations! You&apos;re Eligible To Withdraw{" "}
                                        <span className="text-[var(--success)]">{WITHDRAW_AMOUNT}</span>
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-text-muted">
                                        Available balance from your activity
                                    </p>
                                </div>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
                                <ShieldCheck size={10} className="text-[var(--success)]" />
                                <span>Verified Balance</span>
                                <span>·</span>
                                <span>Ref: HX-29459-9022</span>
                            </div>
                        </div>

                        <a
                            href={WITHDRAW_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary shrink-0 min-h-[44px] px-5 text-xs sm:text-sm"
                        >
                            <DollarSign size={16} strokeWidth={2} />
                            Withdraw Now
                            <ArrowRight size={14} strokeWidth={2} />
                        </a>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
