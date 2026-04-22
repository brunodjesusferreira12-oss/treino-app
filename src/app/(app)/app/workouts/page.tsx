import Link from "next/link";

import { WorkoutLibrary } from "@/components/workouts/workout-library";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getWorkouts } from "@/features/workouts/queries";

export default async function WorkoutsPage() {
  const workouts = await getWorkouts();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treinos"
        title="Biblioteca de protocolos"
        description="Gerencie seus treinos, organize por dia da semana e mantenha toda a estrutura pronta para execução."
        actions={
          <Link href="/app/workouts/new">
            <Button>Novo treino</Button>
          </Link>
        }
      />

      <WorkoutLibrary workouts={workouts} />
    </div>
  );
}
