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

export const CATEGORY_OPTIONS = [
  "fortalecimento para corrida",
  "musculação",
  "core",
  "pliometria",
  "mobilidade",
  "estabilidade",
  "superiores",
  "inferiores",
] as const;

export const MUSCLE_GROUP_OPTIONS = [
  "quadríceps",
  "posterior",
  "glúteos",
  "panturrilha",
  "tibial",
  "core",
  "peito",
  "costas",
  "ombros",
  "tríceps",
  "bíceps",
  "mobilidade",
  "estabilidade",
] as const;

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  app: "/app",
  workouts: "/app/workouts",
  history: "/app/history",
  progress: "/app/progress",
} as const;
