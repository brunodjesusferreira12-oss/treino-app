import { Activity, ArrowDown, ArrowUp, Ruler, Scale, Target } from "lucide-react";

import { BodyWeightChart } from "@/components/charts/body-weight-chart";
import { BodyMeasurementForm } from "@/components/profile/body-measurement-form";
import { BodyMeasurementHistory } from "@/components/profile/body-measurement-history";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatHeight,
  formatSignedWeightDelta,
  formatWeight,
} from "@/lib/format";
import { getProfilePageData } from "@/features/profile/queries";

function DeltaChip({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  const isPositive = (value ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            isPositive
              ? "bg-orange-300/15 text-orange-200"
              : "bg-sky-300/15 text-sky-200"
          }`}
        >
          {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </span>
        <p className="text-sm font-semibold text-zinc-100">
          {formatSignedWeightDelta(value)}
        </p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const data = await getProfilePageData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perfil"
        title="Perfil físico e evolução corporal"
        description="Registre peso e altura, acompanhe variações ao longo do tempo e mantenha seu histórico corporal sempre atualizado."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Peso atual</p>
            <Scale className="h-4 w-4 text-lime-300" />
          </div>
          <p className="text-3xl font-semibold text-zinc-50">
            {formatWeight(data.summary.latestWeightKg)}
          </p>
          <p className="text-sm text-zinc-500">
            {data.summary.lastRecordedOn
              ? `Atualizado em ${data.summary.lastRecordedOn}`
              : "Sem registro diário ainda"}
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Altura</p>
            <Ruler className="h-4 w-4 text-sky-300" />
          </div>
          <p className="text-3xl font-semibold text-zinc-50">
            {formatHeight(data.summary.heightCm)}
          </p>
          <p className="text-sm text-zinc-500">
            Base para cálculos de referência corporal.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">IMC de referencia</p>
            <Activity className="h-4 w-4 text-orange-300" />
          </div>
          <p className="text-3xl font-semibold text-zinc-50">
            {data.summary.bmi?.toLocaleString("pt-BR") ?? "--"}
          </p>
          <p className="text-sm text-zinc-500">
            {data.summary.bmiLabel
              ? `${data.summary.bmiLabel}. Use apenas como referência simples.`
              : "Informe altura e registre peso para calcular."}
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Distancia ate a meta</p>
            <Target className="h-4 w-4 text-lime-300" />
          </div>
          <p className="text-3xl font-semibold text-zinc-50">
            {formatSignedWeightDelta(data.summary.targetDeltaKg)}
          </p>
          <p className="text-sm text-zinc-500">
            {data.summary.targetWeightKg
              ? `Meta configurada em ${formatWeight(data.summary.targetWeightKg)}.`
              : "Defina um peso-alvo se quiser acompanhar a diferença."}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Evolução do peso</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Linha do tempo corporal
            </h2>
          </div>

          {data.chartData.length > 0 ? (
            <BodyWeightChart data={data.chartData} />
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-10 text-sm text-zinc-500">
              O gráfico aparece automaticamente quando você salvar seus registros
              diários.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <DeltaChip value={data.summary.weightDelta7d} label="Variação em 7 dias" />
            <DeltaChip value={data.summary.weightDelta30d} label="Variação em 30 dias" />
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-zinc-500">Check-ins recentes</p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">
                {data.summary.recentCheckinCount} registro(s) nos últimos 14 dias
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Perfil base</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Dados para os cálculos
            </h2>
          </div>
          <ProfileSettingsForm
            defaultValues={{
              fullName: data.profile.full_name ?? "",
              heightCm: data.profile.height_cm,
              targetWeightKg: data.profile.target_weight_kg,
            }}
          />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Registro do dia</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
              Atualize sua evolução diária
            </h2>
          </div>
          <BodyMeasurementForm defaultWeightKg={data.summary.latestWeightKg} />
        </Card>

        <div className="space-y-4">
          <PageHeader
            title="Histórico recente"
            description={`Você já registrou ${data.summary.measurementCount} medida(s) corporal(is).`}
          />
          <BodyMeasurementHistory items={data.measurements.slice(0, 10)} />
        </div>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-sm text-zinc-500">Exportacao e backup</p>
          <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
            Baixe seus dados
          </h2>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            Gere um backup completo em JSON ou exporte CSVs prontos para planilha.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/api/export/backup?format=json&scope=all">
            <Button>Backup JSON completo</Button>
          </a>
          <a href="/api/export/backup?format=csv&scope=body">
            <Button variant="secondary">CSV de peso corporal</Button>
          </a>
          <a href="/api/export/backup?format=csv&scope=history">
            <Button variant="secondary">CSV do histórico de treinos</Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
