import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ensureReferenceBadges } from "@/features/gamification/service";

export async function ensureUserSeeded() {
  const user = await requireUser();
  const supabase = await createClient();

  await ensureReferenceBadges();

  await supabase.from("user_points").upsert(
    {
      user_id: user.id,
      total_points: 0,
      level: 1,
      current_streak: 0,
    },
    {
      onConflict: "user_id",
    },
  );

  const { count } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) === 0) {
    await supabase.rpc("seed_my_default_workouts");
  }
}
