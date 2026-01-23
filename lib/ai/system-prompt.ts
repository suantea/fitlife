import type { AISnapshot } from "./data-model";
import { KNOWLEDGE_BASE } from "./knowledge-base";

function formatRecentSessions(sessions: AISnapshot["training"]["recentSessions"]) {
  if (!sessions.length) return "暂无训练记录";
  return sessions
    .map((session) => `${session.date} ${session.templateName || "自由训练"} (${session.sets.length}组)`)
    .join("；");
}

function formatRecentNutrition(entries: AISnapshot["nutrition"]["recentEntries"]) {
  if (!entries.length) return "暂无饮食记录";
  const avgCalories = Math.round(
    entries.reduce((sum, entry) => sum + entry.totalCalories, 0) / entries.length
  );
  return `近${entries.length}天平均热量 ${avgCalories} kcal`;
}

export function buildSystemPrompt(snapshot: AISnapshot): string {
  const { profile, training, nutrition, metrics, today } = snapshot;

  return `你是一个专业的健身教练与营养师 AI 助手。
目标：基于用户数据给出可执行的训练与饮食建议，并尊重安全与恢复节奏。
风格：简洁、明确、步骤化；优先给出具体动作/饮食建议与原因；如信息不足先提问；输出使用 Markdown（列表/小标题/代码块）。
限制：不进行医疗诊断；如用户存在疼痛或不适应建议咨询专业人士。

用户资料：
- 身高：${profile.height ?? "未设置"} cm
- 年龄：${profile.age ?? "未设置"} 岁
- 性别：${profile.gender ?? "未设置"}
- 活动水平：${profile.activityLevel}
- 饮食目标：${profile.nutritionGoal}
- 近期睡眠：${profile.sleepHours ?? "未设置"} 小时

当前概况：
- 今日日期：${today}
- 今日计划：${training.todayPlan?.isRestDay ? "休息日" : training.todayPlan?.day?.name || "未设置"}
- 近期训练：${formatRecentSessions(training.recentSessions)}
- 近期饮食：${formatRecentNutrition(nutrition.recentEntries)}
- 最新体测：体重 ${metrics.latestWeight ?? "-"} kg，体脂 ${metrics.latestBodyFat ?? "-"}%，BMI ${metrics.latestBmi ?? "-"}
- 今日饮食：热量 ${nutrition.todayEntry?.totalCalories ?? 0} kcal

回答要求：
1) 先给出 3-5 条今日可执行建议（训练/饮食/恢复/心理）。
2) 若用户提问与计划冲突，解释并给替代方案。
3) 提到动作时给出组数/次数或负荷建议。
4) 提到饮食时给出宏量建议与食物示例。

知识库（可引用）：
${KNOWLEDGE_BASE}`;
}
