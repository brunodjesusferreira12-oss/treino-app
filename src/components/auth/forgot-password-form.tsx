"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type ForgotPasswordValues = {
  email: string;
};

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
  });

  return (
    <Card className="space-y-6 p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
          Recuperação
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          Redefinir senha
        </h1>
        <p className="text-sm leading-6 text-zinc-400">
          Enviaremos um link seguro para você criar uma nova senha.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            setMessage(null);
            const supabase = createClient();
            const redirectTo = `${window.location.origin}/auth/confirm?next=/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(
              values.email,
              { redirectTo },
            );

            if (error) {
              setMessage(error.message);
              return;
            }

            setMessage("Verifique sua caixa de entrada para continuar.");
          }),
        )}
      >
        <FormField label="E-mail">
          <Input type="email" placeholder="voce@email.com" {...register("email")} />
        </FormField>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
            {message}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar link"}
        </Button>
      </form>

      <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100">
        Voltar para login
      </Link>
    </Card>
  );
}
