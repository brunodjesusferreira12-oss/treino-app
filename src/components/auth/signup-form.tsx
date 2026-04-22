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

type SignupValues = {
  fullName: string;
  email: string;
  password: string;
};

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<SignupValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  return (
    <Card className="space-y-6 p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
          Cadastro
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          Crie seu acesso privado
        </h1>
        <p className="text-sm leading-6 text-zinc-400">
          O sistema já vai iniciar com seus protocolos prontos para uso.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            setMessage(null);
            const supabase = createClient();
            const redirectTo = `${window.location.origin}/auth/confirm?next=/app`;

            const { data, error } = await supabase.auth.signUp({
              email: values.email,
              password: values.password,
              options: {
                emailRedirectTo: redirectTo,
                data: {
                  full_name: values.fullName,
                },
              },
            });

            if (error) {
              setMessage(error.message);
              return;
            }

            if (data.session) {
              router.push("/app");
              router.refresh();
              return;
            }

            setMessage(
              "Conta criada. Verifique seu e-mail para confirmar o acesso antes do primeiro login.",
            );
          }),
        )}
      >
        <FormField label="Nome">
          <Input placeholder="Seu nome" {...register("fullName")} />
        </FormField>
        <FormField label="E-mail">
          <Input type="email" placeholder="voce@email.com" {...register("email")} />
        </FormField>
        <FormField label="Senha">
          <Input
            type="password"
            placeholder="Crie uma senha forte"
            {...register("password")}
          />
        </FormField>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
            {message}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <div className="text-sm text-zinc-400">
        Já possui acesso?{" "}
        <Link href="/login" className="text-zinc-100">
          Entrar
        </Link>
      </div>
    </Card>
  );
}
