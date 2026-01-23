import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import type { WorkoutSet } from "@/lib/types";

export default function SessionDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { state, updateWorkoutSession, deleteWorkoutSession, getExerciseById } = useApp();

  const session = useMemo(() => {
    if (!params.id) return undefined;
    return state.workoutSessions.find((item) => item.id === params.id);
  }, [params.id, state.workoutSessions]);

  const [editedSets, setEditedSets] = useState<WorkoutSet[]>(session?.sets || []);
  const [notes, setNotes] = useState(session?.notes || "");

  if (!session) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-muted">未找到该训练记录</Text>
      </ScreenContainer>
    );
  }

  const grouped = useMemo<[string, WorkoutSet[]][]>(() => {
    const map: Record<string, WorkoutSet[]> = {};
    editedSets.forEach((set) => {
      if (!map[set.exerciseId]) map[set.exerciseId] = [];
      map[set.exerciseId].push(set);
    });
    return Object.entries(map).map(([exerciseId, sets]) => [
      exerciseId,
      sets.sort((a, b) => a.setIndex - b.setIndex),
    ]);
  }, [editedSets]);

  const handleUpdateSet = (setId: string, field: keyof WorkoutSet, value: string | boolean) => {
    setEditedSets((prev) => prev.map((set) => {
      if (set.id !== setId) return set;
      return {
        ...set,
        [field]: typeof value === "string" ? Number(value) : value,
      } as WorkoutSet;
    }));
  };

  const handleDeleteSet = (setId: string) => {
    Alert.alert("删除组", "确定要删除这一组吗？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => setEditedSets((prev) => prev.filter((s) => s.id !== setId)) },
    ]);
  };

  const handleSave = async () => {
    try {
      await updateWorkoutSession({ ...session, sets: editedSets, notes: notes.trim() || undefined });
      Alert.alert("成功", "记录已更新");
      router.back();
    } catch {
      Alert.alert("错误", "保存失败");
    }
  };

  const handleDeleteSession = () => {
    Alert.alert("删除训练记录", "确定要删除该训练记录吗？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => {
        await deleteWorkoutSession(session.id);
        router.back();
      } },
    ]);
  };

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">训练记录</Text>
        <TouchableOpacity onPress={handleDeleteSession} className="p-1">
          <IconSymbol name="trash" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 py-4">
          <Text className="text-foreground font-semibold text-lg">{session.templateName || "自由训练"}</Text>
          <Text className="text-muted text-sm mt-1">
            {session.date} · {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5) || "进行中"}
          </Text>
        </View>

        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold mb-2">训练备注</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="记录本次训练感受..."
            placeholderTextColor={colors.muted}
            className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
            multiline
          />
        </View>

        {grouped.map(([exerciseId, sets]) => (
          <View key={exerciseId} className="px-5 mb-4">
            <Text className="text-foreground font-semibold mb-2">
              {getExerciseById(exerciseId)?.name || "动作"}
            </Text>
            <View className="bg-surface rounded-xl border border-border overflow-hidden">
              {sets.map((set, index) => (
                <View key={set.id} className="border-b border-border p-3 last:border-b-0">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-muted">第 {index + 1} 组</Text>
                    <TouchableOpacity onPress={() => handleDeleteSet(set.id)}>
                      <IconSymbol name="trash" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-3">
                    <TextInput
                      value={String(set.weight)}
                      onChangeText={(value) => handleUpdateSet(set.id, "weight", value)}
                      keyboardType="decimal-pad"
                      placeholder="重量"
                      placeholderTextColor={colors.muted}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                    />
                    <TextInput
                      value={String(set.reps)}
                      onChangeText={(value) => handleUpdateSet(set.id, "reps", value)}
                      keyboardType="number-pad"
                      placeholder="次数"
                      placeholderTextColor={colors.muted}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                    />
                  </View>
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-muted text-sm">热身组</Text>
                    <TouchableOpacity
                      onPress={() => handleUpdateSet(set.id, "isWarmup", !set.isWarmup)}
                      className={`w-12 h-7 rounded-full ${set.isWarmup ? "bg-warning" : "bg-muted/30"} justify-center px-1`}
                    >
                      <View className={`w-5 h-5 rounded-full bg-background ${set.isWarmup ? "self-end" : "self-start"}`} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-border bg-background">
        <TouchableOpacity onPress={handleSave} className="bg-primary rounded-xl py-4 items-center">
          <Text className="text-background font-semibold">保存修改</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
