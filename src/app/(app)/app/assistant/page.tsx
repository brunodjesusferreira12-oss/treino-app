import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getAssistantPageData } from "@/features/assistant/queries";

export default async function AssistantPage() {
  const data = await getAssistantPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assistente"
        title="Fortynex Coach"
        description="Um assistente inteligente para sugerir o treino do dia, analisar sua constancia, orientar progressao e ajudar nas batalhas."
      />

      <AssistantPanel
        context={data.context}
        initialMessages={data.initialMessages}
        starterPrompts={data.starterPrompts}
        isAiEnabled={data.isAiEnabled}
        configuredModel={data.configuredModel}
        memoryEnabled={data.memoryEnabled}
        todaySuggestion={data.todaySuggestion}
        weeklyPlan={data.weeklyPlan}
      />
    </div>
  );
}
