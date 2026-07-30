"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import { clsx } from "clsx";

const TIP_WIDTH = 240; // ~15rem
const MARGIN = 8;

export function InfoHint({
    text,
    label = "More info",
    className,
}: {
    text: string;
    label?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const tipId = useId();

    useEffect(() => setMounted(true), []);

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth;
        let left = r.left + r.width / 2 - TIP_WIDTH / 2;
        left = Math.max(MARGIN, Math.min(left, vw - TIP_WIDTH - MARGIN));
        const placement: "top" | "bottom" = r.top > 140 ? "top" : "bottom";
        const top = placement === "top" ? r.top - MARGIN : r.bottom + MARGIN;
        setCoords({ top, left, placement });
    }, []);

    useLayoutEffect(() => {
        if (open) updatePosition();
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;

        const close = () => setOpen(false);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onPointer = (e: PointerEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                tipRef.current && !tipRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };

        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", updatePosition);
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", updatePosition);
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
        };
    }, [open, updatePosition]);

    const toggle = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen((v) => !v);
    };

    return (
        <span
            ref={triggerRef}
            className={clsx("relative inline-flex items-center align-middle", className)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <span
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-expanded={open}
                aria-describedby={open ? tipId : undefined}
                onClick={toggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggle(e);
                }}
                className="inline-flex items-center justify-center w-6 h-6 -m-1 text-text-muted hover:text-accent focus:text-accent outline-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-full transition-colors cursor-help"
            >
                <HelpCircle size={14} />
            </span>

            {mounted && open && coords && createPortal(
                <div
                    ref={tipRef}
                    id={tipId}
                    role="tooltip"
                    style={{
                        position: "fixed",
                        top: coords.top,
                        left: coords.left,
                        width: TIP_WIDTH,
                        transform: coords.placement === "top" ? "translateY(-100%)" : "none",
                    }}
                    className="z-[100] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-[12px] font-normal leading-snug tracking-normal text-text-secondary shadow-[var(--elevation-2)] pointer-events-none normal-case"
                >
                    {text}
                </div>,
                document.body
            )}
        </span>
    );
}
