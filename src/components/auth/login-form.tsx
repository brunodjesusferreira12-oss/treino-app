"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(
    searchParams.get("error"),
  );
  const { register, handleSubmit } = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Card className="space-y-6 p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
          Entrar
        </p>
        <h1 className="text-3xl font-semibold text-zinc-50">
          Acesse seu painel
        </h1>
        <p className="text-sm leading-6 text-zinc-400">
          Entre com seu e-mail e senha para visualizar seus treinos privados.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          startTransition(async () => {
            setMessage(null);
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword(values);

            if (error) {
              setMessage(error.message);
              return;
            }

            router.push("/app");
            router.refresh();
          }),
        )}
      >
        <FormField label="E-mail">
          <Input type="email" placeholder="voce@email.com" {...register("email")} />
        </FormField>
        <FormField label="Senha">
          <Input type="password" placeholder="Sua senha" {...register("password")} />
        </FormField>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
            {message}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="flex flex-col gap-3 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
        <Link href="/forgot-password" className="hover:text-zinc-100">
          Esqueci minha senha
        </Link>
        <Link href="/signup" className="hover:text-zinc-100">
          Criar conta
        </Link>
      </div>
    </Card>
  );
}
