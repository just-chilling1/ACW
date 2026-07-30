"use client";

import { Clock, Headphones, ShieldCheck, Star } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

export function SupportFooter() {
  return (
    <div className="card-base mt-8 w-full shrink-0">
      <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.08)]">
            <Headphones size={22} strokeWidth={1.5} className="text-[var(--gold)]" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-white">Need Help?</h3>
            <p className="text-sm text-text-secondary">Our support team is here for you 24/7</p>
          </div>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="btn-primary h-[42px] whitespace-nowrap px-7"
        >
          Contact Support
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Clock size={12} strokeWidth={1.75} className="text-[var(--success)]" />
          <span>
            Avg response: <strong className="text-[var(--success)]">under 2 hours</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Star size={12} strokeWidth={1.75} className="text-[var(--gold)]" />
          <span>4.9/5 support rating</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <ShieldCheck size={12} strokeWidth={1.75} className="text-[var(--info)]" />
          <span>98% satisfaction rate</span>
        </div>
      </div>
    </div>
  );
}
