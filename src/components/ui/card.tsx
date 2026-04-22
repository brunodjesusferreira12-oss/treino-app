import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-zinc-900/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
