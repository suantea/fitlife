import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { workoutTemplates, workoutTemplateDays, workoutTemplateExercises } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { ensureDb } from "./utils";

export const templateRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await ensureDb();
      return db.select().from(workoutTemplates).where(eq(workoutTemplates.userId, ctx.user.id));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      const template = await db.query.workoutTemplates.findFirst({
        where: and(eq(workoutTemplates.id, input.id), eq(workoutTemplates.userId, ctx.user.id)),
        with: {
          days: {
            with: {
              exercises: {
                with: {
                  exercise: true
                },
                orderBy: (exercises, { asc }) => [asc(exercises.order)],
              }
            },
            orderBy: (days, { asc }) => [asc(days.dayIndex)],
          }
        }
      });

      return template || null;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      cycleLength: z.number().min(1),
      description: z.string().optional(),
      days: z.array(z.object({
        dayIndex: z.number(),
        name: z.string(),
        muscleGroups: z.array(z.string()),
        exercises: z.array(z.object({
          exerciseId: z.number(),
          order: z.number(),
          sets: z.number(),
          reps: z.number(),
          weight: z.number().optional(),
          notes: z.string().optional(),
        }))
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      await db.transaction(async (tx) => {
        // 1. Create Template
        const [templateResult] = await tx.insert(workoutTemplates).values({
          userId: ctx.user.id,
          name: input.name,
          cycleLength: input.cycleLength,
          description: input.description,
        });
        const templateId = templateResult.insertId;

        // 2. Create Days
        for (const day of input.days) {
          const [dayResult] = await tx.insert(workoutTemplateDays).values({
            templateId,
            dayIndex: day.dayIndex,
            name: day.name,
            muscleGroups: day.muscleGroups,
          });
          const dayId = dayResult.insertId;

          // 3. Create Exercises for the Day
          if (day.exercises.length > 0) {
            await tx.insert(workoutTemplateExercises).values(
              day.exercises.map(ex => ({
                templateDayId: dayId,
                exerciseId: ex.exerciseId,
                order: ex.order,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                notes: ex.notes,
              }))
            );
          }
        }
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1),
      cycleLength: z.number().min(1),
      description: z.string().optional(),
      days: z.array(z.object({
        dayIndex: z.number(),
        name: z.string(),
        muscleGroups: z.array(z.string()),
        exercises: z.array(z.object({
          exerciseId: z.number(),
          order: z.number(),
          sets: z.number(),
          reps: z.number(),
          weight: z.number().optional(),
          notes: z.string().optional(),
        }))
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      await db.transaction(async (tx) => {
        // 1. Verify ownership
        const existing = await tx.query.workoutTemplates.findFirst({
          where: and(eq(workoutTemplates.id, input.id), eq(workoutTemplates.userId, ctx.user.id))
        });

        if (!existing) {
          throw new Error("Template not found or unauthorized");
        }

        // 2. Update Template details
        await tx.update(workoutTemplates)
          .set({
            name: input.name,
            cycleLength: input.cycleLength,
            description: input.description,
            updatedAt: new Date()
          })
          .where(eq(workoutTemplates.id, input.id));

        // 3. Delete existing days (cascade should handle exercises, but let's be explicit if needed)
        // Note: If schema has ON DELETE CASCADE, deleting days is enough. 
        // Let's manually delete days for this template.
        // First get all day IDs to delete exercises? 
        // Actually, let's assume we can just delete days and re-create.
        // But to be safe with foreign keys, let's check schema. 
        // If we didn't set cascade in schema (drizzle usually needs explicit definition), 
        // we should delete exercises first.
        
        const existingDays = await tx.select({ id: workoutTemplateDays.id })
          .from(workoutTemplateDays)
          .where(eq(workoutTemplateDays.templateId, input.id));
          
        const dayIds = existingDays.map(d => d.id);
        
        if (dayIds.length > 0) {
          // Delete exercises for these days
          // We can't use 'inArray' easily without importing it or doing a loop.
          // Let's just delete by templateDayId if possible, or loop.
          // Since we are in a transaction, efficiency is okay.
          for (const dayId of dayIds) {
             await tx.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.templateDayId, dayId));
          }
          
          // Delete days
          await tx.delete(workoutTemplateDays).where(eq(workoutTemplateDays.templateId, input.id));
        }

        // 4. Re-create Days and Exercises
        for (const day of input.days) {
          const [dayResult] = await tx.insert(workoutTemplateDays).values({
            templateId: input.id,
            dayIndex: day.dayIndex,
            name: day.name,
            muscleGroups: day.muscleGroups,
          });
          const dayId = dayResult.insertId;

          if (day.exercises.length > 0) {
            await tx.insert(workoutTemplateExercises).values(
              day.exercises.map(ex => ({
                templateDayId: dayId,
                exerciseId: ex.exerciseId,
                order: ex.order,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                notes: ex.notes,
              }))
            );
          }
        }
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      // Cascading delete should handle days and exercises
      await db.delete(workoutTemplates)
        .where(and(eq(workoutTemplates.id, input.id), eq(workoutTemplates.userId, ctx.user.id)));
      return { success: true };
    }),
});
