import { PageHeader } from "@/components/ui/page-header";
import { ProgressView } from "@/components/progress/progress-view";
import { getProgressData } from "@/features/workouts/queries";

export default async function ProgressPage() {
  const { executions, logs } = await getProgressData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evolução"
        title="Consistência e progresso"
        description="Visualize frequência semanal, histórico de carga, exercícios mais recorrentes e o calendário de treinos concluídos."
      />

      <ProgressView executions={executions} logs={logs} />
    </div>
  );
}
