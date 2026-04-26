import {
  formatDateOnly,
  formatScheduledDays,
  getDayLabel,
} from "@/lib/format";
import { DAY_OPTIONS } from "@/lib/constants";
import {
  buildTodayWorkoutSuggestion,
  buildWeeklyCoachPlan,
} from "@/features/assistant/coach";
import { getAssistantConversationMemory } from "@/features/assistant/memory";
import { getDashboardData } from "@/features/workouts/queries";
import type { AssistantContext, AssistantPageData } from "@/features/assistant/types";

function getTodayDayValue() {
  const date = new Date();
  const dayMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  return dayMap[date.getDay()];
}

function buildInitialReply(context: AssistantContext) {
  const activeSport = context.activeSportName ?? "seu treino";
  const todayWorkoutNames = context.todayWorkouts.map((item) => item.name);
  const todayBlock =
    todayWorkoutNames.length > 0
      ? `Hoje eu encontrei ${todayWorkoutNames.length} treino(s) alinhado(s) com o dia: ${todayWorkoutNames.join(", ")}.`
      : "Hoje não encontrei um treino agendado para o dia atual, mas posso sugerir como usar seus protocolos cadastrados.";

  return [
    `Sou o Fortynex Coach. Posso analisar sua rotina de ${activeSport.toLowerCase()}, resumir sua semana, sugerir o foco do treino do dia e ajudar com estrategia de pontos e batalhas.`,
    todayBlock,
    `Seu nivel atual e ${context.points.level}, com ${context.points.totalPoints} pontos e streak de ${context.points.currentStreak} dia(s).`,
  ].join(" ");
}

function buildStarterPrompts(context: AssistantContext) {
  const activeSport = context.activeSportName ?? "treino";

  return [
    `Qual treino faz mais sentido para hoje em ${activeSport.toLowerCase()}?`,
    "Monte meu plano semanal ideal com base no que ja fiz.",
    "Resuma minha semana e diga onde posso melhorar.",
    "Como evoluir carga sem perder consistência?",
    "Me passe uma estrategia para ganhar mais pontos no app.",
    "Analise minhas batalhas e me diga qual a melhor tatica agora.",
  ];
}

export async function getAssistantPageData(): Promise<AssistantPageData> {
  const dashboard = await getDashboardData();
  const todayDayValue = getTodayDayValue();
  const todayDayLabel =
    DAY_OPTIONS.find((item) => item.value === todayDayValue)?.label ??
    getDayLabel(todayDayValue);
  const profileId = dashboard.profile?.id ?? null;

  const context: AssistantContext = {
    profileName: dashboard.profile?.full_name ?? null,
    activeSportName: dashboard.sportContext.activeSportName,
    activeSportSlug: dashboard.sportContext.activeSportSlug,
    points: {
      totalPoints: dashboard.pointsSummary.points?.total_points ?? 0,
      level: dashboard.pointsSummary.points?.level ?? 1,
      currentStreak: dashboard.pointsSummary.points?.current_streak ?? 0,
      badgeCount: dashboard.pointsSummary.badges.length,
    },
    stats: {
      totalWorkouts: dashboard.stats.totalWorkouts,
      plannedSessionsPerWeek: dashboard.stats.plannedSessionsPerWeek,
      averageExercisesPerWorkout: dashboard.stats.averageExercisesPerWorkout,
      completionRate: dashboard.stats.completionRate,
    },
    todayWorkouts: dashboard.weeklyPlan
      .find((item) => item.day === todayDayValue)
      ?.workouts.map((workout) => ({
        name: workout.name,
        category: workout.category,
        scheduledDay: todayDayLabel,
        exercises: workout.workout_sections.reduce(
          (acc, section) => acc + section.exercises.length,
          0,
        ),
      })) ?? [],
    recentWorkouts: dashboard.recentWorkouts.map((workout) => ({
      name: workout.name,
      category: workout.category,
      scheduledDays: formatScheduledDays(workout.scheduled_days),
      exercises: workout.workout_sections.reduce(
        (acc, section) => acc + section.exercises.length,
        0,
      ),
    })),
    recentExecutions: dashboard.recentExecutions.map((execution) => ({
      workoutName: execution.workout_name,
      executedAt: formatDateOnly(execution.executed_at),
      completedExercises: execution.exercise_logs.filter((log) => log.completed).length,
      notes: execution.notes,
    })),
    recentBattles: dashboard.battles.slice(0, 3).map((battle) => ({
      title: battle.title,
      status: battle.status,
      sportName: battle.sports?.name ?? "Geral",
      leaderScore: [...(battle.battle_scores ?? [])].sort((a, b) => b.score - a.score)[0]
        ?.score ?? 0,
    })),
  };
  const memory = profileId
    ? await getAssistantConversationMemory(profileId)
    : {
        conversationId: null,
        memoryEnabled: false,
        messages: [],
      };
  const todaySuggestion = buildTodayWorkoutSuggestion({
    activeSportName: dashboard.sportContext.activeSportName,
    activeSportSlug: dashboard.sportContext.activeSportSlug,
    workouts: dashboard.workouts,
    weeklyPlan: dashboard.weeklyPlan,
    recentExecutions: dashboard.recentExecutions,
  });
  const weeklyPlan = buildWeeklyCoachPlan({
    activeSportName: dashboard.sportContext.activeSportName,
    activeSportSlug: dashboard.sportContext.activeSportSlug,
    workouts: dashboard.workouts,
    weeklyPlan: dashboard.weeklyPlan,
    recentExecutions: dashboard.recentExecutions,
  });

  return {
    context,
    initialMessages:
      memory.messages.length > 0
        ? memory.messages
        : [
            {
              id: "assistant-welcome",
              role: "assistant",
              content: buildInitialReply(context),
              createdAt: new Date().toISOString(),
            },
          ],
    starterPrompts: buildStarterPrompts(context),
    isAiEnabled: Boolean(process.env.OPENAI_API_KEY),
    configuredModel: process.env.OPENAI_MODEL ?? null,
    memoryEnabled: memory.memoryEnabled,
    todaySuggestion,
    weeklyPlan,
  };
}
