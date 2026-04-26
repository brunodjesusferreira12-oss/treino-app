"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentWeekRange, getWeekKey } from "@/lib/utils";
import { GAMIFICATION_POINTS } from "@/features/gamification/config";

type AwardPointsInput = {
  userId: string;
  sportId?: string | null;
  eventType: string;
  points: number;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  skipBattleSync?: boolean;
};

export async function awardPoints(input: AwardPointsInput) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("award_gamification_event", {
    target_user_id: input.userId,
    target_sport_id: input.sportId ?? null,
    target_event_type: input.eventType,
    target_points: input.points,
    target_reference_type: input.referenceType ?? null,
    target_reference_id: input.referenceId ?? null,
    target_description: input.description ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || input.skipBattleSync) {
    return;
  }

  const { recalculateBattlesForUser } = await import("@/features/battles/service");
  await recalculateBattlesForUser(input.userId);
}

export async function awardPointsForSportSelection(input: {
  userId: string;
  sportId: string;
  selectedForDate: string;
}) {
  await awardPoints({
    userId: input.userId,
    sportId: input.sportId,
    eventType: "SPORT_SELECTION_COMPLETED",
    points: GAMIFICATION_POINTS.SPORT_SELECTION_COMPLETED,
    referenceType: "sport-session",
    referenceId: input.selectedForDate,
    description: "Selecionou a modalidade do dia.",
  });
}

export async function awardExecutionGamification(input: {
  userId: string;
  sportId: string | null;
  executionId: string;
  completed: boolean;
  exerciseCompletions: Array<{
    exerciseId: string;
    completedNow: boolean;
  }>;
  noteAdded: boolean;
}) {
  for (const completion of input.exerciseCompletions) {
    if (!completion.completedNow) continue;

    await awardPoints({
      userId: input.userId,
      sportId: input.sportId,
      eventType: "COMPLETE_EXERCISE",
      points: GAMIFICATION_POINTS.COMPLETE_EXERCISE,
      referenceType: "exercise-log",
      referenceId: `${input.executionId}:${completion.exerciseId}`,
      description: "Concluiu um exercício da sessão.",
    });
  }

  if (input.noteAdded) {
    await awardPoints({
      userId: input.userId,
      sportId: input.sportId,
      eventType: "ADD_NOTE",
      points: GAMIFICATION_POINTS.ADD_NOTE,
      referenceType: "execution-note",
      referenceId: input.executionId,
      description: "Registrou observações relevantes sobre o treino.",
    });
  }

  if (input.completed) {
    await awardPoints({
      userId: input.userId,
      sportId: input.sportId,
      eventType: "COMPLETE_WORKOUT",
      points: GAMIFICATION_POINTS.COMPLETE_WORKOUT,
      referenceType: "execution",
      referenceId: input.executionId,
      description: "Concluiu o treino do dia.",
    });

    await applyWeeklyBonuses(input.userId, input.sportId);
  }
}

export async function applyBattleResultPoints(input: {
  userId: string;
  sportId?: string | null;
  battleId: string;
  result: "win" | "draw";
}) {
  await awardPoints({
    userId: input.userId,
    sportId: input.sportId ?? null,
    eventType: input.result === "win" ? "BATTLE_WIN" : "BATTLE_DRAW",
    points:
      input.result === "win"
        ? GAMIFICATION_POINTS.BATTLE_WIN
        : GAMIFICATION_POINTS.BATTLE_DRAW,
    referenceType: "battle-result",
    referenceId: input.battleId,
    description:
      input.result === "win"
        ? "Venceu uma batalha entre competidores."
        : "Empatou uma batalha entre competidores.",
    skipBattleSync: true,
  });
}

async function applyWeeklyBonuses(userId: string, sportId: string | null) {
  const supabase = await createClient();
  const weekKey = getWeekKey();
  const { start, end } = getCurrentWeekRange();

  const { data, error } = await supabase
    .from("workout_executions")
    .select("id")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("executed_at", start.toISOString())
    .lte("executed_at", end.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  const totalCompleted = (data ?? []).length;

  if (totalCompleted >= 3) {
    await awardPoints({
      userId,
      sportId,
      eventType: "WEEKLY_STREAK_3",
      points: GAMIFICATION_POINTS.WEEKLY_STREAK_3,
      referenceType: "weekly-bonus",
      referenceId: `${weekKey}:3`,
      description: "Bateu a meta de 3 treinos na semana.",
    });
  }

  if (totalCompleted >= 5) {
    await awardPoints({
      userId,
      sportId,
      eventType: "WEEKLY_STREAK_5",
      points: GAMIFICATION_POINTS.WEEKLY_STREAK_5,
      referenceType: "weekly-bonus",
      referenceId: `${weekKey}:5`,
      description: "Bateu a meta de 5 treinos na semana.",
    });
  }
}

export async function evaluateBadges(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sync_user_badges", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function ensureReferenceBadges() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_reference_badges");

  if (error) {
    throw new Error(error.message);
  }
}
