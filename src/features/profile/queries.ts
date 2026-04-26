import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildBodyChartData,
  buildBodyMetricsSummary,
} from "@/features/profile/calculations";
import type {
  BodyMeasurementRow,
  ProfilePageData,
  ProfileRow,
} from "@/features/profile/types";

export async function getProfilePageData(): Promise<ProfilePageData> {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: measurements, error: measurementsError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_on", { ascending: false })
        .limit(120),
    ]);

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Perfil não encontrado.");
  }

  if (measurementsError) {
    throw new Error(measurementsError.message);
  }

  const typedProfile = profile as ProfileRow;
  const typedMeasurements = (measurements ?? []) as BodyMeasurementRow[];

  return {
    profile: typedProfile,
    measurements: typedMeasurements,
    summary: buildBodyMetricsSummary({
      profile: typedProfile,
      measurements: typedMeasurements,
    }),
    chartData: buildBodyChartData(typedMeasurements),
  };
}
