import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 outline-none ring-0 transition placeholder:text-zinc-500 focus:border-lime-300/60 focus:bg-white/7",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
