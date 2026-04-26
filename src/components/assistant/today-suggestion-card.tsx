import Link from "next/link";
import { ArrowRight, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CoachTodaySuggestion } from "@/features/assistant/types";

type TodaySuggestionCardProps = {
  suggestion: CoachTodaySuggestion | null;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function TodaySuggestionCard({
  suggestion,
  secondaryHref,
  secondaryLabel,
}: TodaySuggestionCardProps) {
  if (!suggestion) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-lime-300" />
          <div>
            <p className="text-sm text-[color:var(--muted)]">Coach do dia</p>
            <h2 className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
              Sugestao indisponivel
            </h2>
          </div>
        </div>
        <p className="text-sm leading-7 text-[color:var(--muted)]">
          Escolha um esporte do dia e tenha pelo menos um treino cadastrado para o
              coach recomendar a melhor sessão.
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,242,100,0.12),transparent_35%)]" />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
              <Sparkles className="h-4 w-4 text-lime-300" />
              {suggestion.headline}
            </div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              {suggestion.workoutName}
            </h2>
          </div>
          <div className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-2 text-xs font-semibold text-lime-200">
            {suggestion.intensity}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Resumo
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-soft)]">
              {suggestion.summary}
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              {suggestion.reason}
            </p>
          </div>

          <div className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card-strong)] p-4">
            <div>
              <p className="text-xs text-[color:var(--muted)]">Janela sugerida</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                {suggestion.dayLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestion.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs text-[color:var(--foreground-soft)]"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={suggestion.actionHref}>
            <Button>
              {suggestion.actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref}>
              <Button variant="secondary">{secondaryLabel}</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
