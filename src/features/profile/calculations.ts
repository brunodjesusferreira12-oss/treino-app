import { formatDateOnly } from "@/lib/format";
import type {
  BodyMeasurementRow,
  BodyMetricsSummary,
} from "@/features/profile/types";

function normalizeDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(1));
}

function calculateBmi(weightKg: number | null, heightCm: number | null) {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return null;
  }

  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

function getBmiLabel(bmi: number | null) {
  if (bmi === null) {
    return null;
  }

  if (bmi < 18.5) return "Faixa baixa";
  if (bmi < 25) return "Faixa equilibrada";
  if (bmi < 30) return "Acima da faixa";
  return "Faixa elevada";
}

function getPastMeasurement(
  measurements: BodyMeasurementRow[],
  latest: BodyMeasurementRow,
  daysBack: number,
) {
  const threshold = new Date(latest.recorded_on);
  threshold.setDate(threshold.getDate() - daysBack);

  return measurements.find(
    (item) => new Date(item.recorded_on).getTime() <= threshold.getTime(),
  );
}

export function buildBodyMetricsSummary(input: {
  profile: {
    height_cm: number | null;
    target_weight_kg: number | null;
  };
  measurements: BodyMeasurementRow[];
}): BodyMetricsSummary {
  const measurements = [...input.measurements].sort(
    (a, b) => new Date(b.recorded_on).getTime() - new Date(a.recorded_on).getTime(),
  );
  const latest = measurements[0] ?? null;
  const latestWeight = latest?.weight_kg ?? null;
  const bmi = calculateBmi(latestWeight, input.profile.height_cm);
  const measurement7d = latest ? getPastMeasurement(measurements, latest, 7) : null;
  const measurement30d = latest ? getPastMeasurement(measurements, latest, 30) : null;
  const recentCheckinCount = measurements.filter((item) => {
    const diffMs = Date.now() - new Date(item.recorded_on).getTime();
    return diffMs <= 14 * 24 * 60 * 60 * 1000;
  }).length;

  return {
    latestWeightKg: latestWeight,
    heightCm: input.profile.height_cm ?? null,
    targetWeightKg: input.profile.target_weight_kg ?? null,
    bmi,
    bmiLabel: getBmiLabel(bmi),
    targetDeltaKg:
      latestWeight !== null && input.profile.target_weight_kg !== null
        ? normalizeDecimal(latestWeight - input.profile.target_weight_kg)
        : null,
    weightDelta7d:
      latestWeight !== null && measurement7d
        ? normalizeDecimal(latestWeight - measurement7d.weight_kg)
        : null,
    weightDelta30d:
      latestWeight !== null && measurement30d
        ? normalizeDecimal(latestWeight - measurement30d.weight_kg)
        : null,
    measurementCount: measurements.length,
    recentCheckinCount,
    lastRecordedOn: latest ? formatDateOnly(latest.recorded_on) : null,
  };
}

export function buildBodyChartData(measurements: BodyMeasurementRow[]) {
  return [...measurements]
    .sort((a, b) => new Date(a.recorded_on).getTime() - new Date(b.recorded_on).getTime())
    .map((item) => ({
      date: formatDateOnly(item.recorded_on),
      weight: item.weight_kg,
    }));
}
