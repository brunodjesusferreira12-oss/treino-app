"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createBattleAction } from "@/features/battles/actions";
import {
  battleFormSchema,
  type BattleFormValues,
} from "@/features/battles/schemas";
import { BATTLE_SCORING_MODES, BATTLE_TYPE_OPTIONS, SPORT_OPTIONS } from "@/lib/constants";
import {
  formatBattleScoringModeLabel,
  formatBattleTypeLabel,
} from "@/lib/format";

type BattleFormProps = {
  candidates: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
};

export function BattleForm({ candidates }: BattleFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [startsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [endsAt] = useState(() =>
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );
  const { register, handleSubmit } = useForm<BattleFormValues>({
    resolver: zodResolver(battleFormSchema) as Resolver<BattleFormValues>,
    defaultValues: {
      title: "",
      opponentId: candidates[0]?.id ?? "",
      sportSlug: "all",
      battleType: "head_to_head",
      scoringMode: "points",
      startsAt,
      endsAt,
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          setMessage(null);
          const result = await createBattleAction(values);

          if (!result.ok || !result.id) {
            setMessage(result.error ?? "Não foi possível criar a batalha.");
            return;
          }

          router.push(`/app/battles/${result.id}`);
          router.refresh();
        }),
      )}
    >
      <Card className="grid gap-4 md:grid-cols-2">
        <FormField label="Título">
          <Input placeholder="Ex.: Duelo da semana" {...register("title")} />
        </FormField>

        <FormField label="Competidor">
          <Select {...register("opponentId")}>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.full_name ?? "Competidor"}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Modalidade">
          <Select {...register("sportSlug")}>
            <option value="all">Geral</option>
            {SPORT_OPTIONS.map((sport) => (
              <option key={sport.slug} value={sport.slug}>
                {sport.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Tipo de batalha">
          <Select {...register("battleType")}>
            {BATTLE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {formatBattleTypeLabel(type)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Modo de pontuação">
          <Select {...register("scoringMode")}>
            {BATTLE_SCORING_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {formatBattleScoringModeLabel(mode)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Início">
          <Input type="datetime-local" {...register("startsAt")} />
        </FormField>

        <FormField label="Fim">
          <Input type="datetime-local" {...register("endsAt")} />
        </FormField>
      </Card>

      {message ? (
        <Card className="border-red-500/20 bg-red-500/8 text-sm text-red-200">
          {message}
        </Card>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar batalha"}
      </Button>
    </form>
  );
}
