import type { WorkoutFormValues } from "@/features/workouts/schemas";

const DAY_KEYWORDS = [
  { value: "monday", aliases: ["segunda", "seg"] },
  { value: "tuesday", aliases: ["terca", "terça", "ter"] },
  { value: "wednesday", aliases: ["quarta", "qua"] },
  { value: "thursday", aliases: ["quinta", "qui"] },
  { value: "friday", aliases: ["sexta", "sex"] },
  { value: "saturday", aliases: ["sabado", "sábado", "sab"] },
  { value: "sunday", aliases: ["domingo", "dom"] },
] as const;

const COMMON_SECTION_TITLES = new Set(
  [
    "ativacao",
    "aquecimento",
    "forca",
    "forca principal",
    "principal",
    "complementar",
    "acessorios",
    "acessorio",
    "core",
    "mobilidade",
    "estabilidade",
    "final",
    "finisher",
    "alongamento",
    "peito",
    "costas",
    "triceps",
    "biceps",
    "ombro",
    "ombros",
    "quadriceps",
    "posterior",
    "gluteos",
    "gluteo medio",
    "panturrilha",
    "tibial",
    "pliometria",
    "pilates",
  ].map(normalizeToken),
);

type ImportedExercise = WorkoutFormValues["sections"][number]["exercises"][number];
type ImportedSection = WorkoutFormValues["sections"][number];

export type WorkoutProtocolImportResult = {
  name: string | null;
  scheduledDays: WorkoutFormValues["scheduledDays"];
  suggestedCategory: WorkoutFormValues["category"] | null;
  objective: string | null;
  notes: string | null;
  sections: ImportedSection[];
  summary: {
    sectionCount: number;
    exerciseCount: number;
    videoCount: number;
    sectionTitles: string[];
  };
};

type ParsedExerciseParts = {
  sets: number | null;
  reps: string | null;
  duration: string | null;
  distance: string | null;
};

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanLine(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createEmptyExercise(name = ""): ImportedExercise {
  return {
    name,
    sets: null,
    reps: null,
    duration: null,
    distance: null,
    loadDefault: null,
    notes: null,
    videoUrl: null,
    muscleGroup: null,
    isPriority: false,
  };
}

function createSection(title: string): ImportedSection {
  return {
    title,
    exercises: [],
  };
}

function detectScheduledDays(line: string) {
  const normalized = normalizeToken(line);
  return DAY_KEYWORDS.filter(({ aliases }) =>
    aliases.some((alias) => normalized.includes(alias)),
  ).map(({ value }) => value) as WorkoutFormValues["scheduledDays"];
}

function splitNamedLine(line: string) {
  const match = line.match(/^(.*?)\s*(?:-|–|—|:)\s*(.+)$/u);
  if (!match) return null;

  return {
    before: match[1].trim(),
    after: match[2].trim(),
  };
}

function detectHeader(line: string) {
  const days = detectScheduledDays(line);
  const normalized = normalizeToken(line);

  if (days.length > 0) {
    const split = splitNamedLine(line);
    if (split) {
      return {
        name: split.after,
        scheduledDays: days,
      };
    }
  }

  if (normalized.startsWith("treino")) {
    const split = splitNamedLine(line);
    return {
      name: split?.after ?? line,
      scheduledDays: [] as WorkoutFormValues["scheduledDays"],
    };
  }

  return null;
}

function isVideoLine(line: string) {
  return /^v[ií]deo\s*:\s*https?:\/\/\S+/i.test(line);
}

function extractVideoUrl(line: string) {
  return line.match(/^v[ií]deo\s*:\s*(https?:\/\/\S+)/i)?.[1] ?? null;
}

function isObservationLine(line: string) {
  const normalized = normalizeToken(line);
  return (
    normalized.startsWith("obs:") ||
    normalized.startsWith("observacao:") ||
    normalized.startsWith("observacoes:")
  );
}

function extractObservation(line: string) {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return null;
  return line.slice(colonIndex + 1).trim() || null;
}

function looksLikePrescription(value: string) {
  return (
    /^(\d+)\s*[x×]\s*(.+)$/iu.test(value) ||
    /\b(amrap|emom|for time|rounds?|tabata)\b/i.test(value)
  );
}

function extractExerciseSegments(line: string) {
  const withoutIndex = line.replace(/^\d+[\.\)]\s*/, "").trim();
  const match = withoutIndex.match(
    /^(.*?)\s+(?:-|–|—)\s+((?:\d+\s*[x×]\s*.+)|(?:amrap.*)|(?:emom.*)|(?:for time.*)|(?:tabata.*)|(?:\d+\s*rounds?.*))$/iu,
  );

  if (!match) {
    return null;
  }

  return {
    name: match[1].trim(),
    prescription: match[2].trim(),
  };
}

function looksLikeSectionHeading(line: string) {
  const normalized = normalizeToken(line);

  if (!normalized || isVideoLine(line) || isObservationLine(line)) {
    return false;
  }

  if (COMMON_SECTION_TITLES.has(normalized)) {
    return true;
  }

  if (/^\d+[\.\)]\s*/.test(line) || extractExerciseSegments(line)) {
    return false;
  }

  const uppercaseOnly = line === line.toUpperCase();
  const shortTitle = line.split(" ").length <= 4 && line.length <= 40;
  return uppercaseOnly && shortTitle;
}

function looksLikeExerciseLine(line: string) {
  if (isVideoLine(line) || isObservationLine(line)) {
    return false;
  }

  if (/^\d+[\.\)]\s*/.test(line)) {
    return true;
  }

  const segments = extractExerciseSegments(line);
  return Boolean(segments && looksLikePrescription(segments.prescription));
}

function parsePrescription(value: string | null): ParsedExerciseParts {
  if (!value) {
    return {
      sets: null,
      reps: null,
      duration: null,
      distance: null,
    };
  }

  const match = value.match(/^(\d+)\s*[x×]\s*(.+)$/iu);

  if (!match) {
    return {
      sets: null,
      reps: value,
      duration: null,
      distance: null,
    };
  }

  const sets = Number(match[1]);
  const prescription = match[2].trim();
  const normalizedPrescription = normalizeToken(prescription);

  if (
    /\b(min|minuto|minutos)\b/.test(normalizedPrescription) ||
    /^\d+(?:[.,]\d+)?\s*s\b/i.test(prescription) ||
    /^\d+(?:[.,]\d+)?s$/i.test(prescription)
  ) {
    return {
      sets,
      reps: null,
      duration: prescription,
      distance: null,
    };
  }

  if (
    /\bmetros?\b/.test(normalizedPrescription) ||
    /^\d+(?:[.,]\d+)?m$/i.test(prescription)
  ) {
    return {
      sets,
      reps: null,
      duration: null,
      distance: prescription,
    };
  }

  return {
    sets,
    reps: prescription,
    duration: null,
    distance: null,
  };
}

function parseExerciseLine(line: string): ImportedExercise {
  const withoutIndex = line.replace(/^\d+[\.\)]\s*/, "").trim();
  const segments = extractExerciseSegments(line);

  if (segments) {
    const parsed = parsePrescription(segments.prescription);

    return {
      ...createEmptyExercise(segments.name),
      sets: parsed.sets,
      reps: parsed.reps,
      duration: parsed.duration,
      distance: parsed.distance,
    };
  }

  return createEmptyExercise(withoutIndex);
}

function inferCategoryFromText(text: string): WorkoutFormValues["category"] | null {
  const normalized = normalizeToken(text);

  if (/\bmetcon\b|\bamrap\b|\bemom\b|\bfor time\b/.test(normalized)) {
    return "metcon";
  }

  if (normalized.includes("mobilidade")) {
    return "mobilidade";
  }

  if (normalized.includes("estabilidade")) {
    return "estabilidade";
  }

  if (normalized.includes("condicionamento")) {
    return "condicionamento";
  }

  if (normalized.includes("pilates")) {
    return "pilates solo";
  }

  if (normalized.includes("recuperacao") || normalized.includes("alongamento")) {
    return "recuperacao";
  }

  if (normalized.includes("core")) {
    return "core";
  }

  if (normalized.includes("tecnica")) {
    return "tecnica";
  }

  if (normalized.includes("forca")) {
    return "forca";
  }

  return null;
}

function joinText(current: string | null, next: string) {
  return current ? `${current}\n${next}` : next;
}

export function parseWorkoutProtocol(protocol: string): WorkoutProtocolImportResult {
  const lines = protocol
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Cole um protocolo com pelo menos uma linha para importar.");
  }

  const sections: ImportedSection[] = [];
  let currentSection: ImportedSection | null = null;
  let lastExercise: ImportedExercise | null = null;
  let workoutName: string | null = null;
  let scheduledDays: WorkoutFormValues["scheduledDays"] = [];
  let objective: string | null = null;
  let generalNotes: string | null = null;
  let videoCount = 0;

  function ensureSection(title = "Principal") {
    if (!currentSection) {
      currentSection = createSection(title);
      sections.push(currentSection);
    }

    return currentSection;
  }

  for (const [index, line] of lines.entries()) {
    if (index === 0) {
      const header = detectHeader(line);
      if (header) {
        workoutName = header.name;
        scheduledDays = header.scheduledDays;
        continue;
      }
    }

    if (isVideoLine(line)) {
      const videoUrl = extractVideoUrl(line);
      if (videoUrl && lastExercise) {
        lastExercise.videoUrl = videoUrl;
        videoCount += 1;
      }
      continue;
    }

    if (isObservationLine(line)) {
      const observation = extractObservation(line);
      if (observation) {
        if (lastExercise) {
          lastExercise.notes = joinText(lastExercise.notes, observation);
        } else {
          generalNotes = joinText(generalNotes, observation);
        }
      }
      continue;
    }

    if (!workoutName && index === 0 && !looksLikeExerciseLine(line) && !looksLikeSectionHeading(line)) {
      workoutName = line;
      continue;
    }

    if (looksLikeSectionHeading(line)) {
      currentSection = createSection(line);
      sections.push(currentSection);
      lastExercise = null;
      continue;
    }

    if (looksLikeExerciseLine(line)) {
      const section = ensureSection();
      const exercise = parseExerciseLine(line);
      section.exercises.push(exercise);
      lastExercise = exercise;
      continue;
    }

    if (!currentSection && workoutName && !looksLikeExerciseLine(line)) {
      objective = joinText(objective, line);
      continue;
    }

    if (lastExercise) {
      lastExercise.notes = joinText(lastExercise.notes, line);
      continue;
    }

    const section = ensureSection();
    const exercise = createEmptyExercise(line);
    section.exercises.push(exercise);
    lastExercise = exercise;
  }

  const normalizedSections = sections
    .map((section) => ({
      ...section,
      title: section.title || "Principal",
      exercises: section.exercises.filter((exercise) => exercise.name.trim().length > 0),
    }))
    .filter((section) => section.exercises.length > 0);

  if (normalizedSections.length === 0) {
    throw new Error(
      "Não consegui reconhecer exercícios nesse protocolo. Tente colar linhas como 'Supino - 4x8' ou '1. Agachamento - 3x10'.",
    );
  }

  const exerciseCount = normalizedSections.reduce(
    (total, section) => total + section.exercises.length,
    0,
  );

  return {
    name: workoutName,
    scheduledDays,
    suggestedCategory: inferCategoryFromText(lines.join(" ")),
    objective,
    notes: generalNotes,
    sections: normalizedSections,
    summary: {
      sectionCount: normalizedSections.length,
      exerciseCount,
      videoCount,
      sectionTitles: normalizedSections.map((section) => section.title),
    },
  };
}
