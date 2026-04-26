import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[color:var(--foreground-soft)]">
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-[color:var(--muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
