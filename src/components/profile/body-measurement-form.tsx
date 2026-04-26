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
import { Textarea } from "@/components/ui/textarea";
import { getTodayDateKey } from "@/lib/utils";
import { upsertBodyMeasurementAction } from "@/features/profile/actions";
import {
  bodyMeasurementSchema,
  type BodyMeasurementValues,
} from "@/features/profile/schemas";

type BodyMeasurementFormProps = {
  defaultWeightKg?: number | null;
};

export function BodyMeasurementForm({
  defaultWeightKg = null,
}: BodyMeasurementFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BodyMeasurementValues>({
    resolver: zodResolver(bodyMeasurementSchema) as Resolver<BodyMeasurementValues>,
    defaultValues: {
      recordedOn: getTodayDateKey(),
      weightKg: defaultWeightKg ?? undefined,
      notes: "",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        startTransition(async () => {
          setMessage(null);
          const result = await upsertBodyMeasurementAction(values);

          if (!result.ok) {
            setMessage(result.error ?? "Não foi possível salvar o registro.");
            return;
          }

          setMessage("Registro diário salvo com sucesso.");
          reset({
            ...values,
            notes: "",
          });
          router.refresh();
        }),
      )}
    >
      <Card className="grid gap-4 md:grid-cols-2">
        <FormField label="Data" error={errors.recordedOn?.message}>
          <Input type="date" {...register("recordedOn")} />
        </FormField>

        <FormField
          label="Peso (kg)"
          error={errors.weightKg?.message}
          hint="Se já existir registro para o dia, ele será atualizado."
        >
          <Input
            type="number"
            step="0.1"
            placeholder="Ex.: 82.4"
            {...register("weightKg", { valueAsNumber: true })}
          />
        </FormField>

        <div className="md:col-span-2">
          <FormField
            label="Observações"
            error={errors.notes?.message}
            hint="Opcional: energia, alimentação, retenção, sensação corporal."
          >
            <Textarea rows={4} {...register("notes")} />
          </FormField>
        </div>
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
        {isPending ? "Salvando..." : "Salvar registro do dia"}
      </Button>
    </form>
  );
}
