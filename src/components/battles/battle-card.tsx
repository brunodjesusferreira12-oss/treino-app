import Link from "next/link";
import { Swords, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatBattleStatusLabel, formatDateOnly } from "@/lib/format";

type BattleCardProps = {
  battle: {
    id: string;
    title: string;
    status: string;
    starts_at: string;
    ends_at: string;
    sports?: {
      name: string;
    } | null;
    battle_scores?: Array<{
      user_id: string;
      score: number;
    }>;
  };
};

export function BattleCard({ battle }: BattleCardProps) {
  const leader = [...(battle.battle_scores ?? [])].sort((a, b) => b.score - a.score)[0];

  return (
    <Link href={`/app/battles/${battle.id}`}>
      <Card className="h-full space-y-4 transition hover:bg-[color:var(--surface)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
              <Swords className="h-4 w-4 text-lime-300" />
              Batalha
            </div>
            <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
              {battle.title}
            </h3>
          </div>
          <Badge>{formatBattleStatusLabel(battle.status)}</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-xs text-[color:var(--muted)]">Modalidade</p>
            <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
              {battle.sports?.name ?? "Geral"}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <p className="text-xs text-[color:var(--muted)]">Lider parcial</p>
            <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
              {leader ? `${leader.score} pts` : "Sem pontuação"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
          <Timer className="h-4 w-4" />
          {formatDateOnly(battle.starts_at)} até {formatDateOnly(battle.ends_at)}
        </div>
      </Card>
    </Link>
  );
}
