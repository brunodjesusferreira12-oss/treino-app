import { APP_ROUTES, DAY_OPTIONS } from "@/lib/constants";
import { getDayLabel } from "@/lib/format";
import type {
  BattleTacticsInsight,
  CoachTodaySuggestion,
  CoachWeeklyPlanItem,
} from "@/features/assistant/types";
import type {
  WorkoutExecutionWithLogs,
  WorkoutWithSections,
} from "@/features/workouts/types";

type DashboardCoachInput = {
  activeSportName: string | null;
  activeSportSlug: string | null;
  workouts: WorkoutWithSections[];
  weeklyPlan: Array<{
    day: string;
    workouts: WorkoutWithSections[];
  }>;
  recentExecutions: WorkoutExecutionWithLogs[];
};

type BattleTacticsInput = {
  battle: {
    title: string;
    status: string;
    scoring_mode: string;
    starts_at: string;
    ends_at: string;
    winner_user_id: string | null;
    battle_scores?: Array<{
      user_id: string;
      score: number;
    }>;
  };
  currentUserId: string;
  participantNames: Map<string, string>;
};

function getTodayDayValue(input = new Date()) {
  const dayMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  return dayMap[input.getDay()];
}

function countExercises(workout: WorkoutWithSections) {
  return workout.workout_sections.reduce(
    (acc, section) => acc + section.exercises.length,
    0,
  );
}

function countPriorityExercises(workout: WorkoutWithSections) {
  return workout.workout_sections.reduce(
    (acc, section) =>
      acc + section.exercises.filter((exercise) => exercise.is_priority).length,
    0,
  );
}

function getLastExecutionDaysAgo(
  workoutId: string,
  executions: WorkoutExecutionWithLogs[],
) {
  const execution = executions.find((item) => item.workout_id === workoutId);

  if (!execution) {
    return 5;
  }

  const diffMs = Date.now() - new Date(execution.executed_at).getTime();
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

function getSportCategoryBonus(
  sportSlug: string | null,
  category: string | null | undefined,
) {
  if (!category) return 0;

  const normalized = category.toLowerCase();

  if (
    sportSlug === "musculacao" &&
    (normalized.includes("forca") || normalized.includes("hipertrofia"))
  ) {
    return 6;
  }

  if (
    sportSlug === "pilates" &&
    (normalized.includes("pilates") ||
      normalized.includes("mobilidade") ||
      normalized.includes("estabilidade"))
  ) {
    return 6;
  }

  if (
    sportSlug === "crossfit" &&
    (normalized.includes("metcon") ||
      normalized.includes("condicionamento") ||
      normalized.includes("tecnica"))
  ) {
    return 6;
  }

  return 2;
}

function getWorkoutIntensity(
  workout: WorkoutWithSections,
  sportSlug: string | null,
) {
  const totalExercises = countExercises(workout);
  const category = workout.category.toLowerCase();

  if (sportSlug === "pilates") {
    return totalExercises >= 8 ? "Controlada com volume" : "Controlada";
  }

  if (
    sportSlug === "crossfit" ||
    category.includes("metcon") ||
    category.includes("condicionamento")
  ) {
    return totalExercises >= 8 ? "Alta" : "Moderada-alta";
  }

  if (totalExercises <= 5) return "Leve";
  if (totalExercises <= 9) return "Moderada";
  return "Alta";
}

function getWorkoutFocus(workout: WorkoutWithSections) {
  if (workout.objective?.trim()) {
    return workout.objective.trim();
  }

  return workout.category;
}

export function buildTodayWorkoutSuggestion(
  input: DashboardCoachInput,
): CoachTodaySuggestion | null {
  const todayDay = getTodayDayValue();
  const todayLabel = getDayLabel(todayDay);
  const dayPlan = input.weeklyPlan.find((item) => item.day === todayDay);
  const scheduledToday = dayPlan?.workouts ?? [];
  const candidates = scheduledToday.length > 0 ? scheduledToday : input.workouts;

  if (candidates.length === 0) {
    return null;
  }

  const ranked = [...candidates].sort((a, b) => {
    const aExercises = countExercises(a);
    const bExercises = countExercises(b);
    const aPriority = countPriorityExercises(a);
    const bPriority = countPriorityExercises(b);
    const aRecency = getLastExecutionDaysAgo(a.id, input.recentExecutions);
    const bRecency = getLastExecutionDaysAgo(b.id, input.recentExecutions);
    const aScore =
      aExercises * 2 +
      aPriority * 5 +
      aRecency +
      getSportCategoryBonus(input.activeSportSlug, a.category);
    const bScore =
      bExercises * 2 +
      bPriority * 5 +
      bRecency +
      getSportCategoryBonus(input.activeSportSlug, b.category);

    return bScore - aScore;
  });

  const workout = ranked[0];
  const totalExercises = countExercises(workout);
  const priorityExercises = countPriorityExercises(workout);
  const lastExecutionDays = getLastExecutionDaysAgo(workout.id, input.recentExecutions);
  const intensity = getWorkoutIntensity(workout, input.activeSportSlug);
  const summary =
    scheduledToday.length > 0
      ? `O coach escolheu ${workout.name} para ${todayLabel.toLowerCase()} porque ele encaixa na agenda do dia e entrega um volume coerente com sua rotina atual.`
      : `Não havia um treino marcado para ${todayLabel.toLowerCase()}, então o coach priorizou ${workout.name} para manter sua consistência sem fugir da modalidade ativa.`;

  return {
    headline: "Treino sugerido pelo coach",
    workoutId: workout.id,
    workoutName: workout.name,
    dayLabel: todayLabel,
    intensity,
    summary,
    reason: `${getWorkoutFocus(workout)}. Última execução há ${lastExecutionDays} dia(s), com ${totalExercises} exercício(s) e ${priorityExercises} marcado(s) como prioridade.`,
    highlights: [
      `${totalExercises} exercícios`,
      priorityExercises > 0
        ? `${priorityExercises} prioritário(s)`
        : "volume equilibrado",
      `Categoria ${workout.category}`,
    ],
    actionHref: `${APP_ROUTES.workouts}/${workout.id}`,
    actionLabel: "Abrir treino sugerido",
    coachPrompt: `Explique a melhor estrategia para executar ${workout.name} hoje.`,
  };
}

function getRecoveryRecommendation(sportName: string | null, isToday: boolean) {
  if (sportName?.toLowerCase() === "pilates") {
    return isToday
      ? "Use o dia para respiração, controle corporal e mobilidade curta."
      : "Reserve o dia para postura, alongamento e recuperação ativa.";
  }

  if (sportName?.toLowerCase() === "crossfit") {
    return isToday
      ? "Se o corpo estiver pesado, priorize mobilidade, técnica e uma sessão curta."
      : "Aproveite para recuperar, revisar técnica e entrar forte no próximo WOD.";
  }

  return isToday
    ? "Se não houver protocolo hoje, mantenha o corpo ativo com mobilidade e uma caminhada curta."
    : "Bom dia para recuperação ativa, mobilidade e organização do próximo bloco.";
}

function estimateWorkoutPoints(workout: WorkoutWithSections) {
  return 100 + countExercises(workout) * 10 + 5;
}

export function buildWeeklyCoachPlan(
  input: DashboardCoachInput,
): CoachWeeklyPlanItem[] {
  const todayDay = getTodayDayValue();

  return DAY_OPTIONS.map((dayOption) => {
    const dayWorkouts =
      input.weeklyPlan.find((item) => item.day === dayOption.value)?.workouts ?? [];
    const isToday = dayOption.value === todayDay;

    if (dayWorkouts.length === 0) {
      return {
        day: dayOption.value,
        label: dayOption.label,
        isToday,
        workoutNames: [],
        focus: "Recuperação e base",
        intensity: "Recuperação",
        recommendation: getRecoveryRecommendation(input.activeSportName, isToday),
        targetPoints: 0,
      };
    }

    const dominantWorkout = [...dayWorkouts].sort(
      (a, b) => countExercises(b) - countExercises(a),
    )[0];
    const totalPoints = dayWorkouts.reduce(
      (acc, workout) => acc + estimateWorkoutPoints(workout),
      0,
    );
    const workoutNames = dayWorkouts.map((workout) => workout.name);
    const focus = dominantWorkout.objective?.trim() || dominantWorkout.category;
    const intensity = getWorkoutIntensity(dominantWorkout, input.activeSportSlug);
    const recommendation = isToday
      ? `Priorize ${dominantWorkout.name} e tente fechar o bloco principal sem pular observações para capitalizar pontos e manter consistência.`
      : dayWorkouts.length > 1
        ? `Você tem ${dayWorkouts.length} opções nesse dia. Comece pela sessão com maior prioridade ou pela que está há mais tempo sem execução.`
        : `Dia ideal para ${dominantWorkout.name}. Entre com foco em ${focus.toLowerCase()} e finalize o treino por completo.`;

    return {
      day: dayOption.value,
      label: dayOption.label,
      isToday,
      workoutNames,
      focus,
      intensity,
      recommendation,
      targetPoints: totalPoints,
    };
  });
}

function getBattleScoreUnit(scoringMode: string) {
  switch (scoringMode) {
    case "workouts":
      return "treinos";
    case "exercises":
      return "exercícios";
    case "sport_points":
      return "pts da modalidade";
    default:
      return "pts";
  }
}

function formatTimeLabel(endsAt: string) {
  const diffMs = new Date(endsAt).getTime() - Date.now();

  if (diffMs <= 0) {
      return "período encerrado";
  }

  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));

  if (totalHours < 24) {
    return `${totalHours} h restantes`;
  }

  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays} dia(s) restantes`;
}

function buildNextGoal(scoringMode: string, delta: number) {
  switch (scoringMode) {
    case "workouts":
      return `Meta imediata: fechar pelo menos ${Math.max(1, delta + 1)} treino(s) completo(s).`;
    case "exercises":
      return `Meta imediata: recuperar ${Math.max(3, delta + 2)} exercício(s) concluídos.`;
    case "sport_points":
      return `Meta imediata: abrir ${Math.max(30, delta + 20)} pts focando na modalidade da batalha.`;
    default:
      return `Meta imediata: abrir ${Math.max(25, delta + 15)} pts para ganhar folga real no placar.`;
  }
}

export function buildBattleTactics(
  input: BattleTacticsInput,
): BattleTacticsInsight {
  const unit = getBattleScoreUnit(input.battle.scoring_mode);
  const orderedScores = [...(input.battle.battle_scores ?? [])].sort(
    (a, b) => b.score - a.score,
  );
  const myEntry = orderedScores.find((item) => item.user_id === input.currentUserId) ?? {
    user_id: input.currentUserId,
    score: 0,
  };
  const opponentEntry =
    orderedScores.find((item) => item.user_id !== input.currentUserId) ?? {
      user_id: "opponent",
      score: 0,
    };
  const myName = input.participantNames.get(myEntry.user_id) ?? "Você";
  const opponentName =
    input.participantNames.get(opponentEntry.user_id) ?? "Competidor";
  const delta = Math.abs(myEntry.score - opponentEntry.score);
  const isPending = input.battle.status === "pending";
  const isEnded = input.battle.status === "ended";
  const isTied = myEntry.score === opponentEntry.score;
  const isLeading = myEntry.score > opponentEntry.score;

  if (isPending) {
    return {
      status: "pending",
      scoreUnit: unit,
      summary: `A batalha ${input.battle.title} ainda não começou. Use esse intervalo para alinhar a modalidade, revisar o treino sugerido e entrar forte desde o primeiro dia.`,
      urgency: "Preparação",
      delta,
      myScore: myEntry.score,
      opponentScore: opponentEntry.score,
      leaderName: myName,
      opponentName,
      timeLabel: `Começa em ${new Date(input.battle.starts_at).toLocaleDateString("pt-BR")}`,
      nextGoal: "Meta imediata: chegar na estreia com um treino definido e observações prontas.",
      actions: [
        "Escolha com antecedência qual treino abre a batalha e deixe a sessão pronta para executar.",
        "Evite entrar em modo reativo: o melhor começo é pontuar logo no primeiro dia.",
        "Se a disputa for por pontos, garanta treino completo e observações para maximizar o ganho inicial.",
      ],
    };
  }

  if (isEnded) {
    const didWin = input.battle.winner_user_id === input.currentUserId;
    const didDraw =
      input.battle.winner_user_id === null && myEntry.score === opponentEntry.score;

    return {
      status: "ended",
      scoreUnit: unit,
      summary: didDraw
        ? `A batalha terminou empatada em ${myEntry.score} ${unit}.`
        : didWin
          ? `Você venceu ${opponentName} por ${delta} ${unit}.`
          : `${opponentName} levou a melhor por ${delta} ${unit}.`,
      urgency: "Resultado final",
      delta,
      myScore: myEntry.score,
      opponentScore: opponentEntry.score,
      leaderName: didWin ? myName : opponentName,
      opponentName,
      timeLabel: "Batalha encerrada",
      nextGoal: didWin
        ? "Meta imediata: repetir o padrão de consistência que funcionou neste duelo."
        : "Meta imediata: analisar onde você perdeu ritmo e preparar o contra-ataque da próxima batalha.",
      actions: [
        "Revise quais dias e quais tipos de sessão mais te renderam vantagem.",
        "Use o histórico para ajustar seu próximo plano semanal e não depender de recuperação no fim.",
        "Se quiser revanche, troque a modalidade ou o modo de pontuação para testar outra estratégia.",
      ],
    };
  }

  const status = isTied ? "tied" : isLeading ? "leading" : "trailing";
  const urgency = delta === 0 ? "Empate técnico" : delta <= 20 ? "Disputa apertada" : "Janela crítica";

  if (status === "tied") {
    return {
      status,
      scoreUnit: unit,
      summary: `Placar empatado em ${myEntry.score} ${unit}. O próximo bloco bem executado pode virar a batalha imediatamente.`,
      urgency,
      delta,
      myScore: myEntry.score,
      opponentScore: opponentEntry.score,
      leaderName: myName,
      opponentName,
      timeLabel: formatTimeLabel(input.battle.ends_at),
      nextGoal: buildNextGoal(input.battle.scoring_mode, 0),
      actions: [
        "Escolha a sessão com maior potencial de pontuação completa para criar a primeira folga.",
        "Não deixe treino pela metade: em empate, consistência pesa mais do que tentativa heroica.",
        "Registre observações e finalize os exercícios prioritários para ganhar microvantagem.",
      ],
    };
  }

  return {
    status,
    scoreUnit: unit,
    summary: isLeading
      ? `Você está na frente de ${opponentName} por ${delta} ${unit}. Agora o foco é proteger a vantagem sem perder consistência.`
      : `${opponentName} abriu ${delta} ${unit} de vantagem. Ainda há tempo para reagir com uma sessão mais inteligente e completa.`,
    urgency,
    delta,
    myScore: myEntry.score,
    opponentScore: opponentEntry.score,
    leaderName: isLeading ? myName : opponentName,
    opponentName,
    timeLabel: formatTimeLabel(input.battle.ends_at),
    nextGoal: buildNextGoal(input.battle.scoring_mode, delta),
    actions: isLeading
      ? [
          "Proteja a folga com um treino completo em vez de tentar inventar volume sem terminar.",
          "Se a batalha for por exercícios, escolha a sessão com mais itens concluídos e menos risco de abandono.",
          "Entre cedo na semana para não depender do último dia com pressão alta.",
        ]
      : [
          "Ataque pela sessão com maior retorno no modo de pontuação atual.",
          "Se o duelo for por pontos, priorize treino completo, exercícios concluídos e observações para encurtar a distância rápido.",
          "Recupere terreno hoje. Quanto mais você adia, mais a batalha vira corrida contra o tempo.",
        ],
  };
}
