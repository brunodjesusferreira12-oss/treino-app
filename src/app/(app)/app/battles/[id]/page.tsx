import { notFound } from "next/navigation";

import { BattleTacticsCard } from "@/components/battles/battle-tactics-card";
import { ComparativeScoreboard } from "@/components/battles/comparative-scoreboard";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { buildBattleTactics } from "@/features/assistant/coach";
import { getBattleById } from "@/features/battles/queries";
import { requireUser } from "@/lib/auth";
import {
  formatBattleScoringModeLabel,
  formatBattleStatusLabel,
  formatDateOnly,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BattleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const battle = await getBattleById(id);

  if (!battle) {
    notFound();
  }

  const supabase = await createClient();
  const userIds = (battle.battle_participants ?? []).map((participant) => participant.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const orderedScores = [...(battle.battle_scores ?? [])].sort((a, b) => b.score - a.score);
  const topScore = orderedScores[0]?.score ?? 0;
  const participantNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name ?? "Competidor"]),
  );
  const tactics = buildBattleTactics({
    battle,
    currentUserId: user.id,
    participantNames,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Batalha"
        title={battle.title}
        description={`Período: ${formatDateOnly(battle.starts_at)} até ${formatDateOnly(battle.ends_at)}.`}
      />

      <Card className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-sm text-[color:var(--muted)]">Status</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {formatBattleStatusLabel(battle.status)}
          </p>
        </div>
        <div>
          <p className="text-sm text-[color:var(--muted)]">Modalidade</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {battle.sports?.name ?? "Geral"}
          </p>
        </div>
        <div>
          <p className="text-sm text-[color:var(--muted)]">Pontuação líder</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {topScore} pts
          </p>
        </div>
        <div>
          <p className="text-sm text-[color:var(--muted)]">Regra</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {formatBattleScoringModeLabel(battle.scoring_mode)}
          </p>
        </div>
      </Card>

      <ComparativeScoreboard
        items={orderedScores.map((item) => ({
          name: profileMap.get(item.user_id)?.full_name ?? "Competidor",
          score: item.score,
          isWinner: battle.winner_user_id === item.user_id,
        }))}
      />

      <BattleTacticsCard insight={tactics} />
    </div>
  );
}
