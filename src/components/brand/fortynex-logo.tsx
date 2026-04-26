import Image from "next/image";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FortynexLogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  subtitle?: string | null;
  className?: string;
};

const sizeMap: Record<NonNullable<FortynexLogoProps["size"]>, number> = {
  sm: 40,
  md: 56,
  lg: 88,
};

export function FortynexLogo({
  size = "md",
  showWordmark = true,
  subtitle,
  className,
}: FortynexLogoProps) {
  const pixelSize = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--logo-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
          size === "lg" ? "rounded-[24px]" : "",
        )}
      >
        <Image
          src="/fortynex-logo.png"
          alt={`${APP_NAME} logo`}
          width={pixelSize}
          height={pixelSize}
          className="h-auto w-auto object-cover"
          priority
        />
      </div>

      {showWordmark ? (
        <div>
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            {APP_NAME}
          </p>
          {subtitle ? (
            <p className="text-xs text-[color:var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
