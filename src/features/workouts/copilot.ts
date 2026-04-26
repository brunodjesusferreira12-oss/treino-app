import { formatLoad } from "@/lib/format";
import type {
  ExerciseLogRow,
  ExerciseRow,
  ExecutionExerciseCopilotInsight,
} from "@/features/workouts/types";

type HistoricalLog = ExerciseLogRow & {
  executed_at: string;
};

type CurrentExerciseLogInput = {
  completed: boolean;
  loadUsed: number | null;
  repsDone: string | null;
  notes: string | null;
};

function getPrimaryRepNumber(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return Number(match[0].replace(",", "."));
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function getRestRecommendation(exercise: ExerciseRow) {
  const categoryHint = `${exercise.muscle_group ?? ""} ${exercise.notes ?? ""}`.toLowerCase();
  const repNumber = getPrimaryRepNumber(exercise.reps);

  if (
    exercise.duration ||
    exercise.distance ||
    categoryHint.includes("metcon") ||
    categoryHint.includes("condicionamento")
  ) {
    return "30-45s entre series ou rounds curtos";
  }

  if (
    categoryHint.includes("core") ||
    categoryHint.includes("mobilidade") ||
    categoryHint.includes("pilates") ||
    categoryHint.includes("respiracao")
  ) {
    return "30-60s com foco em controle e tecnica";
  }

  if (exercise.is_priority || (repNumber !== null && repNumber <= 6)) {
    return "90-150s para manter tecnica e forca";
  }

  if (repNumber !== null && repNumber <= 10) {
    return "75-120s para recuperar bem sem esfriar";
  }

  return "45-75s para sustentar volume com consistencia";
}

function getRecommendedRestSeconds(exercise: ExerciseRow) {
  const categoryHint = `${exercise.muscle_group ?? ""} ${exercise.notes ?? ""}`.toLowerCase();
  const repNumber = getPrimaryRepNumber(exercise.reps);

  if (
    exercise.duration ||
    exercise.distance ||
    categoryHint.includes("metcon") ||
    categoryHint.includes("condicionamento")
  ) {
    return 45;
  }

  if (
    categoryHint.includes("core") ||
    categoryHint.includes("mobilidade") ||
    categoryHint.includes("pilates") ||
    categoryHint.includes("respiracao")
  ) {
    return 45;
  }

  if (exercise.is_priority || (repNumber !== null && repNumber <= 6)) {
    return 120;
  }

  if (repNumber !== null && repNumber <= 10) {
    return 90;
  }

  return 60;
}

function getSuggestedLoadLabel(
  exercise: ExerciseRow,
  averageLoad: number | null,
  lastLoad: number | null,
) {
  if (lastLoad !== null && averageLoad !== null) {
    const low = roundToHalf(Math.min(lastLoad, averageLoad));
    const high = roundToHalf(Math.max(lastLoad, averageLoad));

    if (low === high) {
      return `Base atual: ${formatLoad(low)}`;
    }

    return `Faixa sugerida: ${formatLoad(low)} a ${formatLoad(high)}`;
  }

  if (lastLoad !== null) {
    return `Retome pela ultima carga util: ${formatLoad(lastLoad)}`;
  }

  if (averageLoad !== null) {
    return `Use a media historica como base: ${formatLoad(averageLoad)}`;
  }

  if (exercise.load_default !== null) {
    return `Comece perto da carga base do protocolo: ${formatLoad(exercise.load_default)}`;
  }

  return "Sem historico de carga ainda. Use uma carga tecnica e registre o resultado.";
}

export function buildExecutionCopilotInsights(
  exercises: ExerciseRow[],
  historicalLogs: HistoricalLog[],
) {
  const historyByExercise = new Map<string, HistoricalLog[]>();

  for (const log of historicalLogs) {
    if (!log.exercise_id) continue;
    const current = historyByExercise.get(log.exercise_id) ?? [];
    current.push(log);
    historyByExercise.set(log.exercise_id, current);
  }

  const insightByExerciseId: Record<string, ExecutionExerciseCopilotInsight> = {};

  for (const exercise of exercises) {
    const history = [...(historyByExercise.get(exercise.id) ?? [])].sort(
      (a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime(),
    );
    const loads = history
      .map((item) => item.load_used)
      .filter((value): value is number => value !== null && value !== undefined);
    const averageLoad =
      loads.length > 0
        ? roundToHalf(loads.reduce((acc, value) => acc + value, 0) / loads.length)
        : null;
    const lastLoad = history.find((item) => item.load_used !== null)?.load_used ?? null;
    const bestLoad = loads.length > 0 ? Math.max(...loads) : null;

    insightByExerciseId[exercise.id] = {
      exerciseId: exercise.id,
      averageLoad,
      lastLoad,
      bestLoad,
      lastRepsDone: history[0]?.reps_done ?? null,
      sessionCount: history.length,
      completionCount: history.filter((item) => item.completed).length,
      loadHistoryCount: loads.length,
      recommendedRest: getRestRecommendation(exercise),
      recommendedRestSeconds: getRecommendedRestSeconds(exercise),
      recommendedLoadLabel: getSuggestedLoadLabel(exercise, averageLoad, lastLoad),
      recentHistory: history.slice(0, 3).map((item) => ({
        executedAt: item.executed_at,
        loadUsed: item.load_used,
        repsDone: item.reps_done,
        restSeconds: item.rest_seconds,
        completed: item.completed,
        notes: item.notes,
      })),
    };
  }

  return insightByExerciseId;
}

export function buildRealtimeCopilotMessage(input: {
  exercise: ExerciseRow;
  insight: ExecutionExerciseCopilotInsight | undefined;
  currentLog: CurrentExerciseLogInput | undefined;
}) {
  const { exercise, insight, currentLog } = input;
  const currentLoad = currentLog?.loadUsed ?? null;
  const repTarget = exercise.reps ?? exercise.duration ?? exercise.distance ?? null;

  if (!insight || insight.sessionCount === 0) {
    return {
      title: "Primeira referencia",
      description:
        exercise.load_default !== null
          ? `Voce ainda nao tem historico deste exercicio. Comece perto de ${formatLoad(exercise.load_default)} e ajuste pela tecnica.`
          : "Voce ainda nao tem historico deste exercicio. Escolha uma carga controlavel, feche as repeticoes-alvo e registre tudo para o copiloto aprender.",
      tone: "neutral" as const,
    };
  }

  if (currentLoad !== null && insight.bestLoad !== null && currentLoad > insight.bestLoad) {
    return {
      title: "Acima do melhor registro",
      description: `Essa carga esta ${formatLoad(currentLoad - insight.bestLoad)} acima do seu melhor registro. Se a tecnica estiver firme, avance; se a execucao perder qualidade, recue para consolidar.`,
      tone: "highlight" as const,
    };
  }

  if (currentLoad !== null && insight.lastLoad !== null && currentLoad > insight.lastLoad) {
    return {
      title: "Progressao ativa",
      description: `Hoje voce esta ${formatLoad(currentLoad - insight.lastLoad)} acima da ultima carga registrada. Mantenha o descanso em ${insight.recommendedRest} e confirme o alvo de ${repTarget ?? "repeticoes planejadas"} com controle.`,
      tone: "highlight" as const,
    };
  }

  if (currentLoad !== null && insight.averageLoad !== null && currentLoad < insight.averageLoad) {
    return {
      title: "Dia de consolidacao",
      description: `A carga atual ficou abaixo da sua media (${formatLoad(insight.averageLoad)}). Isso pode ser estrategico em dias de fadiga mais alta, desde que voce mantenha boa tecnica e volume consistente.`,
      tone: "neutral" as const,
    };
  }

  if (currentLog?.completed) {
    return {
      title: "Serie registrada",
      description:
        "Exercicio marcado como concluido. Se hoje teve algum ajuste importante, registre uma observacao curta para melhorar a proxima sugestao do copiloto.",
      tone: "success" as const,
    };
  }

  return {
    title: "Base sugerida",
    description: `${insight.recommendedLoadLabel}. Ultimo resultado registrado: ${insight.lastRepsDone ?? "sem repeticoes registradas"} e descanso recomendado de ${insight.recommendedRest}.`,
    tone: "neutral" as const,
  };
}
