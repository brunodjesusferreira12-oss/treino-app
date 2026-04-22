import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function ensureUserSeeded() {
  const user = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) === 0) {
    await supabase.rpc("seed_my_default_workouts");
  }
}
