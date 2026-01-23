import { z } from "zod";
import { eq } from "drizzle-orm";
import { userProfiles } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { ensureDb } from "./utils";

export const profileRouter = router({
  get: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await ensureDb();
      
      const profile = await db.select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id))
        .limit(1);

      return profile[0] || null;
    }),

  update: protectedProcedure
    .input(z.object({
      height: z.number().optional(),
      weight: z.number().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      age: z.number().optional(),
      activityLevel: z.enum([
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "super_active"
      ]).optional(),
      goal: z.enum(["lose_weight", "muscle_gain", "maintain"]).optional(),
      tdee: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      
      const existing = await db.select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db.update(userProfiles)
          .set(input)
          .where(eq(userProfiles.userId, ctx.user.id));
      } else {
        await db.insert(userProfiles).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      return { success: true };
    }),
});
