import { useState, useMemo } from "react";
import { Text, View, TouchableOpacity, TextInput, FlatList, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import type { Exercise, MuscleGroup, Equipment } from "@/lib/types";
import { MUSCLE_GROUP_NAMES, EQUIPMENT_NAMES } from "@/lib/types";

const MUSCLE_GROUPS: MuscleGroup[] = ["chest", "back", "shoulders", "arms", "legs", "core"];
const EQUIPMENT_LIST: Equipment[] = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "bands", "other"];

export default function ExercisesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, addExercise, updateExercise, deleteExercise } = useApp();

  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // 表单字段
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("chest");
  const [equipment, setEquipment] = useState<Equipment>("barbell");
  const [description, setDescription] = useState("");
  const [defaultSets, setDefaultSets] = useState("");
  const [defaultReps, setDefaultReps] = useState("");
  const [defaultWeight, setDefaultWeight] = useState("");

  const filteredExercises = useMemo(() => {
    let exercises = state.exercises;

    if (selectedGroup !== "all") {
      exercises = exercises.filter((e) => e.muscleGroup === selectedGroup);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter((e) =>
        e.name.toLowerCase().includes(query) || MUSCLE_GROUP_NAMES[e.muscleGroup].includes(query)
      );
    }

    return exercises;
  }, [state.exercises, selectedGroup, searchQuery]);

  const resetForm = () => {
    setName("");
    setMuscleGroup("chest");
    setEquipment("barbell");
    setDescription("");
    setDefaultSets("");
    setDefaultReps("");
    setDefaultWeight("");
  };

  const openAddModal = () => {
    setEditingExercise(null);
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (exercise: Exercise) => {
    if (!exercise.isCustom) {
      Alert.alert("提示", "预设动作无法编辑");
      return;
    }
    setEditingExercise(exercise);
    setName(exercise.name);
    setMuscleGroup(exercise.muscleGroup);
    setEquipment(exercise.equipment);
    setDescription(exercise.description || "");
    setDefaultSets(exercise.defaultSets ? String(exercise.defaultSets) : "");
    setDefaultReps(exercise.defaultReps ? String(exercise.defaultReps) : "");
    setDefaultWeight(exercise.defaultWeight ? String(exercise.defaultWeight) : "");
    setShowFormModal(true);
  };

  const handleSaveExercise = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入动作名称");
      return;
    }

    const payload = {
      name: name.trim(),
      muscleGroup,
      equipment,
      description: description.trim() || undefined,
      defaultSets: defaultSets ? Number(defaultSets) : undefined,
      defaultReps: defaultReps ? Number(defaultReps) : undefined,
      defaultWeight: defaultWeight ? Number(defaultWeight) : undefined,
      isCustom: true,
    };

    try {
      if (editingExercise) {
        await updateExercise({ ...editingExercise, ...payload });
        Alert.alert("成功", "动作已更新");
      } else {
        await addExercise(payload);
        Alert.alert("成功", "动作已添加");
      }
      setShowFormModal(false);
      resetForm();
    } catch {
      Alert.alert("错误", "保存失败，请重试");
    }
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    if (!exercise.isCustom) {
      Alert.alert("提示", "预设动作不能删除");
      return;
    }

    Alert.alert("删除动作", `确定要删除\"${exercise.name}\"吗？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => deleteExercise(exercise.id) },
    ]);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDeleteExercise(item)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-foreground font-medium text-base">{item.name}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-primary/10 px-2 py-0.5 rounded">
              <Text className="text-primary text-xs">{MUSCLE_GROUP_NAMES[item.muscleGroup]}</Text>
            </View>
            <Text className="text-muted text-xs">{EQUIPMENT_NAMES[item.equipment]}</Text>
            {item.isCustom && (
              <View className="bg-warning/10 px-2 py-0.5 rounded">
                <Text className="text-warning text-xs">自定义</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {item.defaultSets || item.defaultReps || item.defaultWeight ? (
        <Text className="text-muted text-sm mt-2">
          默认 {item.defaultSets || "-"} 组 · {item.defaultReps || "-"} 次 · {item.defaultWeight || "-"} kg
        </Text>
      ) : null}
      {item.description && (
        <Text className="text-muted text-sm mt-2">{item.description}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* 头部 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">动作库</Text>
        <TouchableOpacity onPress={openAddModal} className="p-1">
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <View className="px-5 py-3">
        <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索动作..."
            placeholderTextColor={colors.muted}
            className="flex-1 py-3 px-3 text-foreground"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}> 
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 肌肉群筛选 */}
      <View className="px-5 mb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ key: "all", label: "全部" }, ...MUSCLE_GROUPS.map((g) => ({ key: g, label: MUSCLE_GROUP_NAMES[g] }))]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedGroup(item.key as MuscleGroup | "all")}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedGroup === item.key ? "bg-primary" : "bg-surface border border-border"
              }`}
              activeOpacity={0.7}
            >
              <Text className={selectedGroup === item.key ? "text-background font-medium" : "text-foreground"}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 动作列表 */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="list.bullet" size={48} color={colors.muted} />
            <Text className="text-muted mt-4 text-center">
              {searchQuery ? "未找到匹配的动作" : "暂无动作\n点击右上角添加"}
            </Text>
          </View>
        }
      />

      {/* 添加/编辑动作弹窗 */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFormModal(false)}
      >
        <ScreenContainer edges={["top", "left", "right", "bottom"]} className="flex-1 bg-background">
          {/* 弹窗头部 */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowFormModal(false)}>
              <Text className="text-primary">取消</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">{editingExercise ? "编辑动作" : "添加动作"}</Text>
            <TouchableOpacity onPress={handleSaveExercise}>
              <Text className="text-primary font-semibold">保存</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-5 py-4">
            {/* 动作名称 */}
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">动作名称</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="例如：杠铃卧推"
                placeholderTextColor={colors.muted}
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
              />
            </View>

            {/* 目标肌群 */}
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">目标肌群</Text>
              <View className="flex-row flex-wrap gap-2">
                {MUSCLE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group}
                    onPress={() => setMuscleGroup(group)}
                    className={`px-4 py-2 rounded-lg ${
                      muscleGroup === group ? "bg-primary" : "bg-surface border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={muscleGroup === group ? "text-background" : "text-foreground"}>
                      {MUSCLE_GROUP_NAMES[group]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 器械类型 */}
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">器械类型</Text>
              <View className="flex-row flex-wrap gap-2">
                {EQUIPMENT_LIST.map((eq) => (
                  <TouchableOpacity
                    key={eq}
                    onPress={() => setEquipment(eq)}
                    className={`px-4 py-2 rounded-lg ${
                      equipment === eq ? "bg-primary" : "bg-surface border border-border"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={equipment === eq ? "text-background" : "text-foreground"}>
                      {EQUIPMENT_NAMES[eq]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 默认训练参数 */}
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">默认训练参数</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={defaultSets}
                  onChangeText={setDefaultSets}
                  placeholder="组数"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                />
                <TextInput
                  value={defaultReps}
                  onChangeText={setDefaultReps}
                  placeholder="次数"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                />
                <TextInput
                  value={defaultWeight}
                  onChangeText={setDefaultWeight}
                  placeholder="重量(kg)"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                />
              </View>
            </View>

            {/* 动作描述 */}
            <View className="mb-4">
              <Text className="text-foreground font-medium mb-2">动作描述（可选）</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="描述动作要点..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border min-h-[80px]"
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
