import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function toCsv(rows: Array<Record<string, string | number | boolean | null>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapeValue = (value: string | number | boolean | null) => {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const scope = url.searchParams.get("scope") ?? "all";
  const dateKey = new Date().toISOString().slice(0, 10);

  if (format === "csv" && scope === "body") {
    const { data, error } = await supabase
      .from("body_measurements")
      .select("recorded_on, weight_kg, notes, created_at")
      .eq("user_id", user.id)
      .order("recorded_on", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const csv = toCsv(
      (data ?? []).map((item) => ({
        recorded_on: item.recorded_on,
        weight_kg: item.weight_kg,
        notes: item.notes,
        created_at: item.created_at,
      })),
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fortynex-body-${dateKey}.csv"`,
      },
    });
  }

  if (format === "csv" && scope === "history") {
    const { data: executions, error: executionError } = await supabase
      .from("workout_executions")
      .select("id, workout_name, executed_at, completed, notes")
      .eq("user_id", user.id)
      .order("executed_at", { ascending: false });

    if (executionError) {
      return NextResponse.json(
        { error: executionError.message },
        { status: 500 },
      );
    }

    const executionIds = (executions ?? []).map((item) => item.id);
    const { data: logs, error: logsError } = executionIds.length
      ? await supabase
          .from("exercise_logs")
          .select(
            "execution_id, exercise_name, section_title, prescription, load_used, reps_done, rpe, rest_seconds, completed, notes",
          )
          .in("execution_id", executionIds)
      : { data: [], error: null };

    if (logsError) {
      return NextResponse.json(
        { error: logsError.message },
        { status: 500 },
      );
    }

    const executionMap = new Map((executions ?? []).map((item) => [item.id, item]));
    const csv = toCsv(
      (logs ?? []).map((log) => ({
        executed_at: executionMap.get(log.execution_id)?.executed_at ?? "",
        workout_name: executionMap.get(log.execution_id)?.workout_name ?? "",
        workout_completed: executionMap.get(log.execution_id)?.completed ?? false,
        exercise_name: log.exercise_name,
        section_title: log.section_title,
        prescription: log.prescription,
        load_used: log.load_used,
        reps_done: log.reps_done,
        rpe: log.rpe,
        rest_seconds: log.rest_seconds,
        exercise_completed: log.completed,
        execution_notes: executionMap.get(log.execution_id)?.notes ?? "",
        exercise_notes: log.notes,
      })),
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fortynex-history-${dateKey}.csv"`,
      },
    });
  }

  const [
    profile,
    bodyMeasurements,
    sportSessions,
    workouts,
    executions,
    points,
    badges,
    events,
    battles,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("body_measurements").select("*").eq("user_id", user.id),
    supabase.from("user_sport_sessions").select("*, sports(*)").eq("user_id", user.id),
    supabase
      .from("workouts")
      .select("*, sports(*), workout_sections(*, exercises(*))")
      .eq("user_id", user.id),
    supabase
      .from("workout_executions")
      .select("*, exercise_logs(*)")
      .eq("user_id", user.id)
      .order("executed_at", { ascending: false }),
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
      .order("created_at", { ascending: false }),
    supabase
      .from("battle_participants")
      .select("battle_id")
      .eq("user_id", user.id),
  ]);

  const battleIds = (battles.data ?? []).map((item) => item.battle_id);
  const battleBundle =
    battleIds.length > 0
      ? await supabase
          .from("battles")
          .select("*, sports(*), battle_participants(*), battle_scores(*)")
          .in("id", battleIds)
      : { data: [], error: null };

  const firstError = [
    profile.error,
    bodyMeasurements.error,
    sportSessions.error,
    workouts.error,
    executions.error,
    points.error,
    badges.error,
    events.error,
    battleBundle.error,
  ].find(Boolean);

  if (firstError) {
    return NextResponse.json(
      { error: firstError.message },
      { status: 500 },
    );
  }

  const payload = {
    exported_at: new Date().toISOString(),
    app: "Fortynex",
    user_id: user.id,
    profile: profile.data,
    body_measurements: bodyMeasurements.data ?? [],
    sport_sessions: sportSessions.data ?? [],
    workouts: workouts.data ?? [],
    executions: executions.data ?? [],
    points: points.data,
    badges: badges.data ?? [],
    gamification_events: events.data ?? [],
    battles: battleBundle.data ?? [],
  };

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="fortynex-backup-${dateKey}.json"`,
    },
  });
}
