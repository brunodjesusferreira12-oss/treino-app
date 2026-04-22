import Link from "next/link";
import { ArrowRight, CalendarRange, Sparkles } from "lucide-react";

import { WeeklyFrequencyChart } from "@/components/charts/weekly-frequency-chart";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateOnly, formatScheduledDays } from "@/lib/format";
import { getDayLabel } from "@/lib/format";
import { getDashboardData } from "@/features/workouts/queries";

export default async function DashboardPage() {
  const { profile, weeklyPlan, recentExecutions, recentWorkouts, stats, frequencyChart } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={profile?.full_name ? `Bom treino, ${profile.full_name}` : "Seu painel de treinos"}
        description="Resumo da sua agenda semanal, últimas execuções e evolução recente em um único lugar."
        actions={
          <Link href="/app/workouts/new">
            <Button>
              Novo treino
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Treinos cadastrados"
          value={stats.totalWorkouts}
          description="Protocolos privados disponíveis na sua conta."
        />
        <StatCard
          label="Sessões por semana"
          value={stats.plannedSessionsPerWeek}
          description="Frequência planejada com base na agenda configurada."
        />
        <StatCard
          label="Exercícios por treino"
          value={stats.averageExercisesPerWorkout}
          description="Média atual de volume estrutural por protocolo."
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${stats.completionRate}%`}
          description="Percentual das execuções finalizadas nos últimos 30 dias."
        />
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
                          {workout.category}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">Sem treino planejado.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-sm text-zinc-500">Últimos treinos acessados</p>
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
                    <Badge>{workout.category}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="Nada por aqui ainda"
                description="Assim que você acessar ou criar treinos, eles aparecem neste painel."
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
                      <Badge className={execution.completed ? "text-lime-200" : ""}>
                        {completedLogs} concluídos
                      </Badge>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                title="Nenhuma execução registrada"
                description="Ao iniciar e finalizar seus treinos, o histórico recente aparece aqui."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
