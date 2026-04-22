"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatScheduledDays } from "@/lib/format";
import type { WorkoutWithSections } from "@/features/workouts/types";

type WorkoutLibraryProps = {
  workouts: WorkoutWithSections[];
};

export function WorkoutLibrary({ workouts }: WorkoutLibraryProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...new Set(workouts.map((workout) => workout.category))];

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesQuery =
      workout.name.toLowerCase().includes(query.toLowerCase()) ||
      workout.objective?.toLowerCase().includes(query.toLowerCase()) ||
      false;

    const matchesCategory =
      selectedCategory === "all" || workout.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  if (workouts.length === 0) {
    return (
      <EmptyState
        title="Nenhum treino cadastrado"
        description="Crie seu primeiro treino ou importe o protocolo inicial para começar a usar o painel."
        actionLabel="Criar treino"
        actionHref="/app/workouts/new"
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="grid gap-4 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar treino, objetivo ou bloco..."
            className="pl-11"
          />
        </label>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "all" ? "Todas as categorias" : category}
            </option>
          ))}
        </select>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredWorkouts.map((workout) => {
          const exerciseCount = workout.workout_sections.reduce(
            (acc, section) => acc + section.exercises.length,
            0,
          );

          return (
            <Link key={workout.id} href={`/app/workouts/${workout.id}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-lime-300/20 hover:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{workout.category}</Badge>
                        <Badge className="text-lime-200">
                          {formatScheduledDays(workout.scheduled_days)}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-50">
                        {workout.name}
                      </h3>
                    </div>
                    {workout.objective ? (
                      <p className="text-sm leading-6 text-zinc-400">
                        {workout.objective}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl bg-white/5 px-3 py-2 text-right">
                    <p className="text-xs text-zinc-500">Exercícios</p>
                    <p className="text-lg font-semibold text-zinc-50">
                      {exerciseCount}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {workout.workout_sections.map((section) => (
                    <Badge key={section.id}>{section.title}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
