import { NextResponse } from "next/server";

import {
  appendAssistantExchange,
  clearAssistantConversation,
} from "@/features/assistant/memory";
import { assistantRequestSchema } from "@/features/assistant/schemas";
import { generateAssistantReply } from "@/features/assistant/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = assistantRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  try {
    const result = await generateAssistantReply({
      userId: user.id,
      message: parsed.data.message,
    });
    await appendAssistantExchange({
      userId: user.id,
      userMessage: parsed.data.message,
      assistantMessage: result.reply,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar a resposta do assistente.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const cleared = await clearAssistantConversation(user.id);
    return NextResponse.json({ ok: true, cleared });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível limpar a memória do assistente.",
      },
      { status: 500 },
    );
  }
}
