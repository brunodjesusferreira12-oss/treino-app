import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type BodyMeasurementRow =
  Database["public"]["Tables"]["body_measurements"]["Row"];

export type BodyMetricsSummary = {
  latestWeightKg: number | null;
  heightCm: number | null;
  targetWeightKg: number | null;
  bmi: number | null;
  bmiLabel: string | null;
  targetDeltaKg: number | null;
  weightDelta7d: number | null;
  weightDelta30d: number | null;
  measurementCount: number;
  recentCheckinCount: number;
  lastRecordedOn: string | null;
};

export type ProfilePageData = {
  profile: ProfileRow;
  measurements: BodyMeasurementRow[];
  summary: BodyMetricsSummary;
  chartData: Array<{
    date: string;
    weight: number;
  }>;
};
