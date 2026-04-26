import Link from "next/link";

import { BattleCard } from "@/components/battles/battle-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getUserBattles } from "@/features/battles/queries";

export default async function BattlesPage() {
  const battles = await getUserBattles();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Batalhas"
        title="Duelo entre competidores"
        description="Crie desafios, acompanhe o placar em tempo real e veja quem venceu no fim do período."
        actions={
          <Link href="/app/battles/new">
            <Button>Criar batalha</Button>
          </Link>
        }
      />

      {battles.length === 0 ? (
        <EmptyState
          title="Nenhuma batalha encontrada"
          description="Crie um duelo para comparar pontos, volume ou consistência com outro competidor."
          actionLabel="Criar batalha"
          actionHref="/app/battles/new"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {battles.map((battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      )}
    </div>
  );
}
