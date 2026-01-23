import { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ExercisePicker } from "@/components/exercise-picker";
import { useApp } from "@/lib/app-context";
import { generateId, getTodayString } from "@/lib/storage";
import { MUSCLE_GROUP_NAMES, type MuscleGroup, type TemplateDay, type TemplateExercise, type Exercise } from "@/lib/types";

const MUSCLE_GROUPS: MuscleGroup[] = ["chest", "back", "shoulders", "arms", "legs", "core"];

export default function TemplateEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const colors = useColors();
  const { state, addWorkoutTemplate, updateWorkoutTemplate } = useApp();

  const editingTemplate = useMemo(() => {
    if (!params.id) return undefined;
    return state.workoutTemplates.find((t) => t.id === params.id);
  }, [params.id, state.workoutTemplates]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trainingDays, setTrainingDays] = useState(3);
  const [restDays, setRestDays] = useState(0);
  const [days, setDays] = useState<TemplateDay[]>([]);
  const [activeDayIndex, setActiveDayIndex] = useState(1);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (!editingTemplate) {
      const initialDays: TemplateDay[] = Array.from({ length: trainingDays }, (_, index) => ({
        dayIndex: index + 1,
        name: `训练日 ${index + 1}`,
        muscleGroups: [],
        exercises: [],
      }));
      setDays(initialDays);
      return;
    }

    setName(editingTemplate.name);
    setDescription(editingTemplate.description || "");
    setTrainingDays(editingTemplate.schedule.trainingDaysPerWeek);
    setRestDays(editingTemplate.schedule.restDaysBetweenCycles);
    setDays(editingTemplate.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        id: exercise.id || generateId(),
      })),
    })));
    setActiveDayIndex(editingTemplate.days[0]?.dayIndex || 1);
  }, [editingTemplate]);

  useEffect(() => {
    setDays((prevDays) => {
      if (prevDays.length === trainingDays) return prevDays;
      if (prevDays.length > trainingDays) {
        return prevDays.slice(0, trainingDays).map((day, index) => ({ ...day, dayIndex: index + 1 }));
      }
      const newDays = [...prevDays];
      for (let i = prevDays.length; i < trainingDays; i += 1) {
        newDays.push({
          dayIndex: i + 1,
          name: `训练日 ${i + 1}`,
          muscleGroups: [],
          exercises: [],
        });
      }
      return newDays;
    });
  }, [trainingDays]);

  useEffect(() => {
    setActiveDayIndex((prev) => Math.min(prev, trainingDays));
  }, [trainingDays]);

  const currentDay = days.find((day) => day.dayIndex === activeDayIndex);

  const handleSelectExercise = (exercise: Exercise) => {
    setDays((prev) => prev.map((day) => {
      if (day.dayIndex !== activeDayIndex) return day;
      const newExercise: TemplateExercise = {
        id: generateId(),
        exerciseId: exercise.id,
        order: day.exercises.length + 1,
        sets: exercise.defaultSets ?? 3,
        reps: exercise.defaultReps ?? 10,
        weight: exercise.defaultWeight,
      };
      return {
        ...day,
        exercises: [...day.exercises, newExercise],
      };
    }));
    setPickerVisible(false);
  };

  const updateExercise = (exerciseId: string, field: keyof TemplateExercise, value: string) => {
    setDays((prevDays) => prevDays.map((day) => {
      if (day.dayIndex !== activeDayIndex) return day;
      const numericValue = value.trim() === "" ? undefined : Number(value);
      const nextValue = field === "notes"
        ? value
        : field === "sets" || field === "reps"
          ? numericValue ?? 0
          : numericValue;
      return {
        ...day,
        exercises: day.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                [field]: nextValue,
              }
            : exercise
        ),
      };
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setDays((prevDays) => prevDays.map((day) => {
      if (day.dayIndex !== activeDayIndex) return day;
      return {
        ...day,
        exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId).map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        })),
      };
    }));
  };

  const toggleMuscleGroup = (group: MuscleGroup) => {
    setDays((prevDays) => prevDays.map((day) => {
      if (day.dayIndex !== activeDayIndex) return day;
      const hasGroup = day.muscleGroups.includes(group);
      return {
        ...day,
        muscleGroups: hasGroup
          ? day.muscleGroups.filter((g) => g !== group)
          : [...day.muscleGroups, group],
      };
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("错误", "请输入模板名称");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      days: days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        })),
      })),
      schedule: {
        trainingDaysPerWeek: trainingDays,
        restDaysBetweenCycles: restDays,
        startDate: editingTemplate?.schedule.startDate || getTodayString(),
      },
      updatedAt: new Date().toISOString(),
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      isPreset: editingTemplate?.isPreset,
    };

    try {
      if (editingTemplate) {
        await updateWorkoutTemplate({ ...editingTemplate, ...payload });
      } else {
        await addWorkoutTemplate(payload);
      }
      Alert.alert("成功", "模板已保存");
      router.back();
    } catch (error) {
      Alert.alert("错误", error instanceof Error ? error.message : "保存失败");
    }
  };

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: editingTemplate ? "编辑模板" : "新建模板" }} />

      <ScrollView contentContainerStyle={styles.pageContent}>
        <View style={styles.header}>
          <TextInput
            style={[styles.nameInput, { color: colors.text }]}
            placeholder="模板名称"
            placeholderTextColor={colors.icon}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.descInput, { color: colors.text }]}
            placeholder="描述 (可选)"
            placeholderTextColor={colors.icon}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>训练周期</Text>
          <View style={styles.cycleRow}>
            <View style={styles.cycleItem}>
              <Text style={[styles.cycleLabel, { color: colors.icon }]}>每周训练天数</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border }]}
                  onPress={() => setTrainingDays(Math.max(1, trainingDays - 1))}
                >
                  <Text style={{ color: colors.text }}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.text }]}>{trainingDays}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border }]}
                  onPress={() => setTrainingDays(Math.min(7, trainingDays + 1))}
                >
                  <Text style={{ color: colors.text }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cycleItem}>
              <Text style={[styles.cycleLabel, { color: colors.icon }]}>轮次间休息</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border }]}
                  onPress={() => setRestDays(Math.max(0, restDays - 1))}
                >
                  <Text style={{ color: colors.text }}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.text }]}>{restDays}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { borderColor: colors.border }]}
                  onPress={() => setRestDays(Math.min(7, restDays + 1))}
                >
                  <Text style={{ color: colors.text }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.daysTabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysTabContent}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.dayIndex}
                style={[
                  styles.dayTab,
                  activeDayIndex === day.dayIndex && { backgroundColor: colors.tint, borderColor: colors.tint },
                  { borderColor: colors.border },
                ]}
                onPress={() => setActiveDayIndex(day.dayIndex)}
              >
                <Text style={[styles.dayTabText, { color: activeDayIndex === day.dayIndex ? "#fff" : colors.text }]}>
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {currentDay ? (
          <View style={styles.dayContent}>
            <View style={styles.dayHeader}>
              <TextInput
                style={[styles.dayNameInput, { color: colors.text, borderBottomColor: colors.border }]}
                value={currentDay.name}
                onChangeText={(text) => {
                  setDays(days.map((day) =>
                    day.dayIndex === activeDayIndex ? { ...day, name: text } : day
                  ));
                }}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>训练部位</Text>
              <View style={styles.tagRow}>
                {MUSCLE_GROUPS.map((group) => {
                  const selected = currentDay.muscleGroups.includes(group);
                  return (
                    <TouchableOpacity
                      key={group}
                      onPress={() => toggleMuscleGroup(group)}
                      style={[
                        styles.tag,
                        selected ? { backgroundColor: colors.tint } : { borderColor: colors.border },
                      ]}
                    >
                      <Text style={{ color: selected ? "#fff" : colors.text }}>
                        {MUSCLE_GROUP_NAMES[group]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>训练动作</Text>
              {currentDay.exercises.map((exercise, index) => (
                <View
                  key={exercise.id}
                  style={[styles.exerciseCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>#{index + 1} {state.exercises.find((e) => e.id === exercise.exerciseId)?.name || "动作"}</Text>
                    <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                      <IconSymbol name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.exerciseRow}>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.icon }]}>组数</Text>
                      <TextInput
                        style={[styles.numberInput, { color: colors.text, borderColor: colors.border }]}
                        keyboardType="numeric"
                        value={String(exercise.sets)}
                        onChangeText={(value) => updateExercise(exercise.id, "sets", value)}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.icon }]}>次数</Text>
                      <TextInput
                        style={[styles.numberInput, { color: colors.text, borderColor: colors.border }]}
                        keyboardType="numeric"
                        value={String(exercise.reps)}
                        onChangeText={(value) => updateExercise(exercise.id, "reps", value)}
                      />
                    </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.icon }]}>重量(kg)</Text>
                    <TextInput
                      style={[styles.numberInput, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="decimal-pad"
                      placeholder="-"
                      placeholderTextColor={colors.icon}
                      value={exercise.weight ? String(exercise.weight) : ""}
                      onChangeText={(value) => updateExercise(exercise.id, "weight", value)}
                    />
                  </View>
                </View>
                <View style={styles.exerciseRowSecondary}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.icon }]}>组间休息(秒)</Text>
                    <TextInput
                      style={[styles.numberInput, { color: colors.text, borderColor: colors.border }]}
                      keyboardType="numeric"
                      placeholder="-"
                      placeholderTextColor={colors.icon}
                      value={exercise.restSeconds ? String(exercise.restSeconds) : ""}
                      onChangeText={(value) => updateExercise(exercise.id, "restSeconds", value)}
                    />
                  </View>
                </View>
              </View>
            ))}
            </View>

            <TouchableOpacity
              style={[styles.addExerciseBtn, { backgroundColor: colors.tint }]}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={styles.addExerciseText}>+ 添加动作</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}
      >
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.tint }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>保存模板</Text>
        </TouchableOpacity>
      </View>

      <ExercisePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectExercise}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingBottom: 140,
  },
  header: {
    padding: 16,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  descInput: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  cycleRow: {
    flexDirection: "row",
    gap: 16,
  },
  cycleItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  cycleLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  daysTabContainer: {
    height: 50,
  },
  daysTabContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dayTabText: {
    fontWeight: "600",
  },
  dayContent: {
    paddingBottom: 24,
  },
  dayHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayNameInput: {
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  exerciseCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  exerciseRow: {
    flexDirection: "row",
    gap: 12,
  },
  exerciseRowSecondary: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
  },
  addExerciseBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
  },
  addExerciseText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
