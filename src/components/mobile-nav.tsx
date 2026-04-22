"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, History, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app", label: "Início", icon: LayoutDashboard },
  { href: "/app/workouts", label: "Treinos", icon: Dumbbell },
  { href: "/app/history", label: "Histórico", icon: History },
  { href: "/app/progress", label: "Evolução", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-white/10 bg-zinc-950/90 p-2 shadow-2xl backdrop-blur lg:hidden">
      <nav className="grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                isActive
                  ? "bg-lime-300 text-zinc-950"
                  : "text-zinc-400 hover:bg-white/6 hover:text-zinc-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
