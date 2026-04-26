import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-[color:var(--foreground)] shadow-[var(--shadow-card)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
