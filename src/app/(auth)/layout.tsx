import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.08),transparent_28%)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden border-r border-white/10 bg-zinc-950/40 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-lg font-bold text-zinc-950">
              T
            </span>
            <div>
              <p className="font-semibold text-zinc-50">Treino App</p>
              <p className="text-sm text-zinc-500">Seu sistema pessoal de evolução</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
              Sistema Privado
            </p>
            <h1 className="max-w-xl font-[var(--font-display)] text-5xl font-semibold leading-tight text-zinc-50">
              Corrida, fortalecimento e musculação complementar em um só painel.
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-400">
              Cadastre, execute e acompanhe seus treinos com acesso seguro e
              visual premium em qualquer dispositivo.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            "Sessão persistente com Supabase Auth",
            "Rotas privadas e RLS por usuário",
            "Execução diária com histórico completo",
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

      <section className="flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
        <div className="w-full max-w-lg">{children}</div>
      </section>
    </div>
  );
}
