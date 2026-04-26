import { createClient } from "@/lib/supabase/server";
import { applyBattleResultPoints } from "@/features/gamification/service";

type SyncedBattleScore = {
  battle_id: string;
  status: string;
  winner_user_id: string | null;
  sport_id: string | null;
  user_id: string;
  score: number;
};

export async function recalculateBattleScores(battleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("sync_battle_scores", {
    target_battle_id: battleId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const syncedScores = (data ?? []) as SyncedBattleScore[];

  if (syncedScores.length === 0) {
    return;
  }

  const { status, winner_user_id: winnerUserId, sport_id: sportId } = syncedScores[0];

  if (status !== "ended") {
    return;
  }

  if (winnerUserId) {
    await applyBattleResultPoints({
      userId: winnerUserId,
      sportId,
      battleId,
      result: "win",
    });
    return;
  }

  const ordered = [...syncedScores].sort((a, b) => b.score - a.score);
  const leader = ordered[0];
  const runnerUp = ordered[1];

  if (!leader || !runnerUp || leader.score !== runnerUp.score) {
    return;
  }

  await Promise.all(
    ordered.slice(0, 2).map((entry) =>
      applyBattleResultPoints({
        userId: entry.user_id,
        sportId,
        battleId,
        result: "draw",
      }),
    ),
  );
}

export async function recalculateBattlesForUser(userId: string) {
  const supabase = await createClient();

  const { data: participations, error } = await supabase
    .from("battle_participants")
    .select("battle_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  for (const participation of participations ?? []) {
    await recalculateBattleScores(participation.battle_id);
  }
}
