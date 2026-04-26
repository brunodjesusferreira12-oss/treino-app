import type { ReactNode } from "react";

import { FortynexLogo } from "@/components/brand/fortynex-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.08),transparent_28%)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden border-r border-[color:var(--border)] bg-[color:var(--card)] px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-5">
          <div className="inline-flex rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <FortynexLogo
              size="md"
              subtitle="Treine. Evolua. Supere."
            />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
              Sistema Privado
            </p>
            <h1 className="max-w-xl font-[var(--font-display)] text-5xl font-semibold leading-tight text-zinc-50">
              {APP_NAME}: musculação, pilates e crossfit em uma experiência moderna e segura.
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-400">
              Entre para organizar seus treinos, assistir vídeos, acumular pontos
              e disputar batalhas com visual de produto real.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            "Sessão persistente com Supabase Auth",
            "Rotas privadas, RLS e dados separados por usuário",
            "Pontuação, badges e batalhas entre competidores",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
        <div className="absolute right-4 top-4 md:right-6 md:top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg">{children}</div>
      </section>
    </div>
  );
}
