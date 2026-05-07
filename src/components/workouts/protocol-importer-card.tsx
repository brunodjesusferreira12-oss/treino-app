"use client";

import { Sparkles, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import type { WorkoutProtocolImportResult } from "@/features/workouts/importer";
import { DAY_OPTIONS } from "@/lib/constants";

type ProtocolImporterCardProps = {
  value: string;
  onChange: (value: string) => void;
  onImport: () => void;
  summary: WorkoutProtocolImportResult | null;
  error: string | null;
  isBusy?: boolean;
};

const dayLabelMap = new Map<string, string>(
  DAY_OPTIONS.map((day) => [day.value, day.label]),
);

export function ProtocolImporterCard({
  value,
  onChange,
  onImport,
  summary,
  error,
  isBusy = false,
}: ProtocolImporterCardProps) {
  return (
    <Card className="space-y-5 border-lime-300/15 bg-lime-300/6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-lime-200">
          <Sparkles className="h-3.5 w-3.5" />
          Importador inteligente
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
            Cole o protocolo e deixe o app estruturar o treino
          </h2>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            O importador reconhece nome do treino, dia da semana, blocos, exercícios,
            séries, repetições, tempo, distância e links de vídeo. Depois disso, você
            pode revisar manualmente antes de salvar.
          </p>
        </div>
      </div>

      <FormField label="Protocolo bruto">
        <Textarea
          className="min-h-[220px] font-mono text-sm"
          placeholder={`SEGUNDA - PEITO + TRICEPS
PEITO
1. Supino com halteres - 4x8
2. Crucifixo - 3x12
TRICEPS
3. Triceps corda - 3x15
Video: https://youtube.com/...`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </FormField>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onImport} disabled={isBusy}>
          <Wand2 className="h-4 w-4" />
          {isBusy ? "Analisando..." : "Analisar e preencher"}
        </Button>
      </div>

      {error ? (
        <Card className="border-red-500/20 bg-red-500/8 text-sm text-red-200">
          {error}
        </Card>
      ) : null}

      {summary ? (
        <Card className="space-y-4 border-white/10 bg-black/20">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{summary.summary.exerciseCount} exercícios</Badge>
            <Badge>{summary.summary.sectionCount} blocos</Badge>
            <Badge>{summary.summary.videoCount} vídeos</Badge>
            {summary.suggestedCategory ? (
              <Badge>Categoria sugerida: {summary.suggestedCategory}</Badge>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Nome detectado
              </p>
              <p className="text-sm text-zinc-200">
                {summary.name ?? "Sem nome detectado automaticamente"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Dias detectados
              </p>
              <p className="text-sm text-zinc-200">
                {summary.scheduledDays.length > 0
                  ? summary.scheduledDays
                      .map((day) => dayLabelMap.get(day) ?? day)
                      .join(", ")
                  : "Nenhum dia detectado"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Blocos encontrados
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.summary.sectionTitles.map((title) => (
                <span
                  key={title}
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-zinc-300"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        </Card>
      ) : null}
    </Card>
  );
}
