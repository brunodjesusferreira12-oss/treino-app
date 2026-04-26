import { DAY_OPTIONS, SPORT_OPTIONS } from "@/lib/constants";

type ExerciseFormatInput = {
  sets: number | null;
  reps: string | null;
  duration: string | null;
  distance: string | null;
};

export function getDayLabel(value: string | null | undefined) {
  if (!value) return "Sem dia definido";
  return DAY_OPTIONS.find((day) => day.value === value)?.label ?? value;
}

export function getSportLabel(value: string | null | undefined) {
  if (!value) return "Sem modalidade";
  return SPORT_OPTIONS.find((sport) => sport.slug === value)?.name ?? value;
}

export function formatScheduledDays(days: string[] | null | undefined) {
  if (!days?.length) return "Sem agenda";
  return days
    .map((day) => getDayLabel(day))
    .filter(Boolean)
    .join(", ");
}

export function formatExercisePrescription(exercise: ExerciseFormatInput) {
  const suffix = exercise.reps ?? exercise.duration ?? exercise.distance ?? null;

  if (!exercise.sets && !suffix) {
    return "Livre";
  }

  if (!exercise.sets) {
    return suffix ?? "Livre";
  }

  if (!suffix) {
    return `${exercise.sets} séries`;
  }

  return `${exercise.sets}x${suffix}`;
}

export function formatDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatLoad(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sem carga";
  return `${value.toLocaleString("pt-BR")} kg`;
}

export function formatWeight(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sem registro";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} kg`;
}

export function formatHeight(value: number | null | undefined) {
  if (value === null || value === undefined) return "Não informado";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} cm`;
}

export function formatSignedWeightDelta(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sem base";
  const normalized = Number(value.toFixed(1));
  const sign = normalized > 0 ? "+" : "";
  return `${sign}${normalized.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg`;
}

export function formatPoints(value: number) {
  return `${value.toLocaleString("pt-BR")} pts`;
}

function titleCaseLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCategoryLabel(value: string | null | undefined) {
  if (!value) return "Sem categoria";

  const categoryMap: Record<string, string> = {
    forca: "Força",
    hipertrofia: "Hipertrofia",
    core: "Core",
    mobilidade: "Mobilidade",
    estabilidade: "Estabilidade",
    condicionamento: "Condicionamento",
    metcon: "Metcon",
    tecnica: "Técnica",
    recuperacao: "Recuperação",
    "pilates solo": "Pilates solo",
    "pilates equipamentos": "Pilates em equipamentos",
  };

  return categoryMap[value.toLowerCase()] ?? titleCaseLabel(value);
}

export function formatMuscleGroupLabel(value: string | null | undefined) {
  if (!value) return "Sem grupo";

  const muscleMap: Record<string, string> = {
    "corpo inteiro": "Corpo inteiro",
    peito: "Peito",
    costas: "Costas",
    ombros: "Ombros",
    triceps: "Tríceps",
    biceps: "Bíceps",
    quadriceps: "Quadríceps",
    posterior: "Posterior",
    gluteos: "Glúteos",
    panturrilha: "Panturrilha",
    core: "Core",
    mobilidade: "Mobilidade",
    estabilidade: "Estabilidade",
    respiracao: "Respiração",
    condicionamento: "Condicionamento",
    "levantamento olimpico": "Levantamento olímpico",
    ginastica: "Ginástica",
    cardio: "Cardio",
    pilates: "Pilates",
    crossfit: "CrossFit",
  };

  return muscleMap[value.toLowerCase()] ?? titleCaseLabel(value);
}

export function formatBattleStatusLabel(value: string | null | undefined) {
  if (!value) return "Sem status";

  const statusMap: Record<string, string> = {
    pending: "Pendente",
    active: "Ativa",
    ended: "Encerrada",
  };

  return statusMap[value.toLowerCase()] ?? titleCaseLabel(value);
}

export function formatBattleTypeLabel(value: string | null | undefined) {
  if (!value) return "Sem tipo";

  const typeMap: Record<string, string> = {
    head_to_head: "Um contra um",
    consistency: "Consistência",
    volume: "Volume",
  };

  return typeMap[value.toLowerCase()] ?? titleCaseLabel(value);
}

export function formatBattleScoringModeLabel(value: string | null | undefined) {
  if (!value) return "Sem regra";

  const modeMap: Record<string, string> = {
    points: "Pontos",
    workouts: "Treinos concluídos",
    exercises: "Exercícios concluídos",
    sport_points: "Pontos da modalidade",
  };

  return modeMap[value.toLowerCase()] ?? titleCaseLabel(value);
}

export function getLevelProgress(totalPoints: number) {
  const level = Math.max(1, Math.floor(totalPoints / 250) + 1);
  const currentLevelFloor = (level - 1) * 250;
  const nextLevelFloor = level * 250;
  const progress = ((totalPoints - currentLevelFloor) / (nextLevelFloor - currentLevelFloor)) * 100;

  return {
    level,
    progress,
    pointsIntoLevel: totalPoints - currentLevelFloor,
    nextLevelAt: nextLevelFloor,
  };
}
