import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Exercise,
  WorkoutTemplate,
  WorkoutSession,
  NutritionEntry,
  NutritionLogItem,
  FoodLibraryItem,
  BodyMetricEntry,
  ExerciseAbility,
  CarbCyclePlan,
  UserProfile,
  AIConfig,
  AIMessage,
  AppState,
} from './types';
import { generateExercisesWithIds, PRESET_TEMPLATES, getExerciseIdByName } from './preset-exercises';

// 存储键名
const STORAGE_KEYS = {
  USER_PROFILE: '@health_app:user_profile',
  EXERCISES: '@health_app:exercises',
  WORKOUT_TEMPLATES: '@health_app:workout_templates',
  WORKOUT_SESSIONS: '@health_app:workout_sessions',
  NUTRITION_ENTRIES: '@health_app:nutrition_entries',
  CUSTOM_FOODS: '@health_app:custom_foods',
  BODY_METRICS: '@health_app:body_metrics',
  EXERCISE_ABILITIES: '@health_app:exercise_abilities',
  CARB_CYCLE_PLANS: '@health_app:carb_cycle_plans',
  AI_CONFIG: '@health_app:ai_config',
  AI_MESSAGES: '@health_app:ai_messages',
  CURRENT_SESSION: '@health_app:current_session',
};

// 默认用户配置
export const DEFAULT_USER_PROFILE: UserProfile = {
  weightUnit: 'kg',
  restTimerMode: 'countUp',
  defaultRestSeconds: 90,
  includeWarmupInStats: false,
  activityLevel: 'moderate',
  nutritionGoal: 'maintenance',
  favoriteFoodIds: [],
  sleepHours: 7,
};

// 默认AI配置
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  isConfigured: false,
};

// 通用存储方法
async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    throw error;
  }
}

async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
}

// 用户配置
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setItem(STORAGE_KEYS.USER_PROFILE, profile);
}

export async function loadUserProfile(): Promise<UserProfile> {
  const stored = await getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE, DEFAULT_USER_PROFILE);
  return {
    ...DEFAULT_USER_PROFILE,
    ...stored,
    favoriteFoodIds: stored.favoriteFoodIds ?? DEFAULT_USER_PROFILE.favoriteFoodIds,
  };
}

// 动作库
export async function saveExercises(exercises: Exercise[]): Promise<void> {
  await setItem(STORAGE_KEYS.EXERCISES, exercises);
}

export async function loadExercises(): Promise<Exercise[]> {
  const stored = await getItem<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  // 如果没有存储的动作，返回预设动作
  if (stored.length === 0) {
    const presetExercises = generateExercisesWithIds();
    await saveExercises(presetExercises);
    return presetExercises;
  }
  return stored;
}

// 训练模板
export async function saveWorkoutTemplates(templates: WorkoutTemplate[]): Promise<void> {
  await setItem(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
}

function normalizeTemplateDays(rawDays: any[], exercises: Exercise[]) {
  const hasZeroBased = rawDays.some((day) => Number(day.dayIndex) === 0);
  return rawDays.map((day, index) => {
    const rawIndex = Number(day.dayIndex ?? index + 1);
    const dayIndex = hasZeroBased ? index + 1 : rawIndex <= 0 ? index + 1 : rawIndex;
    const name = day.name || `Day ${dayIndex}`;

    let exercisesList = [];
    if (Array.isArray(day.exercises)) {
      exercisesList = day.exercises.map((ex: any, exIndex: number) => ({
        id: ex.id ?? generateId(),
        exerciseId: ex.exerciseId ?? ex.id,
        order: Number(ex.order ?? exIndex + 1),
        sets: Number(ex.sets ?? 3),
        reps: Number(ex.reps ?? 10),
        weight: ex.weight !== undefined ? Number(ex.weight) : undefined,
        restSeconds: ex.restSeconds !== undefined ? Number(ex.restSeconds) : undefined,
        notes: ex.notes,
      }));
    } else if (Array.isArray(day.exerciseIds)) {
      exercisesList = day.exerciseIds.map((id: string, exIndex: number) => ({
        id: generateId(),
        exerciseId: id,
        order: exIndex + 1,
        sets: 3,
        reps: 10,
      }));
    } else if (Array.isArray(day.exerciseNames)) {
      exercisesList = day.exerciseNames
        .map((name: string, exIndex: number) => {
          const exerciseId = getExerciseIdByName(exercises, name);
          if (!exerciseId) return null;
          return {
            id: generateId(),
            exerciseId,
            order: exIndex + 1,
            sets: 3,
            reps: 10,
          };
        })
        .filter(Boolean);
    }

    const muscleGroups =
      Array.isArray(day.muscleGroups) && day.muscleGroups.length > 0
        ? day.muscleGroups
        : Array.from(
            new Set(
              exercisesList
                .map((ex: any) => exercises.find((e) => e.id === ex.exerciseId)?.muscleGroup)
                .filter(Boolean)
            )
          );

    return {
      dayIndex,
      name,
      muscleGroups,
      exercises: exercisesList.sort((a: any, b: any) => a.order - b.order),
    };
  });
}

function normalizeWorkoutTemplate(template: any, exercises: Exercise[]): WorkoutTemplate {
  const days = normalizeTemplateDays(Array.isArray(template.days) ? template.days : [], exercises);
  const trainingDaysPerWeek =
    Number(template.schedule?.trainingDaysPerWeek ?? template.trainingDaysPerWeek ?? days.length) ||
    days.length;
  const restDaysBetweenCycles = Number(
    template.schedule?.restDaysBetweenCycles ?? template.restDaysBetweenCycles ?? 0
  );
  const schedule = {
    trainingDaysPerWeek,
    restDaysBetweenCycles: restDaysBetweenCycles < 0 ? 0 : restDaysBetweenCycles,
    startDate: template.schedule?.startDate ?? template.startDate,
  };

  return {
    id: template.id ?? generateId(),
    name: template.name ?? '未命名模板',
    description: template.description,
    days,
    schedule,
    isPreset: template.isPreset,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export async function loadWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const stored = await getItem<any[]>(STORAGE_KEYS.WORKOUT_TEMPLATES, []);
  // 如果没有存储的模板，生成预设模板
  if (stored.length === 0) {
    const exercises = await loadExercises();
    const presetTemplates: WorkoutTemplate[] = PRESET_TEMPLATES.map((template, index) =>
      normalizeWorkoutTemplate(
        {
          ...template,
          id: `preset_template_${index + 1}`,
          schedule: {
            trainingDaysPerWeek: template.days.length,
            restDaysBetweenCycles: 0,
          },
        },
        exercises
      )
    );
    await saveWorkoutTemplates(presetTemplates);
    return presetTemplates;
  }

  const exercises = await loadExercises();
  const normalized = stored.map((template) => normalizeWorkoutTemplate(template, exercises));
  if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
    await saveWorkoutTemplates(normalized);
  }
  return normalized;
}

// 训练会话
export async function saveWorkoutSessions(sessions: WorkoutSession[]): Promise<void> {
  await setItem(STORAGE_KEYS.WORKOUT_SESSIONS, sessions);
}

export async function loadWorkoutSessions(): Promise<WorkoutSession[]> {
  return getItem(STORAGE_KEYS.WORKOUT_SESSIONS, []);
}

// 营养记录
export async function saveNutritionEntries(entries: NutritionEntry[]): Promise<void> {
  await setItem(STORAGE_KEYS.NUTRITION_ENTRIES, entries);
}

export async function loadNutritionEntries(): Promise<NutritionEntry[]> {
  const stored = await getItem<any[]>(STORAGE_KEYS.NUTRITION_ENTRIES, []);
  if (stored.length === 0) return [];
  if (Array.isArray(stored[0]?.items)) {
    return stored as NutritionEntry[];
  }

  const grouped: Record<string, NutritionEntry> = {};
  stored.forEach((entry) => {
    const date = entry.date || getTodayString();
    if (!grouped[date]) {
      grouped[date] = {
        id: generateId(),
        date,
        items: [],
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFats: 0,
      };
    }

    const item: NutritionLogItem = {
      id: entry.id ?? generateId(),
      name: entry.foodName ?? '食物',
      quantity: entry.quantity ?? 100,
      unit: entry.unit ?? 'g',
      calories: Number(entry.calories ?? 0),
      carbs: Number(entry.carbs ?? 0),
      protein: Number(entry.protein ?? 0),
      fats: Number(entry.fats ?? 0),
      source: 'quick',
      loggedAt: entry.loggedAt ?? new Date().toISOString(),
    };

    grouped[date].items.push(item);
    grouped[date].totalCalories += item.calories;
    grouped[date].totalCarbs += item.carbs;
    grouped[date].totalProtein += item.protein;
    grouped[date].totalFats += item.fats;
  });

  const normalized = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  await saveNutritionEntries(normalized);
  return normalized;
}

// 自定义食物库
export async function saveCustomFoods(foods: FoodLibraryItem[]): Promise<void> {
  await setItem(STORAGE_KEYS.CUSTOM_FOODS, foods);
}

export async function loadCustomFoods(): Promise<FoodLibraryItem[]> {
  return getItem(STORAGE_KEYS.CUSTOM_FOODS, []);
}

// 体测记录
export async function saveBodyMetrics(metrics: BodyMetricEntry[]): Promise<void> {
  await setItem(STORAGE_KEYS.BODY_METRICS, metrics);
}

export async function loadBodyMetrics(): Promise<BodyMetricEntry[]> {
  return getItem(STORAGE_KEYS.BODY_METRICS, []);
}

// 动作能力
export async function saveExerciseAbilities(abilities: ExerciseAbility[]): Promise<void> {
  await setItem(STORAGE_KEYS.EXERCISE_ABILITIES, abilities);
}

export async function loadExerciseAbilities(): Promise<ExerciseAbility[]> {
  return getItem(STORAGE_KEYS.EXERCISE_ABILITIES, []);
}

// 碳循环计划
export async function saveCarbCyclePlans(plans: CarbCyclePlan[]): Promise<void> {
  await setItem(STORAGE_KEYS.CARB_CYCLE_PLANS, plans);
}

export async function loadCarbCyclePlans(): Promise<CarbCyclePlan[]> {
  return getItem(STORAGE_KEYS.CARB_CYCLE_PLANS, []);
}

// AI配置
export async function saveAIConfig(config: AIConfig): Promise<void> {
  await setItem(STORAGE_KEYS.AI_CONFIG, config);
}

export async function loadAIConfig(): Promise<AIConfig> {
  return getItem(STORAGE_KEYS.AI_CONFIG, DEFAULT_AI_CONFIG);
}

// AI消息
export async function saveAIMessages(messages: AIMessage[]): Promise<void> {
  await setItem(STORAGE_KEYS.AI_MESSAGES, messages);
}

export async function loadAIMessages(): Promise<AIMessage[]> {
  return getItem(STORAGE_KEYS.AI_MESSAGES, []);
}

// 当前训练会话
export async function saveCurrentSession(session: WorkoutSession | null): Promise<void> {
  if (session) {
    await setItem(STORAGE_KEYS.CURRENT_SESSION, session);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
}

export async function loadCurrentSession(): Promise<WorkoutSession | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

// 导出所有数据
export async function exportAllData(): Promise<AppState> {
  const [
    userProfile,
    exercises,
    workoutTemplates,
    workoutSessions,
    nutritionEntries,
    customFoods,
    bodyMetrics,
    exerciseAbilities,
    carbCyclePlans,
    aiConfig,
    aiMessages,
    currentSession,
  ] = await Promise.all([
    loadUserProfile(),
    loadExercises(),
    loadWorkoutTemplates(),
    loadWorkoutSessions(),
    loadNutritionEntries(),
    loadCustomFoods(),
    loadBodyMetrics(),
    loadExerciseAbilities(),
    loadCarbCyclePlans(),
    loadAIConfig(),
    loadAIMessages(),
    loadCurrentSession(),
  ]);

  return {
    userProfile,
    exercises,
    workoutTemplates,
    workoutSessions,
    nutritionEntries,
    customFoods,
    bodyMetrics,
    exerciseAbilities,
    carbCyclePlans,
    aiConfig,
    aiMessages,
    currentSession: currentSession ?? undefined,
  };
}

// 导入所有数据
export async function importAllData(data: Partial<AppState>): Promise<void> {
  const promises: Promise<void>[] = [];

  if (data.userProfile) {
    promises.push(saveUserProfile(data.userProfile));
  }
  if (data.exercises) {
    promises.push(saveExercises(data.exercises));
  }
  if (data.workoutTemplates) {
    promises.push(saveWorkoutTemplates(data.workoutTemplates));
  }
  if (data.workoutSessions) {
    promises.push(saveWorkoutSessions(data.workoutSessions));
  }
  if (data.nutritionEntries) {
    promises.push(saveNutritionEntries(data.nutritionEntries));
  }
  if (data.customFoods) {
    promises.push(saveCustomFoods(data.customFoods));
  }
  if (data.bodyMetrics) {
    promises.push(saveBodyMetrics(data.bodyMetrics));
  }
  if (data.exerciseAbilities) {
    promises.push(saveExerciseAbilities(data.exerciseAbilities));
  }
  if (data.carbCyclePlans) {
    promises.push(saveCarbCyclePlans(data.carbCyclePlans));
  }
  if (data.aiConfig) {
    promises.push(saveAIConfig(data.aiConfig));
  }
  if (data.aiMessages) {
    promises.push(saveAIMessages(data.aiMessages));
  }

  await Promise.all(promises);
}

// 清除所有数据
export async function clearAllData(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  await AsyncStorage.multiRemove(keys);
}

// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// 获取今天的日期字符串 (YYYY-MM-DD)
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// 获取当前时间字符串 (HH:mm:ss)
export function getCurrentTimeString(): string {
  return new Date().toTimeString().split(' ')[0];
}
