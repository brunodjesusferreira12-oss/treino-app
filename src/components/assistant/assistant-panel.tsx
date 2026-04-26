"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bot,
  BrainCircuit,
  LoaderCircle,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Swords,
} from "lucide-react";

import { TodaySuggestionCard } from "@/components/assistant/today-suggestion-card";
import { WeeklyPlanCard } from "@/components/assistant/weekly-plan-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AssistantContext,
  AssistantStoredMessage,
  CoachTodaySuggestion,
  CoachWeeklyPlanItem,
} from "@/features/assistant/types";

type AssistantPanelProps = {
  context: AssistantContext;
  initialMessages: AssistantStoredMessage[];
  starterPrompts: string[];
  isAiEnabled: boolean;
  configuredModel: string | null;
  memoryEnabled: boolean;
  todaySuggestion: CoachTodaySuggestion | null;
  weeklyPlan: CoachWeeklyPlanItem[];
};

type AssistantApiResponse = {
  reply: string;
  mode: "openai" | "fallback";
  model: string | null;
};

type DeleteApiResponse = {
  ok: boolean;
  cleared: boolean;
};

function createResetMessage(): AssistantStoredMessage {
  return {
    id: "assistant-reset",
    role: "assistant",
    content:
      "Memória limpa. Posso reorganizar seu treino do dia, seu plano semanal e sua estratégia de batalha quando você quiser.",
    createdAt: new Date().toISOString(),
  };
}

export function AssistantPanel({
  context,
  initialMessages,
  starterPrompts,
  isAiEnabled,
  configuredModel,
  memoryEnabled,
  todaySuggestion,
  weeklyPlan,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantStoredMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [assistantMode, setAssistantMode] = useState<"openai" | "fallback">(
    isAiEnabled ? "openai" : "fallback",
  );
  const [lastModel, setLastModel] = useState<string | null>(configuredModel);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function submitMessage(nextMessage?: string) {
    const text = (nextMessage ?? draft).trim();
    if (!text || isPending) return;

    const optimisticUserMessage: AssistantStoredMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticUserMessage]);
    setDraft("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            history: [],
          }),
        });

        const payload = (await response.json()) as
          | AssistantApiResponse
          | { error?: string };

        if (!response.ok || !("reply" in payload)) {
          const errorMessage =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Não foi possível consultar o assistente.";

          throw new Error(errorMessage);
        }

        setAssistantMode(payload.mode);
        setLastModel(payload.model);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: payload.reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content:
              error instanceof Error
                ? `Não consegui responder agora. ${error.message}`
                : "Não consegui responder agora.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });
  }

  function resetMemory() {
    if (isPending || !memoryEnabled) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant", {
          method: "DELETE",
        });

        const payload = (await response.json()) as
          | DeleteApiResponse
          | { error?: string };

        if (!response.ok || !("ok" in payload)) {
          const errorMessage =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Não foi possível limpar a memória.";

          throw new Error(errorMessage);
        }

        setMessages([createResetMessage()]);
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: `assistant-reset-error-${Date.now()}`,
            role: "assistant",
            content:
              error instanceof Error
                ? `Não consegui limpar a memória agora. ${error.message}`
                : "Não consegui limpar a memória agora.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.08),transparent_34%)]" />

          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <Bot className="h-4 w-4 text-lime-300" />
                  Conversa ativa
                </div>
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
                  Fortynex Coach
                </h2>
                <p className="text-sm text-[color:var(--muted)]">
                  {memoryEnabled
                    ? "Sua memória recente fica salva para continuar a conversa entre acessos."
                    : "Memória persistente indisponível até o novo schema ser aplicado no banco."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                    assistantMode === "openai"
                      ? "border-lime-300/25 bg-lime-300/10 text-lime-200"
                      : "border-sky-300/20 bg-sky-300/10 text-sky-600 dark:text-sky-200",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {assistantMode === "openai"
                    ? `IA conectada${lastModel ? ` - ${lastModel}` : ""}`
                    : "Coach local inteligente"}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetMemory}
                  disabled={!memoryEnabled || isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar memória
                </Button>
              </div>
            </div>

            <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-[0_18px_40px_rgba(0,0,0,0.12)] md:max-w-[78%]",
                      message.role === "user"
                        ? "bg-lime-300 text-zinc-950"
                        : "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]",
                    )}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
                      {message.role === "user" ? "Você" : "Coach"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isPending ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--foreground-soft)]">
                    <LoaderCircle className="h-4 w-4 animate-spin text-lime-300" />
                    Pensando no melhor próximo passo...
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitMessage(prompt)}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs text-[color:var(--foreground-soft)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card-strong)] p-4">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitMessage();
                    }
                  }}
                  placeholder="Pergunte sobre treino do dia, plano semanal, progressão, pontos, badges ou estratégia para batalhas..."
                  className="min-h-[120px] border-none bg-transparent px-0 py-0 text-[color:var(--foreground)] focus:bg-transparent"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[color:var(--muted)]">
                    Use Shift + Enter para quebrar linha.
                  </p>
                  <Button
                    onClick={() => submitMessage()}
                    disabled={isPending || !draft.trim()}
                  >
                    Enviar
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <TodaySuggestionCard
            suggestion={todaySuggestion}
            secondaryHref="/app/workouts"
            secondaryLabel="Ver treinos"
          />

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-sky-300" />
              <div>
                <p className="text-sm text-[color:var(--muted)]">Contexto atual</p>
                <h2 className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                  Leitura do seu momento
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="text-xs text-[color:var(--muted)]">Esporte do dia</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {context.activeSportName ?? "Não selecionado"}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="text-xs text-[color:var(--muted)]">Pontos e nivel</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {context.points.totalPoints} pts - Nível {context.points.level}
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="text-xs text-[color:var(--muted)]">Streak e badges</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {context.points.currentStreak} dia(s) - {context.points.badgeCount} badge(s)
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                <p className="text-xs text-[color:var(--muted)]">Conclusão recente</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                  {context.stats.completionRate}% de treinos finalizados
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-orange-300" />
              <div>
                <p className="text-sm text-[color:var(--muted)]">Radar competitivo</p>
                <h2 className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">
                  Batalhas recentes
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {context.recentBattles.length > 0 ? (
                context.recentBattles.map((battle) => (
                  <div
                    key={`${battle.title}-${battle.status}`}
                    className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3"
                  >
                    <p className="font-medium text-[color:var(--foreground)]">
                      {battle.title}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {battle.sportName} - {battle.status} - líder com {battle.leaderScore} pts
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Nenhuma batalha recente. Crie um duelo para receber estratégia
                  competitiva.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <WeeklyPlanCard items={weeklyPlan} />
    </div>
  );
}
