import Link from "next/link";

import { WorkoutLibrary } from "@/components/workouts/workout-library";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentSportContext, getWorkouts } from "@/features/workouts/queries";

export default async function WorkoutsPage() {
  const sportContext = await getCurrentSportContext();
  const workouts = await getWorkouts({ sportId: sportContext.activeSportId });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treinos"
        title="Biblioteca de protocolos"
        description={`Gerencie treinos de ${sportContext.activeSportName ?? "todas as modalidades"}, com execução pronta, vídeo e estrutura por blocos.`}
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
