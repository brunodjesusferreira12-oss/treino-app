import type { ReactNode } from "react";

import { MobileNav } from "@/components/mobile-nav";
import { LogoutButton } from "@/components/logout-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { Card } from "@/components/ui/card";

type AppShellProps = {
  fullName?: string | null;
  email?: string | null;
  children: ReactNode;
};

export function AppShell({ fullName, email, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[290px] shrink-0 rounded-[32px] border border-white/10 bg-zinc-950/65 p-6 backdrop-blur lg:block">
          <SidebarNav />
        </aside>

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6 pb-24 lg:pb-6">
          <Card className="flex flex-col gap-4 overflow-hidden border-white/8 bg-white/[0.04] p-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300/70">
                Painel Privado
              </p>
              <h2 className="text-xl font-semibold text-zinc-50">
                {fullName ? `Olá, ${fullName}` : "Olá, atleta"}
              </h2>
              <p className="text-sm text-zinc-400">
                {email ?? "Seu sistema está pronto para acompanhar evolução real."}
              </p>
            </div>
            <LogoutButton />
          </Card>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
