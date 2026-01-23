import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, FlatList, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ExercisePicker } from "@/components/exercise-picker";
import { useApp } from "@/lib/app-context";
import { generateId, getCurrentTimeString } from "@/lib/storage";
import type { WorkoutSet, Exercise } from "@/lib/types";
import { MUSCLE_GROUP_NAMES } from "@/lib/types";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function WorkoutSessionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, endWorkoutSession, addSetToSession, updateSetInSession, deleteSetFromSession } = useApp();
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [isWarmup, setIsWarmup] = useState(false);
  
  // 休息计时器状态
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState<"countUp" | "countDown">(state.userProfile.restTimerMode);
  const [targetRestSeconds, setTargetRestSeconds] = useState(state.userProfile.defaultRestSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 训练时长
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 如果没有当前会话，返回
  useEffect(() => {
    if (!state.currentSession) {
      router.back();
    }
  }, [state.currentSession, router]);

  // 训练计时器
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // 休息计时器
  useEffect(() => {
    if (isResting) {
      timerRef.current = setInterval(() => {
        setRestSeconds(prev => {
          if (timerMode === "countDown" && prev <= 1) {
            // 倒计时结束
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setIsResting(false);
            return 0;
          }
          return timerMode === "countUp" ? prev + 1 : prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isResting, timerMode]);

  useEffect(() => {
    const planned = state.currentSession?.plan?.exercises;
    if (!selectedExercise && planned && planned.length > 0) {
      const first = planned[0];
      const meta = state.exercises.find((exercise) => exercise.id === first.exerciseId);
      if (meta) {
        setSelectedExercise(meta);
      }
    }
  }, [selectedExercise, state.currentSession?.plan?.exercises, state.exercises]);

  useEffect(() => {
    if (!selectedExercise) return;
    const planned = state.currentSession?.plan?.exercises?.find(
      (exercise) => exercise.exerciseId === selectedExercise.id
    );
    if (planned?.restSeconds) {
      setTargetRestSeconds(planned.restSeconds);
    }
    if (planned?.weight && weight === "") {
      setWeight(String(planned.weight));
    }
    if (planned?.reps && reps === "") {
      setReps(String(planned.reps));
    }
  }, [selectedExercise, state.currentSession?.plan?.exercises, weight, reps]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRest = () => {
    setRestSeconds(timerMode === "countDown" ? targetRestSeconds : 0);
    setIsResting(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStopRest = () => {
    setIsResting(false);
    setRestSeconds(0);
  };

  const handleAdjustTime = (delta: number) => {
    if (timerMode === "countDown") {
      setTargetRestSeconds(prev => Math.max(15, prev + delta));
      if (isResting) {
        setRestSeconds(prev => Math.max(0, prev + delta));
      }
    } else {
      setRestSeconds(prev => Math.max(0, prev + delta));
    }
  };

  const handleAddSet = useCallback(() => {
    if (!selectedExercise) {
      Alert.alert("提示", "请先选择动作");
      return;
    }
    
    const weightNum = parseFloat(weight) || 0;
    const repsNum = parseInt(reps) || 0;
    
    if (weightNum <= 0 || repsNum <= 0) {
      Alert.alert("提示", "请输入有效的重量和次数");
      return;
    }

    const currentSets = state.currentSession?.sets.filter(s => s.exerciseId === selectedExercise.id) || [];
    const restValue = timerMode === "countDown" ? targetRestSeconds : restSeconds;
    const newSet: Omit<WorkoutSet, "id"> = {
      exerciseId: selectedExercise.id,
      setIndex: currentSets.length + 1,
      isWarmup,
      weight: weightNum,
      reps: repsNum,
      restSeconds: restValue > 0 ? restValue : undefined,
      completedAt: getCurrentTimeString(),
    };

    addSetToSession(newSet);
    
    // 重置输入但保留重量（通常下一组重量相同）
    setReps("");
    setIsWarmup(false);
    
    // 开始休息计时
    handleStartRest();
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [selectedExercise, weight, reps, isWarmup, restSeconds, timerMode, targetRestSeconds, state.currentSession, addSetToSession]);

  const handleEndWorkout = () => {
    Alert.alert(
      "结束训练",
      "确定要结束本次训练吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: async () => {
            await endWorkoutSession();
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteSet = (setId: string) => {
    Alert.alert(
      "删除组",
      "确定要删除这一组吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => deleteSetFromSession(setId),
        },
      ]
    );
  };

  // 获取当前动作的组数
  const currentExerciseSets = selectedExercise
    ? state.currentSession?.sets.filter(s => s.exerciseId === selectedExercise.id) || []
    : [];

  // 获取上次该动作的表现
  const getLastPerformance = (exerciseId: string) => {
    const lastSession = state.workoutSessions
      .filter(s => s.sets.some(set => set.exerciseId === exerciseId))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    
    if (!lastSession) return null;
    
    const sets = lastSession.sets.filter(s => s.exerciseId === exerciseId && !s.isWarmup);
    if (sets.length === 0) return null;
    
    const maxWeight = Math.max(...sets.map(s => s.weight));
    const maxSet = sets.find(s => s.weight === maxWeight);
    return maxSet ? `${maxSet.weight}kg × ${maxSet.reps}` : null;
  };

  if (!state.currentSession) {
    return null;
  }

  const plannedExercises = state.currentSession.plan?.exercises || [];
  const getPlannedProgress = (exerciseId: string): { completed: number; target: number } | null => {
    const planned = plannedExercises.find((ex) => ex.exerciseId === exerciseId);
    if (!planned) return null;
    const completed = state.currentSession?.sets.filter(
      (set) => set.exerciseId === exerciseId && !set.isWarmup
    ).length;
    return { completed, target: planned.sets };
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="flex-1">
      {/* 顶部栏 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <View>
          <Text className="text-xl font-bold text-foreground">
            {state.currentSession.templateName || "自由训练"}
          </Text>
          <Text className="text-muted text-sm">
            {state.currentSession.startTime?.slice(0, 5)} · {formatTime(elapsedSeconds)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleEndWorkout}
          className="bg-error px-4 py-2 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-background font-semibold">结束训练</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 今日计划 */}
        {plannedExercises.length > 0 && (
          <View className="px-5 py-4">
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground font-semibold mb-3">
                今日计划 {state.currentSession.plan?.dayName ? `· ${state.currentSession.plan?.dayName}` : ""}
              </Text>
              <View className="gap-2">
                {plannedExercises.map((exercise) => {
                  const meta = state.exercises.find((item) => item.id === exercise.exerciseId);
                  const progress = getPlannedProgress(exercise.exerciseId);
                  const isSelected = selectedExercise?.id === exercise.exerciseId;
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => meta && setSelectedExercise(meta)}
                      className={`rounded-xl px-4 py-3 border ${isSelected ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-foreground font-medium">{meta?.name || "动作"}</Text>
                          <Text className="text-muted text-sm">
                            {exercise.sets} 组 × {exercise.reps} 次{exercise.weight ? ` · ${exercise.weight}kg` : ""}
                          </Text>
                        </View>
                        {progress && (
                          <View className="items-end">
                            <Text className="text-primary text-sm font-semibold">
                              {Math.min(progress.completed, progress.target)}/{progress.target}
                            </Text>
                            <Text className="text-muted text-xs">完成组数</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* 动作选择 */}
        <View className="px-5 py-4">
          <TouchableOpacity
            onPress={() => setShowExercisePicker(true)}
            className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            {selectedExercise ? (
              <View>
                <Text className="text-foreground font-semibold text-lg">
                  {selectedExercise.name}
                </Text>
                <Text className="text-muted text-sm">
                  {MUSCLE_GROUP_NAMES[selectedExercise.muscleGroup]}
                  {getLastPerformance(selectedExercise.id) && ` · 上次: ${getLastPerformance(selectedExercise.id)}`}
                </Text>
              </View>
            ) : (
              <Text className="text-muted">点击选择动作</Text>
            )}
            <IconSymbol name="chevron.down" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* 当前动作的组列表 */}
        {selectedExercise && currentExerciseSets.length > 0 && (
          <View className="px-5 mb-4">
            <Text className="text-foreground font-semibold mb-3">已完成的组</Text>
            {currentExerciseSets.map((set, index) => (
              <View
                key={set.id}
                className="bg-surface rounded-xl p-3 mb-2 flex-row items-center justify-between border border-border"
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${set.isWarmup ? "bg-warning/20" : "bg-primary/20"}`}>
                    <Text className={set.isWarmup ? "text-warning font-semibold" : "text-primary font-semibold"}>
                      {index + 1}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-foreground">
                      {set.weight} kg × {set.reps}
                    </Text>
                    <Text className="text-muted text-xs">
                      {set.isWarmup ? "热身组" : "正式组"}
                      {set.restSeconds && ` · 休息 ${set.restSeconds}s`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteSet(set.id)}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 新增组输入 */}
        {selectedExercise && (
          <View className="px-5 mb-4">
            <Text className="text-foreground font-semibold mb-3">添加新组</Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              {/* 热身组开关 */}
              <TouchableOpacity
                onPress={() => setIsWarmup(!isWarmup)}
                className="flex-row items-center justify-between mb-4 pb-4 border-b border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground">热身组</Text>
                <View className={`w-12 h-7 rounded-full ${isWarmup ? "bg-warning" : "bg-muted/30"} justify-center px-1`}>
                  <View className={`w-5 h-5 rounded-full bg-background ${isWarmup ? "self-end" : "self-start"}`} />
                </View>
              </TouchableOpacity>

              {/* 重量和次数输入 */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-2">重量 (kg)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    className="bg-background rounded-xl px-4 py-3 text-foreground text-lg text-center border border-border"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-2">次数</Text>
                  <TextInput
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    className="bg-background rounded-xl px-4 py-3 text-foreground text-lg text-center border border-border"
                  />
                </View>
              </View>

              {/* 添加按钮 */}
              <TouchableOpacity
                onPress={handleAddSet}
                className="bg-primary rounded-xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold text-lg">完成这一组</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 休息计时器 */}
        <View className="px-5">
          <Text className="text-foreground font-semibold mb-3">休息计时</Text>
          <View className="bg-surface rounded-xl p-5 border border-border items-center">
            {/* 计时显示 */}
            <Text className="text-6xl font-bold text-foreground mb-4">
              {timerMode === "countDown" 
                ? formatTime(isResting ? restSeconds : targetRestSeconds)
                : formatTime(restSeconds)
              }
            </Text>

            {/* 时间调整 */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() => handleAdjustTime(-15)}
                className="bg-background px-4 py-2 rounded-lg border border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground">-15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAdjustTime(-30)}
                className="bg-background px-4 py-2 rounded-lg border border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground">-30s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAdjustTime(15)}
                className="bg-background px-4 py-2 rounded-lg border border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground">+15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAdjustTime(30)}
                className="bg-background px-4 py-2 rounded-lg border border-border"
                activeOpacity={0.7}
              >
                <Text className="text-foreground">+30s</Text>
              </TouchableOpacity>
            </View>

            {/* 控制按钮 */}
            <View className="flex-row gap-3">
              {isResting ? (
                <>
                  <TouchableOpacity
                    onPress={handleStopRest}
                    className="bg-error px-6 py-3 rounded-xl"
                    activeOpacity={0.8}
                  >
                    <Text className="text-background font-semibold">停止</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsResting(false);
                      setRestSeconds(0);
                    }}
                    className="bg-muted/30 px-6 py-3 rounded-xl"
                    activeOpacity={0.8}
                  >
                    <Text className="text-foreground font-semibold">重置</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleStartRest}
                  className="bg-primary px-8 py-3 rounded-xl"
                  activeOpacity={0.8}
                >
                  <Text className="text-background font-semibold">开始休息</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 模式切换 */}
            <TouchableOpacity
              onPress={() => setTimerMode(prev => prev === "countUp" ? "countDown" : "countUp")}
              className="mt-4"
              activeOpacity={0.7}
            >
              <Text className="text-primary text-sm">
                {timerMode === "countUp" ? "切换到倒计时" : "切换到正计时"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ExercisePicker
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={(exercise) => {
          setSelectedExercise(exercise);
          setShowExercisePicker(false);
        }}
      />
    </ScreenContainer>
  );
}
