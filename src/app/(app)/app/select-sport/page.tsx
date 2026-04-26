import { PageHeader } from "@/components/ui/page-header";
import { SportSelector } from "@/components/sports/sport-selector";
import { getSports } from "@/features/sports/queries";
import { getCurrentSportContext } from "@/features/workouts/queries";

export default async function SelectSportPage() {
  const [sports, sportContext] = await Promise.all([
    getSports(),
    getCurrentSportContext(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Esporte do dia"
        title="Qual esporte você vai praticar hoje?"
        description="A modalidade escolhida influencia os treinos exibidos, o estilo da sessão, a pontuação, as batalhas e o resumo do seu dia."
      />
      <SportSelector
        sports={sports}
        selectedSportId={sportContext.activeSportId}
      />
    </div>
  );
}
