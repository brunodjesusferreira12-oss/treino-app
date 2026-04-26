import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--foreground)] outline-none ring-0 transition placeholder:text-[color:var(--muted)] focus:border-lime-300/60 focus:bg-[color:var(--surface-strong)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
