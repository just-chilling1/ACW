"use client";

import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

export type AccordionItem = {
  question: string;
  answer: string;
};

export type AccordionGroup = {
  category: string;
  items: AccordionItem[];
};

type AccordionProps = {
  groups: AccordionGroup[];
  className?: string;
};

export function Accordion({ groups, className }: AccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className={clsx("flex flex-col gap-6", className)}>
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="ds-h3">{group.category}</h3>
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-text-muted">
              {group.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((item, index) => {
              const key = `${group.category}-${index}`;
              const open = openKey === key;
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-1)]"
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenKey(open ? null : key)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-3)]"
                  >
                    <span className="text-sm font-semibold text-text-primary">{item.question}</span>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.75}
                      className={clsx(
                        "shrink-0 text-text-muted transition-transform duration-200",
                        open && "rotate-180 text-[var(--gold)]"
                      )}
                    />
                  </button>
                  <div
                    className={clsx(
                      "grid transition-[grid-template-rows] duration-200",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-[var(--border-subtle)] px-4 py-3.5 text-sm leading-relaxed text-text-secondary">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
