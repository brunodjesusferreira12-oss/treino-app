"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { battleFormSchema, type BattleFormValues } from "@/features/battles/schemas";
import { recalculateBattleScores } from "@/features/battles/service";

type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

export async function createBattleAction(
  rawInput: BattleFormValues,
): Promise<ActionResult> {
  const parsed = battleFormSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const input = parsed.data;

  const sportId =
    input.sportSlug === "all"
      ? null
      : (
          await supabase
            .from("sports")
            .select("id")
            .eq("slug", input.sportSlug)
            .single()
        ).data?.id ?? null;

  const status =
    new Date(input.startsAt) > new Date()
      ? "pending"
      : new Date(input.endsAt) < new Date()
        ? "ended"
        : "active";

  const { data: battle, error } = await supabase
    .from("battles")
    .insert({
      created_by: user.id,
      title: input.title,
      sport_id: sportId,
      battle_type: input.battleType,
      scoring_mode: input.scoringMode,
      starts_at: new Date(input.startsAt).toISOString(),
      ends_at: new Date(input.endsAt).toISOString(),
      status,
    })
    .select("id")
    .single();

  if (error || !battle) {
    return {
      ok: false,
      error: error?.message ?? "Não foi possível criar a batalha.",
    };
  }

  const participants = [
    { battle_id: battle.id, user_id: user.id, role: "challenger" },
    { battle_id: battle.id, user_id: input.opponentId, role: "opponent" },
  ];

  const { error: participantsError } = await supabase
    .from("battle_participants")
    .insert(participants);

  if (participantsError) {
    return {
      ok: false,
      error: participantsError.message,
    };
  }

  await recalculateBattleScores(battle.id);

  revalidatePath(APP_ROUTES.battles);
  revalidatePath(APP_ROUTES.app);

  return { ok: true, id: battle.id };
}
