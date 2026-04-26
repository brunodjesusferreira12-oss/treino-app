import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  MoonStar,
  Sparkles,
  Swords,
} from "lucide-react";

import { TodaySuggestionCard } from "@/components/assistant/today-suggestion-card";
import { BattleCard } from "@/components/battles/battle-card";
import { PointsPanel } from "@/components/gamification/points-panel";
import { SportSelector } from "@/components/sports/sport-selector";
import { WeeklyFrequencyChart } from "@/components/charts/weekly-frequency-chart";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCategoryLabel, formatDateOnly, formatScheduledDays } from "@/lib/format";
import { getDayLabel } from "@/lib/format";
import { buildTodayWorkoutSuggestion } from "@/features/assistant/coach";
import { getSports } from "@/features/sports/queries";
import { getDashboardData } from "@/features/workouts/queries";

export default async function DashboardPage() {
  const {
    profile,
    sportContext,
    workouts,
    weeklyPlan,
    recentExecutions,
    recentWorkouts,
    stats,
    frequencyChart,
    pointsSummary,
    battles,
  } = await getDashboardData();

  if (!sportContext.activeSportId) {
    const sports = await getSports();

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Início da sessão"
          title="Qual esporte você vai praticar hoje?"
          description="Escolha a modalidade para adaptar a experiência do dia, filtrar treinos, contabilizar pontos e registrar a sessão correta."
        />
        <SportSelector sports={sports} />
      </div>
    );
  }

  const todaySuggestion = buildTodayWorkoutSuggestion({
    activeSportName: sportContext.activeSportName,
    activeSportSlug: sportContext.activeSportSlug,
    workouts,
    weeklyPlan,
    recentExecutions,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={
          profile?.full_name
            ? `Bom treino, ${profile.full_name}`
            : "Seu painel esportivo"
        }
        description={`Experiência do dia configurada para ${sportContext.activeSportName}. Treinos, pontuação e batalhas agora respeitam essa modalidade.`}
        actions={
          <div className="flex gap-3">
            <Link href="/app/select-sport">
              <Button variant="secondary">Trocar esporte</Button>
            </Link>
            <Link href="/app/workouts/new">
              <Button>
                Novo treino
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Treinos cadastrados"
          value={stats.totalWorkouts}
          description="Protocolos ativos para a modalidade selecionada."
        />
        <StatCard
          label="Sessões por semana"
          value={stats.plannedSessionsPerWeek}
          description="Frequência planejada para seu esporte do dia."
        />
        <StatCard
          label="Exercícios por treino"
          value={stats.averageExercisesPerWorkout}
          description="Média de volume por sessão cadastrada."
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${stats.completionRate}%`}
          description="Percentual recente de treinos finalizados."
        />
      </div>

      <TodaySuggestionCard
        suggestion={todaySuggestion}
        secondaryHref="/app/assistant"
        secondaryLabel="Perguntar ao coach"
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PointsPanel
          totalPoints={pointsSummary.points?.total_points ?? 0}
          level={pointsSummary.points?.level ?? 1}
          currentStreak={pointsSummary.points?.current_streak ?? 0}
          badgeCount={pointsSummary.badges.length}
        />

        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Frequência recente</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Treinos concluídos por semana
            </h2>
          </div>
          <WeeklyFrequencyChart data={frequencyChart} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Agenda semanal</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
                Organização por dia
              </h2>
            </div>
            <CalendarRange className="h-5 w-5 text-lime-300" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {weeklyPlan.map((day) => (
              <div
                key={day.day}
                className="rounded-[24px] border border-white/10 bg-zinc-950/45 p-4"
              >
                <p className="text-sm font-medium text-zinc-200">
                  {getDayLabel(day.day)}
                </p>
                <div className="mt-3 space-y-2">
                  {day.workouts.length > 0 ? (
                    day.workouts.map((workout) => (
                      <Link
                        key={workout.id}
                        href={`/app/workouts/${workout.id}`}
                        className="block rounded-2xl bg-white/5 px-4 py-3 transition hover:bg-white/8"
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {workout.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatCategoryLabel(workout.category)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-200">
                          <MoonStar className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            Dia de descanso
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Reserve o dia para recuperação, mobilidade leve e boa
                            organização da semana.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Swords className="h-5 w-5 text-orange-300" />
            <div>
              <p className="text-sm text-zinc-500">Batalhas</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
                Seus duelos mais recentes
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {battles.length > 0 ? (
              battles.slice(0, 3).map((battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))
            ) : (
              <EmptyState
                title="Nenhuma batalha criada"
                description="Crie um duelo com outro competidor para comparar consistência, volume ou pontos."
                actionLabel="Criar batalha"
                actionHref="/app/battles/new"
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <div>
                <p className="text-sm text-zinc-500">Treinos da modalidade</p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
                  Retome rápido o que está usando
                </h2>
              </div>
          </div>
          <div className="space-y-3">
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/app/workouts/${workout.id}`}
                  className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-zinc-50">{workout.name}</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatScheduledDays(workout.scheduled_days)}
                      </p>
                    </div>
                    <Badge>{formatCategoryLabel(workout.category)}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="Nenhum treino para a modalidade de hoje"
                description="Crie um protocolo novo ou altere a modalidade da sessão."
                actionLabel="Criar treino"
                actionHref="/app/workouts/new"
              />
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Progresso recente</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Últimas execuções
            </h2>
          </div>
          <div className="space-y-3">
            {recentExecutions.length > 0 ? (
              recentExecutions.map((execution) => {
                const completedLogs = execution.exercise_logs.filter(
                  (log) => log.completed,
                ).length;

                return (
                  <Link
                    key={execution.id}
                    href={`/app/history/${execution.id}`}
                    className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-zinc-50">
                          {execution.workout_name}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDateOnly(execution.executed_at)}
                        </p>
                      </div>
                      <Badge>{completedLogs} concluídos</Badge>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                title="Nenhuma execução registrada"
                description="Quando você iniciar e finalizar seus treinos, o histórico recente aparece aqui."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
