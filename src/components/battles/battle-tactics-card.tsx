import { Flame, ShieldCheck, Swords, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BattleTacticsInsight } from "@/features/assistant/types";

type BattleTacticsCardProps = {
  insight: BattleTacticsInsight;
};

const toneClasses: Record<BattleTacticsInsight["status"], string> = {
  leading: "border-lime-300/25 bg-lime-300/10",
  trailing: "border-orange-300/25 bg-orange-300/10",
  tied: "border-sky-300/25 bg-sky-300/10",
  pending: "border-[color:var(--border)] bg-[color:var(--surface)]",
  ended: "border-[color:var(--border)] bg-[color:var(--surface)]",
};

const toneIcons: Record<BattleTacticsInsight["status"], typeof TrendingUp> = {
  leading: ShieldCheck,
  trailing: Flame,
  tied: TrendingUp,
  pending: Swords,
  ended: TrendingUp,
};

export function BattleTacticsCard({ insight }: BattleTacticsCardProps) {
  const StatusIcon = toneIcons[insight.status];

  return (
    <Card className={cn("space-y-5", toneClasses[insight.status])}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <StatusIcon className="h-4 w-4 text-lime-300" />
            Coach tatico em tempo real
          </div>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Leitura da batalha
          </h2>
        </div>

        <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground-soft)]">
          {insight.urgency}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <p className="text-xs text-[color:var(--muted)]">Seu placar</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {insight.myScore} {insight.scoreUnit}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <p className="text-xs text-[color:var(--muted)]">Adversario</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {insight.opponentScore} {insight.scoreUnit}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
          <p className="text-xs text-[color:var(--muted)]">Tempo</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {insight.timeLabel}
          </p>
        </div>
      </div>

      <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card-strong)] p-4">
        <p className="text-sm leading-7 text-[color:var(--foreground)]">{insight.summary}</p>
        <p className="mt-3 text-sm font-medium text-lime-200">{insight.nextGoal}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {insight.actions.map((action) => (
          <div
            key={action}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground-soft)]"
          >
            {action}
          </div>
        ))}
      </div>
    </Card>
  );
}
