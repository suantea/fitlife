import type { AppState, WorkoutSession, NutritionEntry, WorkoutTemplate } from "../types";
import { getTodayString } from "../storage";
import { getPlanForDate } from "../training-plan";
import { getCarbCycleDay } from "../carb-cycle";

export interface AISnapshot {
  today: string;
  profile: AppState["userProfile"];
  training: {
    activeTemplate?: WorkoutTemplate;
    todayPlan?: ReturnType<typeof getPlanForDate>;
    recentSessions: WorkoutSession[];
  };
  nutrition: {
    todayEntry?: NutritionEntry;
    recentEntries: NutritionEntry[];
    carbCycleDay?: ReturnType<typeof getCarbCycleDay>;
  };
  metrics: {
    latestWeight?: number;
    latestBodyFat?: number;
    latestBmi?: number;
  };
}

export function buildAISnapshot(state: AppState): AISnapshot {
  const today = getTodayString();
  const activeTemplate = state.workoutTemplates.find(
    (template) => template.id === state.userProfile.activeWorkoutTemplateId
  );
  const todayPlan = activeTemplate ? getPlanForDate(activeTemplate, today) : undefined;
  const todayEntry = state.nutritionEntries.find((entry) => entry.date === today);
  const recentSessions = [...state.workoutSessions].slice(-7);
  const recentEntries = [...state.nutritionEntries].slice(-7);
  const activeCarbPlan = state.carbCyclePlans.find(
    (plan) => plan.id === state.userProfile.activeCarbCyclePlanId
  );
  const carbCycleDay = activeCarbPlan ? getCarbCycleDay(activeCarbPlan, today) : undefined;
  const latestMetric = [...state.bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))[0];

  return {
    today,
    profile: state.userProfile,
    training: {
      activeTemplate,
      todayPlan,
      recentSessions,
    },
    nutrition: {
      todayEntry,
      recentEntries,
      carbCycleDay,
    },
    metrics: {
      latestWeight: latestMetric?.weight,
      latestBodyFat: latestMetric?.bodyFat,
      latestBmi: latestMetric?.bmi,
    },
  };
}
