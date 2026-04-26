"use client";

import { BrainCircuit, Gauge, History, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateOnly, formatLoad } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildRealtimeCopilotMessage } from "@/features/workouts/copilot";
import type {
  ExerciseRow,
  ExecutionExerciseCopilotInsight,
} from "@/features/workouts/types";

type ExecutionCopilotCardProps = {
  exercise: ExerciseRow;
  insight?: ExecutionExerciseCopilotInsight;
  currentLog?: {
    completed: boolean;
    loadUsed: number | null;
    repsDone: string | null;
    rpe?: number | null;
    restSeconds?: number | null;
    notes: string | null;
  };
  isLoading?: boolean;
  onStartRestTimer?: (seconds: number) => void;
  isRestActive?: boolean;
  remainingRestSeconds?: number;
};

export function ExecutionCopilotCard({
  exercise,
  insight,
  currentLog,
  isLoading = false,
  onStartRestTimer,
  isRestActive = false,
  remainingRestSeconds = 0,
}: ExecutionCopilotCardProps) {
  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
  }

  if (isLoading) {
    return (
      <Card className="space-y-4 border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <BrainCircuit className="h-4 w-4 text-lime-300" />
          Copiloto de execução
        </div>
        <p className="text-sm text-zinc-300">
          Carregando sua média de carga, última sessão e referências de progresso...
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-2xl bg-black/20"
            />
          ))}
        </div>
      </Card>
    );
  }

  const message = buildRealtimeCopilotMessage({
    exercise,
    insight,
    currentLog,
  });

  const toneClass =
    message.tone === "highlight"
      ? "border-lime-300/25 bg-lime-300/10"
      : message.tone === "success"
        ? "border-emerald-300/20 bg-emerald-300/10"
        : "border-white/10 bg-white/5";

  return (
    <Card className={cn("space-y-4 p-4", toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <BrainCircuit className="h-4 w-4 text-lime-300" />
          Copiloto de execução
        </div>
        <Badge className="border-white/10 bg-black/20 text-zinc-200">
          {message.title}
        </Badge>
      </div>

      <p className="text-sm leading-7 text-zinc-200">{message.description}</p>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Gauge className="h-3.5 w-3.5" />
            Carga histórica
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-100">
            {insight?.averageLoad !== null && insight?.averageLoad !== undefined
              ? `Média ${formatLoad(insight.averageLoad)}`
              : "Sem média ainda"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {insight?.recommendedLoadLabel ?? "Sem referência suficiente"}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <History className="h-3.5 w-3.5" />
            Última sessão
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-100">
            {insight?.lastLoad !== null && insight?.lastLoad !== undefined
              ? formatLoad(insight.lastLoad)
              : "Sem carga anterior"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {insight?.recentHistory[0]
              ? `${formatDateOnly(insight.recentHistory[0].executedAt)} · ${
                  insight.recentHistory[0].repsDone ?? "sem reps"
                }${insight.recentHistory[0].rpe ? ` · RPE ${insight.recentHistory[0].rpe}` : ""}`
              : "Nenhuma sessão registrada"}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <TimerReset className="h-3.5 w-3.5" />
            Descanso recomendado
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-100">
            {insight?.recommendedRest ?? "Ajuste livre"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {insight?.completionCount ?? 0}/{insight?.sessionCount ?? 0} sessões fechadas
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-white/10 bg-black/20 text-zinc-200">
          RPE atual {currentLog?.rpe ?? "--"}
        </Badge>
        <Badge className="border-white/10 bg-black/20 text-zinc-200">
          Descanso base {insight?.recommendedRestSeconds ?? 0}s
        </Badge>
        {currentLog?.restSeconds ? (
          <Badge className="border-white/10 bg-black/20 text-zinc-200">
            Último descanso salvo {currentLog.restSeconds}s
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onStartRestTimer?.(insight?.recommendedRestSeconds ?? 60)}
          className="rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-2 text-xs font-medium text-lime-100 transition hover:bg-lime-300/15"
        >
          Iniciar descanso sugerido
        </button>
        <button
          type="button"
          onClick={() => onStartRestTimer?.(60)}
          className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
        >
          60s rápido
        </button>
        {isRestActive ? (
          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-medium text-sky-100">
            Descanso ativo {formatTimer(remainingRestSeconds)}
          </span>
        ) : null}
      </div>

      {insight?.recentHistory && insight.recentHistory.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Histórico rápido
          </p>
          <div className="flex flex-wrap gap-2">
            {insight.recentHistory.map((item, index) => (
              <span
                key={`${item.executedAt}-${index}`}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300"
              >
                {formatDateOnly(item.executedAt)} ·{" "}
                {item.loadUsed !== null ? formatLoad(item.loadUsed) : "sem carga"} ·{" "}
                {item.repsDone ?? "sem reps"}
                {item.rpe !== null ? ` · RPE ${item.rpe}` : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
