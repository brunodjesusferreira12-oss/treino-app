import { getAssistantPageData } from "@/features/assistant/queries";
import type {
  AssistantContext,
  AssistantMessage,
  AssistantPageData,
} from "@/features/assistant/types";

type GenerateAssistantReplyInput = {
  userId: string;
  message: string;
};

type GenerateAssistantReplyResult = {
  reply: string;
  mode: "openai" | "fallback";
  model: string | null;
};

function detectIntent(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("hoje") ||
    normalized.includes("treino do dia") ||
    normalized.includes("qual treino")
  ) {
    return "daily";
  }

  if (
    normalized.includes("semana") ||
    normalized.includes("planejamento") ||
    normalized.includes("plano semanal")
  ) {
    return "weekly";
  }

  if (
    normalized.includes("carga") ||
    normalized.includes("repet") ||
    normalized.includes("progress") ||
    normalized.includes("evol")
  ) {
    return "progress";
  }

  if (
    normalized.includes("ponto") ||
    normalized.includes("nivel") ||
    normalized.includes("badge") ||
    normalized.includes("streak")
  ) {
    return "gamification";
  }

  if (
    normalized.includes("batalha") ||
    normalized.includes("duelo") ||
    normalized.includes("competidor") ||
    normalized.includes("ranking")
  ) {
    return "battle";
  }

  return "overview";
}

function buildContextSnapshot(
  context: AssistantContext,
  todaySuggestion: AssistantPageData["todaySuggestion"],
  weeklyPlan: AssistantPageData["weeklyPlan"],
) {
  return {
    perfil: context.profileName,
    esporteDoDia: context.activeSportName,
    pontos: context.points,
    estatisticas: context.stats,
    sugestaoDoDia: todaySuggestion,
    planoSemanal: weeklyPlan,
    treinosDoDia: context.todayWorkouts,
    treinosRecentes: context.recentWorkouts.slice(0, 4),
    execucoesRecentes: context.recentExecutions.slice(0, 4),
    batalhasRecentes: context.recentBattles,
  };
}

function generateFallbackReply(
  context: AssistantContext,
  message: string,
  todaySuggestion: AssistantPageData["todaySuggestion"],
  weeklyPlan: AssistantPageData["weeklyPlan"],
) {
  const intent = detectIntent(message);
  const lines: string[] = [];
  const sportLabel = context.activeSportName ?? "sua rotina atual";

  if (!context.activeSportName) {
    lines.push(
      "Ainda não há um esporte selecionado para hoje. Escolha a modalidade do dia para eu conseguir filtrar melhor seus treinos e orientar a sessão certa.",
    );
  }

  if (intent === "daily") {
    if (todaySuggestion) {
      lines.push(
        `${todaySuggestion.headline}: ${todaySuggestion.workoutName} (${todaySuggestion.intensity}).`,
      );
      lines.push(todaySuggestion.summary);
      lines.push(todaySuggestion.reason);
    } else if (context.todayWorkouts.length > 0) {
      lines.push(
        `Hoje seu foco mais natural em ${sportLabel.toLowerCase()} e seguir ${context.todayWorkouts
          .map((item) => `${item.name} (${item.exercises} exercícios)`)
          .join(" ou ")}.`,
      );
    } else {
      lines.push(
        "Você ainda não tem treinos suficientes para eu sugerir a melhor sessão do dia. O próximo passo é cadastrar ou importar um protocolo.",
      );
    }
  }

  if (intent === "weekly") {
    const activeDays = weeklyPlan.filter((day) => day.workoutNames.length > 0);

    if (activeDays.length === 0) {
      lines.push(
        "Seu plano semanal ainda está vazio. Cadastre treinos por dia da semana para eu montar uma distribuição real de carga e consistência.",
      );
    } else {
      lines.push(
        `Seu plano semanal para ${sportLabel.toLowerCase()} está distribuído em ${activeDays.length} dia(s) com sessão estruturada.`,
      );
      lines.push(
        activeDays
          .slice(0, 4)
          .map(
            (day) =>
              `${day.label}: ${day.workoutNames.join(", ")}. Foco em ${day.focus.toLowerCase()} e alvo de ${day.targetPoints} pts.`,
          )
          .join("\n"),
      );
      const todayDay = weeklyPlan.find((day) => day.isToday);

      if (todayDay) {
        lines.push(`Hoje eu manteria este direcionamento: ${todayDay.recommendation}`);
      }
    }
  }

  if (intent === "progress") {
    const lastExecution = context.recentExecutions[0];
    lines.push(
      `Sua taxa recente de conclusão está em ${context.stats.completionRate}%, com média de ${context.stats.averageExercisesPerWorkout} exercícios por treino.`,
    );
    if (lastExecution) {
      lines.push(
        `Seu registro mais recente foi ${lastExecution.workoutName}, com ${lastExecution.completedExercises} exercícios concluídos em ${lastExecution.executedAt}.`,
      );
    }
    lines.push(
      "Regra prática: aumente carga apenas quando a técnica estiver estável, todas as repetições-alvo estiverem fechando com controle e o histórico estiver consistente por pelo menos duas sessões parecidas.",
    );
  }

  if (intent === "gamification") {
    lines.push(
      `Você está no nível ${context.points.level}, com ${context.points.totalPoints} pontos, streak de ${context.points.currentStreak} dia(s) e ${context.points.badgeCount} badge(s).`,
    );
    lines.push(
      "Para pontuar mais rápido, foque em concluir o treino do dia, marcar exercícios individualmente, registrar observações úteis e manter a meta de 3 a 5 treinos por semana.",
    );
  }

  if (intent === "battle") {
    if (context.recentBattles.length > 0) {
      lines.push(
        `Você tem ${context.recentBattles.length} batalha(s) recente(s). A mais próxima no radar é ${context.recentBattles[0]?.title}, atualmente com liderança em ${context.recentBattles[0]?.leaderScore} ponto(s).`,
      );
    } else {
      lines.push(
        "Ainda não encontrei batalhas recentes. Se quiser subir o nível competitivo do app, crie um duelo por pontos, treinos ou exercícios concluídos.",
      );
    }
    lines.push(
      "Estratégia segura para vencer: priorize consistência, finalize as sessões por completo e não deixe de registrar observações quando o treino pedir ajustes importantes.",
    );
  }

  if (intent === "overview") {
    lines.push(
      `Hoje eu vejo ${context.stats.totalWorkouts} treino(s) ativo(s) para ${sportLabel.toLowerCase()} e uma frequência planejada de ${context.stats.plannedSessionsPerWeek} sessão(ões) por semana.`,
    );

    if (todaySuggestion) {
      lines.push(
        `Treino recomendado agora: ${todaySuggestion.workoutName}. Motivo principal: ${todaySuggestion.reason}`,
      );
    }

    const nextPlannedDay = weeklyPlan.find((day) => day.workoutNames.length > 0);
    if (nextPlannedDay) {
      lines.push(
        `Seu bloco semanal mais claro comeca em ${nextPlannedDay.label}: ${nextPlannedDay.workoutNames.join(", ")}.`,
      );
    }

    lines.push(
      "Posso te ajudar em quatro frentes: escolher o treino do dia, montar sua semana, ajustar progressão e orientar sua preparação para batalhas.",
    );
  }

  lines.push(
    "Se houver dor persistente, lesão ou qualquer suspeita clínica, use minhas respostas apenas como apoio de organização e procure um profissional de saúde ou educação física.",
  );

  return lines.join("\n\n");
}

function buildDeveloperPrompt(
  context: AssistantContext,
  todaySuggestion: AssistantPageData["todaySuggestion"],
  weeklyPlan: AssistantPageData["weeklyPlan"],
) {
  return [
    "Você é o Fortynex Coach, um assistente inteligente de treino dentro de um app privado.",
    "Responda sempre em portugues do Brasil.",
    "Seja objetivo, pratico, motivador e profissional.",
    "Use apenas o contexto fornecido; se faltar dado, diga isso com clareza.",
    "Não invente histórico, treinos, cargas ou resultados.",
    "Não forneça diagnóstico médico. Em casos de dor, lesão ou suspeita clínica, recomende suporte profissional.",
    "Quando fizer recomendações, priorize consistência, execução segura, carga progressiva e aderência semanal.",
    "Use o treino sugerido e o plano semanal como base, mas deixe claro quando a recomendação pode ser ajustada.",
    "Contexto do usuário:",
    JSON.stringify(buildContextSnapshot(context, todaySuggestion, weeklyPlan), null, 2),
  ].join("\n");
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const directOutput = Reflect.get(payload, "output_text");
  if (typeof directOutput === "string" && directOutput.trim()) {
    return directOutput.trim();
  }

  const output = Reflect.get(payload, "output");
  if (!Array.isArray(output)) {
    return null;
  }

  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Reflect.get(item, "content");
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text =
        Reflect.get(part, "text") ??
        Reflect.get(part, "output_text") ??
        Reflect.get(part, "value");

      if (typeof text === "string" && text.trim()) {
        chunks.push(text.trim());
      }
    }
  }

  return chunks.length > 0 ? chunks.join("\n\n") : null;
}

async function generateOpenAiReply(
  context: AssistantContext,
  todaySuggestion: AssistantPageData["todaySuggestion"],
  weeklyPlan: AssistantPageData["weeklyPlan"],
  conversationHistory: AssistantMessage[],
  input: GenerateAssistantReplyInput,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-5";
  const supportsReasoning =
    model.startsWith("gpt-5") ||
    model.startsWith("o1") ||
    model.startsWith("o3") ||
    model.startsWith("o4");

  if (!apiKey) {
    return null;
  }

  const trimmedHistory = conversationHistory.slice(-10);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      ...(supportsReasoning ? { reasoning: { effort: "low" } } : {}),
      input: [
        {
          role: "developer",
          content: buildDeveloperPrompt(context, todaySuggestion, weeklyPlan),
        },
        ...trimmedHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: input.message,
        },
      ],
      text: {
        format: {
          type: "text",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI respondeu com status ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;
  const reply = extractResponseText(payload);

  if (!reply) {
    throw new Error("A resposta da OpenAI veio sem texto utilizavel.");
  }

  return {
    reply,
    mode: "openai" as const,
    model,
  };
}

export async function generateAssistantReply(
  input: GenerateAssistantReplyInput,
): Promise<GenerateAssistantReplyResult> {
  const {
    context,
    initialMessages,
    todaySuggestion,
    weeklyPlan,
  } = await getAssistantPageData();
  const conversationHistory = initialMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  try {
    const aiReply = await generateOpenAiReply(
      context,
      todaySuggestion,
      weeklyPlan,
      conversationHistory,
      input,
    );
    if (aiReply) {
      return aiReply;
    }
  } catch {
    // Fall back to the local coach when the API is unavailable or not configured.
  }

  return {
    reply: generateFallbackReply(context, input.message, todaySuggestion, weeklyPlan),
    mode: "fallback",
    model: null,
  };
}
