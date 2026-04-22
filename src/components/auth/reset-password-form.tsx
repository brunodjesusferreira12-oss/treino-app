"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type ResetPasswordValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<ResetPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Card className="space-y-6 p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
          Nova senha
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          Atualizar credenciais
        </h1>
        <p className="text-sm leading-6 text-zinc-400">
          Defina uma nova senha para seguir usando o sistema.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            setMessage(null);

            if (values.password !== values.confirmPassword) {
              setMessage("As senhas não coincidem.");
              return;
            }

            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
              password: values.password,
            });

            if (error) {
              setMessage(error.message);
              return;
            }

            router.push("/app");
            router.refresh();
          }),
        )}
      >
        <FormField label="Nova senha">
          <Input type="password" placeholder="Digite a nova senha" {...register("password")} />
        </FormField>
        <FormField label="Confirmar senha">
          <Input
            type="password"
            placeholder="Repita a nova senha"
            {...register("confirmPassword")}
          />
        </FormField>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
            {message}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Atualizando..." : "Salvar nova senha"}
        </Button>
      </form>

      <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100">
        Voltar para login
      </Link>
    </Card>
  );
}
