import { DAY_OPTIONS } from "@/lib/constants";

type ExerciseFormatInput = {
  sets: number | null;
  reps: string | null;
  duration: string | null;
  distance: string | null;
};

export function getDayLabel(value: string | null | undefined) {
  if (!value) return "Sem dia definido";
  return DAY_OPTIONS.find((day) => day.value === value)?.label ?? value;
}

export function formatScheduledDays(days: string[] | null | undefined) {
  if (!days?.length) return "Sem agenda";
  return days
    .map((day) => getDayLabel(day))
    .filter(Boolean)
    .join(", ");
}

export function formatExercisePrescription(exercise: ExerciseFormatInput) {
  const suffix = exercise.reps ?? exercise.duration ?? exercise.distance ?? null;

  if (!exercise.sets && !suffix) {
    return "Livre";
  }

  if (!exercise.sets) {
    return suffix ?? "Livre";
  }

  if (!suffix) {
    return `${exercise.sets} séries`;
  }

  return `${exercise.sets}x${suffix}`;
}

export function formatDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatLoad(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sem carga";
  return `${value.toLocaleString("pt-BR")} kg`;
}
