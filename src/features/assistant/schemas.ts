import { z } from "zod";

export const assistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(4000, "A mensagem está muito longa."),
});

export const assistantRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "Digite pelo menos dois caracteres.")
    .max(1500, "A pergunta está muito longa."),
  history: z.array(assistantMessageSchema).max(12).default([]),
});

export type AssistantRequestValues = z.infer<typeof assistantRequestSchema>;
