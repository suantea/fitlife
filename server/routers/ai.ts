import { z } from "zod";
import { desc, eq, and, gte } from "drizzle-orm";
import { userProfiles, workoutLogs, nutritionLogs, workoutTemplates } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { ensureDb } from "./utils";
import { KNOWLEDGE_BASE } from "../knowledge-base";

// Mock AI Service - In a real app, this would call OpenAI/Anthropic
const generateAIResponse = async (systemPrompt: string, userMessage: string) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // return a mock response based on the input
  if (userMessage.includes("suggest") || userMessage.includes("advice")) {
    return `Based on your data and the **Knowledge Base**, here is my advice:

1. **Training**: You've been consistent. Try increasing the weight on your compound lifts by 2.5kg this week (Progressive Overload).
2. **Nutrition**: Your protein intake looks good, but consider slightly increasing carbs on your heavy training days.
3. **Recovery**: Make sure you get 8 hours of sleep.

*Remember: Consistency is key!*`;
  }
  
  return `I understand you're asking about: "${userMessage}". 
  
According to my internal knowledge base:
> ${KNOWLEDGE_BASE.slice(0, 100)}...

I recommend sticking to your plan. **You got this!**`;
};

export const aiRouter = router({
  getDailyAdvice: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await ensureDb();
      
      // 1. Gather Context
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.user.id)
      });

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWorkout = await db.query.workoutLogs.findFirst({
        where: eq(workoutLogs.userId, ctx.user.id),
        orderBy: [desc(workoutLogs.date)],
        with: { template: true }
      });

      const lastNutrition = await db.query.nutritionLogs.findFirst({
        where: eq(nutritionLogs.userId, ctx.user.id),
        orderBy: [desc(nutritionLogs.date)]
      });

      // 2. Construct System Prompt (for the "AI")
      const systemPrompt = `
You are an expert Fitness & Nutrition AI Assistant.
Your goal is to help the user achieve their goal: ${profile?.goal || "General Fitness"}.
User Profile: ${profile?.height}cm, ${profile?.weight}kg, Activity: ${profile?.activityLevel}.

Knowledge Base Context:
${KNOWLEDGE_BASE}

Recent Activity:
- Last Workout: ${lastWorkout ? lastWorkout.template?.name : "None recently"}
- Last Nutrition: ${lastNutrition ? `${lastNutrition.totalCalories} kcal` : "No log"}
`;

      // 3. Generate "Daily Advice"
      // In a real app, we'd send this prompt to the LLM
      
      return {
        date: today.toISOString(),
        advice: `### Daily Insight for ${today.toDateString()}

**Goal**: ${profile?.goal === "muscle_gain" ? "Build Muscle" : "Lose Fat"}

Based on your recent activity, here are 3 focus points for today:

1. **Hydration**: Aim for 3L of water.
2. **Training**: ${lastWorkout ? "Great job on your last workout! Rest or do light cardio today." : "You haven't trained recently. Let's get moving!"}
3. **Nutrition**: ${lastNutrition && (lastNutrition.totalProtein || 0) < 100 ? "Try to up your protein intake today." : "Keep hitting your macro targets!"}

*Stay consistent!*`
      };
    }),

  chat: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      // Fetch context similarly...
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.user.id)
      });

      const systemPrompt = `You are a helpful fitness assistant. User goal: ${profile?.goal}`;
      const response = await generateAIResponse(systemPrompt, input.message);
      
      return { response };
    }),
});
