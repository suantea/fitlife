import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type {
  Exercise,
  WorkoutTemplate,
  WorkoutSession,
  WorkoutSet,
  NutritionEntry,
  NutritionLogItem,
  FoodLibraryItem,
  BodyMetricEntry,
  ExerciseAbility,
  CarbCyclePlan,
  UserProfile,
  AIConfig,
  AIMessage,
} from './types';
import {
  loadUserProfile,
  loadExercises,
  loadWorkoutTemplates,
  loadWorkoutSessions,
  loadNutritionEntries,
  loadCustomFoods,
  loadBodyMetrics,
  loadExerciseAbilities,
  loadCarbCyclePlans,
  loadAIConfig,
  loadAIMessages,
  loadCurrentSession,
  saveUserProfile,
  saveExercises,
  saveWorkoutTemplates,
  saveWorkoutSessions,
  saveNutritionEntries,
  saveCustomFoods,
  saveBodyMetrics,
  saveExerciseAbilities,
  saveCarbCyclePlans,
  saveAIConfig,
  saveAIMessages,
  saveCurrentSession,
  DEFAULT_USER_PROFILE,
  DEFAULT_AI_CONFIG,
  generateId,
  getTodayString,
  getCurrentTimeString,
} from './storage';

// 状态类型
interface AppState {
  isLoading: boolean;
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
  currentSession: WorkoutSession | null;
}

// Action类型
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_ALL_DATA'; payload: Omit<AppState, 'isLoading'> }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_EXERCISES'; payload: Exercise[] }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'UPDATE_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'SET_WORKOUT_TEMPLATES'; payload: WorkoutTemplate[] }
  | { type: 'ADD_WORKOUT_TEMPLATE'; payload: WorkoutTemplate }
  | { type: 'UPDATE_WORKOUT_TEMPLATE'; payload: WorkoutTemplate }
  | { type: 'DELETE_WORKOUT_TEMPLATE'; payload: string }
  | { type: 'ADD_WORKOUT_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_WORKOUT_SESSION'; payload: WorkoutSession }
  | { type: 'DELETE_WORKOUT_SESSION'; payload: string }
  | { type: 'ADD_NUTRITION_ENTRY'; payload: NutritionEntry }
  | { type: 'UPDATE_NUTRITION_ENTRY'; payload: NutritionEntry }
  | { type: 'DELETE_NUTRITION_ENTRY'; payload: string }
  | { type: 'SET_CUSTOM_FOODS'; payload: FoodLibraryItem[] }
  | { type: 'ADD_CUSTOM_FOOD'; payload: FoodLibraryItem }
  | { type: 'UPDATE_CUSTOM_FOOD'; payload: FoodLibraryItem }
  | { type: 'DELETE_CUSTOM_FOOD'; payload: string }
  | { type: 'ADD_BODY_METRIC'; payload: BodyMetricEntry }
  | { type: 'UPDATE_BODY_METRIC'; payload: BodyMetricEntry }
  | { type: 'DELETE_BODY_METRIC'; payload: string }
  | { type: 'UPDATE_EXERCISE_ABILITY'; payload: ExerciseAbility }
  | { type: 'SET_CARB_CYCLE_PLANS'; payload: CarbCyclePlan[] }
  | { type: 'ADD_CARB_CYCLE_PLAN'; payload: CarbCyclePlan }
  | { type: 'UPDATE_CARB_CYCLE_PLAN'; payload: CarbCyclePlan }
  | { type: 'DELETE_CARB_CYCLE_PLAN'; payload: string }
  | { type: 'UPDATE_AI_CONFIG'; payload: Partial<AIConfig> }
  | { type: 'ADD_AI_MESSAGE'; payload: AIMessage }
  | { type: 'CLEAR_AI_MESSAGES' }
  | {
      type: 'START_WORKOUT_SESSION';
      payload: { templateId?: string; templateName?: string; plan?: WorkoutSession['plan'] };
    }
  | { type: 'END_WORKOUT_SESSION' }
  | { type: 'ADD_SET_TO_SESSION'; payload: WorkoutSet }
  | { type: 'UPDATE_SET_IN_SESSION'; payload: WorkoutSet }
  | { type: 'DELETE_SET_FROM_SESSION'; payload: string };

// 初始状态
const initialState: AppState = {
  isLoading: true,
  userProfile: DEFAULT_USER_PROFILE,
  exercises: [],
  workoutTemplates: [],
  workoutSessions: [],
  nutritionEntries: [],
  customFoods: [],
  bodyMetrics: [],
  exerciseAbilities: [],
  carbCyclePlans: [],
  aiConfig: DEFAULT_AI_CONFIG,
  aiMessages: [],
  currentSession: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOAD_ALL_DATA':
      return { ...state, ...action.payload, isLoading: false };

    case 'UPDATE_USER_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };

    case 'SET_EXERCISES':
      return { ...state, exercises: action.payload };

    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };

    case 'UPDATE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };

    case 'DELETE_EXERCISE':
      return { ...state, exercises: state.exercises.filter((e) => e.id !== action.payload) };

    case 'SET_WORKOUT_TEMPLATES':
      return { ...state, workoutTemplates: action.payload };

    case 'ADD_WORKOUT_TEMPLATE':
      return { ...state, workoutTemplates: [...state.workoutTemplates, action.payload] };

    case 'UPDATE_WORKOUT_TEMPLATE':
      return {
        ...state,
        workoutTemplates: state.workoutTemplates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_WORKOUT_TEMPLATE':
      return {
        ...state,
        workoutTemplates: state.workoutTemplates.filter((t) => t.id !== action.payload),
      };

    case 'ADD_WORKOUT_SESSION':
      return { ...state, workoutSessions: [...state.workoutSessions, action.payload] };

    case 'UPDATE_WORKOUT_SESSION':
      return {
        ...state,
        workoutSessions: state.workoutSessions.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case 'DELETE_WORKOUT_SESSION':
      return {
        ...state,
        workoutSessions: state.workoutSessions.filter((s) => s.id !== action.payload),
      };

    case 'ADD_NUTRITION_ENTRY':
      return { ...state, nutritionEntries: [...state.nutritionEntries, action.payload] };

    case 'UPDATE_NUTRITION_ENTRY':
      return {
        ...state,
        nutritionEntries: state.nutritionEntries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };

    case 'DELETE_NUTRITION_ENTRY':
      return {
        ...state,
        nutritionEntries: state.nutritionEntries.filter((e) => e.id !== action.payload),
      };

    case 'SET_CUSTOM_FOODS':
      return { ...state, customFoods: action.payload };

    case 'ADD_CUSTOM_FOOD':
      return { ...state, customFoods: [...state.customFoods, action.payload] };

    case 'UPDATE_CUSTOM_FOOD':
      return {
        ...state,
        customFoods: state.customFoods.map((f) =>
          f.id === action.payload.id ? action.payload : f
        ),
      };

    case 'DELETE_CUSTOM_FOOD':
      return { ...state, customFoods: state.customFoods.filter((f) => f.id !== action.payload) };

    case 'ADD_BODY_METRIC':
      return { ...state, bodyMetrics: [...state.bodyMetrics, action.payload] };

    case 'UPDATE_BODY_METRIC':
      return {
        ...state,
        bodyMetrics: state.bodyMetrics.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };

    case 'DELETE_BODY_METRIC':
      return { ...state, bodyMetrics: state.bodyMetrics.filter((m) => m.id !== action.payload) };

    case 'UPDATE_EXERCISE_ABILITY': {
      const exists = state.exerciseAbilities.find(
        (a) => a.exerciseId === action.payload.exerciseId
      );
      if (exists) {
        return {
          ...state,
          exerciseAbilities: state.exerciseAbilities.map((a) =>
            a.exerciseId === action.payload.exerciseId ? action.payload : a
          ),
        };
      }
      return { ...state, exerciseAbilities: [...state.exerciseAbilities, action.payload] };
    }

    case 'SET_CARB_CYCLE_PLANS':
      return { ...state, carbCyclePlans: action.payload };

    case 'ADD_CARB_CYCLE_PLAN':
      return { ...state, carbCyclePlans: [...state.carbCyclePlans, action.payload] };

    case 'UPDATE_CARB_CYCLE_PLAN':
      return {
        ...state,
        carbCyclePlans: state.carbCyclePlans.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'DELETE_CARB_CYCLE_PLAN':
      return { ...state, carbCyclePlans: state.carbCyclePlans.filter((p) => p.id !== action.payload) };

    case 'UPDATE_AI_CONFIG':
      return { ...state, aiConfig: { ...state.aiConfig, ...action.payload } };

    case 'ADD_AI_MESSAGE':
      return { ...state, aiMessages: [...state.aiMessages, action.payload] };

    case 'CLEAR_AI_MESSAGES':
      return { ...state, aiMessages: [] };

    case 'START_WORKOUT_SESSION': {
      const newSession: WorkoutSession = {
        id: generateId(),
        templateId: action.payload.templateId,
        templateName: action.payload.templateName,
        date: getTodayString(),
        startTime: getCurrentTimeString(),
        plan: action.payload.plan,
        sets: [],
      };
      return { ...state, currentSession: newSession };
    }

    case 'END_WORKOUT_SESSION':
      if (state.currentSession) {
        const completedSession: WorkoutSession = {
          ...state.currentSession,
          endTime: getCurrentTimeString(),
        };
        return {
          ...state,
          currentSession: null,
          workoutSessions: [...state.workoutSessions, completedSession],
        };
      }
      return state;

    case 'ADD_SET_TO_SESSION':
      if (state.currentSession) {
        return {
          ...state,
          currentSession: {
            ...state.currentSession,
            sets: [...state.currentSession.sets, action.payload],
          },
        };
      }
      return state;

    case 'UPDATE_SET_IN_SESSION':
      if (state.currentSession) {
        return {
          ...state,
          currentSession: {
            ...state.currentSession,
            sets: state.currentSession.sets.map((s) =>
              s.id === action.payload.id ? action.payload : s
            ),
          },
        };
      }
      return state;

    case 'DELETE_SET_FROM_SESSION':
      if (state.currentSession) {
        return {
          ...state,
          currentSession: {
            ...state.currentSession,
            sets: state.currentSession.sets.filter((s) => s.id !== action.payload),
          },
        };
      }
      return state;

    default:
      return state;
  }
}

// Context类型
type NutritionLogInput = Omit<NutritionLogItem, 'id' | 'loggedAt'> & { date: string };

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // 便捷方法
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<Exercise>;
  updateExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, 'id'>) => Promise<WorkoutTemplate>;
  updateWorkoutTemplate: (template: WorkoutTemplate) => Promise<void>;
  deleteWorkoutTemplate: (id: string) => Promise<void>;
  startWorkoutSession: (template?: WorkoutTemplate, plan?: WorkoutSession['plan']) => void;
  endWorkoutSession: () => Promise<void>;
  updateWorkoutSession: (session: WorkoutSession) => Promise<void>;
  deleteWorkoutSession: (id: string) => Promise<void>;
  addSetToSession: (set: Omit<WorkoutSet, 'id'>) => void;
  updateSetInSession: (set: WorkoutSet) => void;
  deleteSetFromSession: (id: string) => void;
  addNutritionEntry: (entry: NutritionLogInput) => Promise<NutritionEntry>;
  updateNutritionEntry: (date: string, item: NutritionLogItem) => Promise<void>;
  deleteNutritionEntry: (date: string, id: string) => Promise<void>;
  addCustomFood: (food: Omit<FoodLibraryItem, 'id'>) => Promise<FoodLibraryItem>;
  updateCustomFood: (food: FoodLibraryItem) => Promise<void>;
  deleteCustomFood: (id: string) => Promise<void>;
  updateCarbCyclePlan: (plan: CarbCyclePlan) => Promise<void>;
  addCarbCyclePlan: (plan: Omit<CarbCyclePlan, 'id'>) => Promise<CarbCyclePlan>;
  deleteCarbCyclePlan: (id: string) => Promise<void>;
  addBodyMetric: (metric: Omit<BodyMetricEntry, 'id'>) => Promise<BodyMetricEntry>;
  updateBodyMetric: (metric: BodyMetricEntry) => Promise<void>;
  deleteBodyMetric: (id: string) => Promise<void>;
  updateExerciseAbility: (ability: ExerciseAbility) => Promise<void>;
  updateAIConfig: (config: Partial<AIConfig>) => Promise<void>;
  addAIMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearAIMessages: () => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  getSessionsByDate: (date: string) => WorkoutSession[];
  getNutritionByDate: (date: string) => NutritionEntry | undefined;
  getBodyMetricByDate: (date: string) => BodyMetricEntry | undefined;
}

// 创建Context
const AppContext = createContext<AppContextType | null>(null);

// Provider组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 加载所有数据
  useEffect(() => {
    async function loadData() {
      try {
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

        dispatch({
          type: 'LOAD_ALL_DATA',
          payload: {
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
          },
        });
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (state.isLoading) return;
    saveCurrentSession(state.currentSession ?? null).catch((error) => {
      console.error('Error saving current session:', error);
    });
  }, [state.currentSession, state.isLoading]);

  // 便捷方法实现
  const updateUserProfile = useCallback(async (profile: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: profile });
    const newProfile = { ...state.userProfile, ...profile };
    await saveUserProfile(newProfile);
  }, [state.userProfile]);

  const addExercise = useCallback(async (exercise: Omit<Exercise, 'id'>): Promise<Exercise> => {
    const newExercise: Exercise = { ...exercise, id: generateId() };
    dispatch({ type: 'ADD_EXERCISE', payload: newExercise });
    await saveExercises([...state.exercises, newExercise]);
    return newExercise;
  }, [state.exercises]);

  const updateExercise = useCallback(async (exercise: Exercise) => {
    dispatch({ type: 'UPDATE_EXERCISE', payload: exercise });
    await saveExercises(state.exercises.map((e) => (e.id === exercise.id ? exercise : e)));
  }, [state.exercises]);

  const deleteExercise = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_EXERCISE', payload: id });
    await saveExercises(state.exercises.filter((e) => e.id !== id));
  }, [state.exercises]);

  const addWorkoutTemplate = useCallback(async (template: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> => {
    const newTemplate: WorkoutTemplate = { ...template, id: generateId() };
    dispatch({ type: 'ADD_WORKOUT_TEMPLATE', payload: newTemplate });
    await saveWorkoutTemplates([...state.workoutTemplates, newTemplate]);
    return newTemplate;
  }, [state.workoutTemplates]);

  const updateWorkoutTemplate = useCallback(async (template: WorkoutTemplate) => {
    dispatch({ type: 'UPDATE_WORKOUT_TEMPLATE', payload: template });
    await saveWorkoutTemplates(state.workoutTemplates.map((t) => (t.id === template.id ? template : t)));
  }, [state.workoutTemplates]);

  const deleteWorkoutTemplate = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_WORKOUT_TEMPLATE', payload: id });
    await saveWorkoutTemplates(state.workoutTemplates.filter((t) => t.id !== id));
  }, [state.workoutTemplates]);

  const startWorkoutSession = useCallback((template?: WorkoutTemplate, plan?: WorkoutSession['plan']) => {
    dispatch({
      type: 'START_WORKOUT_SESSION',
      payload: {
        templateId: template?.id,
        templateName: template?.name,
        plan,
      },
    });
  }, []);

  const endWorkoutSession = useCallback(async () => {
    if (state.currentSession) {
      const completedSession: WorkoutSession = {
        ...state.currentSession,
        endTime: getCurrentTimeString(),
      };
      dispatch({ type: 'END_WORKOUT_SESSION' });
      await saveWorkoutSessions([...state.workoutSessions, completedSession]);
      await saveCurrentSession(null);
    }
  }, [state.currentSession, state.workoutSessions]);

  const updateWorkoutSession = useCallback(async (session: WorkoutSession) => {
    dispatch({ type: 'UPDATE_WORKOUT_SESSION', payload: session });
    const updatedSessions = state.workoutSessions.map((s) =>
      s.id === session.id ? session : s
    );
    await saveWorkoutSessions(updatedSessions);
  }, [state.workoutSessions]);

  const deleteWorkoutSession = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_WORKOUT_SESSION', payload: id });
    const updatedSessions = state.workoutSessions.filter((s) => s.id !== id);
    await saveWorkoutSessions(updatedSessions);
  }, [state.workoutSessions]);

  const addSetToSession = useCallback((set: Omit<WorkoutSet, 'id'>) => {
    const newSet: WorkoutSet = { ...set, id: generateId() };
    dispatch({ type: 'ADD_SET_TO_SESSION', payload: newSet });
  }, []);

  const updateSetInSession = useCallback((set: WorkoutSet) => {
    dispatch({ type: 'UPDATE_SET_IN_SESSION', payload: set });
  }, []);

  const deleteSetFromSession = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SET_FROM_SESSION', payload: id });
  }, []);

  const addNutritionEntry = useCallback(async (entry: NutritionLogInput): Promise<NutritionEntry> => {
    const item: NutritionLogItem = {
      id: generateId(),
      foodId: entry.foodId,
      name: entry.name,
      quantity: entry.quantity,
      unit: entry.unit,
      calories: entry.calories,
      carbs: entry.carbs,
      protein: entry.protein,
      fats: entry.fats,
      source: entry.source,
      loggedAt: new Date().toISOString(),
    };

    const existing = state.nutritionEntries.find((e) => e.date === entry.date);
    const updatedEntry: NutritionEntry = existing
      ? {
          ...existing,
          items: [...existing.items, item],
          totalCalories: existing.totalCalories + item.calories,
          totalCarbs: existing.totalCarbs + item.carbs,
          totalProtein: existing.totalProtein + item.protein,
          totalFats: existing.totalFats + item.fats,
        }
      : {
          id: generateId(),
          date: entry.date,
          items: [item],
          totalCalories: item.calories,
          totalCarbs: item.carbs,
          totalProtein: item.protein,
          totalFats: item.fats,
        };

    if (existing) {
      dispatch({ type: 'UPDATE_NUTRITION_ENTRY', payload: updatedEntry });
      await saveNutritionEntries(
        state.nutritionEntries.map((e) => (e.date === entry.date ? updatedEntry : e))
      );
    } else {
      dispatch({ type: 'ADD_NUTRITION_ENTRY', payload: updatedEntry });
      await saveNutritionEntries([...state.nutritionEntries, updatedEntry]);
    }
    return updatedEntry;
  }, [state.nutritionEntries]);

  const updateNutritionEntry = useCallback(async (date: string, item: NutritionLogItem) => {
    const existing = state.nutritionEntries.find((e) => e.date === date);
    if (!existing) return;

    const updatedItems = existing.items.map((i) => (i.id === item.id ? item : i));
    const totals = updatedItems.reduce(
      (acc, cur) => ({
        calories: acc.calories + cur.calories,
        carbs: acc.carbs + cur.carbs,
        protein: acc.protein + cur.protein,
        fats: acc.fats + cur.fats,
      }),
      { calories: 0, carbs: 0, protein: 0, fats: 0 }
    );

    const updatedEntry: NutritionEntry = {
      ...existing,
      items: updatedItems,
      totalCalories: totals.calories,
      totalCarbs: totals.carbs,
      totalProtein: totals.protein,
      totalFats: totals.fats,
    };

    dispatch({ type: 'UPDATE_NUTRITION_ENTRY', payload: updatedEntry });
    await saveNutritionEntries(
      state.nutritionEntries.map((e) => (e.date === date ? updatedEntry : e))
    );
  }, [state.nutritionEntries]);

  const deleteNutritionEntry = useCallback(async (date: string, id: string) => {
    const existing = state.nutritionEntries.find((e) => e.date === date);
    if (!existing) return;

    const updatedItems = existing.items.filter((item) => item.id !== id);
    if (updatedItems.length === 0) {
      dispatch({ type: 'DELETE_NUTRITION_ENTRY', payload: existing.id });
      await saveNutritionEntries(state.nutritionEntries.filter((e) => e.date !== date));
      return;
    }

    const totals = updatedItems.reduce(
      (acc, cur) => ({
        calories: acc.calories + cur.calories,
        carbs: acc.carbs + cur.carbs,
        protein: acc.protein + cur.protein,
        fats: acc.fats + cur.fats,
      }),
      { calories: 0, carbs: 0, protein: 0, fats: 0 }
    );

    const updatedEntry: NutritionEntry = {
      ...existing,
      items: updatedItems,
      totalCalories: totals.calories,
      totalCarbs: totals.carbs,
      totalProtein: totals.protein,
      totalFats: totals.fats,
    };

    dispatch({ type: 'UPDATE_NUTRITION_ENTRY', payload: updatedEntry });
    await saveNutritionEntries(
      state.nutritionEntries.map((e) => (e.date === date ? updatedEntry : e))
    );
  }, [state.nutritionEntries]);

  const addCustomFood = useCallback(async (food: Omit<FoodLibraryItem, 'id'>): Promise<FoodLibraryItem> => {
    const newFood: FoodLibraryItem = { ...food, id: generateId(), isCustom: true };
    dispatch({ type: 'ADD_CUSTOM_FOOD', payload: newFood });
    await saveCustomFoods([...state.customFoods, newFood]);
    return newFood;
  }, [state.customFoods]);

  const updateCustomFood = useCallback(async (food: FoodLibraryItem) => {
    dispatch({ type: 'UPDATE_CUSTOM_FOOD', payload: food });
    await saveCustomFoods(state.customFoods.map((f) => (f.id === food.id ? food : f)));
  }, [state.customFoods]);

  const deleteCustomFood = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CUSTOM_FOOD', payload: id });
    await saveCustomFoods(state.customFoods.filter((f) => f.id !== id));
  }, [state.customFoods]);

  const addCarbCyclePlan = useCallback(async (plan: Omit<CarbCyclePlan, 'id'>): Promise<CarbCyclePlan> => {
    const newPlan: CarbCyclePlan = { ...plan, id: generateId() };
    dispatch({ type: 'ADD_CARB_CYCLE_PLAN', payload: newPlan });
    await saveCarbCyclePlans([...state.carbCyclePlans, newPlan]);
    return newPlan;
  }, [state.carbCyclePlans]);

  const updateCarbCyclePlan = useCallback(async (plan: CarbCyclePlan) => {
    dispatch({ type: 'UPDATE_CARB_CYCLE_PLAN', payload: plan });
    await saveCarbCyclePlans(state.carbCyclePlans.map((p) => (p.id === plan.id ? plan : p)));
  }, [state.carbCyclePlans]);

  const deleteCarbCyclePlan = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CARB_CYCLE_PLAN', payload: id });
    await saveCarbCyclePlans(state.carbCyclePlans.filter((p) => p.id !== id));
  }, [state.carbCyclePlans]);

  const addBodyMetric = useCallback(async (metric: Omit<BodyMetricEntry, 'id'>): Promise<BodyMetricEntry> => {
    const newMetric: BodyMetricEntry = { ...metric, id: generateId() };
    dispatch({ type: 'ADD_BODY_METRIC', payload: newMetric });
    await saveBodyMetrics([...state.bodyMetrics, newMetric]);
    return newMetric;
  }, [state.bodyMetrics]);

  const updateBodyMetric = useCallback(async (metric: BodyMetricEntry) => {
    dispatch({ type: 'UPDATE_BODY_METRIC', payload: metric });
    await saveBodyMetrics(state.bodyMetrics.map((m) => (m.id === metric.id ? metric : m)));
  }, [state.bodyMetrics]);

  const deleteBodyMetric = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_BODY_METRIC', payload: id });
    await saveBodyMetrics(state.bodyMetrics.filter((m) => m.id !== id));
  }, [state.bodyMetrics]);

  const updateExerciseAbility = useCallback(async (ability: ExerciseAbility) => {
    dispatch({ type: 'UPDATE_EXERCISE_ABILITY', payload: ability });
    const exists = state.exerciseAbilities.find((a) => a.exerciseId === ability.exerciseId);
    if (exists) {
      await saveExerciseAbilities(
        state.exerciseAbilities.map((a) => (a.exerciseId === ability.exerciseId ? ability : a))
      );
    } else {
      await saveExerciseAbilities([...state.exerciseAbilities, ability]);
    }
  }, [state.exerciseAbilities]);

  const updateAIConfig = useCallback(async (config: Partial<AIConfig>) => {
    dispatch({ type: 'UPDATE_AI_CONFIG', payload: config });
    await saveAIConfig({ ...state.aiConfig, ...config });
  }, [state.aiConfig]);

  const addAIMessage = useCallback((message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AI_MESSAGE', payload: newMessage });
    saveAIMessages([...state.aiMessages, newMessage]).catch((error) => {
      console.error('Error saving AI messages:', error);
    });
  }, [state.aiMessages]);

  const clearAIMessages = useCallback(async () => {
    dispatch({ type: 'CLEAR_AI_MESSAGES' });
    await saveAIMessages([]);
  }, []);

  const getExerciseById = useCallback((id: string) => {
    return state.exercises.find((e) => e.id === id);
  }, [state.exercises]);

  const getSessionsByDate = useCallback((date: string) => {
    return state.workoutSessions.filter((s) => s.date === date);
  }, [state.workoutSessions]);

  const getNutritionByDate = useCallback((date: string) => {
    return state.nutritionEntries.find((e) => e.date === date);
  }, [state.nutritionEntries]);

  const getBodyMetricByDate = useCallback((date: string) => {
    return state.bodyMetrics.find((m) => m.date === date);
  }, [state.bodyMetrics]);

  const value: AppContextType = {
    state,
    dispatch,
    updateUserProfile,
    addExercise,
    updateExercise,
    deleteExercise,
    addWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
    startWorkoutSession,
    endWorkoutSession,
    updateWorkoutSession,
    deleteWorkoutSession,
    addSetToSession,
    updateSetInSession,
    deleteSetFromSession,
    addNutritionEntry,
    updateNutritionEntry,
    deleteNutritionEntry,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
    addCarbCyclePlan,
    updateCarbCyclePlan,
    deleteCarbCyclePlan,
    addBodyMetric,
    updateBodyMetric,
    deleteBodyMetric,
    updateExerciseAbility,
    updateAIConfig,
    addAIMessage,
    clearAIMessages,
    getExerciseById,
    getSessionsByDate,
    getNutritionByDate,
    getBodyMetricByDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
