// 核心数据类型定义

// 肌肉群分类
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core';

// 器械类型
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'other';

// 单位
export type WeightUnit = 'kg' | 'lb';

// 动作定义
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  description?: string;
  isCustom?: boolean;
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number;
}

// 训练组
export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setIndex: number;
  isWarmup: boolean;
  weight: number;
  reps: number;
  restSeconds?: number;
  completedAt?: string;
}

// 训练会话
export interface WorkoutSession {
  id: string;
  templateId?: string;
  templateName?: string;
  date: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  sets: WorkoutSet[];
  durationSeconds?: number;
  plan?: WorkoutSessionPlan;
}

// 模板动作配置
export interface TemplateExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  weight?: number;
  restSeconds?: number;
  notes?: string;
}

// 训练模板中的一天
export interface TemplateDay {
  dayIndex: number;
  name: string;
  muscleGroups: MuscleGroup[];
  exercises: TemplateExercise[];
}

export interface TemplateSchedule {
  trainingDaysPerWeek: number;
  restDaysBetweenCycles: number;
  startDate?: string;
}

export interface WorkoutSessionPlan {
  dayIndex?: number;
  dayName?: string;
  muscleGroups?: MuscleGroup[];
  exercises: TemplateExercise[];
}

// 训练模板
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  days: TemplateDay[];
  schedule: TemplateSchedule;
  isPreset?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type FoodCategory = 'protein' | 'carbs' | 'fats' | 'vegetables' | 'fruits' | 'other';

export interface FoodLibraryItem {
  id: string;
  name: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  isCustom?: boolean;
}

export type FoodLogSource = 'database' | 'custom' | 'quick';

export interface NutritionLogItem {
  id: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: 'g' | 'ml' | 'serving';
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  source: FoodLogSource;
  loggedAt: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  items: NutritionLogItem[];
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFats: number;
  notes?: string;
}

// 碳循环日类型
export type CarbDayType = 'high' | 'medium' | 'low';

// 碳循环模板中的一天
export interface CarbCycleDay {
  dayIndex: number;
  type: CarbDayType;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

// 碳循环模板
export interface CarbCyclePlan {
  id: string;
  name: string;
  cycleLength: number;
  days: CarbCycleDay[];
  startDate?: string;
}

// 体测记录
export interface BodyMetricEntry {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  bmi?: number;
}

// 用户资料
export interface UserProfile {
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weightUnit: WeightUnit;
  restTimerMode: 'countUp' | 'countDown';
  defaultRestSeconds: number;
  includeWarmupInStats: boolean;
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
  activeWorkoutTemplateId?: string;
  activeCarbCyclePlanId?: string;
  favoriteFoodIds: string[];
  sleepHours?: number;
}

// 动作能力记录
export interface ExerciseAbility {
  exerciseId: string;
  estimated1RM?: number;
  manual1RM?: number;
  maxWeight?: number;
  maxWeightReps?: number;
  lastUpdated: string;
}

// AI配置
export interface AIConfig {
  provider: 'dashscope' | 'kimi' | 'openai' | 'custom';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  isConfigured: boolean;
}

// AI消息
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// 训练目标
export type FitnessGoal = 'lose_fat' | 'maintain' | 'gain_muscle';

// 饮食目标
export type NutritionGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';

// 活动水平
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// 饮食推荐配置
export interface DietRecommendation {
  goal: FitnessGoal;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

// 食物推荐项
export interface FoodRecommendation {
  name: string;
  category: 'protein' | 'carbs' | 'fat' | 'vegetable';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// 应用状态
export interface AppState {
  userProfile: UserProfile;
  exercises: Exercise[];
  workoutTemplates: WorkoutTemplate[];
  workoutSessions: WorkoutSession[];
  nutritionEntries: NutritionEntry[];
  customFoods: FoodLibraryItem[];
  bodyMetrics: BodyMetricEntry[];
  exerciseAbilities: ExerciseAbility[];
  carbCyclePlans: CarbCyclePlan[];
  aiConfig: AIConfig;
  aiMessages: AIMessage[];
  currentSession?: WorkoutSession | null;
}

// 肌肉群中文名称映射
export const MUSCLE_GROUP_NAMES: Record<MuscleGroup, string> = {
  chest: '胸部',
  back: '背部',
  shoulders: '肩部',
  arms: '手臂',
  legs: '腿部',
  core: '核心',
};

// 器械中文名称映射
export const EQUIPMENT_NAMES: Record<Equipment, string> = {
  barbell: '杠铃',
  dumbbell: '哑铃',
  cable: '绳索',
  machine: '器械',
  bodyweight: '自重',
  kettlebell: '壶铃',
  bands: '弹力带',
  other: '其他',
};

// 碳日类型中文名称
export const CARB_DAY_NAMES: Record<CarbDayType, string> = {
  high: '高碳日',
  medium: '中碳日',
  low: '低碳日',
};

// 训练目标中文名称
export const FITNESS_GOAL_NAMES: Record<FitnessGoal, string> = {
  lose_fat: '减脂',
  maintain: '维持',
  gain_muscle: '增肌',
};

export const NUTRITION_GOAL_NAMES: Record<NutritionGoal, string> = {
  fat_loss: '减脂',
  maintenance: '维持',
  muscle_gain: '增肌',
};

// 活动水平中文名称
export const ACTIVITY_LEVEL_NAMES: Record<ActivityLevel, string> = {
  sedentary: '久坐（几乎不运动）',
  light: '轻度活动（每周1-3次）',
  moderate: '中度活动（每周3-5次）',
  active: '活跃（每周6-7次）',
  very_active: '非常活跃（每天高强度）',
};
