import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="flex min-h-[220px] flex-col items-start justify-center gap-4 border-dashed border-[color:var(--border-strong)] bg-[color:var(--card-strong)]">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
          {title}
        </h3>
        <p className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">
          {description}
        </p>
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </Card>
  );
}
