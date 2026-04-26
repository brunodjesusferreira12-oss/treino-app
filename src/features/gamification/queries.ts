import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function getUserPointsSummary() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: points }, { data: badges }, { data: recentEvents }] = await Promise.all([
    supabase.from("user_points").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_badges")
      .select("earned_at, badges(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
    supabase
      .from("gamification_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    points,
    badges: badges ?? [],
    recentEvents: recentEvents ?? [],
  };
}

export async function getPersonalRankingBreakdown() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: events }, { data: sports }] = await Promise.all([
    supabase.from("gamification_events").select("*").eq("user_id", user.id),
    supabase.from("sports").select("id, slug, name"),
  ]);

  const sportMap = new Map((sports ?? []).map((sport) => [sport.id, sport]));
  const totalsBySport = new Map<string, { name: string; points: number }>();

  for (const event of events ?? []) {
    if (!event.sport_id) continue;
    const sport = sportMap.get(event.sport_id);
    if (!sport) continue;
    const current = totalsBySport.get(sport.slug) ?? {
      name: sport.name,
      points: 0,
    };
    current.points += event.points;
    totalsBySport.set(sport.slug, current);
  }

  const weeklyPoints = Array.from({ length: 8 }, (_, index) => {
    const start = new Date();
    start.setDate(start.getDate() - (7 - index) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const total = (events ?? [])
      .filter((event) => {
        const createdAt = new Date(event.created_at);
        return createdAt >= start && createdAt <= end;
      })
      .reduce((acc, event) => acc + event.points, 0);

    return {
      week: `${start.getDate()}/${start.getMonth() + 1}`,
      points: total,
    };
  });

  return {
    totalsBySport: Array.from(totalsBySport.values()).sort((a, b) => b.points - a.points),
    weeklyPoints,
  };
}
