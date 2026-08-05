"use client";

import { Check } from "lucide-react";
import { clsx } from "clsx";

type SelectableChipProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export function SelectableChip({
  label,
  selected,
  onClick,
  className,
  disabled,
}: SelectableChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "btn-chip inline-flex min-h-9 items-center gap-1.5",
        selected && "btn-chip-active",
        !selected && "hover:border-[var(--border-strong)] hover:text-text-primary",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {selected ? <Check size={12} strokeWidth={2.5} /> : null}
      {label}
    </button>
  );
}
