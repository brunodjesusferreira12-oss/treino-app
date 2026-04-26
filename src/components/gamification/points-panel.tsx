import { Flame, ShieldCheck, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatPoints, getLevelProgress } from "@/lib/format";

type PointsPanelProps = {
  totalPoints: number;
  level: number;
  currentStreak: number;
  badgeCount: number;
};

export function PointsPanel({
  totalPoints,
  level,
  currentStreak,
  badgeCount,
}: PointsPanelProps) {
  const progress = getLevelProgress(totalPoints);

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[color:var(--muted)]">Pontuação total</p>
          <h3 className="mt-1 text-3xl font-semibold text-[color:var(--foreground)]">
            {formatPoints(totalPoints)}
          </h3>
        </div>
        <div className="rounded-2xl bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-950">
          Nivel {level}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
            <span>Progresso para o próximo nível</span>
          <span>{Math.round(progress.progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface)]">
          <div
            className="h-full rounded-full bg-lime-300 transition-all"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <Flame className="h-4 w-4 text-orange-300" />
            Streak
          </div>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
            {currentStreak} dias
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <ShieldCheck className="h-4 w-4 text-sky-300" />
            Badges
          </div>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
            {badgeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <Trophy className="h-4 w-4 text-lime-300" />
            Meta
          </div>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
            {Math.max(progress.nextLevelAt - totalPoints, 0)} pts
          </p>
        </div>
      </div>
    </Card>
  );
}
