import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { workoutLogs, workoutLogSets, workoutTemplates } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { ensureDb } from "./utils";

export const workoutRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      cursor: z.number().optional(), // use ID as cursor
    }))
    .query(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      // TODO: Implement cursor pagination properly. For now just limit.
      const logs = await db.query.workoutLogs.findMany({
        where: eq(workoutLogs.userId, ctx.user.id),
        orderBy: [desc(workoutLogs.date)],
        limit: input.limit,
        with: {
          template: true,
          sets: {
             with: {
               exercise: true
             }
          }
        }
      });
      return logs;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      const log = await db.query.workoutLogs.findFirst({
        where: and(eq(workoutLogs.id, input.id), eq(workoutLogs.userId, ctx.user.id)),
        with: {
          template: true,
          sets: {
            with: {
              exercise: true
            },
            orderBy: (sets, { asc }) => [asc(sets.setNumber)]
          }
        }
      });

      return log || null;
    }),

  create: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      date: z.string().optional(), // ISO string
      duration: z.number().optional(),
      notes: z.string().optional(),
      sets: z.array(z.object({
        exerciseId: z.number(),
        setNumber: z.number(),
        reps: z.number(),
        weight: z.number(),
        completed: z.boolean().default(true),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      await db.transaction(async (tx) => {
        const [logResult] = await tx.insert(workoutLogs).values({
          userId: ctx.user.id,
          templateId: input.templateId,
          date: input.date ? new Date(input.date) : new Date(),
          duration: input.duration,
          notes: input.notes,
        });
        const logId = logResult.insertId;

        if (input.sets.length > 0) {
          await tx.insert(workoutLogSets).values(
            input.sets.map(s => ({
              workoutLogId: logId,
              exerciseId: s.exerciseId,
              setNumber: s.setNumber,
              reps: s.reps,
              weight: s.weight,
              completed: s.completed,
            }))
          );
        }
      });

      return { success: true };
    }),
    
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      await db.delete(workoutLogs)
        .where(and(eq(workoutLogs.id, input.id), eq(workoutLogs.userId, ctx.user.id)));
      return { success: true };
    }),
});
