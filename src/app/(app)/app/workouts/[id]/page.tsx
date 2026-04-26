import Link from "next/link";
import { Suspense } from "react";
import { Pencil } from "lucide-react";

import { DeleteWorkoutButton } from "@/components/workouts/delete-workout-button";
import { StartWorkoutButton } from "@/components/workouts/start-workout-button";
import { WorkoutHistoryPanel } from "@/components/workouts/workout-history-panel";
import { WorkoutHistoryPanelSkeleton } from "@/components/workouts/workout-history-panel-skeleton";
import { WorkoutAccessTracker } from "@/components/workout-access-tracker";
import { ExerciseVideoButton } from "@/components/videos/exercise-video-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatCategoryLabel,
  formatExercisePrescription,
  formatMuscleGroupLabel,
  formatScheduledDays,
} from "@/lib/format";
import { getWorkoutById } from "@/features/workouts/queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkoutDetailPage({ params }: PageProps) {
  const { id } = await params;
  const workout = await getWorkoutById(id);

  return (
    <div className="space-y-6">
      <WorkoutAccessTracker workoutId={id} />

      <PageHeader
        eyebrow="Treino"
        title={workout.name}
        description={
          workout.objective ??
          "Treino estruturado com blocos, vídeos e exercícios ordenados."
        }
        actions={
          <>
            <Link href={`/app/workouts/${id}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <StartWorkoutButton workoutId={id} />
          </>
        }
      />

      <Card className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-sm text-zinc-500">Modalidade</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {workout.sports?.name ?? "Não definida"}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Categoria</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {formatCategoryLabel(workout.category)}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Dias</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {formatScheduledDays(workout.scheduled_days)}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Blocos</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {workout.workout_sections.length}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Exercícios</p>
          <p className="mt-2 text-lg font-semibold text-zinc-50">
            {workout.workout_sections.reduce(
              (acc, section) => acc + section.exercises.length,
              0,
            )}
          </p>
        </div>
      </Card>

      {workout.notes ? (
        <Card>
          <p className="text-sm font-medium text-zinc-200">Observações gerais</p>
          <p className="mt-3 text-sm leading-7 text-zinc-400">{workout.notes}</p>
        </Card>
      ) : null}

      <div className="space-y-4">
        {workout.workout_sections.map((section) => (
          <Card key={section.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
                  Bloco
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
                  {section.title}
                </h2>
              </div>
              <Badge>{section.exercises.length} exercícios</Badge>
            </div>

            <div className="space-y-3">
              {section.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="rounded-[24px] border border-white/10 bg-zinc-950/45 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-zinc-50">
                          {exercise.order_index + 1}. {exercise.name}
                        </h3>
                        {exercise.is_priority ? (
                          <Badge className="bg-lime-300 text-zinc-950">
                            Prioritário
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-zinc-400">
                        {formatExercisePrescription(exercise)}
                      </p>
                      {exercise.notes ? (
                        <p className="text-sm leading-6 text-zinc-500">
                          {exercise.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {exercise.muscle_group ? (
                        <Badge>{formatMuscleGroupLabel(exercise.muscle_group)}</Badge>
                      ) : null}
                      <ExerciseVideoButton
                        title={exercise.name}
                        videoUrl={exercise.video_url}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Suspense fallback={<WorkoutHistoryPanelSkeleton />}>
          <WorkoutHistoryPanel workoutId={id} />
        </Suspense>

        <Card className="space-y-5">
          <div>
            <p className="text-sm text-zinc-500">Ações rápidas</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Gerenciar treino
            </h2>
          </div>
          <div className="space-y-3">
            <Link href={`/app/workouts/${id}/edit`}>
              <Button variant="secondary" className="w-full justify-center">
                Editar treino
              </Button>
            </Link>
            <StartWorkoutButton workoutId={id} />
            <DeleteWorkoutButton workoutId={id} />
          </div>
        </Card>
      </div>
    </div>
  );
}
