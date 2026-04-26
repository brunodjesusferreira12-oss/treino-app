export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantStoredMessage = AssistantMessage & {
  id: string;
  createdAt: string;
};

export type CoachTodaySuggestion = {
  headline: string;
  workoutId: string | null;
  workoutName: string;
  dayLabel: string;
  intensity: string;
  summary: string;
  reason: string;
  highlights: string[];
  actionHref: string;
  actionLabel: string;
  coachPrompt: string;
};

export type CoachWeeklyPlanItem = {
  day: string;
  label: string;
  isToday: boolean;
  workoutNames: string[];
  focus: string;
  intensity: string;
  recommendation: string;
  targetPoints: number;
};

export type BattleTacticsInsight = {
  status: "leading" | "trailing" | "tied" | "pending" | "ended";
  scoreUnit: string;
  summary: string;
  urgency: string;
  delta: number;
  myScore: number;
  opponentScore: number;
  leaderName: string;
  opponentName: string;
  timeLabel: string;
  nextGoal: string;
  actions: string[];
};

export type AssistantContext = {
  profileName: string | null;
  activeSportName: string | null;
  activeSportSlug: string | null;
  points: {
    totalPoints: number;
    level: number;
    currentStreak: number;
    badgeCount: number;
  };
  stats: {
    totalWorkouts: number;
    plannedSessionsPerWeek: number;
    averageExercisesPerWorkout: number;
    completionRate: number;
  };
  todayWorkouts: Array<{
    name: string;
    category: string;
    scheduledDay: string;
    exercises: number;
  }>;
  recentWorkouts: Array<{
    name: string;
    category: string;
    scheduledDays: string;
    exercises: number;
  }>;
  recentExecutions: Array<{
    workoutName: string;
    executedAt: string;
    completedExercises: number;
    notes: string | null;
  }>;
  recentBattles: Array<{
    title: string;
    status: string;
    sportName: string;
    leaderScore: number;
  }>;
};

export type AssistantPageData = {
  context: AssistantContext;
  initialMessages: AssistantStoredMessage[];
  starterPrompts: string[];
  isAiEnabled: boolean;
  configuredModel: string | null;
  memoryEnabled: boolean;
  todaySuggestion: CoachTodaySuggestion | null;
  weeklyPlan: CoachWeeklyPlanItem[];
};
