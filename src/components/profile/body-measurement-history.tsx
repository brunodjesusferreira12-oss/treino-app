import { ActivitySquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateOnly, formatWeight } from "@/lib/format";
import type { BodyMeasurementRow } from "@/features/profile/types";

type BodyMeasurementHistoryProps = {
  items: BodyMeasurementRow[];
};

export function BodyMeasurementHistory({
  items,
}: BodyMeasurementHistoryProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum registro corporal ainda"
        description="Adicione o primeiro peso do dia para acompanhar a evolução ao longo da semana."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="space-y-3 border-white/10 bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">{formatDateOnly(item.recorded_on)}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {formatWeight(item.weight_kg)}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lime-300">
              <ActivitySquare className="h-4 w-4" />
            </span>
          </div>

          {item.notes ? (
            <p className="text-sm leading-7 text-zinc-400">{item.notes}</p>
          ) : (
            <p className="text-sm text-zinc-500">Sem observações nesse dia.</p>
          )}
        </Card>
      ))}
    </div>
  );
}
