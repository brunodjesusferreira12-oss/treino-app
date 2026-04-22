import type { Database } from "@/lib/supabase/database.types";

export type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutSectionRow =
  Database["public"]["Tables"]["workout_sections"]["Row"];
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
export type WorkoutExecutionRow =
  Database["public"]["Tables"]["workout_executions"]["Row"];
export type ExerciseLogRow = Database["public"]["Tables"]["exercise_logs"]["Row"];

export type WorkoutSectionWithExercises = WorkoutSectionRow & {
  exercises: ExerciseRow[];
};

export type WorkoutWithSections = WorkoutRow & {
  workout_sections: WorkoutSectionWithExercises[];
};

export type WorkoutExecutionWithLogs = WorkoutExecutionRow & {
  exercise_logs: ExerciseLogRow[];
};
