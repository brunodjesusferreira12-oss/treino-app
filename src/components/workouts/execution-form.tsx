"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { CheckCircle2, CirclePlay, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatExercisePrescription } from "@/lib/format";
import { cn } from "@/lib/utils";
import { saveExecutionAction } from "@/features/workouts/actions";
import {
  executionFormSchema,
  type ExecutionFormValues,
} from "@/features/workouts/schemas";
import type { WorkoutWithSections } from "@/features/workouts/types";

type ExecutionFormProps = {
  executionId: string;
  workout: WorkoutWithSections;
  notes: string | null;
  existingLogs: Record<
    string,
    {
      completed: boolean;
      loadUsed: number | null;
      repsDone: string | null;
      notes: string | null;
    }
  >;
  completed: boolean;
};

export function ExecutionForm({
  executionId,
  workout,
  notes,
  existingLogs,
  completed,
}: ExecutionFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const exercises = workout.workout_sections.flatMap((section) =>
    section.exercises.map((exercise) => ({
      ...exercise,
      sectionTitle: section.title,
    })),
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
  } = useForm<ExecutionFormValues>({
    resolver: zodResolver(executionFormSchema) as Resolver<ExecutionFormValues>,
    defaultValues: {
      executionId,
      notes: notes ?? null,
      completed,
      logs: exercises.map((exercise) => ({
        exerciseId: exercise.id,
        completed: existingLogs[exercise.id]?.completed ?? false,
        loadUsed: existingLogs[exercise.id]?.loadUsed ?? exercise.load_default ?? null,
        repsDone: existingLogs[exercise.id]?.repsDone ?? null,
        notes: existingLogs[exercise.id]?.notes ?? null,
      })),
    },
  });

  const logs = useWatch({
    control,
    name: "logs",
  }) ?? [];
  const completedCount = logs.filter((item) => item.completed).length;
  const progress = exercises.length === 0 ? 0 : (completedCount / exercises.length) * 100;

  const onSubmit = (markAsCompleted: boolean) =>
    handleSubmit((values) =>
      startTransition(async () => {
        setMessage(null);
        const result = await saveExecutionAction({
          ...values,
          completed: markAsCompleted,
        });

        if (!result.ok) {
          setMessage(result.error ?? "Não foi possível salvar a execução.");
          return;
        }

        router.refresh();
        if (markAsCompleted) {
          router.push("/app/history");
        }
      }),
    );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Progresso do treino</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              {completedCount}/{exercises.length} exercícios concluídos
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-200">
            {Math.round(progress)}% concluído
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/6">
          <div
            className="h-full rounded-full bg-lime-300 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <form className="space-y-4">
        {workout.workout_sections.map((section) => (
          <Card key={section.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
                  Bloco
                </p>
                <h3 className="mt-2 text-xl font-semibold text-zinc-50">
                  {section.title}
                </h3>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-zinc-400">
                {section.exercises.length} exercícios
              </div>
            </div>

            <div className="space-y-4">
              {section.exercises.map((exercise) => {
                const index = exercises.findIndex((item) => item.id === exercise.id);
                const watched = logs[index];

                return (
                  <div
                    key={exercise.id}
                    className={cn(
                      "rounded-[24px] border border-white/10 bg-zinc-950/50 p-4 transition",
                      watched?.completed ? "border-lime-300/30 bg-lime-300/5" : "",
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
                            <Checkbox
                              checked={watched?.completed ?? false}
                              onChange={(event) =>
                                setValue(
                                  `logs.${index}.completed`,
                                  event.target.checked,
                                  { shouldDirty: true },
                                )
                              }
                            />
                            {watched?.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-lime-300" />
                            ) : (
                              <CirclePlay className="h-4 w-4 text-zinc-500" />
                            )}
                            Concluir
                          </label>
                          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-400">
                            {formatExercisePrescription(exercise)}
                          </span>
                          {exercise.is_priority ? (
                            <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-semibold text-zinc-950">
                              Prioritário
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-zinc-50">
                            {exercise.name}
                          </h4>
                          <p className="mt-1 text-sm text-zinc-500">
                            {exercise.muscle_group ?? section.title}
                          </p>
                        </div>
                        {exercise.notes ? (
                          <p className="text-sm leading-6 text-zinc-400">
                            {exercise.notes}
                          </p>
                        ) : null}
                        {exercise.video_url ? (
                          <a
                            href={exercise.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-lime-200 hover:text-lime-100"
                          >
                            Abrir vídeo
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>

                      <div className="grid w-full gap-4 md:max-w-xl md:grid-cols-3">
                        <FormField label="Carga (kg)">
                          <Input
                            type="number"
                            min={0}
                            step="0.5"
                            {...register(`logs.${index}.loadUsed`, {
                              setValueAs: (value) =>
                                value === "" ? null : Number(value),
                            })}
                          />
                        </FormField>
                        <FormField label="Repetições / resultado">
                          <Input
                            placeholder="8, 12, 30s..."
                            {...register(`logs.${index}.repsDone`)}
                          />
                        </FormField>
                        <FormField label="Observação">
                          <Input
                            placeholder="Como foi hoje?"
                            {...register(`logs.${index}.notes`)}
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <Card>
          <FormField label="Observações do dia">
            <Textarea
              placeholder="Como você se sentiu, ajustes, dor, evolução..."
              {...register("notes")}
            />
          </FormField>
        </Card>

        {message ? (
          <Card className="border-red-500/20 bg-red-500/8 text-sm text-red-200">
            {message}
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => void onSubmit(false)()}
          >
            Salvar progresso
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => void onSubmit(true)()}
          >
            {isPending ? "Salvando..." : "Finalizar treino"}
          </Button>
        </div>
      </form>
    </div>
  );
}
