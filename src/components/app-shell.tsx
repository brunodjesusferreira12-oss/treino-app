import type { ReactNode } from "react";

import { FortynexLogo } from "@/components/brand/fortynex-logo";
import { MobileNav } from "@/components/mobile-nav";
import { LogoutButton } from "@/components/logout-button";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AppShellProps = {
  fullName?: string | null;
  email?: string | null;
  activeSportName?: string | null;
  children: ReactNode;
};

export function AppShell({
  fullName,
  email,
  activeSportName,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[290px] shrink-0 rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card-strong)] p-6 backdrop-blur lg:block">
          <SidebarNav />
        </aside>

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6 pb-24 lg:pb-6">
          <InstallAppPrompt />

          <Card className="flex flex-col gap-4 overflow-hidden border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <FortynexLogo size="sm" subtitle={null} />
                {activeSportName ? <Badge>{activeSportName} hoje</Badge> : null}
              </div>
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                {fullName ? `Ola, ${fullName}` : "Ola, atleta"}
              </h2>
              <p className="text-sm text-[color:var(--muted)]">
                {email ?? "Sua plataforma esta pronta para treino, score e desafios."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle className="lg:hidden" />
              <LogoutButton />
            </div>
          </Card>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
