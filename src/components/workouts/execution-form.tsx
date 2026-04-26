"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BrainCircuit, CheckCircle2, CirclePlay } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseVideoButton } from "@/components/videos/exercise-video-button";
import { ExecutionCopilotCard } from "@/components/workouts/execution-copilot-card";
import { saveExecutionAction } from "@/features/workouts/actions";
import {
  executionFormSchema,
  type ExecutionFormValues,
} from "@/features/workouts/schemas";
import type {
  ExecutionExerciseCopilotInsight,
  WorkoutWithSections,
} from "@/features/workouts/types";
import { formatExercisePrescription } from "@/lib/format";
import { cn } from "@/lib/utils";

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
      restSeconds: number | null;
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
  const [copilotInsights, setCopilotInsights] = useState<
    Record<string, ExecutionExerciseCopilotInsight>
  >({});
  const [isCopilotLoading, setIsCopilotLoading] = useState(true);
  const [activeRestExerciseId, setActiveRestExerciseId] = useState<string | null>(null);
  const [remainingRestSeconds, setRemainingRestSeconds] = useState(0);
  const [initialRestSeconds, setInitialRestSeconds] = useState(0);
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
    formState: { errors },
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
        restSeconds: existingLogs[exercise.id]?.restSeconds ?? null,
        notes: existingLogs[exercise.id]?.notes ?? null,
      })),
    },
  });

  const logs =
    useWatch({
      control,
      name: "logs",
    }) ?? [];

  const completedCount = logs.filter((item) => item.completed).length;
  const progress = exercises.length === 0 ? 0 : (completedCount / exercises.length) * 100;
  const hasValidationErrors =
    Boolean(errors.executionId) ||
    Boolean(errors.notes) ||
    exercises.some((_, index) =>
      Boolean(
        errors.logs?.[index]?.exerciseId ||
          errors.logs?.[index]?.loadUsed ||
          errors.logs?.[index]?.repsDone ||
          errors.logs?.[index]?.restSeconds ||
          errors.logs?.[index]?.notes,
      ),
    );

  useEffect(() => {
    if (remainingRestSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingRestSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [remainingRestSeconds]);

  useEffect(() => {
    let ignore = false;

    async function loadCopilot() {
      setIsCopilotLoading(true);

      try {
        const response = await fetch(`/api/executions/${executionId}/copilot`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | {
              insights?: Record<string, ExecutionExerciseCopilotInsight>;
              error?: string;
            }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Não foi possível carregar o copiloto.");
        }

        if (!ignore) {
          setCopilotInsights(payload?.insights ?? {});
        }
      } catch {
        if (!ignore) {
          setCopilotInsights({});
        }
      } finally {
        if (!ignore) {
          setIsCopilotLoading(false);
        }
      }
    }

    void loadCopilot();

    return () => {
      ignore = true;
    };
  }, [executionId]);

  const submitExecution = (markAsCompleted: boolean) =>
    handleSubmit(
      (values) =>
        startTransition(async () => {
          setMessage(null);

          try {
            const result = await saveExecutionAction({
              ...values,
              completed: markAsCompleted,
            });

            if (!result.ok) {
              setMessage(result.error ?? "Não foi possível salvar a execução.");
              return;
            }

            if (markAsCompleted) {
              router.push("/app/history");
              return;
            }

            router.refresh();
          } catch {
            setMessage("Não foi possível concluir o treino agora. Tente novamente.");
          }
        }),
      () => {
        setMessage(
          "Revise apenas os campos com valor inválido. Os demais podem ficar em branco.",
        );
      },
    );

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secondsRemaining = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secondsRemaining).padStart(2, "0")}`;
  }

  function startRestTimer(seconds: number, exerciseId: string, exerciseIndex: number) {
    setActiveRestExerciseId(exerciseId);
    setInitialRestSeconds(seconds);
    setRemainingRestSeconds(seconds);
    setValue(`logs.${exerciseIndex}.restSeconds`, seconds, {
      shouldDirty: true,
    });
  }

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

      <Card className="space-y-3 border-lime-300/20 bg-lime-300/10">
        <div className="flex items-center gap-2 text-sm text-lime-200">
          <BrainCircuit className="h-4 w-4" />
          Copiloto ativo
        </div>
        <p className="text-sm leading-7 text-zinc-100">
          O copiloto acompanha este treino usando seu próprio histórico para sugerir
          carga média, última carga útil, descanso e sinais de progressão em tempo real.
        </p>
        <p className="text-xs text-zinc-300">
          {isCopilotLoading
            ? "Carregando referências do seu histórico em segundo plano..."
            : "Referências carregadas. Você pode ajustar carga e repetir séries com apoio do seu histórico real."}
        </p>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs text-zinc-500">Cronômetro de descanso</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-2xl font-semibold text-zinc-50">
                {remainingRestSeconds > 0 ? formatTimer(remainingRestSeconds) : "00:00"}
              </p>
              <p className="text-xs text-zinc-400">
                {activeRestExerciseId && remainingRestSeconds > 0
                  ? "Descanso em andamento para o exercício atual."
                  : "Inicie o descanso sugerido diretamente no painel do copiloto."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={remainingRestSeconds <= 0}
                onClick={() => setRemainingRestSeconds(0)}
              >
                Encerrar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={initialRestSeconds <= 0}
                onClick={() => {
                  setRemainingRestSeconds(initialRestSeconds);
                }}
              >
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <form className="space-y-4" noValidate>
        <input type="hidden" {...register("executionId")} />

        <Card className="border-sky-300/20 bg-sky-300/10 text-sm text-sky-100">
          Você pode finalizar o treino mesmo sem preencher carga, repetições ou
          observações em todos os exercícios. Esses campos são opcionais e servem
          apenas para enriquecer seu histórico.
        </Card>

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
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3 xl:max-w-xl">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
                            <Checkbox
                              checked={watched?.completed ?? false}
                              onChange={(event) =>
                                setValue(`logs.${index}.completed`, event.target.checked, {
                                  shouldDirty: true,
                                })
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
                          <p className="text-sm leading-6 text-zinc-400">{exercise.notes}</p>
                        ) : null}

                        <ExerciseVideoButton
                          title={exercise.name}
                          videoUrl={exercise.video_url}
                        />
                      </div>

                      <div className="grid w-full gap-4 md:grid-cols-3 xl:max-w-xl">
                        <input type="hidden" {...register(`logs.${index}.exerciseId`)} />
                        <FormField
                          label="Carga (kg)"
                          error={errors.logs?.[index]?.loadUsed?.message}
                          hint="Opcional"
                        >
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
                        <FormField
                          label="Repetições / resultado"
                          error={errors.logs?.[index]?.repsDone?.message}
                          hint="Opcional"
                        >
                          <Input
                            placeholder="8, 30s, 1 round..."
                            {...register(`logs.${index}.repsDone`)}
                          />
                        </FormField>
                        <FormField
                          label="Observação"
                          error={errors.logs?.[index]?.notes?.message}
                          hint="Opcional"
                        >
                          <Input
                            placeholder="Como foi hoje?"
                            {...register(`logs.${index}.notes`)}
                          />
                        </FormField>
                      </div>
                    </div>

                    <ExecutionCopilotCard
                      exercise={exercise}
                      insight={copilotInsights[exercise.id]}
                      currentLog={watched}
                      isLoading={isCopilotLoading}
                      onStartRestTimer={(seconds) =>
                        startRestTimer(seconds, exercise.id, index)
                      }
                      isRestActive={
                        activeRestExerciseId === exercise.id && remainingRestSeconds > 0
                      }
                      remainingRestSeconds={
                        activeRestExerciseId === exercise.id ? remainingRestSeconds : 0
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <Card>
          <FormField label="Observações do dia" error={errors.notes?.message}>
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

        {hasValidationErrors ? (
          <Card className="border-amber-400/20 bg-amber-400/10 text-sm text-amber-100">
            Existem alguns valores inválidos no formulário. Você ainda pode
            deixar campos em branco, mas valores preenchidos precisam estar no
            formato esperado.
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => void submitExecution(false)()}
          >
            Salvar progresso
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => void submitExecution(true)()}
          >
            {isPending ? "Salvando..." : "Finalizar treino"}
          </Button>
        </div>
      </form>
    </div>
  );
}
