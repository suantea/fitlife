import { useState } from "react";
import { Text, View, TouchableOpacity, TextInput, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { getTodayString } from "@/lib/storage";
import type { BodyMetricEntry } from "@/lib/types";

export default function BodyMetricsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, addBodyMetric, updateBodyMetric, deleteBodyMetric } = useApp();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BodyMetricEntry | null>(null);
  
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [date, setDate] = useState(getTodayString());

  // 按日期排序的体测记录
  const sortedMetrics = [...state.bodyMetrics].sort((a, b) => b.date.localeCompare(a.date));

  // 计算BMI
  const calculateBMI = (weightKg: number): number | undefined => {
    if (!state.userProfile.height) return undefined;
    const heightM = state.userProfile.height / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  };

  const resetForm = () => {
    setWeight("");
    setBodyFat("");
    setDate(getTodayString());
    setEditingEntry(null);
    setIsAdding(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleOpenEdit = (entry: BodyMetricEntry) => {
    setEditingEntry(entry);
    setWeight(entry.weight?.toString() || "");
    setBodyFat(entry.bodyFat?.toString() || "");
    setDate(entry.date);
    setIsAdding(true);
  };

  const handleSave = async () => {
    const weightNum = parseFloat(weight);
    const bodyFatNum = parseFloat(bodyFat);

    if (!weightNum && !bodyFatNum) {
      Alert.alert("提示", "请至少输入体重或体脂率");
      return;
    }

    try {
      const entry = {
        date,
        weight: weightNum || undefined,
        bodyFat: bodyFatNum || undefined,
        bmi: weightNum ? calculateBMI(weightNum) : undefined,
      };

      if (editingEntry) {
        await updateBodyMetric({ ...editingEntry, ...entry });
        Alert.alert("成功", "记录已更新");
      } else {
        // 检查是否已有当天记录
        const existing = state.bodyMetrics.find(m => m.date === date);
        if (existing) {
          Alert.alert(
            "提示",
            "当天已有记录，是否覆盖？",
            [
              { text: "取消", style: "cancel" },
              {
                text: "覆盖",
                onPress: async () => {
                  await updateBodyMetric({ ...existing, ...entry });
                  resetForm();
                },
              },
            ]
          );
          return;
        }
        await addBodyMetric(entry);
        Alert.alert("成功", "记录已添加");
      }
      
      resetForm();
    } catch {
      Alert.alert("错误", "保存失败，请重试");
    }
  };

  const handleDelete = (entry: BodyMetricEntry) => {
    Alert.alert(
      "删除记录",
      `确定要删除 ${entry.date} 的记录吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => deleteBodyMetric(entry.id),
        },
      ]
    );
  };

  // 获取趋势数据
  const getTrend = () => {
    if (sortedMetrics.length < 2) return null;
    
    const latest = sortedMetrics[0];
    const previous = sortedMetrics[1];
    
    if (!latest.weight || !previous.weight) return null;
    
    const diff = latest.weight - previous.weight;
    return {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
      value: Math.abs(diff).toFixed(1),
    };
  };

  const trend = getTrend();

  const renderMetricItem = ({ item }: { item: BodyMetricEntry }) => (
    <TouchableOpacity
      onPress={() => handleOpenEdit(item)}
      onLongPress={() => handleDelete(item)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-medium">{item.date.replace(/-/g, "/")}</Text>
        <IconSymbol name="pencil" size={16} color={colors.muted} />
      </View>
      <View className="flex-row justify-between">
        {item.weight && (
          <View className="items-center">
            <Text className="text-foreground font-semibold text-lg">{item.weight}</Text>
            <Text className="text-muted text-xs">体重 (kg)</Text>
          </View>
        )}
        {item.bodyFat && (
          <View className="items-center">
            <Text className="text-foreground font-semibold text-lg">{item.bodyFat}%</Text>
            <Text className="text-muted text-xs">体脂率</Text>
          </View>
        )}
        {item.bmi && (
          <View className="items-center">
            <Text className="text-foreground font-semibold text-lg">{item.bmi}</Text>
            <Text className="text-muted text-xs">BMI</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* 头部 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">体测记录</Text>
        <TouchableOpacity onPress={handleOpenAdd} className="p-1">
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 添加/编辑表单 */}
      {isAdding && (
        <View className="px-5 py-4 border-b border-border bg-surface">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground font-semibold">
              {editingEntry ? "编辑记录" : "添加记录"}
            </Text>
            <TouchableOpacity onPress={resetForm}>
              <IconSymbol name="xmark" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-muted text-sm mb-2">体重 (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
              />
            </View>
            <View className="flex-1">
              <Text className="text-muted text-sm mb-2">体脂率 (%)</Text>
              <TextInput
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">日期</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary rounded-xl py-3 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-background font-semibold">保存</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 最新数据概览 */}
      {sortedMetrics.length > 0 && !isAdding && (
        <View className="px-5 py-4">
          <View className="bg-primary/10 rounded-xl p-4">
            <Text className="text-foreground font-semibold mb-3">最新数据</Text>
            <View className="flex-row justify-between items-center">
              <View className="items-center">
                <Text className="text-3xl font-bold text-foreground">
                  {sortedMetrics[0].weight || "-"}
                </Text>
                <Text className="text-muted text-sm">体重 (kg)</Text>
              </View>
              {trend && (
                <View className="items-center">
                  <View className="flex-row items-center gap-1">
                    <IconSymbol 
                      name={trend.direction === "up" ? "chevron.up" : "chevron.down"} 
                      size={16} 
                      color={trend.direction === "up" ? colors.error : colors.success} 
                    />
                    <Text className={`font-semibold ${trend.direction === "up" ? "text-error" : "text-success"}`}>
                      {trend.value} kg
                    </Text>
                  </View>
                  <Text className="text-muted text-xs">较上次</Text>
                </View>
              )}
              <View className="items-center">
                <Text className="text-3xl font-bold text-foreground">
                  {sortedMetrics[0].bodyFat ? `${sortedMetrics[0].bodyFat}%` : "-"}
                </Text>
                <Text className="text-muted text-sm">体脂率</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 记录列表 */}
      <FlatList
        data={sortedMetrics}
        keyExtractor={(item) => item.id}
        renderItem={renderMetricItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center py-10">
            <IconSymbol name="scalemass" size={48} color={colors.muted} />
            <Text className="text-muted mt-4 text-center">
              暂无体测记录{"\n"}点击右上角添加
            </Text>
          </View>
        }
        ListHeaderComponent={
          sortedMetrics.length > 0 ? (
            <Text className="text-foreground font-semibold mb-3">历史记录</Text>
          ) : null
        }
      />
    </ScreenContainer>
  );
}
