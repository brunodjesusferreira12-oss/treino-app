import { createClient } from "@/lib/supabase/server";
import type { AssistantStoredMessage } from "@/features/assistant/types";

const MEMORY_LIMIT = 24;
const MEMORY_TRIM_TO = 40;

function isMissingMemoryTable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = Reflect.get(error, "code");
  const message = Reflect.get(error, "message");

  return (
    code === "42P01" ||
    (typeof message === "string" &&
      (message.includes("assistant_conversations") ||
        message.includes("assistant_messages")))
  );
}

async function getOrCreateAssistantConversation(userId: string) {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("assistant_conversations")
    .select("id, user_id, title, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    if (isMissingMemoryTable(existingError)) {
      return null;
    }

    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: createdError } = await supabase
    .from("assistant_conversations")
    .insert({
      user_id: userId,
      title: "Coach principal",
    })
    .select("id, user_id, title, created_at, updated_at")
    .single();

  if (createdError) {
    if (isMissingMemoryTable(createdError)) {
      return null;
    }

    throw new Error(createdError.message);
  }

  return created;
}

export async function getAssistantConversationMemory(userId: string) {
  const conversation = await getOrCreateAssistantConversation(userId);

  if (!conversation) {
    return {
      conversationId: null,
      memoryEnabled: false,
      messages: [] as AssistantStoredMessage[],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(MEMORY_LIMIT);

  if (error) {
    if (isMissingMemoryTable(error)) {
      return {
        conversationId: null,
        memoryEnabled: false,
        messages: [] as AssistantStoredMessage[],
      };
    }

    throw new Error(error.message);
  }

  return {
    conversationId: conversation.id,
    memoryEnabled: true,
    messages: (data ?? []).map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      createdAt: message.created_at,
    })),
  };
}

export async function appendAssistantExchange(input: {
  userId: string;
  userMessage: string;
  assistantMessage: string;
}) {
  const conversation = await getOrCreateAssistantConversation(input.userId);

  if (!conversation) {
    return false;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assistant_messages").insert([
    {
      conversation_id: conversation.id,
      user_id: input.userId,
      role: "user",
      content: input.userMessage,
    },
    {
      conversation_id: conversation.id,
      user_id: input.userId,
      role: "assistant",
      content: input.assistantMessage,
    },
  ]);

  if (error) {
    if (isMissingMemoryTable(error)) {
      return false;
    }

    throw new Error(error.message);
  }

  await supabase
    .from("assistant_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation.id);

  const { data: allMessages, error: trimError } = await supabase
    .from("assistant_messages")
    .select("id")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false });

  if (trimError) {
    if (isMissingMemoryTable(trimError)) {
      return true;
    }

    throw new Error(trimError.message);
  }

  const staleMessageIds = (allMessages ?? [])
    .slice(MEMORY_TRIM_TO)
    .map((message) => message.id);

  if (staleMessageIds.length > 0) {
    await supabase.from("assistant_messages").delete().in("id", staleMessageIds);
  }

  return true;
}

export async function clearAssistantConversation(userId: string) {
  const conversation = await getOrCreateAssistantConversation(userId);

  if (!conversation) {
    return false;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assistant_messages")
    .delete()
    .eq("conversation_id", conversation.id)
    .eq("user_id", userId);

  if (error) {
    if (isMissingMemoryTable(error)) {
      return false;
    }

    throw new Error(error.message);
  }

  await supabase
    .from("assistant_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation.id);

  return true;
}
