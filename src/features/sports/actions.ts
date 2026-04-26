"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/utils";
import { awardPointsForSportSelection } from "@/features/gamification/service";

type ActionResult = {
  ok: boolean;
  error?: string;
};

export async function selectSportForTodayAction(sportId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const today = getTodayDateKey();

  const { data: sport, error: sportError } = await supabase
    .from("sports")
    .select("*")
    .eq("id", sportId)
    .single();

  if (sportError || !sport) {
    return {
      ok: false,
      error: sportError?.message ?? "Modalidade não encontrada.",
    };
  }

  const { error } = await supabase.from("user_sport_sessions").upsert(
    {
      user_id: user.id,
      sport_id: sportId,
      selected_for_date: today,
    },
    {
      onConflict: "user_id,selected_for_date",
    },
  );

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  await awardPointsForSportSelection({
    userId: user.id,
    sportId,
    selectedForDate: today,
  });

  revalidatePath(APP_ROUTES.app);
  revalidatePath(APP_ROUTES.selectSport);
  revalidatePath(APP_ROUTES.workouts);

  return { ok: true };
}
