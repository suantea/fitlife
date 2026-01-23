import { boolean, date, float, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  height: float("height"), // cm
  weight: float("weight"), // kg
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  age: int("age"),
  activityLevel: mysqlEnum("activityLevel", [
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "super_active"
  ]),
  goal: mysqlEnum("goal", ["lose_weight", "muscle_gain", "maintain"]),
  tdee: int("tdee"), // Total Daily Energy Expenditure
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  muscleGroup: mysqlEnum("muscleGroup", [
    "chest", "back", "shoulders", "arms", "legs", "core", "full_body", "cardio"
  ]).notNull(),
  equipment: mysqlEnum("equipment", [
    "barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "bands", "other"
  ]).default("other"),
  description: text("description"),
  isCustom: boolean("isCustom").default(false),
  userId: int("userId").references(() => users.id), // Null for preset exercises
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workoutTemplates = mysqlTable("workout_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  cycleLength: int("cycleLength").default(7), // e.g., 7 days
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workoutTemplateDays = mysqlTable("workout_template_days", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull().references(() => workoutTemplates.id, { onDelete: 'cascade' }),
  dayIndex: int("dayIndex").notNull(), // 1 to cycleLength
  name: varchar("name", { length: 255 }), // e.g., "Push Day"
  muscleGroups: json("muscleGroups"), // Array of strings
});

export const workoutTemplateExercises = mysqlTable("workout_template_exercises", {
  id: int("id").autoincrement().primaryKey(),
  templateDayId: int("templateDayId").notNull().references(() => workoutTemplateDays.id, { onDelete: 'cascade' }),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id),
  order: int("order").notNull(),
  sets: int("sets").default(3),
  reps: int("reps").default(10),
  weight: float("weight"), // Target weight
  notes: text("notes"),
});

export const workoutLogs = mysqlTable("workout_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  templateId: int("templateId").references(() => workoutTemplates.id),
  date: timestamp("date").defaultNow().notNull(),
  duration: int("duration"), // seconds
  notes: text("notes"),
});

export const workoutLogSets = mysqlTable("workout_log_sets", {
  id: int("id").autoincrement().primaryKey(),
  workoutLogId: int("workoutLogId").notNull().references(() => workoutLogs.id, { onDelete: 'cascade' }),
  exerciseId: int("exerciseId").notNull().references(() => exercises.id),
  setNumber: int("setNumber").notNull(),
  reps: int("reps"),
  weight: float("weight"),
  completed: boolean("completed").default(false),
});

export const foods = mysqlTable("foods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  calories: float("calories").notNull(), // per serving
  protein: float("protein").notNull(),
  carbs: float("carbs").notNull(),
  fat: float("fat").notNull(),
  servingSize: float("servingSize").default(100),
  servingUnit: varchar("servingUnit", { length: 50 }).default("g"),
  userId: int("userId").references(() => users.id), // Null for global food database
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const nutritionLogs = mysqlTable("nutrition_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  date: date("date").notNull(),
  totalCalories: float("totalCalories").default(0),
  totalProtein: float("totalProtein").default(0),
  totalCarbs: float("totalCarbs").default(0),
  totalFat: float("totalFat").default(0),
});

export const nutritionLogItems = mysqlTable("nutrition_log_items", {
  id: int("id").autoincrement().primaryKey(),
  logId: int("logId").notNull().references(() => nutritionLogs.id, { onDelete: 'cascade' }),
  foodId: int("foodId").notNull().references(() => foods.id),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  amount: float("amount").notNull(), // Multiplier of serving size
  calories: float("calories").notNull(),
});

export const carbCyclingSettings = mysqlTable("carb_cycling_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  cycleType: mysqlEnum("cycleType", ["weekly", "custom"]).default("weekly"),
  // Stores configuration for high/medium/low days
  // e.g. { high: { carb: 300, protein: 180, fat: 60 }, low: { ... } }
  macroTargets: json("macroTargets"), 
  // Stores which day is which type
  // e.g. { monday: "high", tuesday: "low", ... } or array of types for custom cycle
  cycleSchedule: json("cycleSchedule"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  workoutTemplates: many(workoutTemplates),
  workoutLogs: many(workoutLogs),
  nutritionLogs: many(nutritionLogs),
  carbSettings: one(carbCyclingSettings, {
    fields: [users.id],
    references: [carbCyclingSettings.userId],
  }),
}));

export const workoutTemplatesRelations = relations(workoutTemplates, ({ many }) => ({
  days: many(workoutTemplateDays),
}));

export const workoutTemplateDaysRelations = relations(workoutTemplateDays, ({ one, many }) => ({
  template: one(workoutTemplates, {
    fields: [workoutTemplateDays.templateId],
    references: [workoutTemplates.id],
  }),
  exercises: many(workoutTemplateExercises),
}));

export const workoutTemplateExercisesRelations = relations(workoutTemplateExercises, ({ one }) => ({
  day: one(workoutTemplateDays, {
    fields: [workoutTemplateExercises.templateDayId],
    references: [workoutTemplateDays.id],
  }),
  exercise: one(exercises, {
    fields: [workoutTemplateExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const workoutLogsRelations = relations(workoutLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutLogs.userId],
    references: [users.id],
  }),
  template: one(workoutTemplates, {
    fields: [workoutLogs.templateId],
    references: [workoutTemplates.id],
  }),
  sets: many(workoutLogSets),
}));

export const workoutLogSetsRelations = relations(workoutLogSets, ({ one }) => ({
  log: one(workoutLogs, {
    fields: [workoutLogSets.workoutLogId],
    references: [workoutLogs.id],
  }),
  exercise: one(exercises, {
    fields: [workoutLogSets.exerciseId],
    references: [exercises.id],
  }),
}));

export const nutritionLogsRelations = relations(nutritionLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [nutritionLogs.userId],
    references: [users.id],
  }),
  items: many(nutritionLogItems),
}));

export const nutritionLogItemsRelations = relations(nutritionLogItems, ({ one }) => ({
  log: one(nutritionLogs, {
    fields: [nutritionLogItems.logId],
    references: [nutritionLogs.id],
  }),
  food: one(foods, {
    fields: [nutritionLogItems.foodId],
    references: [foods.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type InsertWorkoutTemplate = typeof workoutTemplates.$inferInsert;
export type WorkoutTemplateDay = typeof workoutTemplateDays.$inferSelect;
export type InsertWorkoutTemplateDay = typeof workoutTemplateDays.$inferInsert;
export type WorkoutTemplateExercise = typeof workoutTemplateExercises.$inferSelect;
export type InsertWorkoutTemplateExercise = typeof workoutTemplateExercises.$inferInsert;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;
export type WorkoutLogSet = typeof workoutLogSets.$inferSelect;
export type InsertWorkoutLogSet = typeof workoutLogSets.$inferInsert;
export type Food = typeof foods.$inferSelect;
export type InsertFood = typeof foods.$inferInsert;
export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = typeof nutritionLogs.$inferInsert;
export type NutritionLogItem = typeof nutritionLogItems.$inferSelect;
export type InsertNutritionLogItem = typeof nutritionLogItems.$inferInsert;
export type CarbCyclingSettings = typeof carbCyclingSettings.$inferSelect;
export type InsertCarbCyclingSettings = typeof carbCyclingSettings.$inferInsert;
