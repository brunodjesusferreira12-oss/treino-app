import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { recalculateBattleScores } from "@/features/battles/service";

type BattleRecord = {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string;
  battle_type: string;
  scoring_mode: string;
  winner_user_id: string | null;
  sports?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
  } | null;
  battle_participants?: Array<{
    battle_id: string;
    user_id: string;
    role: string;
  }>;
  battle_scores?: Array<{
    battle_id: string;
    user_id: string;
    score: number;
  }>;
};

export async function getBattleCandidates() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_battle_candidates");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getUserBattles() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: participations, error } = await supabase
    .from("battle_participants")
    .select("battle_id")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const battleIds = (participations ?? []).map((item) => item.battle_id);

  if (battleIds.length === 0) {
    return [];
  }

  const { data: battles, error: battlesError } = await supabase
    .from("battles")
    .select("*, sports(*), battle_participants(*), battle_scores(*)")
    .in("id", battleIds)
    .order("starts_at", { ascending: false });

  if (battlesError) {
    throw new Error(battlesError.message);
  }

  for (const battle of battles ?? []) {
    await recalculateBattleScores(battle.id);
  }

  const { data: refreshedBattles, error: refreshedError } = await supabase
    .from("battles")
    .select("*, sports(*), battle_participants(*), battle_scores(*)")
    .in("id", battleIds)
    .order("starts_at", { ascending: false });

  if (refreshedError) {
    throw new Error(refreshedError.message);
  }

  return (refreshedBattles ?? []) as unknown as BattleRecord[];
}

export async function getBattleById(battleId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: participation } = await supabase
    .from("battle_participants")
    .select("id")
    .eq("battle_id", battleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) {
    return null;
  }

  await recalculateBattleScores(battleId);

  const { data, error } = await supabase
    .from("battles")
    .select("*, sports(*), battle_participants(*), battle_scores(*)")
    .eq("id", battleId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as BattleRecord;
}
