import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { getHistoryExecutionDetail } from "@/features/workouts/queries";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HistoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const execution = await getHistoryExecutionDetail(id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detalhe do histórico"
        title={execution.workout_name}
        description={`Sessão registrada em ${formatDate(execution.executed_at)}.`}
      />

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge>{execution.completed ? "Finalizado" : "Em andamento"}</Badge>
          <p className="text-sm text-zinc-500">{formatDate(execution.executed_at)}</p>
        </div>
        <p className="text-sm leading-7 text-zinc-300">
          {execution.notes ?? "Sem observações gerais para esta sessão."}
        </p>
      </Card>

      <div className="space-y-4">
        {execution.exercise_logs.map((log) => (
          <Card key={log.id} className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-50">
                  {log.exercise_name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {log.section_title ?? "Sem bloco"} • {log.prescription ?? "Livre"}
                </p>
              </div>
              <Badge>{log.completed ? "Concluído" : "Não concluído"}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-xs text-zinc-500">Carga</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">
                  {log.load_used ? `${log.load_used} kg` : "Sem carga"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-xs text-zinc-500">Resultado</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">
                  {log.reps_done ?? "Não informado"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-xs text-zinc-500">Observação</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {log.notes ?? "Sem observação"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
