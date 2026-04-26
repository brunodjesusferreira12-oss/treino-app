"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Dumbbell,
  History,
  LayoutDashboard,
  Plus,
  Swords,
  UserRound,
} from "lucide-react";

import { FortynexLogo } from "@/components/brand/fortynex-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/assistant", label: "Assistente", icon: Bot },
  { href: "/app/workouts", label: "Treinos", icon: Dumbbell },
  { href: "/app/history", label: "Histórico", icon: History },
  { href: "/app/progress", label: "Evolução", icon: BarChart3 },
  { href: "/app/battles", label: "Batalhas", icon: Swords },
  { href: "/app/profile", label: "Perfil", icon: UserRound },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="space-y-4">
        <div className="inline-flex rounded-2xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm font-semibold text-lime-200">
          <FortynexLogo
            size="sm"
            subtitle={null}
          />
        </div>
        <p className="max-w-xs text-sm leading-6 text-[color:var(--muted)]">
          Plataforma privada de treino com esporte do dia, pontuação e batalhas.
        </p>
        <ThemeToggle />
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-[color:var(--muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--foreground)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Link href="/app/select-sport">
          <Button variant="secondary" className="w-full justify-center">
            Trocar esporte
          </Button>
        </Link>
        <Link href="/app/workouts/new">
          <Button className="w-full justify-center">
            <Plus className="h-4 w-4" />
            Novo treino
          </Button>
        </Link>
      </div>
    </div>
  );
}
