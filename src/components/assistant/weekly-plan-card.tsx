import { CalendarRange, MoonStar, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { CoachWeeklyPlanItem } from "@/features/assistant/types";

type WeeklyPlanCardProps = {
  items: CoachWeeklyPlanItem[];
};

export function WeeklyPlanCard({ items }: WeeklyPlanCardProps) {
  const activeDays = items.filter((item) => item.workoutNames.length > 0);
  const totalTargetPoints = activeDays.reduce(
    (acc, item) => acc + item.targetPoints,
    0,
  );

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <CalendarRange className="h-4 w-4 text-sky-300" />
            Plano semanal do coach
          </div>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Rota da semana
          </h2>
        </div>
        <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-600 dark:text-sky-200">
          {activeDays.length} dia(s) ativos
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="text-xs text-[color:var(--muted)]">Meta semanal estimada</p>
          <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
            {totalTargetPoints} pts
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            Esse alvo considera treino concluído, exercícios marcados e um
            fechamento com observações.
          </p>
        </div>

        <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card-strong)] p-4">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <Sparkles className="h-4 w-4 text-lime-300" />
            Como usar
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-soft)]">
            Entre na semana pensando em consistência. O coach já separou dias de
            carga e dias de recuperação para você executar sem improviso.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const isRestDay = item.workoutNames.length === 0;

          return (
            <div
              key={item.day}
              className={`rounded-[24px] border p-4 transition ${
                isRestDay
                  ? "border-sky-300/20 bg-sky-300/8"
                  : item.isToday
                    ? "border-lime-300/25 bg-lime-300/10"
                    : "border-[color:var(--border)] bg-[color:var(--surface)]"
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {isRestDay ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-300/12 text-sky-600 dark:text-sky-200">
                        <MoonStar className="h-4 w-4" />
                      </span>
                    ) : null}
                    <p className="text-lg font-semibold text-[color:var(--foreground)]">
                      {item.label}
                    </p>
                    {item.isToday ? (
                      <span className="rounded-full bg-lime-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-950">
                        Hoje
                      </span>
                    ) : null}
                    {isRestDay ? (
                      <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-200">
                        Descanso
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[color:var(--muted)]">
                    {isRestDay
                      ? "Dia de descanso programado"
                      : item.workoutNames.join(" - ")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-2 text-xs ${
                      isRestDay
                        ? "border-sky-300/20 bg-sky-300/10 text-sky-600 dark:text-sky-200"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]"
                    }`}
                  >
                    {item.intensity}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-2 text-xs ${
                      isRestDay
                        ? "border-sky-300/20 bg-sky-300/10 text-sky-600 dark:text-sky-200"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]"
                    }`}
                  >
                    {item.targetPoints > 0 ? `${item.targetPoints} pts` : "Recuperação"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[0.42fr_0.58fr]">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
                  <p className="text-xs text-[color:var(--muted)]">Foco</p>
                  <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
                    {item.focus}
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
                  <p className="text-xs text-[color:var(--muted)]">Recomendação</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-soft)]">
                    {item.recommendation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
