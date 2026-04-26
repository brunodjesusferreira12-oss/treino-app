export const APP_NAME = "Fortynex";

export const DAY_OPTIONS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
] as const;

export const DAY_ORDER = DAY_OPTIONS.map((day) => day.value);

export const SPORT_OPTIONS = [
  {
    slug: "musculacao",
    name: "Musculação",
    shortDescription: "Força, hipertrofia e progresso por carga.",
    longDescription:
      "Sessão orientada para ganho de força, hipertrofia e organização de séries, cargas e repetições.",
    accent: "from-lime-300/20 via-lime-300/8 to-transparent",
    cardClass: "border-lime-300/20 bg-lime-300/8",
  },
  {
    slug: "pilates",
    name: "Pilates",
    shortDescription: "Controle corporal, postura e estabilidade.",
    longDescription:
      "Sessão focada em mobilidade, estabilidade, respiração e execução consciente dos movimentos.",
    accent: "from-sky-300/20 via-sky-300/8 to-transparent",
    cardClass: "border-sky-300/20 bg-sky-300/8",
  },
  {
    slug: "crossfit",
    name: "CrossFit",
    shortDescription: "Intensidade, rounds e condicionamento.",
    longDescription:
      "Sessão com rounds, potência, condicionamento e estrutura visual de treino mais agressiva.",
    accent: "from-orange-300/20 via-orange-300/8 to-transparent",
    cardClass: "border-orange-300/20 bg-orange-300/8",
  },
] as const;

export const SPORT_SLUGS = SPORT_OPTIONS.map((sport) => sport.slug);

export const CATEGORY_OPTIONS = [
  "forca",
  "hipertrofia",
  "core",
  "mobilidade",
  "estabilidade",
  "condicionamento",
  "metcon",
  "tecnica",
  "recuperacao",
  "pilates solo",
  "pilates equipamentos",
] as const;

export const MUSCLE_GROUP_OPTIONS = [
  "corpo inteiro",
  "peito",
  "costas",
  "ombros",
  "triceps",
  "biceps",
  "quadriceps",
  "posterior",
  "gluteos",
  "panturrilha",
  "core",
  "mobilidade",
  "estabilidade",
  "respiracao",
  "condicionamento",
  "levantamento olimpico",
  "ginastica",
  "cardio",
  "pilates",
  "crossfit",
] as const;

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  app: "/app",
  assistant: "/app/assistant",
  profile: "/app/profile",
  selectSport: "/app/select-sport",
  workouts: "/app/workouts",
  history: "/app/history",
  progress: "/app/progress",
  ranking: "/app/ranking",
  battles: "/app/battles",
} as const;

export const BATTLE_STATUS_OPTIONS = [
  "pending",
  "active",
  "ended",
] as const;

export const BATTLE_TYPE_OPTIONS = [
  "head_to_head",
  "consistency",
  "volume",
] as const;

export const BATTLE_SCORING_MODES = [
  "points",
  "workouts",
  "exercises",
  "sport_points",
] as const;
