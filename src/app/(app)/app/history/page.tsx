import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  getHistoryExecutions,
  getWorkoutOptions,
} from "@/features/workouts/queries";

type HistoryPageProps = {
  searchParams?: Promise<{
    workoutId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const filters = (await searchParams) ?? {};
  const [executions, workoutOptions] = await Promise.all([
    getHistoryExecutions(filters),
    getWorkoutOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Histórico"
        title="Execuções registradas"
        description="Filtre por período ou treino e compare rapidamente o que foi feito, com carga, anotações e conclusão."
      />

      <Card>
        <form className="grid gap-4 md:grid-cols-4">
          <Select name="workoutId" defaultValue={filters.workoutId ?? ""}>
            <option value="">Todos os treinos</option>
            {workoutOptions.map((workout) => (
              <option key={workout.value} value={workout.value}>
                {workout.label}
              </option>
            ))}
          </Select>
          <Input type="date" name="from" defaultValue={filters.from ?? ""} />
          <Input type="date" name="to" defaultValue={filters.to ?? ""} />
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {executions.length === 0 ? (
        <EmptyState
          title="Nenhuma execução encontrada"
          description="Inicie um treino e finalize a sessão para começar a montar seu histórico."
        />
      ) : (
        <div className="space-y-4">
          {executions.map((execution) => {
            const completedCount = execution.exercise_logs.filter(
              (log) => log.completed,
            ).length;
            const lastLoad = execution.exercise_logs
              .filter((log) => log.load_used !== null)
              .sort((a, b) => Number(b.load_used ?? 0) - Number(a.load_used ?? 0))[0];

            return (
              <Link key={execution.id} href={`/app/history/${execution.id}`}>
                <Card className="transition hover:bg-white/[0.06]">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-zinc-50">
                          {execution.workout_name}
                        </h2>
                        <Badge>{execution.completed ? "Finalizado" : "Em andamento"}</Badge>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {formatDate(execution.executed_at)}
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 xl:min-w-[520px]">
                      <div className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">Exercícios concluídos</p>
                        <p className="mt-2 text-lg font-semibold text-zinc-50">
                          {completedCount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">Maior carga registrada</p>
                        <p className="mt-2 text-lg font-semibold text-zinc-50">
                          {lastLoad?.load_used ? `${lastLoad.load_used} kg` : "Sem carga"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-4 py-3">
                        <p className="text-xs text-zinc-500">Resumo</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {execution.notes ?? "Sem observações neste dia."}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
