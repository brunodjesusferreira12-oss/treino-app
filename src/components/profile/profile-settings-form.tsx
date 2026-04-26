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
import {
  profileSettingsSchema,
  type ProfileSettingsValues,
} from "@/features/profile/schemas";
import { updateProfileSettingsAction } from "@/features/profile/actions";

type ProfileSettingsFormProps = {
  defaultValues: ProfileSettingsValues;
};

export function ProfileSettingsForm({
  defaultValues,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema) as Resolver<ProfileSettingsValues>,
    defaultValues,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          setMessage(null);
          const result = await updateProfileSettingsAction(values);

          if (!result.ok) {
            setMessage(result.error ?? "Não foi possível salvar o perfil.");
            return;
          }

          setMessage("Perfil atualizado com sucesso.");
          router.refresh();
        }),
      )}
    >
      <Card className="grid gap-4 md:grid-cols-2">
        <FormField label="Nome" error={errors.fullName?.message}>
          <Input placeholder="Seu nome" {...register("fullName")} />
        </FormField>

        <FormField
          label="Altura (cm)"
          error={errors.heightCm?.message}
          hint="Usada para calcular o IMC de referência."
        >
          <Input
            type="number"
            step="0.1"
            placeholder="Ex.: 175"
            {...register("heightCm", { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Peso alvo (kg)"
          error={errors.targetWeightKg?.message}
          hint="Opcional, para acompanhar a distância até a meta."
        >
          <Input
            type="number"
            step="0.1"
            placeholder="Ex.: 78"
            {...register("targetWeightKg", { valueAsNumber: true })}
          />
        </FormField>
      </Card>

      {message ? (
        <Card
          className={
            message.includes("sucesso")
              ? "border-lime-300/20 bg-lime-300/10 text-sm text-lime-100"
              : "border-red-500/20 bg-red-500/8 text-sm text-red-200"
          }
        >
          {message}
        </Card>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar perfil"}
      </Button>
    </form>
  );
}
