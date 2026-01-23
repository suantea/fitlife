import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { foods, nutritionLogs, nutritionLogItems, carbCyclingSettings } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { ensureDb } from "./utils";

export const nutritionRouter = router({
  // Food Database
  searchFoods: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await ensureDb();
      let query = db.select().from(foods).$dynamic();
      
      if (input.query) {
        query = query.where(sql`${foods.name} LIKE ${`%${input.query}%`}`);
      }
      
      return query.limit(input.limit);
    }),

  createFood: protectedProcedure
    .input(z.object({
      name: z.string(),
      brand: z.string().optional(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      servingSize: z.number().default(100),
      servingUnit: z.string().default("g"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      await db.insert(foods).values({
        ...input,
        userId: ctx.user.id, // User created food
      });
      return { success: true };
    }),

  // Daily Logging
  getDailyLog: protectedProcedure
    .input(z.object({ date: z.string() })) // YYYY-MM-DD
    .query(async ({ ctx, input }) => {
      const db = await ensureDb();
      const logDate = new Date(input.date);
      const log = await db.query.nutritionLogs.findFirst({
        where: and(
          eq(nutritionLogs.userId, ctx.user.id),
          eq(nutritionLogs.date, logDate)
        ),
        with: {
          items: {
            with: {
              food: true
            }
          }
        }
      });
      return log || null;
    }),

  addLogItem: protectedProcedure
    .input(z.object({
      date: z.string(), // YYYY-MM-DD
      foodId: z.number(),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      amount: z.number(), // Multiplier of serving size
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const logDate = new Date(input.date);
      
      await db.transaction(async (tx) => {
        // 1. Get or Create Log for the day
        let log = await tx.query.nutritionLogs.findFirst({
          where: and(
            eq(nutritionLogs.userId, ctx.user.id),
            eq(nutritionLogs.date, logDate)
          )
        });

        if (!log) {
          const [result] = await tx.insert(nutritionLogs).values({
            userId: ctx.user.id,
            date: logDate,
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
          });
          // Fetch created log
          log = await tx.query.nutritionLogs.findFirst({
             where: eq(nutritionLogs.id, result.insertId)
          });
        }
        
        if (!log) throw new Error("Failed to create/find log");

        // 2. Get Food details to calculate macros
        const food = await tx.query.foods.findFirst({
          where: eq(foods.id, input.foodId)
        });
        
        if (!food) throw new Error("Food not found");

        const calories = food.calories * input.amount;
        const protein = food.protein * input.amount;
        const carbs = food.carbs * input.amount;
        const fat = food.fat * input.amount;

        // 3. Add Item
        await tx.insert(nutritionLogItems).values({
          logId: log.id,
          foodId: input.foodId,
          mealType: input.mealType,
          amount: input.amount,
          calories: calories,
        });

        // 4. Update Log Totals
        await tx.update(nutritionLogs)
          .set({
            totalCalories: (log.totalCalories || 0) + calories,
            totalProtein: (log.totalProtein || 0) + protein,
            totalCarbs: (log.totalCarbs || 0) + carbs,
            totalFat: (log.totalFat || 0) + fat,
          })
          .where(eq(nutritionLogs.id, log.id));
      });

      return { success: true };
    }),

  deleteLogItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      await db.transaction(async (tx) => {
        // Get Item to deduct macros
        const item = await tx.query.nutritionLogItems.findFirst({
          where: eq(nutritionLogItems.id, input.itemId),
          with: {
            food: true,
            log: true
          }
        });

        if (!item || !item.log || item.log.userId !== ctx.user.id) {
          throw new Error("Item not found or unauthorized");
        }

        const food = item.food;
        const amount = item.amount;
        
        const calories = food.calories * amount;
        const protein = food.protein * amount;
        const carbs = food.carbs * amount;
        const fat = food.fat * amount;

        // Delete Item
        await tx.delete(nutritionLogItems).where(eq(nutritionLogItems.id, input.itemId));

        // Update Log Totals
        await tx.update(nutritionLogs)
          .set({
            totalCalories: Math.max(0, (item.log.totalCalories || 0) - calories),
            totalProtein: Math.max(0, (item.log.totalProtein || 0) - protein),
            totalCarbs: Math.max(0, (item.log.totalCarbs || 0) - carbs),
            totalFat: Math.max(0, (item.log.totalFat || 0) - fat),
          })
          .where(eq(nutritionLogs.id, item.logId));
      });
      
      return { success: true };
    }),

  // Carb Cycling & Settings
  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await ensureDb();
      return db.query.carbCyclingSettings.findFirst({
        where: eq(carbCyclingSettings.userId, ctx.user.id)
      });
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      cycleType: z.enum(["weekly", "custom"]),
      macroTargets: z.any(), // JSON
      cycleSchedule: z.any(), // JSON
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const existing = await db.query.carbCyclingSettings.findFirst({
        where: eq(carbCyclingSettings.userId, ctx.user.id)
      });

      if (existing) {
        await db.update(carbCyclingSettings)
          .set({
            cycleType: input.cycleType,
            macroTargets: input.macroTargets,
            cycleSchedule: input.cycleSchedule,
            updatedAt: new Date()
          })
          .where(eq(carbCyclingSettings.id, existing.id));
      } else {
        await db.insert(carbCyclingSettings).values({
          userId: ctx.user.id,
          cycleType: input.cycleType,
          macroTargets: input.macroTargets,
          cycleSchedule: input.cycleSchedule,
        });
      }
      return { success: true };
    }),
});
