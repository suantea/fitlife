import type { AISnapshot } from "./data-model";
import { MUSCLE_GROUP_NAMES } from "../types";

export function generateDailyTips(snapshot: AISnapshot): string[] {
  const tips: string[] = [];

  const { training, nutrition, profile } = snapshot;
  if (training.todayPlan?.isRestDay) {
    tips.push("今天是休息日，安排轻度拉伸或 20-30 分钟低强度有氧，帮助恢复。");
  } else if (training.todayPlan?.day) {
    const muscle = training.todayPlan.day.muscleGroups?.map((group) => MUSCLE_GROUP_NAMES[group]).join("/") || "重点肌群";
    tips.push(`今日训练重点：${muscle}，建议先做复合动作，再安排孤立动作。`);
  }

  if (!nutrition.todayEntry) {
    tips.push("今天还没有饮食记录，先记录一餐，便于跟踪热量与宏量目标。");
  } else if (nutrition.todayEntry.totalProtein < 80) {
    tips.push("今日蛋白摄入偏低，可补充高蛋白食物（鸡胸/牛肉/豆腐）。");
  }

  if ((profile.sleepHours ?? 7) < 7) {
    tips.push("近期睡眠不足 7 小时，优先保证睡眠有助于恢复与训练表现。");
  }

  if (training.recentSessions.length === 0) {
    tips.push("近期训练记录较少，建议先安排 2-3 次全身或上下肢训练作为启动。");
  }

  return tips.slice(0, 4);
}
