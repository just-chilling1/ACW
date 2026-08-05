"use client";

import { ArrowRight, History } from "lucide-react";
import { cleanHistoryItems, formatTopicLabel } from "@/lib/keyword";

interface RecentTopicsProps {
  topics: string[];
  disabled?: boolean;
  onSelect: (topic: string) => void;
}

export function RecentTopics({ topics, disabled, onSelect }: RecentTopicsProps) {
  const recentTopics = cleanHistoryItems(topics);

  if (recentTopics.length === 0) return null;

  return (
    <div className="border-t border-[var(--border-subtle)] pt-6">
      <div className="mb-3 flex items-center justify-center gap-2">
        <History size={14} strokeWidth={1.75} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Recent
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {recentTopics.map((topic) => (
          <button
            key={topic}
            type="button"
            title={topic}
            aria-label={`Search again for ${topic}`}
            onClick={() => onSelect(topic)}
            disabled={disabled}
            className="btn-chip inline-flex max-w-[12rem] min-w-0 items-center gap-1.5 overflow-hidden disabled:opacity-50"
          >
            <span className="min-w-0 flex-1 truncate text-left">{formatTopicLabel(topic)}</span>
            <ArrowRight size={12} strokeWidth={1.75} className="shrink-0 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
}
