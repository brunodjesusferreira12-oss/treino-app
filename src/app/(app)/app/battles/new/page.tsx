import { BattleForm } from "@/components/battles/battle-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getBattleCandidates } from "@/features/battles/queries";

export default async function NewBattlePage() {
  const candidates = await getBattleCandidates();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nova batalha"
        title="Criar desafio"
        description="Escolha um competidor, o período do duelo e a regra principal da disputa."
      />

      {candidates.length === 0 ? (
        <EmptyState
          title="Sem competidores disponíveis"
          description="Assim que houver outros usuários cadastrados, você poderá criar batalhas entre dois participantes."
        />
      ) : (
        <BattleForm candidates={candidates} />
      )}
    </div>
  );
}
