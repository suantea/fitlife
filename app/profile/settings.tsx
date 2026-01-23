import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import type { WeightUnit, ActivityLevel, NutritionGoal } from "@/lib/types";
import { ACTIVITY_LEVEL_NAMES, NUTRITION_GOAL_NAMES } from "@/lib/types";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, updateUserProfile } = useApp();
  
  const [height, setHeight] = useState(state.userProfile.height?.toString() || "");
  const [age, setAge] = useState(state.userProfile.age?.toString() || "");
  const [gender, setGender] = useState<"male" | "female" | "other">(state.userProfile.gender || "male");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(state.userProfile.weightUnit);
  const [restTimerMode, setRestTimerMode] = useState(state.userProfile.restTimerMode);
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(state.userProfile.defaultRestSeconds.toString());
  const [includeWarmupInStats, setIncludeWarmupInStats] = useState(state.userProfile.includeWarmupInStats);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(state.userProfile.activityLevel);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(state.userProfile.nutritionGoal);
  const [sleepHours, setSleepHours] = useState(state.userProfile.sleepHours?.toString() || "");

  const handleSave = async () => {
    try {
      await updateUserProfile({
        height: parseFloat(height) || undefined,
        age: parseInt(age) || undefined,
        gender: gender as "male" | "female" | "other",
        weightUnit,
        restTimerMode,
        defaultRestSeconds: parseInt(defaultRestSeconds) || 90,
        includeWarmupInStats,
        activityLevel,
        nutritionGoal,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      });
      Alert.alert("成功", "设置已保存");
    } catch {
      Alert.alert("错误", "保存失败，请重试");
    }
  };

  return (
    <ScreenContainer className="flex-1">
      {/* 头部 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">设置</Text>
        <TouchableOpacity onPress={handleSave} className="p-1">
          <Text className="text-primary font-semibold">保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 个人信息 */}
        <View className="px-5 py-4">
          <Text className="text-foreground font-semibold mb-4">个人信息</Text>
          
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* 身高 */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-foreground">身高</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="170"
                  placeholderTextColor={colors.muted}
                  className="text-foreground text-right w-20"
                />
                <Text className="text-muted">cm</Text>
              </View>
            </View>

            {/* 年龄 */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-foreground">年龄</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholder="25"
                  placeholderTextColor={colors.muted}
                  className="text-foreground text-right w-20"
                />
                <Text className="text-muted">岁</Text>
              </View>
            </View>

            {/* 性别 */}
            <View className="flex-row items-center justify-between p-4">
              <Text className="text-foreground">性别</Text>
              <View className="flex-row gap-2">
                {[
                  { value: "male", label: "男" },
                  { value: "female", label: "女" },
                  { value: "other", label: "其他" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setGender(option.value as "male" | "female" | "other")}
                    className={`px-4 py-2 rounded-lg ${
                      gender === option.value ? "bg-primary" : "bg-background border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={gender === option.value ? "text-background" : "text-foreground"}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 单位设置 */}
        <View className="px-5 py-4">
          <Text className="text-foreground font-semibold mb-4">单位设置</Text>
          
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            <View className="flex-row items-center justify-between p-4">
              <Text className="text-foreground">重量单位</Text>
              <View className="flex-row gap-2">
                {[
                  { value: "kg", label: "公斤 (kg)" },
                  { value: "lb", label: "磅 (lb)" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setWeightUnit(option.value as WeightUnit)}
                    className={`px-4 py-2 rounded-lg ${
                      weightUnit === option.value ? "bg-primary" : "bg-background border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={weightUnit === option.value ? "text-background" : "text-foreground"}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 计时器设置 */}
        <View className="px-5 py-4">
          <Text className="text-foreground font-semibold mb-4">休息计时器</Text>
          
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* 计时模式 */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-foreground">默认模式</Text>
              <View className="flex-row gap-2">
                {[
                  { value: "countUp", label: "正计时" },
                  { value: "countDown", label: "倒计时" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setRestTimerMode(option.value as "countUp" | "countDown")}
                    className={`px-4 py-2 rounded-lg ${
                      restTimerMode === option.value ? "bg-primary" : "bg-background border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={restTimerMode === option.value ? "text-background" : "text-foreground"}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 默认休息时间 */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-foreground">默认休息时间</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={defaultRestSeconds}
                  onChangeText={setDefaultRestSeconds}
                  keyboardType="number-pad"
                  placeholder="90"
                  placeholderTextColor={colors.muted}
                  className="text-foreground text-right w-20"
                />
                <Text className="text-muted">秒</Text>
              </View>
            </View>

            {/* 热身组统计 */}
            <TouchableOpacity
              onPress={() => setIncludeWarmupInStats(!includeWarmupInStats)}
              className="flex-row items-center justify-between p-4"
              activeOpacity={0.7}
            >
              <View className="flex-1">
                <Text className="text-foreground">统计包含热身组</Text>
                <Text className="text-muted text-sm">计算总组数和总容量时是否包含热身组</Text>
              </View>
              <View className={`w-12 h-7 rounded-full ${includeWarmupInStats ? "bg-primary" : "bg-muted/30"} justify-center px-1`}>
                <View className={`w-5 h-5 rounded-full bg-background ${includeWarmupInStats ? "self-end" : "self-start"}`} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 饮食与恢复 */}
        <View className="px-5 py-4">
          <Text className="text-foreground font-semibold mb-4">饮食与恢复</Text>

          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* 活动水平 */}
            <View className="p-4 border-b border-border">
              <Text className="text-foreground mb-3">活动水平</Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(ACTIVITY_LEVEL_NAMES) as ActivityLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setActivityLevel(level)}
                    className={`px-3 py-2 rounded-lg ${
                      activityLevel === level ? "bg-primary" : "bg-background border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={activityLevel === level ? "text-background text-sm" : "text-foreground text-sm"}>
                      {ACTIVITY_LEVEL_NAMES[level]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 饮食目标 */}
            <View className="p-4 border-b border-border">
              <Text className="text-foreground mb-3">饮食目标</Text>
              <View className="flex-row gap-2">
                {(Object.keys(NUTRITION_GOAL_NAMES) as NutritionGoal[]).map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => setNutritionGoal(goal)}
                    className={`flex-1 py-2 rounded-lg items-center ${
                      nutritionGoal === goal ? "bg-primary" : "bg-background border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={nutritionGoal === goal ? "text-background" : "text-foreground"}>
                      {NUTRITION_GOAL_NAMES[goal]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 睡眠时长 */}
            <View className="flex-row items-center justify-between p-4">
              <Text className="text-foreground">近期平均睡眠</Text>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={sleepHours}
                  onChangeText={setSleepHours}
                  keyboardType="decimal-pad"
                  placeholder="7.5"
                  placeholderTextColor={colors.muted}
                  className="text-foreground text-right w-20"
                />
                <Text className="text-muted">小时</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 关于 */}
        <View className="px-5 py-4">
          <Text className="text-foreground font-semibold mb-4">关于</Text>
          
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-foreground">版本</Text>
              <Text className="text-muted">1.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between p-4">
              <Text className="text-foreground">开发者</Text>
              <Text className="text-muted">健康训练记录</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
