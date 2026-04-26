import {
  Award,
  Dumbbell,
  Flame,
  Medal,
  Sparkles,
  Swords,
  Target,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type BadgeGridProps = {
  items: Array<{
    earned_at: string;
    badges: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      icon: string | null;
      sport_slug: string | null;
      created_at: string;
    } | null;
  }>;
};

const iconMap = {
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  flame: Flame,
  medal: Medal,
  swords: Swords,
  target: Target,
  zap: Zap,
} as const;

export function BadgeGrid({ items }: BadgeGridProps) {
  if (items.length === 0) {
    return (
      <Card className="text-sm text-[color:var(--muted)]">
          As conquistas desbloqueadas aparecem aqui conforme você evolui.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const badge = item.badges;
        if (!badge) return null;
        const Icon = iconMap[badge.icon as keyof typeof iconMap] ?? Award;

        return (
          <Card key={`${badge.id}-${item.earned_at}`} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300/15 text-lime-200">
                <Icon className="h-5 w-5" />
              </span>
              {badge.sport_slug ? <Badge>{badge.sport_slug}</Badge> : null}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                {badge.name}
              </h3>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                {badge.description ?? "Conquista desbloqueada."}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
