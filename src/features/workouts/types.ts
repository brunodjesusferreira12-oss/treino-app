import type { Database } from "@/lib/supabase/database.types";

export type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutSectionRow =
  Database["public"]["Tables"]["workout_sections"]["Row"];
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
export type SportRow = Database["public"]["Tables"]["sports"]["Row"];
export type WorkoutExecutionRow =
  Database["public"]["Tables"]["workout_executions"]["Row"];
export type ExerciseLogRow = Database["public"]["Tables"]["exercise_logs"]["Row"];

export type WorkoutSectionWithExercises = WorkoutSectionRow & {
  exercises: ExerciseRow[];
};

export type WorkoutWithSections = WorkoutRow & {
  sports?: SportRow | null;
  workout_sections: WorkoutSectionWithExercises[];
};

export type WorkoutExecutionWithLogs = WorkoutExecutionRow & {
  exercise_logs: ExerciseLogRow[];
};

export type ExecutionExerciseHistoryEntry = {
  executedAt: string;
  loadUsed: number | null;
  repsDone: string | null;
  restSeconds: number | null;
  completed: boolean;
  notes: string | null;
};

export type ExecutionExerciseCopilotInsight = {
  exerciseId: string;
  averageLoad: number | null;
  lastLoad: number | null;
  bestLoad: number | null;
  lastRepsDone: string | null;
  sessionCount: number;
  completionCount: number;
  loadHistoryCount: number;
  recommendedRest: string;
  recommendedRestSeconds: number;
  recommendedLoadLabel: string;
  recentHistory: ExecutionExerciseHistoryEntry[];
};
