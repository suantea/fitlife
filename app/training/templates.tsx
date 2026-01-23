import { useMemo } from "react";
import { Text, View, TouchableOpacity, FlatList, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { getTodayString } from "@/lib/storage";
import { getPlanForDate } from "@/lib/training-plan";
import type { WorkoutTemplate } from "@/lib/types";

export default function TemplatesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, deleteWorkoutTemplate, updateWorkoutTemplate, updateUserProfile, startWorkoutSession } = useApp();

  const activeTemplateId = state.userProfile.activeWorkoutTemplateId;

  const templates = useMemo(() => {
    return [...state.workoutTemplates].sort((a, b) => {
      if (a.id === activeTemplateId) return -1;
      if (b.id === activeTemplateId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [state.workoutTemplates, activeTemplateId]);

  if (state.isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const handleEdit = (templateId: string) => {
    router.push({ pathname: "/training/template-editor", params: { id: templateId } });
  };

  const handleDelete = (template: WorkoutTemplate) => {
    if (template.isPreset) {
      Alert.alert("提示", "预设模板无法删除");
      return;
    }

    Alert.alert("删除模板", `确定要删除\"${template.name}\"吗？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => deleteWorkoutTemplate(template.id) },
    ]);
  };

  const handleSetActive = async (template: WorkoutTemplate) => {
    await updateUserProfile({ activeWorkoutTemplateId: template.id });
    if (!template.schedule.startDate) {
      await updateWorkoutTemplate({
        ...template,
        schedule: {
          ...template.schedule,
          startDate: getTodayString(),
        },
      });
    }
  };

  const handleStart = (template: WorkoutTemplate) => {
    const plan = getPlanForDate(template, getTodayString());
    if (plan.isRestDay || !plan.day) {
      Alert.alert("今日为休息日", "今天没有安排训练，可改为自由训练。",
        [
          { text: "取消", style: "cancel" },
          {
            text: "开始自由训练",
            onPress: () => {
              startWorkoutSession();
              router.push("/training/session");
            },
          },
        ]
      );
      return;
    }

    startWorkoutSession(template, {
      dayIndex: plan.dayIndex,
      dayName: plan.day.name,
      muscleGroups: plan.day.muscleGroups,
      exercises: plan.day.exercises,
    });
    router.push("/training/session");
  };

  const renderItem = ({ item }: { item: WorkoutTemplate }) => {
    const isActive = item.id === activeTemplateId;
    const cycleLength = item.schedule.trainingDaysPerWeek + item.schedule.restDaysBetweenCycles;
    const totalExercises = item.days.reduce((sum, day) => sum + day.exercises.length, 0);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.icon }]}>
              训练 {item.schedule.trainingDaysPerWeek} 天 · 休息 {item.schedule.restDaysBetweenCycles} 天 · 周期 {cycleLength} 天
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.tint }]}
            onPress={() => handleStart(item)}
          >
            <Text style={styles.startBtnText}>开始</Text>
          </TouchableOpacity>
        </View>

        {item.description ? (
          <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={[styles.metaBadge, { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.text, fontSize: 12 }}>{item.days.length} 天训练</Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: colors.text, fontSize: 12 }}>{totalExercises} 个动作</Text>
          </View>
          {isActive && (
            <View style={[styles.metaBadge, { backgroundColor: colors.tint + "22" }]}
            >
              <Text style={{ color: colors.tint, fontSize: 12 }}>当前计划</Text>
            </View>
          )}
        </View>

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item.id)}>
            <IconSymbol name="pencil" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetActive(item)}>
            <IconSymbol name={isActive ? "checkmark" : "star"} size={20} color={isActive ? colors.primary : colors.text} />
            <Text style={[styles.actionText, { color: isActive ? colors.primary : colors.text }]}>设为当前</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
            <IconSymbol name="trash" size={20} color="red" />
            <Text style={[styles.actionText, { color: "red" }]}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>训练计划</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.tint }]}
          onPress={() => router.push("/training/template-editor")}
        >
          <IconSymbol name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.icon, marginTop: 20 }}>还没有创建任何训练计划</Text>
            <Text style={{ color: colors.icon, marginTop: 8 }}>点击右上角 + 创建一个新的</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  startBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
    flexWrap: "wrap",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
});
