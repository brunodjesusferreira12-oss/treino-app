import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(120)
    .refine(
      (value) => value.length === 0 || value.length >= 2,
      "Informe pelo menos dois caracteres ou deixe em branco.",
    ),
  heightCm: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined || Number.isNaN(value)
        ? null
        : Number(value),
    z
      .number()
      .min(80, "Informe uma altura valida em centimetros.")
      .max(260, "Informe uma altura valida em centimetros.")
      .nullable(),
  ),
  targetWeightKg: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined || Number.isNaN(value)
        ? null
        : Number(value),
    z
      .number()
      .min(20, "Informe um peso alvo valido em kg.")
      .max(400, "Informe um peso alvo valido em kg.")
      .nullable(),
  ),
});

export const bodyMeasurementSchema = z.object({
  recordedOn: z.string().min(1, "Informe a data do registro."),
  weightKg: z.preprocess(
    (value) => Number(value),
    z
      .number()
      .min(20, "Peso muito baixo para um registro valido.")
      .max(400, "Peso muito alto para um registro valido."),
  ),
  notes: z.string().trim().max(500, "Use no maximo 500 caracteres.").optional(),
});

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;
export type BodyMeasurementValues = z.infer<typeof bodyMeasurementSchema>;
