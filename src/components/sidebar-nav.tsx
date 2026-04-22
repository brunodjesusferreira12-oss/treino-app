"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, History, LayoutDashboard, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/workouts", label: "Treinos", icon: Dumbbell },
  { href: "/app/history", label: "Histórico", icon: History },
  { href: "/app/progress", label: "Evolução", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm font-semibold text-lime-200">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-zinc-950">
            T
          </span>
          Treino App
        </div>
        <p className="max-w-xs text-sm leading-6 text-zinc-500">
          Seu cockpit pessoal para execução, consistência e evolução semanal.
        </p>
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
                  ? "bg-white/10 text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-zinc-400 hover:bg-white/6 hover:text-zinc-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
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
