import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { getTodayString } from "@/lib/storage";
import { getPlanForDate, getNextWorkoutDate } from "@/lib/training-plan";
import { MUSCLE_GROUP_NAMES } from "@/lib/types";
import { buildAISnapshot } from "@/lib/ai/data-model";
import { generateDailyTips } from "@/lib/ai/insights";

export default function TrainingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, startWorkoutSession } = useApp();

  if (state.isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const today = getTodayString();
  const todaySessions = state.workoutSessions.filter((s) => s.date === today);
  const hasActiveSession = state.currentSession !== null;
  const activeTemplate = state.workoutTemplates.find(
    (template) => template.id === state.userProfile.activeWorkoutTemplateId
  );
  const todayPlan = activeTemplate ? getPlanForDate(activeTemplate, today) : null;
  const aiTips = generateDailyTips(buildAISnapshot(state));

  const handleStartFreeWorkout = () => {
    startWorkoutSession();
    router.push("/training/session");
  };

  const handleContinueSession = () => {
    router.push("/training/session");
  };

  const handleStartPlanWorkout = () => {
    if (!activeTemplate || !todayPlan || todayPlan.isRestDay || !todayPlan.day) {
      handleStartFreeWorkout();
      return;
    }
    startWorkoutSession(activeTemplate, {
      dayIndex: todayPlan.dayIndex,
      dayName: todayPlan.day.name,
      muscleGroups: todayPlan.day.muscleGroups,
      exercises: todayPlan.day.exercises,
    });
    router.push("/training/session");
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View className="px-5 pt-6 pb-7 bg-primary/5 rounded-b-[28px]">
          <Text className="text-xs tracking-[2px] text-muted">FITLIFE</Text>
          <Text className="text-3xl font-semibold text-foreground mt-2">训练</Text>
          <Text className="text-base text-muted mt-1">{today.replace(/-/g, "/")}</Text>
        </View>

        {/* 今日训练卡片 */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-3xl p-5 border border-border/70 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">今日训练</Text>
              {todaySessions.length > 0 && (
                <View className="bg-success/20 px-3 py-1 rounded-full">
                  <Text className="text-success text-sm font-medium">已完成 {todaySessions.length} 次</Text>
                </View>
              )}
            </View>

            {hasActiveSession ? (
              <TouchableOpacity
                onPress={handleContinueSession}
                className="bg-warning rounded-2xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold text-lg">继续训练</Text>
                <Text className="text-background/80 text-sm mt-1">
                  {state.currentSession?.templateName || "自由训练"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={activeTemplate ? handleStartPlanWorkout : handleStartFreeWorkout}
                className="bg-primary rounded-2xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold text-lg">
                  {activeTemplate ? "开始今日训练" : "开始训练"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 今日计划 */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-3xl p-5 border border-border/70 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">今日计划</Text>
              <TouchableOpacity onPress={() => router.push("/training/templates")} activeOpacity={0.7}>
                <Text className="text-primary">管理模板</Text>
              </TouchableOpacity>
            </View>

            {!activeTemplate ? (
              <View className="items-center py-4">
                <Text className="text-muted text-center">尚未设置当前训练模板</Text>
                <TouchableOpacity
                  onPress={() => router.push("/training/templates")}
                  className="mt-3 bg-primary/10 px-4 py-2 rounded-full"
                >
                  <Text className="text-primary">去选择模板</Text>
                </TouchableOpacity>
              </View>
            ) : todayPlan?.isRestDay ? (
              <View className="items-center py-4">
                <Text className="text-foreground font-medium">今天是休息日</Text>
                <Text className="text-muted text-sm mt-2">
                  下次训练：{getNextWorkoutDate(activeTemplate, today).replace(/-/g, "/")}
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-foreground font-medium">
                  {todayPlan?.day?.name} · {activeTemplate.name}
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {todayPlan?.day?.muscleGroups.map((group) => MUSCLE_GROUP_NAMES[group]).join(" / ") || "未设置训练部位"}
                </Text>
                <View className="mt-4 gap-2">
                  {todayPlan?.day?.exercises.map((exercise) => {
                    const meta = state.exercises.find((item) => item.id === exercise.exerciseId);
                    return (
                      <View key={exercise.id} className="bg-background rounded-2xl px-4 py-3 border border-border/70">
                        <Text className="text-foreground font-medium">{meta?.name || "动作"}</Text>
                        <Text className="text-muted text-sm">
                          {exercise.sets} 组 × {exercise.reps} 次{exercise.weight ? ` · ${exercise.weight}kg` : ""}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* AI 助手建议 */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-3xl p-5 border border-border/70 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">AI 助手今日建议</Text>
              <TouchableOpacity onPress={() => router.push("/profile/ai")} activeOpacity={0.7}>
                <Text className="text-primary">打开助手</Text>
              </TouchableOpacity>
            </View>
            {aiTips.length === 0 ? (
              <Text className="text-muted">暂无建议，开始记录数据后可获得更多洞察。</Text>
            ) : (
              <View className="gap-2">
                {aiTips.map((tip, index) => (
                  <Text key={`${tip}-${index}`} className="text-foreground">• {tip}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 快捷入口 */}
        <View className="px-5 mb-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/training/exercises")}
              className="flex-1 bg-surface rounded-2xl p-4 border border-border/70 items-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="list.bullet" size={28} color={colors.primary} />
              <Text className="text-foreground font-medium mt-2">动作库</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/training/templates")}
              className="flex-1 bg-surface rounded-2xl p-4 border border-border/70 items-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="doc.text" size={28} color={colors.primary} />
              <Text className="text-foreground font-medium mt-2">训练模板</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 训练模板列表 */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">训练模板</Text>
            <TouchableOpacity onPress={() => router.push("/training/templates")} activeOpacity={0.7}>
              <Text className="text-primary">查看全部</Text>
            </TouchableOpacity>
          </View>

          {state.workoutTemplates.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border/70 items-center">
              <IconSymbol name="doc.text" size={40} color={colors.muted} />
              <Text className="text-muted mt-3 text-center">暂无训练模板{"\n"}点击“训练模板”创建</Text>
            </View>
          ) : (
            <View className="gap-3">
              {state.workoutTemplates.slice(0, 3).map((template) => (
                <TouchableOpacity
                  key={template.id}
                  onPress={() => router.push("/training/templates")}
                  className="bg-surface rounded-2xl p-4 border border-border/70"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-foreground font-medium text-base">{template.name}</Text>
                      <Text className="text-muted text-sm mt-1">
                        {template.days.length} 天训练 · {template.days.reduce((sum, day) => sum + day.exercises.length, 0)} 个动作
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 最近训练 */}
        {state.workoutSessions.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold text-foreground mb-4">最近训练</Text>
            <View className="gap-3">
              {state.workoutSessions.slice(-3).reverse().map((session) => (
                <View key={session.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-foreground font-medium">{session.templateName || "自由训练"}</Text>
                      <Text className="text-muted text-sm mt-1">{session.date} · {session.sets.length} 组</Text>
                    </View>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-primary text-sm">
                        {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5) || "进行中"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
