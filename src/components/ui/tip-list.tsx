import { Check } from "lucide-react";
import { clsx } from "clsx";

type TipListProps = {
  items: string[];
  className?: string;
  title?: string;
};

export function TipList({ items, className, title }: TipListProps) {
  return (
    <div className={clsx("card-base", className)}>
      {title ? <h3 className="ds-h3 mb-4">{title}</h3> : null}
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-text-secondary">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(16,185,129,0.12)] text-[var(--success)]">
              <Check size={12} strokeWidth={2.5} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
