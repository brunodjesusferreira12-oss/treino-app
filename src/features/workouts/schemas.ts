import { z } from "zod";

import { CATEGORY_OPTIONS, DAY_ORDER, SPORT_SLUGS } from "@/lib/constants";

const textToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }

    return value;
  }, schema.nullable());

const numberToNull = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}, z.number().nonnegative().nullable());

const rpeToNull = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}, z.number().min(1).max(10).nullable());

const restSecondsToNull = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}, z.number().int().min(0).max(3600).nullable());

export const exerciseFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome do exercício."),
  sets: numberToNull,
  reps: textToNull(z.string().trim().max(40)),
  duration: textToNull(z.string().trim().max(40)),
  distance: textToNull(z.string().trim().max(40)),
  loadDefault: numberToNull,
  notes: textToNull(z.string().trim().max(500)),
  videoUrl: textToNull(z.string().trim().url("Informe uma URL válida.")),
  muscleGroup: textToNull(z.string().trim().max(80)),
  isPriority: z.boolean().default(false),
});

export const sectionFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Informe o nome do bloco."),
  exercises: z
    .array(exerciseFormSchema)
    .min(1, "Adicione pelo menos um exercício por bloco."),
});

export const workoutFormSchema = z.object({
  id: z.string().uuid().optional(),
  sportSlug: z.enum(SPORT_SLUGS as unknown as [string, ...string[]]),
  name: z.string().trim().min(2, "Informe o nome do treino."),
  scheduledDays: z
    .array(z.enum(DAY_ORDER as unknown as [string, ...string[]]))
    .min(1, "Selecione ao menos um dia."),
  category: z.enum(CATEGORY_OPTIONS as unknown as [string, ...string[]]),
  objective: textToNull(z.string().trim().max(180)),
  notes: textToNull(z.string().trim().max(1200)),
  sections: z
    .array(sectionFormSchema)
    .min(1, "Crie pelo menos um bloco de treino."),
});

export const exerciseLogInputSchema = z.object({
  exerciseId: z.string().uuid(),
  completed: z.boolean().default(false),
  loadUsed: numberToNull,
  repsDone: textToNull(z.string().trim().max(80)),
  rpe: rpeToNull,
  restSeconds: restSecondsToNull,
  notes: textToNull(z.string().trim().max(500)),
});

export const executionFormSchema = z.object({
  executionId: z.string().uuid(),
  notes: textToNull(z.string().trim().max(1200)),
  completed: z.boolean().default(false),
  logs: z.array(exerciseLogInputSchema).min(1),
});

export type WorkoutFormValues = z.infer<typeof workoutFormSchema>;
export type ExecutionFormValues = z.infer<typeof executionFormSchema>;
