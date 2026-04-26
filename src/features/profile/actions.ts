"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { APP_ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  bodyMeasurementSchema,
  profileSettingsSchema,
  type BodyMeasurementValues,
  type ProfileSettingsValues,
} from "@/features/profile/schemas";

type ActionResult = {
  ok: boolean;
  error?: string;
};

export async function updateProfileSettingsAction(
  rawInput: ProfileSettingsValues,
): Promise<ActionResult> {
  const parsed = profileSettingsSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const input = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim() || null,
      height_cm: input.heightCm,
      target_weight_kg: input.targetWeightKg,
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath(APP_ROUTES.profile);
  revalidatePath(APP_ROUTES.app);

  return { ok: true };
}

export async function upsertBodyMeasurementAction(
  rawInput: BodyMeasurementValues,
): Promise<ActionResult> {
  const parsed = bodyMeasurementSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const input = parsed.data;

  const { error } = await supabase.from("body_measurements").upsert(
    {
      user_id: user.id,
      recorded_on: input.recordedOn,
      weight_kg: input.weightKg,
      notes: input.notes?.trim() || null,
    },
    {
      onConflict: "user_id,recorded_on",
    },
  );

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath(APP_ROUTES.profile);
  revalidatePath(APP_ROUTES.app);

  return { ok: true };
}
