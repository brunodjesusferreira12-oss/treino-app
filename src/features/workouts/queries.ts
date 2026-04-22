import { cache } from "react";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  ExerciseLogRow,
  ExerciseRow,
  WorkoutExecutionRow,
  WorkoutSectionRow,
  WorkoutWithSections,
} from "@/features/workouts/types";

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

export const getProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
});

export const getWorkouts = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sections(*, exercises(*))")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) =>
    normalizeWorkout(item as unknown as WorkoutWithSections),
  );
});

export async function getWorkoutById(workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sections(*, exercises(*))")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  return normalizeWorkout(data as unknown as WorkoutWithSections);
}

export async function getWorkoutOptions() {
  const workouts = await getWorkouts();
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
    .select("*, exercise_logs(*)")
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

  const { data: execution, error: executionError } = await supabase
    .from("workout_executions")
    .select("*, exercise_logs(*)")
    .eq("id", executionId)
    .eq("user_id", user.id)
    .single();

  if (executionError || !execution) {
    notFound();
  }

  if (!execution.workout_id) {
    return {
      execution: execution as unknown as WorkoutExecutionRow & {
        exercise_logs: ExerciseLogRow[];
      },
      workout: null,
    };
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("*, workout_sections(*, exercises(*))")
    .eq("id", execution.workout_id)
    .eq("user_id", user.id)
    .single();

  if (workoutError || !workout) {
    return {
      execution: execution as unknown as WorkoutExecutionRow & {
        exercise_logs: ExerciseLogRow[];
      },
      workout: null,
    };
  }

  return {
    execution: execution as unknown as WorkoutExecutionRow & {
      exercise_logs: ExerciseLogRow[];
    },
    workout: normalizeWorkout(workout as unknown as WorkoutWithSections),
  };
}

export async function getHistoryExecutions(filters?: {
  workoutId?: string;
  from?: string;
  to?: string;
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

export async function getProgressData() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: executions, error: executionsError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase
        .from("workout_executions")
        .select("*")
        .eq("user_id", user.id)
        .order("executed_at", { ascending: true }),
      supabase
        .from("exercise_logs")
        .select("*, workout_executions!inner(user_id)")
        .eq("workout_executions.user_id", user.id),
    ]);

  if (executionsError) {
    throw new Error(executionsError.message);
  }

  if (logsError) {
    throw new Error(logsError.message);
  }

  return {
    executions: (executions ?? []) as WorkoutExecutionRow[],
    logs: (logs ?? []) as unknown as ExerciseLogRow[],
  };
}

export async function getWorkoutExercises(workoutId: string) {
  const workout = await getWorkoutById(workoutId);
  return workout.workout_sections.flatMap((section) => section.exercises);
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
  const [profile, workouts, executions] = await Promise.all([
    getProfile(),
    getWorkouts(),
    getHistoryExecutions(),
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

  const lastEightWeeks = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 * (7 - index) + date.getDay()));

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(start.getDate() + 6);

    const count = executions.filter((execution) => {
      const executedAt = new Date(execution.executed_at);
      return executedAt >= start && executedAt <= end;
    }).length;

    return {
      week: `${start.getDate()}/${start.getMonth() + 1}`,
      count,
    };
  });

  const completedLast30Days = executions.filter((execution) => {
    const executedAt = new Date(execution.executed_at).getTime();
    return executedAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  });

  const completionRate =
    completedLast30Days.length === 0
      ? 0
      : Math.round(
          (completedLast30Days.filter((execution) => execution.completed).length /
            completedLast30Days.length) *
            100,
        );

  return {
    profile,
    workouts,
    weeklyPlan,
    recentExecutions,
    recentWorkouts,
    stats: {
      totalWorkouts: workouts.length,
      plannedSessionsPerWeek,
      totalExercises,
      averageExercisesPerWorkout:
        workouts.length > 0 ? Math.round(totalExercises / workouts.length) : 0,
      completionRate,
    },
    frequencyChart: lastEightWeeks,
  };
}
