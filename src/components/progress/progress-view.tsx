"use client";

import { useState } from "react";

import { CompletionHeatmap } from "@/components/charts/completion-heatmap";
import { LoadHistoryChart } from "@/components/charts/load-history-chart";
import { WeeklyFrequencyChart } from "@/components/charts/weekly-frequency-chart";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDateOnly } from "@/lib/format";
import type {
  ExerciseLogRow,
  WorkoutExecutionRow,
} from "@/features/workouts/types";

type ProgressViewProps = {
  executions: WorkoutExecutionRow[];
  logs: ExerciseLogRow[];
};

export function ProgressView({ executions, logs }: ProgressViewProps) {
  const exerciseNames = Array.from(
    new Set(logs.filter((log) => log.load_used !== null).map((log) => log.exercise_name)),
  );

  const [selectedExercise, setSelectedExercise] = useState<string>(
    exerciseNames[0] ?? "",
  );

  const frequencyByWeek = Array.from({ length: 8 }, (_, index) => {
    const start = new Date();
    start.setDate(start.getDate() - (7 - index) * 7);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      week: `${start.getDate()}/${start.getMonth() + 1}`,
      count: executions.filter((execution) => {
        const executedAt = new Date(execution.executed_at);
        return executedAt >= start && executedAt <= end && execution.completed;
      }).length,
    };
  });

  const topExercises = Array.from(
    logs.reduce((map, log) => {
      if (!log.completed) return map;
      map.set(log.exercise_name, (map.get(log.exercise_name) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const loadHistory = logs
    .filter((log) => log.exercise_name === selectedExercise && log.load_used !== null)
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((log) => ({
      date: formatDateOnly(log.created_at),
      load: Number(log.load_used ?? 0),
    }));

  const dailyMap = executions.reduce((map, execution) => {
    if (!execution.completed) return map;
    const key = execution.executed_at.slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  const heatmap = Array.from({ length: 84 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (83 - index));
    const iso = date.toISOString().slice(0, 10);
    return {
      date: iso,
      count: dailyMap.get(iso) ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Frequência semanal</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Consistência nas últimas 8 semanas
            </h2>
          </div>
          <WeeklyFrequencyChart data={frequencyByWeek} />
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-zinc-500">Carga por exercício</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
                Evolução de carga registrada
              </h2>
            </div>
            <Select
              className="md:max-w-[260px]"
              value={selectedExercise}
              onChange={(event) => setSelectedExercise(event.target.value)}
            >
              {exerciseNames.map((exercise) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </Select>
          </div>
          <LoadHistoryChart data={loadHistory} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Mais feitos</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Exercícios com maior recorrência
            </h2>
          </div>
          <div className="space-y-3">
            {topExercises.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-zinc-200">{name}</span>
                <span className="rounded-full bg-lime-300/15 px-3 py-1 text-xs font-semibold text-lime-200">
                  {count}x
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Calendário de conclusão</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Últimos 84 dias
            </h2>
          </div>
          <CompletionHeatmap data={heatmap} />
        </Card>
      </div>
    </div>
  );
}
