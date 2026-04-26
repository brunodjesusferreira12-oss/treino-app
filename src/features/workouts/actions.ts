"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/constants";
import { formatExercisePrescription } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { awardExecutionGamification } from "@/features/gamification/service";
import {
  executionFormSchema,
  type ExecutionFormValues,
  workoutFormSchema,
  type WorkoutFormValues,
} from "@/features/workouts/schemas";
import type { ExerciseRow, WorkoutSectionRow } from "@/features/workouts/types";

type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

type ExerciseLogInsert = Database["public"]["Tables"]["exercise_logs"]["Insert"];

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

function stripExecutionMetricColumns(log: ExerciseLogInsert): ExerciseLogInsert {
  const legacyLog = { ...log };
  delete legacyLog.rpe;
  delete legacyLog.rest_seconds;
  return legacyLog;
}

function revalidateWorkoutPages(workoutId?: string) {
  revalidatePath(APP_ROUTES.app);
  revalidatePath(APP_ROUTES.workouts);
  revalidatePath(APP_ROUTES.history);
  revalidatePath(APP_ROUTES.progress);
  revalidatePath(APP_ROUTES.ranking);
  revalidatePath(APP_ROUTES.battles);

  if (workoutId) {
    revalidatePath(`${APP_ROUTES.workouts}/${workoutId}`);
    revalidatePath(`${APP_ROUTES.workouts}/${workoutId}/edit`);
  }
}

function revalidateExecutionStart(workoutId: string) {
  revalidatePath(`${APP_ROUTES.workouts}/${workoutId}`);
  revalidatePath(APP_ROUTES.history);
}

export async function upsertWorkoutAction(
  rawInput: WorkoutFormValues,
): Promise<ActionResult> {
  const parsed = workoutFormSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const input = parsed.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sport, error: sportError } = await supabase
    .from("sports")
    .select("id")
    .eq("slug", input.sportSlug)
    .single();

  if (sportError || !sport) {
    return {
      ok: false,
      error: sportError?.message ?? "Modalidade não encontrada.",
    };
  }

  const workoutPayload = {
    user_id: user.id,
    sport_id: sport.id,
    name: input.name,
    day_of_week: input.scheduledDays[0] ?? null,
    scheduled_days: input.scheduledDays,
    category: input.category,
    objective: input.objective,
    notes: input.notes,
  };

  let workoutId = input.id;

  if (workoutId) {
    const { error } = await supabase
      .from("workouts")
      .update(workoutPayload)
      .eq("id", workoutId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { data, error } = await supabase
      .from("workouts")
      .insert(workoutPayload)
      .select("id")
      .single();

    if (error || !data) {
        return {
          ok: false,
          error: error?.message ?? "Não foi possível criar o treino.",
        };
    }

    workoutId = data.id;
  }

  const [{ data: existingSections }, { data: existingExercises }] = await Promise.all([
    supabase.from("workout_sections").select("id").eq("workout_id", workoutId),
    supabase.from("exercises").select("id").eq("workout_id", workoutId),
  ]);

  const keepSectionIds = new Set<string>();
  const keepExerciseIds = new Set<string>();

  for (const [sectionIndex, section] of input.sections.entries()) {
    let sectionId = section.id;

    const sectionPayload = {
      workout_id: workoutId,
      title: section.title,
      order_index: sectionIndex,
    };

    if (sectionId) {
      const { error } = await supabase
        .from("workout_sections")
        .update(sectionPayload)
        .eq("id", sectionId)
        .eq("workout_id", workoutId);

      if (error) {
        return { ok: false, error: error.message };
      }
    } else {
      const { data, error } = await supabase
        .from("workout_sections")
        .insert(sectionPayload)
        .select("id")
        .single();

      if (error || !data) {
        return {
          ok: false,
          error: error?.message ?? "Não foi possível salvar o bloco.",
        };
      }

      sectionId = data.id;
    }

    keepSectionIds.add(sectionId);

    for (const [exerciseIndex, exercise] of section.exercises.entries()) {
      let exerciseId = exercise.id;

      const exercisePayload = {
        workout_id: workoutId,
        section_id: sectionId,
        name: exercise.name,
        order_index: exerciseIndex,
        sets: exercise.sets,
        reps: exercise.reps,
        duration: exercise.duration,
        distance: exercise.distance,
        load_default: exercise.loadDefault,
        notes: exercise.notes,
        video_url: exercise.videoUrl,
        muscle_group: exercise.muscleGroup,
        is_priority: exercise.isPriority,
      };

      if (exerciseId) {
        const { error } = await supabase
          .from("exercises")
          .update(exercisePayload)
          .eq("id", exerciseId)
          .eq("workout_id", workoutId);

        if (error) {
          return { ok: false, error: error.message };
        }
      } else {
        const { data, error } = await supabase
          .from("exercises")
          .insert(exercisePayload)
          .select("id")
          .single();

        if (error || !data) {
          return {
            ok: false,
            error: error?.message ?? "Não foi possível salvar o exercício.",
          };
        }

        exerciseId = data.id;
      }

      keepExerciseIds.add(exerciseId);
    }
  }

  const exerciseIdsToDelete = (existingExercises ?? [])
    .map((exercise) => exercise.id)
    .filter((id) => !keepExerciseIds.has(id));

  if (exerciseIdsToDelete.length > 0) {
    const { error } = await supabase.from("exercises").delete().in("id", exerciseIdsToDelete);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const sectionIdsToDelete = (existingSections ?? [])
    .map((section) => section.id)
    .filter((id) => !keepSectionIds.has(id));

  if (sectionIdsToDelete.length > 0) {
    const { error } = await supabase
      .from("workout_sections")
      .delete()
      .in("id", sectionIdsToDelete);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidateWorkoutPages(workoutId);
  return { ok: true, id: workoutId };
}

export async function deleteWorkoutAction(workoutId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateWorkoutPages(workoutId);
  return { ok: true };
}

export async function touchWorkoutAction(workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("workouts")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", workoutId)
    .eq("user_id", user.id);
}

export async function startExecutionAction(workoutId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, name, sport_id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();

  if (workoutError || !workout) {
    return {
      ok: false,
      error: workoutError?.message ?? "Treino não encontrado.",
    };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const { data: existing } = await supabase
    .from("workout_executions")
    .select("id")
    .eq("user_id", user.id)
    .eq("workout_id", workoutId)
    .eq("completed", false)
    .gte("executed_at", start.toISOString())
    .lte("executed_at", end.toISOString())
    .maybeSingle();

  if (existing) {
    return { ok: true, id: existing.id };
  }

  const { data, error } = await supabase
    .from("workout_executions")
    .insert({
      user_id: user.id,
      workout_id: workout.id,
      sport_id: workout.sport_id,
      workout_name: workout.name,
      executed_at: new Date().toISOString(),
      completed: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Não foi possível iniciar o treino.",
    };
  }

  const { data: confirmedExecution, error: confirmError } = await supabase
    .from("workout_executions")
    .select("id")
    .eq("id", data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (confirmError) {
    return {
      ok: false,
      error: confirmError.message,
    };
  }

  revalidateExecutionStart(workoutId);
  return { ok: true, id: confirmedExecution?.id ?? data.id };
}

export async function saveExecutionAction(
  rawInput: ExecutionFormValues,
): Promise<ActionResult> {
  const parsed = executionFormSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const input = parsed.data;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: execution, error: executionError } = await supabase
    .from("workout_executions")
    .select("id, workout_id, sport_id, completed, notes")
    .eq("id", input.executionId)
    .eq("user_id", user.id)
    .single();

  if (executionError || !execution) {
    return {
      ok: false,
      error: executionError?.message ?? "Execução não encontrada.",
    };
  }

  if (!execution.workout_id) {
    return {
      ok: false,
      error: "Esta execução está sem treino vinculado.",
    };
  }

  const [{ data: existingLogs }, { data: sections }, { data: exercises }] = await Promise.all([
    supabase
      .from("exercise_logs")
      .select("exercise_id, completed, notes")
      .eq("execution_id", input.executionId),
    supabase.from("workout_sections").select("*").eq("workout_id", execution.workout_id),
    supabase.from("exercises").select("*").eq("workout_id", execution.workout_id),
  ]);

  const existingLogMap = new Map<
    string,
    {
      completed: boolean;
      notes: string | null;
    }
  >(
    (existingLogs ?? []).map((log) => [
      log.exercise_id ?? "",
      {
        completed: log.completed,
        notes: log.notes,
      },
    ]),
  );

  const sectionMap = new Map(
    ((sections ?? []) as WorkoutSectionRow[]).map((section) => [section.id, section]),
  );
  const exerciseMap = new Map(
    ((exercises ?? []) as ExerciseRow[]).map((exercise) => [exercise.id, exercise]),
  );

  const payload: ExerciseLogInsert[] = [];

  for (const log of input.logs) {
    const exercise = exerciseMap.get(log.exerciseId);
    if (!exercise) continue;

    payload.push({
      execution_id: input.executionId,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      section_title: sectionMap.get(exercise.section_id)?.title ?? null,
      prescription: formatExercisePrescription({
        sets: exercise.sets,
        reps: exercise.reps,
        duration: exercise.duration,
        distance: exercise.distance,
      }),
      load_used: log.loadUsed,
      reps_done: log.repsDone,
      rest_seconds: log.restSeconds,
      notes: log.notes,
      completed: log.completed,
    });
  }

  if (payload.length > 0) {
    let { error } = await supabase.from("exercise_logs").upsert(payload, {
      onConflict: "execution_id,exercise_id",
    });

    if (isMissingExecutionMetricsColumnError(error)) {
      const legacyPayload = payload.map(stripExecutionMetricColumns);

      const legacyResult = await supabase.from("exercise_logs").upsert(legacyPayload, {
        onConflict: "execution_id,exercise_id",
      });

      error = legacyResult.error;
    }

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const { error } = await supabase
    .from("workout_executions")
    .update({
      notes: input.notes,
      completed: input.completed,
    })
    .eq("id", input.executionId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await awardExecutionGamification({
    userId: user.id,
    sportId: execution.sport_id,
    executionId: input.executionId,
    completed: !execution.completed && input.completed,
    noteAdded: !execution.notes && Boolean(input.notes),
    exerciseCompletions: input.logs.map((log) => ({
      exerciseId: log.exerciseId,
      completedNow:
        log.completed && !existingLogMap.get(log.exerciseId)?.completed,
    })),
  });

  revalidatePath(`${APP_ROUTES.app}/executions/${input.executionId}`);
  revalidateWorkoutPages(execution.workout_id);

  return { ok: true, id: input.executionId };
}
