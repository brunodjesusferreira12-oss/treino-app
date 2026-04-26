import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildExecutionCopilotInsights } from "@/features/workouts/copilot";
import type {
  ExerciseLogRow,
  ExerciseRow,
  ExecutionExerciseCopilotInsight,
  WorkoutExecutionRow,
  WorkoutSectionRow,
  WorkoutWithSections,
} from "@/features/workouts/types";
import { getTodaySportSession } from "@/features/sports/queries";
import { getUserPointsSummary } from "@/features/gamification/queries";
import { getUserBattles } from "@/features/battles/queries";

const WORKOUT_WITH_SECTIONS_SELECT = `
  id,
  user_id,
  sport_id,
  name,
  day_of_week,
  scheduled_days,
  category,
  objective,
  notes,
  created_at,
  updated_at,
  last_accessed_at,
  sports(id, slug, name, description, created_at),
  workout_sections(
    id,
    workout_id,
    title,
    order_index,
    created_at,
    exercises(
      id,
      workout_id,
      section_id,
      name,
      order_index,
      sets,
      reps,
      duration,
      distance,
      load_default,
      notes,
      video_url,
      muscle_group,
      is_priority,
      created_at,
      updated_at
    )
  )
`;

const WORKOUT_HISTORY_SELECT = `
  id,
  executed_at,
  completed,
  exercise_logs(completed)
`;

const EXECUTION_DETAIL_SELECT = `
  id,
  workout_id,
  workout_name,
  notes,
  completed,
  exercise_logs(
    exercise_id,
    completed,
    load_used,
    reps_done,
    rpe,
    rest_seconds,
    notes
  )
`;

const EXECUTION_DETAIL_SELECT_LEGACY = `
  id,
  workout_id,
  workout_name,
  notes,
  completed,
  exercise_logs(
    exercise_id,
    completed,
    load_used,
    reps_done,
    notes
  )
`;

const EXECUTION_LOG_HISTORY_SELECT = `
  id,
  execution_id,
  exercise_id,
  exercise_name,
  section_title,
  prescription,
  load_used,
  reps_done,
  rpe,
  rest_seconds,
  notes,
  completed,
  created_at,
  updated_at
`;

const EXECUTION_LOG_HISTORY_SELECT_LEGACY = `
  id,
  execution_id,
  exercise_id,
  exercise_name,
  section_title,
  prescription,
  load_used,
  reps_done,
  notes,
  completed,
  created_at,
  updated_at
`;

const EXECUTION_LOOKUP_RETRY_MS = [120, 240, 400] as const;

function isRowNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

function isMissingExecutionMetricsColumnError(error: {
  code?: string | null;
  message?: string | null;
} | null) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "42703" ||
    message.includes("rest_seconds") ||
    message.includes(" rpe") ||
    message.includes(".rpe")
  );
}

function normalizeExecutionDetail<
  T extends {
    exercise_logs?: Array<{
      rpe?: number | null;
      rest_seconds?: number | null;
    }>;
  },
>(execution: T) {
  return {
    ...execution,
    exercise_logs: (execution.exercise_logs ?? []).map((log) => ({
      ...log,
      rpe: log.rpe ?? null,
      rest_seconds: log.rest_seconds ?? null,
    })),
  };
}

function normalizeHistoricalExerciseLogs<
  T extends Array<{
    rpe?: number | null;
    rest_seconds?: number | null;
  }>,
>(logs: T) {
  return logs.map((log) => ({
    ...log,
    rpe: log.rpe ?? null,
    rest_seconds: log.rest_seconds ?? null,
  }));
}

async function fetchExecutionDetailWithRetry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  executionId: string,
  userId: string,
) {
  for (let attempt = 0; attempt <= EXECUTION_LOOKUP_RETRY_MS.length; attempt += 1) {
    const primary = await supabase
      .from("workout_executions")
      .select(EXECUTION_DETAIL_SELECT)
      .eq("id", executionId)
      .eq("user_id", userId)
      .maybeSingle();

    let data: unknown = primary.data;
    let error = primary.error;

    if (isMissingExecutionMetricsColumnError(primary.error)) {
      const legacy = await supabase
        .from("workout_executions")
        .select(EXECUTION_DETAIL_SELECT_LEGACY)
        .eq("id", executionId)
        .eq("user_id", userId)
        .maybeSingle();

      data = legacy.data
        ? normalizeExecutionDetail(
            legacy.data as unknown as {
              exercise_logs: ExerciseLogRow[];
            },
          )
        : null;
      error = legacy.error;
    } else if (primary.data) {
      data = normalizeExecutionDetail(
        primary.data as unknown as {
          exercise_logs: ExerciseLogRow[];
        },
      );
    }

    if (data) {
      return { data, error: null };
    }

    if (!isRowNotFoundError(error) || attempt === EXECUTION_LOOKUP_RETRY_MS.length) {
      return { data: null, error };
    }

    await new Promise((resolve) => {
      setTimeout(resolve, EXECUTION_LOOKUP_RETRY_MS[attempt]);
    });
  }

  return { data: null, error: null };
}

function sortWorkoutSections<T extends { order_index: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order_index - b.order_index);
}

function normalizeWorkout(workout: WorkoutWithSections) {
  return {
    ...workout,
    workout_sections: sortWorkoutSections(workout.workout_sections ?? []).map(
      (section) => ({
        ...section,
        exercises: sortWorkoutSections(section.exercises ?? []),
      }),
    ),
  };
}

export async function getProfile() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentSportContext() {
  const todaySession = await getTodaySportSession();
  return {
    todaySession,
    activeSportId: todaySession?.sport_id ?? null,
    activeSportSlug: todaySession?.sports?.slug ?? null,
    activeSportName: todaySession?.sports?.name ?? null,
  };
}

export async function getWorkouts(filters?: { sportId?: string | null }) {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_SELECT)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (filters?.sportId) {
    query = query.eq("sport_id", filters.sportId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) =>
    normalizeWorkout(item as unknown as WorkoutWithSections),
  );
}

export async function getWorkoutById(workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_SELECT)
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return normalizeWorkout(data as unknown as WorkoutWithSections);
}

export async function getWorkoutOptions(filters?: { sportId?: string | null }) {
  const workouts = await getWorkouts(filters);
  return workouts.map((workout) => ({
    value: workout.id,
    label: workout.name,
  }));
}

export async function getWorkoutHistory(workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_executions")
    .select(WORKOUT_HISTORY_SELECT)
    .eq("user_id", user.id)
    .eq("workout_id", workoutId)
    .order("executed_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Array<
    WorkoutExecutionRow & { exercise_logs: ExerciseLogRow[] }
  >;
}

export async function getExecutionById(executionId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const {
    data: execution,
    error: executionError,
  } = await fetchExecutionDetailWithRetry(supabase, executionId, user.id);

  if (executionError) {
    throw new Error(executionError.message);
  }

  if (!execution) {
    notFound();
  }

  const normalizedExecution = execution as WorkoutExecutionRow & {
    exercise_logs: ExerciseLogRow[];
  };

  if (!normalizedExecution.workout_id) {
    return {
      execution: normalizedExecution,
      workout: null,
    };
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select(WORKOUT_WITH_SECTIONS_SELECT)
    .eq("id", normalizedExecution.workout_id)
    .eq("user_id", user.id)
    .single();

  if (workoutError || !workout) {
    return {
      execution: normalizedExecution,
      workout: null,
    };
  }

  return {
    execution: normalizedExecution,
    workout: normalizeWorkout(workout as unknown as WorkoutWithSections),
  };
}

export async function getExecutionCopilotInsights(executionId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: execution, error: executionError } = await supabase
    .from("workout_executions")
    .select("id, workout_id")
    .eq("id", executionId)
    .eq("user_id", user.id)
    .single();

  if (executionError || !execution || !execution.workout_id) {
    return {} as Record<string, ExecutionExerciseCopilotInsight>;
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, user_id, workout_sections(*, exercises(*))")
    .eq("id", execution.workout_id)
    .eq("user_id", user.id)
    .single();

  if (workoutError || !workout) {
    return {} as Record<string, ExecutionExerciseCopilotInsight>;
  }

  const normalizedWorkout = normalizeWorkout(workout as unknown as WorkoutWithSections);
  const exercises = normalizedWorkout.workout_sections.flatMap((section) => section.exercises);
  const exerciseIds = exercises.map((exercise) => exercise.id);

  if (exerciseIds.length === 0) {
    return {} as Record<string, ExecutionExerciseCopilotInsight>;
  }

  const { data: pastExecutions, error: pastExecutionsError } = await supabase
    .from("workout_executions")
    .select("id, executed_at")
    .eq("user_id", user.id)
    .eq("workout_id", execution.workout_id)
    .neq("id", executionId)
    .order("executed_at", { ascending: false })
    .limit(24);

  if (pastExecutionsError) {
    throw new Error(pastExecutionsError.message);
  }

  const executionDateMap = new Map(
    (pastExecutions ?? []).map((item) => [item.id, item.executed_at]),
  );

  if (executionDateMap.size === 0) {
    return buildExecutionCopilotInsights(exercises, []);
  }

  const { data: pastLogs, error: pastLogsError } = await supabase
    .from("exercise_logs")
    .select(EXECUTION_LOG_HISTORY_SELECT)
    .in("execution_id", Array.from(executionDateMap.keys()))
    .in("exercise_id", exerciseIds);

  let historicalLogs = pastLogs as ExerciseLogRow[] | null;
  let historicalLogsError = pastLogsError;

  if (isMissingExecutionMetricsColumnError(pastLogsError)) {
    const legacyLogsResult = await supabase
      .from("exercise_logs")
      .select(EXECUTION_LOG_HISTORY_SELECT_LEGACY)
      .in("execution_id", Array.from(executionDateMap.keys()))
      .in("exercise_id", exerciseIds);

    historicalLogs = legacyLogsResult.data
      ? (normalizeHistoricalExerciseLogs(
          legacyLogsResult.data as Array<ExerciseLogRow>,
        ) as ExerciseLogRow[])
      : null;
    historicalLogsError = legacyLogsResult.error;
  }

  if (historicalLogsError) {
    throw new Error(historicalLogsError.message);
  }

  return buildExecutionCopilotInsights(
    exercises,
    ((historicalLogs ?? []) as ExerciseLogRow[]).map((log) => ({
      ...log,
      executed_at: executionDateMap.get(log.execution_id) ?? new Date().toISOString(),
    })),
  );
}

export async function getHistoryExecutions(filters?: {
  workoutId?: string;
  from?: string;
  to?: string;
  sportId?: string | null;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("workout_executions")
    .select("*, exercise_logs(*)")
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false });

  if (filters?.workoutId) {
    query = query.eq("workout_id", filters.workoutId);
  }

  if (filters?.sportId) {
    query = query.eq("sport_id", filters.sportId);
  }

  if (filters?.from) {
    query = query.gte("executed_at", new Date(filters.from).toISOString());
  }

  if (filters?.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("executed_at", toDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Array<
    WorkoutExecutionRow & { exercise_logs: ExerciseLogRow[] }
  >;
}

export async function getHistoryExecutionDetail(executionId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_executions")
    .select("*, exercise_logs(*)")
    .eq("id", executionId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return data as unknown as WorkoutExecutionRow & { exercise_logs: ExerciseLogRow[] };
}

export async function getProgressData(filters?: { sportId?: string | null }) {
  const user = await requireUser();
  const supabase = await createClient();

  let executionQuery = supabase
    .from("workout_executions")
    .select("*")
    .eq("user_id", user.id)
    .order("executed_at", { ascending: true });

  if (filters?.sportId) {
    executionQuery = executionQuery.eq("sport_id", filters.sportId);
  }

  const { data: executions, error: executionsError } = await executionQuery;

  if (executionsError) {
    throw new Error(executionsError.message);
  }

  const executionIds = (executions ?? []).map((execution) => execution.id);

  const { data: logs, error: logsError } = executionIds.length
    ? await supabase
        .from("exercise_logs")
        .select("*")
        .in("execution_id", executionIds)
    : { data: [], error: null };

  if (logsError) {
    throw new Error(logsError.message);
  }

  return {
    executions: (executions ?? []) as WorkoutExecutionRow[],
    logs: (logs ?? []) as unknown as ExerciseLogRow[],
  };
}

export async function getWorkoutExerciseMaps(workoutId: string) {
  const supabase = await createClient();

  const [{ data: sections }, { data: exercises }] = await Promise.all([
    supabase.from("workout_sections").select("*").eq("workout_id", workoutId),
    supabase.from("exercises").select("*").eq("workout_id", workoutId),
  ]);

  const sectionMap = new Map(
    ((sections ?? []) as WorkoutSectionRow[]).map((section) => [section.id, section]),
  );
  const exerciseMap = new Map(
    ((exercises ?? []) as ExerciseRow[]).map((exercise) => [exercise.id, exercise]),
  );

  return { sectionMap, exerciseMap };
}

export async function getDashboardData() {
  const [profile, sportContext, pointsSummary, battles] = await Promise.all([
    getProfile(),
    getCurrentSportContext(),
    getUserPointsSummary(),
    getUserBattles(),
  ]);

  const [workouts, executions] = await Promise.all([
    getWorkouts({ sportId: sportContext.activeSportId }),
    getHistoryExecutions({ sportId: sportContext.activeSportId }),
  ]);

  const totalExercises = workouts.reduce(
    (acc, workout) =>
      acc +
      workout.workout_sections.reduce(
        (sectionAcc, section) => sectionAcc + section.exercises.length,
        0,
      ),
    0,
  );

  const plannedSessionsPerWeek = workouts.reduce(
    (acc, workout) => acc + Math.max(workout.scheduled_days.length, 1),
    0,
  );

  const weeklyPlan = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map((day) => ({
    day,
    workouts: workouts.filter((workout) => workout.scheduled_days.includes(day)),
  }));

  const recentExecutions = executions.slice(0, 5);
  const recentWorkouts = [...workouts]
    .sort((a, b) => {
      const aDate = a.last_accessed_at ?? a.updated_at;
      const bDate = b.last_accessed_at ?? b.updated_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 5);

  const frequencyChart = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 * (7 - index) + date.getDay()));

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(start.getDate() + 6);

    const count = executions.filter((execution) => {
      const executedAt = new Date(execution.executed_at);
      return executedAt >= start && executedAt <= end && execution.completed;
    }).length;

    return {
      week: `${start.getDate()}/${start.getMonth() + 1}`,
      count,
    };
  });

  const completionRate =
    executions.length === 0
      ? 0
      : Math.round(
          (executions.filter((execution) => execution.completed).length / executions.length) *
            100,
        );

  return {
    profile,
    sportContext,
    workouts,
    weeklyPlan,
    recentExecutions,
    recentWorkouts,
    pointsSummary,
    battles,
    stats: {
      totalWorkouts: workouts.length,
      plannedSessionsPerWeek,
      totalExercises,
      averageExercisesPerWorkout:
        workouts.length > 0 ? Math.round(totalExercises / workouts.length) : 0,
      completionRate,
    },
    frequencyChart,
  };
}
