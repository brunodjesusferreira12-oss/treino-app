import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";

import { FortynexLogo } from "@/components/brand/fortynex-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 md:px-6 lg:px-8">
      <header className="flex items-center justify-between rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card-strong)] px-5 py-4 backdrop-blur">
        <FortynexLogo
          size="md"
          subtitle="Treine. Evolua. Supere."
        />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div className="space-y-7">
          <div className="inline-flex items-center rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-lime-200">
            Produzido por alunos do IFMA
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl font-[var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-50 md:text-7xl">
              Organize treinos, execute no dia e acompanhe sua evolução com cara
              de produto real.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
              Um sistema privado para musculação, pilates e crossfit, com
              histórico detalhado de carga, repetições e consistência.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/signup">
              <Button size="lg">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Já tenho conta
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="space-y-3">
              <CalendarDays className="h-5 w-5 text-lime-300" />
              <div>
                <h3 className="font-semibold text-zinc-50">Agenda semanal</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Treinos organizados por dia, bloco e prioridade.
                </p>
              </div>
            </Card>
            <Card className="space-y-3">
              <ChartNoAxesCombined className="h-5 w-5 text-sky-300" />
              <div>
                <h3 className="font-semibold text-zinc-50">Evolução visual</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Histórico de cargas, frequência e exercícios mais feitos.
                </p>
              </div>
            </Card>
            <Card className="space-y-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <div>
                <h3 className="font-semibold text-zinc-50">Acesso privado</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Autenticação, sessão persistente e RLS por usuário.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,242,100,0.14),transparent_36%)]" />
          <div className="relative space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">Prévia da experiência</p>
              <h2 className="text-2xl font-semibold text-zinc-50">
                Dashboard com foco em consistência.
              </h2>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Treinos por semana</p>
                    <p className="mt-2 text-4xl font-semibold text-zinc-50">7</p>
                  </div>
                  <div className="rounded-2xl bg-lime-300/15 px-3 py-2 text-sm font-medium text-lime-200">
                    +18% consistência
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-7 gap-2">
                  {["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => (
                    <div
                      key={`${label}-${index}`}
                      className={`h-16 rounded-2xl ${
                        index === 0 || index === 2 || index === 4
                          ? "bg-lime-300/25"
                          : "bg-white/5"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-zinc-500">Treino do dia</p>
                <h3 className="mt-2 text-xl font-semibold text-zinc-50">
                  Quadríceps + Posterior
                </h3>
                <div className="mt-4 space-y-3">
                  {[
                    "Monster Walk",
                    "Bulgarian Split Squat",
                    "Romanian Deadlift",
                  ].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-zinc-300"
                      >
                        <span>{item}</span>
                        <span className="rounded-full bg-white/7 px-3 py-1 text-xs text-zinc-500">
                          pronto
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
