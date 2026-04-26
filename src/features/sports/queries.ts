import { cache } from "react";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateKey } from "@/lib/utils";

export const getSports = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sports").select("*").order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
});

export async function getTodaySportSession() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = getTodayDateKey();

  const { data, error } = await supabase
    .from("user_sport_sessions")
    .select("*, sports(*)")
    .eq("user_id", user.id)
    .eq("selected_for_date", today)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as
    | ({
        id: string;
        user_id: string;
        sport_id: string;
        selected_for_date: string;
        created_at: string;
        sports: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          created_at: string;
        };
      } & Record<string, unknown>)
    | null;
}

export async function getSportBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
