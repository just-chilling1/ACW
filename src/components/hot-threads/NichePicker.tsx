"use client";

import { APP_NICHES, type NicheId } from "@/lib/niches";
import { SelectableChip } from "@/components/ui/selectable-chip";

interface NichePickerProps {
  value: NicheId;
  onChange: (niche: NicheId) => void;
  disabled?: boolean;
}

export function NichePicker({ value, onChange, disabled }: NichePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {APP_NICHES.map((niche) => (
        <SelectableChip
          key={niche.id}
          label={niche.label}
          selected={value === niche.id}
          disabled={disabled}
          onClick={() => onChange(niche.id)}
        />
      ))}
    </div>
  );
}
