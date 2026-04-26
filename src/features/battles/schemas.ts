import { z } from "zod";

import {
  BATTLE_SCORING_MODES,
  BATTLE_TYPE_OPTIONS,
  SPORT_SLUGS,
} from "@/lib/constants";

export const battleFormSchema = z
  .object({
    title: z.string().trim().min(3, "Informe um título para a batalha."),
    opponentId: z.string().uuid("Selecione um competidor válido."),
    sportSlug: z
      .enum(["all", ...(SPORT_SLUGS as unknown as [string, ...string[]])])
      .default("all"),
    battleType: z.enum(BATTLE_TYPE_OPTIONS as unknown as [string, ...string[]]),
    scoringMode: z.enum(BATTLE_SCORING_MODES as unknown as [string, ...string[]]),
    startsAt: z.string().min(1, "Informe a data de início."),
    endsAt: z.string().min(1, "Informe a data final."),
  })
  .refine((value) => new Date(value.endsAt) >= new Date(value.startsAt), {
    message: "A data final precisa ser posterior ao início.",
    path: ["endsAt"],
  });

export type BattleFormValues = z.infer<typeof battleFormSchema>;
