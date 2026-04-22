"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
} from "react-hook-form";
import { GripVertical, Plus, Trash2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_OPTIONS,
  DAY_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
} from "@/lib/constants";
import {
  upsertWorkoutAction,
} from "@/features/workouts/actions";
import {
  workoutFormSchema,
  type WorkoutFormValues,
} from "@/features/workouts/schemas";

function createEmptyExercise() {
  return {
    name: "",
    sets: null,
    reps: null,
    duration: null,
    distance: null,
    loadDefault: null,
    notes: null,
    videoUrl: null,
    muscleGroup: null,
    isPriority: false,
  };
}

type SectionEditorProps = {
  sectionIndex: number;
  control: Control<WorkoutFormValues>;
  register: UseFormRegister<WorkoutFormValues>;
  errors: FieldErrors<WorkoutFormValues>;
  onRemoveSection: (index: number) => void;
};

function SectionEditor({
  sectionIndex,
  control,
  register,
  errors,
  onRemoveSection,
}: SectionEditorProps) {
  const {
    fields: exerciseFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.exercises`,
  });

  return (
    <Card className="space-y-5 border-white/8 bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <GripVertical className="mt-3 h-4 w-4 text-zinc-600" />
          <div className="flex-1">
            <FormField
              label={`Bloco ${sectionIndex + 1}`}
              error={errors.sections?.[sectionIndex]?.title?.message}
            >
              <Input
                placeholder="Ex.: Ativação, Força, Complementar..."
                {...register(`sections.${sectionIndex}.title`)}
              />
            </FormField>
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-zinc-400"
          onClick={() => onRemoveSection(sectionIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {exerciseFields.map((exercise, exerciseIndex) => (
          <div
            key={exercise.id}
            className="rounded-[24px] border border-white/10 bg-zinc-950/50 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-zinc-100">
                Exercício {exerciseIndex + 1}
              </h4>
              <Button
                variant="ghost"
                className="text-zinc-400"
                onClick={() => remove(exerciseIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Nome"
                error={
                  errors.sections?.[sectionIndex]?.exercises?.[exerciseIndex]?.name
                    ?.message
                }
              >
                <Input
                  placeholder="Nome do exercício"
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.name`,
                  )}
                />
              </FormField>

              <FormField label="Grupo muscular">
                <Select
                  defaultValue=""
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.muscleGroup`,
                  )}
                >
                  <option value="">Selecione</option>
                  {MUSCLE_GROUP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Séries">
                <Input
                  type="number"
                  min={0}
                  placeholder="4"
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.sets`,
                    {
                      setValueAs: (value) => (value === "" ? null : Number(value)),
                    },
                  )}
                />
              </FormField>

              <FormField label="Repetições">
                <Input
                  placeholder="8, 12-15, 6 cada perna"
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.reps`,
                  )}
                />
              </FormField>

              <FormField label="Tempo">
                <Input
                  placeholder="30s, 60-75s"
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.duration`,
                  )}
                />
              </FormField>

              <FormField label="Distância">
                <Input
                  placeholder="20m"
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.distance`,
                  )}
                />
              </FormField>

              <FormField label="Carga padrão (kg)">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="30"
                  {...register(
                    `sections.${sectionIndex}.exercises.${exerciseIndex}.loadDefault`,
                    {
                      setValueAs: (value) => (value === "" ? null : Number(value)),
                    },
                  )}
                />
              </FormField>

              <FormField label="Vídeo">
                <div className="relative">
                  <Video className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    placeholder="https://..."
                    className="pl-11"
                    {...register(
                      `sections.${sectionIndex}.exercises.${exerciseIndex}.videoUrl`,
                    )}
                  />
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Observações">
                  <Textarea
                    className="min-h-[90px]"
                    placeholder="Técnica, amplitude, foco ou lembretes..."
                    {...register(
                      `sections.${sectionIndex}.exercises.${exerciseIndex}.notes`,
                    )}
                  />
                </FormField>
              </div>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                <Controller
                  control={control}
                  name={`sections.${sectionIndex}.exercises.${exerciseIndex}.isPriority`}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
                Marcar como exercício importante
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        onClick={() => append(createEmptyExercise())}
      >
        <Plus className="h-4 w-4" />
        Adicionar exercício
      </Button>
    </Card>
  );
}

type WorkoutFormProps = {
  mode: "create" | "edit";
  initialValues?: WorkoutFormValues;
};

export function WorkoutForm({ mode, initialValues }: WorkoutFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema) as Resolver<WorkoutFormValues>,
    defaultValues:
      initialValues ??
      ({
        name: "",
        scheduledDays: ["monday"],
        category: "fortalecimento para corrida",
        objective: null,
        notes: null,
        sections: [
          {
            title: "Ativação",
            exercises: [createEmptyExercise()],
          },
        ],
      } satisfies WorkoutFormValues),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections",
  });

  const selectedDays = useWatch({
    control,
    name: "scheduledDays",
  }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={mode === "create" ? "Novo treino" : "Editar treino"}
        title={mode === "create" ? "Montar protocolo" : "Atualizar protocolo"}
        description="Cadastre blocos, exercícios, agenda semanal e links de vídeo para executar no dia com histórico completo."
      />

      <form
        className="space-y-6"
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            setMessage(null);
            const result = await upsertWorkoutAction(values);

            if (!result.ok || !result.id) {
              setMessage(result.error ?? "Não foi possível salvar o treino.");
              return;
            }

            router.push(`/app/workouts/${result.id}`);
            router.refresh();
          }),
        )}
      >
        <Card className="grid gap-4 md:grid-cols-2">
          <FormField label="Nome do treino" error={errors.name?.message}>
            <Input placeholder="Ex.: Quadríceps + Posterior" {...register("name")} />
          </FormField>

          <FormField label="Categoria" error={errors.category?.message}>
            <Select {...register("category")}>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="Dias da semana"
              error={errors.scheduledDays?.message as string | undefined}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {DAY_OPTIONS.map((day) => (
                  <label
                    key={day.value}
                    className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
                  >
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onChange={(event) => {
                        const nextDays = event.target.checked
                          ? [...selectedDays, day.value]
                          : selectedDays.filter((value) => value !== day.value);

                        setValue("scheduledDays", nextDays, {
                          shouldValidate: true,
                        });
                      }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          <FormField label="Objetivo">
            <Input
              placeholder="Ex.: Fortalecimento para corrida e posterior de coxa"
              {...register("objective")}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Observações gerais">
              <Textarea
                placeholder="Notas do protocolo, recomendações gerais e lembretes..."
                {...register("notes")}
              />
            </FormField>
          </div>
        </Card>

        <div className="space-y-4">
          {fields.map((section, sectionIndex) => (
            <SectionEditor
              key={section.id}
              sectionIndex={sectionIndex}
              control={control}
              register={register}
              errors={errors}
              onRemoveSection={(index) => {
                if (fields.length === 1) {
                  return;
                }

                remove(index);
              }}
            />
          ))}
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            append({
              title: `Bloco ${fields.length + 1}`,
              exercises: [createEmptyExercise()],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar bloco
        </Button>

        {message ? (
          <Card className="border-red-500/20 bg-red-500/8 text-sm text-red-200">
            {message}
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Salvando..."
              : mode === "create"
                ? "Criar treino"
                : "Salvar alterações"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
