import { Crown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ComparativeScoreboardProps = {
  items: Array<{
    name: string;
    score: number;
    isWinner: boolean;
  }>;
};

export function ComparativeScoreboard({ items }: ComparativeScoreboardProps) {
  const maxScore = Math.max(...items.map((item) => item.score), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card
          key={item.name}
          className={cn(
            "space-y-4",
            item.isWinner ? "border-lime-300/25 bg-lime-300/8" : "",
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[color:var(--muted)]">Competidor</p>
              <h3 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">
                {item.name}
              </h3>
            </div>
            {item.isWinner ? (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-zinc-950">
                <Crown className="h-5 w-5" />
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
              <span>Pontuação</span>
              <span>{item.score} pts</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface)]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  item.isWinner ? "bg-lime-300" : "bg-sky-300",
                )}
                style={{ width: `${(item.score / maxScore) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
