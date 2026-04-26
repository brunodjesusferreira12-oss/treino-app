import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getWorkoutHistory } from "@/features/workouts/queries";
import { formatDateOnly } from "@/lib/format";

type WorkoutHistoryPanelProps = {
  workoutId: string;
};

export async function WorkoutHistoryPanel({
  workoutId,
}: WorkoutHistoryPanelProps) {
  const history = await getWorkoutHistory(workoutId);

  return (
    <Card className="space-y-4">
      <div>
          <p className="text-sm text-zinc-500">Últimas execuções</p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
          Histórico recente deste treino
        </h2>
      </div>
      <div className="space-y-3">
        {history.length > 0 ? (
          history.map((execution) => (
            <Link
              key={execution.id}
              href={`/app/history/${execution.id}`}
              className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-100">
                    {formatDateOnly(execution.executed_at)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {execution.exercise_logs.filter((log) => log.completed).length}{" "}
                      exercícios concluídos
                  </p>
                </div>
                <Badge>{execution.completed ? "Finalizado" : "Em andamento"}</Badge>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            Ainda não há histórico para este protocolo.
          </p>
        )}
      </div>
    </Card>
  );
}
