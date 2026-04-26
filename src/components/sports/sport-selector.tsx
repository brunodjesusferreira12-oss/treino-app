"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Activity, Dumbbell, Flame, MoveRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { selectSportForTodayAction } from "@/features/sports/actions";
import { cn } from "@/lib/utils";

type SportSelectorProps = {
  sports: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;
  selectedSportId?: string | null;
};

const iconMap = {
  musculacao: Dumbbell,
  pilates: Activity,
  crossfit: Flame,
} as const;

export function SportSelector({
  sports,
  selectedSportId = null,
}: SportSelectorProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(selectedSportId);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {sports.map((sport) => {
          const Icon = iconMap[sport.slug as keyof typeof iconMap] ?? Activity;
          const isSelected = selectedId === sport.id;

          return (
            <button
              key={sport.id}
              type="button"
              onClick={() => setSelectedId(sport.id)}
              className={cn(
                "group text-left transition",
                isSelected ? "scale-[1.01]" : "hover:-translate-y-0.5",
              )}
            >
              <Card
                className={cn(
                  "relative h-full overflow-hidden border-[color:var(--border)] bg-[color:var(--card-strong)]",
                  isSelected
                    ? "border-lime-300/30 bg-lime-300/8 shadow-[0_0_0_1px_rgba(190,242,100,0.14)]"
                    : "hover:bg-[color:var(--surface)]",
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_45%)]" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl border",
                        isSelected
                          ? "border-lime-300/30 bg-lime-300 text-zinc-950"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {isSelected ? (
                      <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-semibold text-zinc-950">
                        Selecionado
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
                      {sport.name}
                    </h3>
                    <p className="text-sm leading-6 text-[color:var(--muted)]">
                      {sport.description ??
                        "Escolha esta modalidade para personalizar o treino do dia."}
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {message ? (
        <Card className="border-red-500/20 bg-red-500/8 text-sm text-red-200">
          {message}
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={isPending || !selectedId}
          onClick={() =>
            startTransition(async () => {
              if (!selectedId) return;
              setMessage(null);
              const result = await selectSportForTodayAction(selectedId);

              if (!result.ok) {
        setMessage(result.error ?? "Não foi possível salvar a modalidade.");
                return;
              }

              router.push("/app");
            })
          }
        >
          {isPending ? "Salvando..." : "Confirmar modalidade"}
          <MoveRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
