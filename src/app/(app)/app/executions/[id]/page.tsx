import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ExecutionForm } from "@/components/workouts/execution-form";
import { getExecutionById } from "@/features/workouts/queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExecutionPage({ params }: PageProps) {
  const { id } = await params;
  const { execution, workout } = await getExecutionById(id);

  if (!workout) {
    return (
      <Card>
        <p className="text-sm text-zinc-400">
          Este treino foi removido da biblioteca, mas o histórico ainda está salvo.
        </p>
      </Card>
    );
  }

  const existingLogs = Object.fromEntries(
    execution.exercise_logs.map((log) => [
      log.exercise_id as string,
      {
        completed: log.completed,
        loadUsed: log.load_used,
        repsDone: log.reps_done,
        rpe: log.rpe,
        restSeconds: log.rest_seconds,
        notes: log.notes,
      },
    ]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execução"
        title={execution.workout_name}
        description="Registre carga, repetições e observações com o copiloto acompanhando seu histórico em tempo real."
      />

      <ExecutionForm
        executionId={execution.id}
        workout={workout}
        notes={execution.notes}
        existingLogs={existingLogs}
        completed={execution.completed}
      />
    </div>
  );
}
