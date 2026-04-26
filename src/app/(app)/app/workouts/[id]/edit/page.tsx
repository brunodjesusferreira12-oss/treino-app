import { WorkoutForm } from "@/components/workouts/workout-form";
import { getWorkoutById } from "@/features/workouts/queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditWorkoutPage({ params }: PageProps) {
  const { id } = await params;
  const workout = await getWorkoutById(id);

  return (
    <WorkoutForm
      mode="edit"
      initialValues={{
        id: workout.id,
        sportSlug: (workout.sports?.slug as "musculacao" | "pilates" | "crossfit") ?? "musculacao",
        name: workout.name,
        scheduledDays: workout.scheduled_days,
        category: workout.category as
          | "forca"
          | "hipertrofia"
          | "core"
          | "mobilidade"
          | "estabilidade"
          | "condicionamento"
          | "metcon"
          | "tecnica"
          | "recuperacao"
          | "pilates solo"
          | "pilates equipamentos",
        objective: workout.objective,
        notes: workout.notes,
        sections: workout.workout_sections.map((section) => ({
          id: section.id,
          title: section.title,
          exercises: section.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            duration: exercise.duration,
            distance: exercise.distance,
            loadDefault: exercise.load_default,
            notes: exercise.notes,
            videoUrl: exercise.video_url,
            muscleGroup: exercise.muscle_group,
            isPriority: exercise.is_priority,
          })),
        })),
      }}
    />
  );
}
