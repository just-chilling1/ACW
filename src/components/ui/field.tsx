"use client";

import { clsx } from "clsx";
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

type FieldBase = {
  label?: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
  trailing?: ReactNode;
};

type InputFieldProps = FieldBase &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: "input";
  };

type TextareaFieldProps = FieldBase &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: "textarea";
  };

export type FieldProps = InputFieldProps | TextareaFieldProps;

export function Field(props: FieldProps) {
  const { label, hint, error, className, trailing, as = "input", ...rest } = props;
  const id = props.id ?? (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <label className={clsx("flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted flex items-center gap-1 flex-wrap">
          {label}
        </span>
      ) : null}
      <div className="relative">
        {as === "textarea" ? (
          <textarea
            id={id}
            className={clsx(
              "input-base min-h-[110px] resize-y",
              error && "border-[var(--danger)] focus:border-[var(--danger)]",
              trailing && "pr-12"
            )}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            className={clsx(
              "input-base",
              error && "border-[var(--danger)] focus:border-[var(--danger)]",
              trailing && "pr-12"
            )}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {trailing ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <span className="text-xs font-medium text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
