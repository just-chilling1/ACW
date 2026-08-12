"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prevMessage = useRef("");

  useEffect(() => {
    if (!message) {
      prevMessage.current = "";
      return;
    }

    const appeared = prevMessage.current === "";
    prevMessage.current = message;
    if (!appeared) return;

    const id = window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={ref}
      role="alert"
      className={clsx("error-banner items-start", className)}
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
