import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { exerciseRouter } from "./routers/exercises";
import { templateRouter } from "./routers/templates";
import { workoutRouter } from "./routers/workouts";
import { nutritionRouter } from "./routers/nutrition";
import { profileRouter } from "./routers/profile";
import { aiRouter } from "./routers/ai";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  exercises: exerciseRouter,
  templates: templateRouter,
  workouts: workoutRouter,
  nutrition: nutritionRouter,
  profile: profileRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
