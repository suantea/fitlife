import { useState, useMemo, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, FlatList, Alert, ScrollView, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { calculateNutritionRecommendation, getRecommendedFoods, getAllFoods } from "@/lib/nutrition-engine";
import { getCarbCycleDay } from "@/lib/carb-cycle";
import { getTodayString } from "@/lib/storage";
import type { NutritionLogItem, FoodLibraryItem, NutritionGoal, FoodCategory, CarbCycleDay, CarbCyclePlan } from "@/lib/types";
import { NUTRITION_GOAL_NAMES, CARB_DAY_NAMES } from "@/lib/types";

const FOOD_CATEGORIES: FoodCategory[] = ["protein", "carbs", "fats", "vegetables", "fruits", "other"];

export default function NutritionScreen() {
  const colors = useColors();
  const {
    state,
    addNutritionEntry,
    updateNutritionEntry,
    deleteNutritionEntry,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
    addCarbCyclePlan,
    updateCarbCyclePlan,
    deleteCarbCyclePlan,
    updateUserProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"log" | "recommend" | "carb">("log");
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingItem, setEditingItem] = useState<NutritionLogItem | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<(FoodLibraryItem & { source: "database" | "custom" }) | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [date, setDate] = useState(getTodayString());

  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customCategory, setCustomCategory] = useState<FoodCategory>("protein");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");
  const [editingFood, setEditingFood] = useState<FoodLibraryItem | null>(null);

  const [currentGoal, setCurrentGoal] = useState<NutritionGoal>(state.userProfile.nutritionGoal);
  const [currentWeight, setCurrentWeight] = useState("");
  const [recommendation, setRecommendation] = useState<ReturnType<typeof calculateNutritionRecommendation> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "all">("all");

  const [planName, setPlanName] = useState("");
  const [cycleLength, setCycleLength] = useState(7);
  const [planStartDate, setPlanStartDate] = useState(getTodayString());
  const [dayTypes, setDayTypes] = useState<("high" | "medium" | "low")[]>(Array.from({ length: 7 }, () => "medium"));
  const [macroByType, setMacroByType] = useState({
    high: { calories: "", carbs: "", protein: "", fat: "" },
    medium: { calories: "", carbs: "", protein: "", fat: "" },
    low: { calories: "", carbs: "", protein: "", fat: "" },
  });

  const activeCarbPlan = useMemo(() => {
    return state.carbCyclePlans.find((plan) => plan.id === state.userProfile.activeCarbCyclePlanId);
  }, [state.carbCyclePlans, state.userProfile.activeCarbCyclePlanId]);

  const todayEntry = useMemo(() => {
    return state.nutritionEntries.find((entry) => entry.date === date);
  }, [state.nutritionEntries, date]);

  const todayTotals = useMemo(() => {
    return {
      calories: todayEntry?.totalCalories || 0,
      protein: todayEntry?.totalProtein || 0,
      carbs: todayEntry?.totalCarbs || 0,
      fats: todayEntry?.totalFats || 0,
    };
  }, [todayEntry]);

  useEffect(() => {
    if (!currentWeight && state.bodyMetrics.length > 0) {
      const latest = [...state.bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latest?.weight) {
        setCurrentWeight(String(latest.weight));
      }
    }
  }, [state.bodyMetrics, currentWeight]);

  useEffect(() => {
    if (currentGoal !== state.userProfile.nutritionGoal) {
      updateUserProfile({ nutritionGoal: currentGoal });
    }
  }, [currentGoal, state.userProfile.nutritionGoal, updateUserProfile]);

  const foodLibrary = useMemo(() => {
    const preset = getAllFoods().map((food) => ({ ...food, source: "database" as const })) as Array<FoodLibraryItem & { source: "database" }>;
    const custom = state.customFoods.map((food) => ({ ...food, source: "custom" as const })) as Array<FoodLibraryItem & { source: "custom" }>;
    return [...preset, ...custom];
  }, [state.customFoods]);

  const favoriteFoods = useMemo(() => {
    const favorites = state.userProfile.favoriteFoodIds || [];
    return foodLibrary.filter((food) => favorites.includes(food.id));
  }, [foodLibrary, state.userProfile.favoriteFoodIds]);

  const filteredFoods = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return foodLibrary.filter((food) => {
      const matchesQuery = !query || food.name.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "all" || food.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [foodLibrary, searchQuery, selectedCategory]);

  const handleSelectFood = (food: FoodLibraryItem & { source: "database" | "custom" }) => {
    setSelectedFood(food);
    setFoodName(food.name);
  };

  useEffect(() => {
    if (!selectedFood) return;
    const quantityNum = parseFloat(quantity) || 0;
    const multiplier = quantityNum / 100;
    setCalories((selectedFood.caloriesPer100g * multiplier).toFixed(0));
    setProtein((selectedFood.proteinPer100g * multiplier).toFixed(1));
    setCarbs((selectedFood.carbsPer100g * multiplier).toFixed(1));
    setFats((selectedFood.fatsPer100g * multiplier).toFixed(1));
  }, [selectedFood, quantity]);

  const handleCalculateRecommendation = () => {
    const weight = parseFloat(currentWeight);
    if (!weight || weight <= 0) {
      Alert.alert("提示", "请输入有效的体重");
      return;
    }

    const rec = calculateNutritionRecommendation(state.userProfile, currentGoal, weight, state.userProfile.activityLevel);
    setRecommendation(rec);
  };

  useEffect(() => {
    const weight = parseFloat(currentWeight);
    if (!weight || weight <= 0) return;
    const rec = calculateNutritionRecommendation(state.userProfile, currentGoal, weight, state.userProfile.activityLevel);
    setRecommendation(rec);
  }, [currentWeight, currentGoal, state.userProfile]);

  const handleAddEntry = async () => {
    if (!foodName.trim()) {
      Alert.alert("提示", "请输入食物名称");
      return;
    }

    const caloriesNum = parseFloat(calories) || 0;
    const proteinNum = parseFloat(protein) || 0;
    const carbsNum = parseFloat(carbs) || 0;
    const fatsNum = parseFloat(fats) || 0;
    const quantityNum = parseFloat(quantity) || 0;

    if (!caloriesNum) {
      Alert.alert("提示", "请输入有效的热量");
      return;
    }

    try {
      if (editingItem) {
        const updatedItem: NutritionLogItem = {
          ...editingItem,
          name: foodName.trim(),
          quantity: quantityNum,
          calories: caloriesNum,
          protein: proteinNum,
          carbs: carbsNum,
          fats: fatsNum,
        };
        await updateNutritionEntry(date, updatedItem);
        Alert.alert("成功", "记录已更新");
      } else {
        await addNutritionEntry({
          date,
          foodId: selectedFood?.id,
          name: foodName.trim(),
          quantity: quantityNum,
          unit: "g",
          calories: caloriesNum,
          protein: proteinNum,
          carbs: carbsNum,
          fats: fatsNum,
          source: selectedFood?.source || "quick",
        });
        Alert.alert("成功", "记录已添加");
      }

      setFoodName("");
      setQuantity("100");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setSelectedFood(null);
      setEditingItem(null);
      setIsAddingEntry(false);
    } catch {
      Alert.alert("错误", "保存失败");
    }
  };

  const handleDeleteItem = (item: NutritionLogItem) => {
    Alert.alert("删除记录", `确定要删除\"${item.name}\"吗？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => deleteNutritionEntry(date, item.id) },
    ]);
  };

  const handleToggleFavorite = async (foodId: string) => {
    const favorites = state.userProfile.favoriteFoodIds || [];
    const isFavorite = favorites.includes(foodId);
    const next = isFavorite ? favorites.filter((id) => id !== foodId) : [...favorites, foodId];
    await updateUserProfile({ favoriteFoodIds: next });
  };

  const handleSaveCustomFood = async () => {
    if (!customFoodName.trim()) {
      Alert.alert("提示", "请输入食物名称");
      return;
    }

    const payload = {
      name: customFoodName.trim(),
      category: customCategory,
      caloriesPer100g: parseFloat(customCalories) || 0,
      proteinPer100g: parseFloat(customProtein) || 0,
      carbsPer100g: parseFloat(customCarbs) || 0,
      fatsPer100g: parseFloat(customFats) || 0,
      isCustom: true,
    };

    try {
      if (editingFood) {
        await updateCustomFood({ ...editingFood, ...payload });
      } else {
        await addCustomFood(payload);
      }
      setShowCustomFoodModal(false);
      setCustomFoodName("");
      setCustomCalories("");
      setCustomProtein("");
      setCustomCarbs("");
      setCustomFats("");
      setEditingFood(null);
    } catch {
      Alert.alert("错误", "保存失败");
    }
  };

  const handleDeleteCustomFood = async (food: FoodLibraryItem) => {
    Alert.alert("删除食物", `确定要删除\"${food.name}\"吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteCustomFood(food.id);
          setShowCustomFoodModal(false);
          setEditingFood(null);
        },
      },
    ]);
  };

  const carbToday = activeCarbPlan ? getCarbCycleDay(activeCarbPlan, date) : null;

  const dailyTarget = useMemo(() => {
    if (carbToday?.day) {
      return {
        calories: carbToday.day.calories,
        carbs: carbToday.day.carbs,
        protein: carbToday.day.protein,
        fats: carbToday.day.fat,
      };
    }
    if (recommendation) {
      return {
        calories: recommendation.dailyCalories,
        carbs: recommendation.carbs.grams,
        protein: recommendation.protein.grams,
        fats: recommendation.fats.grams,
      };
    }
    return null;
  }, [carbToday, recommendation]);

  const recommendedFoods = useMemo(() => {
    if (!recommendation) return [];
    return selectedCategory === "all"
      ? getRecommendedFoods(recommendation.goal)
      : getRecommendedFoods(recommendation.goal, selectedCategory as FoodCategory);
  }, [recommendation, selectedCategory]);

  const handlePlanSave = async () => {
    if (!planName.trim()) {
      Alert.alert("提示", "请输入计划名称");
      return;
    }

    const buildDay = (index: number, type: "high" | "medium" | "low"): CarbCycleDay => {
      const macros = macroByType[type];
      return {
        dayIndex: index + 1,
        type,
        calories: Number(macros.calories) || 0,
        carbs: Number(macros.carbs) || 0,
        protein: Number(macros.protein) || 0,
        fat: Number(macros.fat) || 0,
      };
    };

    const planDays = dayTypes.map((type, index) => buildDay(index, type));

    const payload: Omit<CarbCyclePlan, "id"> = {
      name: planName.trim(),
      cycleLength,
      days: planDays,
      startDate: planStartDate,
    };

    if (activeCarbPlan) {
      await updateCarbCyclePlan({ ...activeCarbPlan, ...payload });
    } else {
      const created = await addCarbCyclePlan(payload);
      await updateUserProfile({ activeCarbCyclePlanId: created.id });
    }

    Alert.alert("成功", "碳水循环计划已保存");
  };

  const handlePlanDelete = async () => {
    if (!activeCarbPlan) return;
    await deleteCarbCyclePlan(activeCarbPlan.id);
    await updateUserProfile({ activeCarbCyclePlanId: undefined });
  };

  useEffect(() => {
    if (!activeCarbPlan) return;
    setPlanName(activeCarbPlan.name);
    setCycleLength(activeCarbPlan.cycleLength);
    setPlanStartDate(activeCarbPlan.startDate || getTodayString());
    setDayTypes(activeCarbPlan.days.map((day) => day.type));
    const initial = { ...macroByType };
    activeCarbPlan.days.forEach((day) => {
      initial[day.type] = {
        calories: String(day.calories),
        carbs: String(day.carbs),
        protein: String(day.protein),
        fat: String(day.fat),
      };
    });
    setMacroByType(initial);
  }, [activeCarbPlan]);

  return (
    <ScreenContainer className="flex-1">
      {/* 头部 */}
      <View className="px-5 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">饮食</Text>
      </View>

      {/* Tab切换 */}
      <View className="flex-row border-b border-border">
        {[
          { value: "log", label: "饮食记录" },
          { value: "recommend", label: "营养建议" },
          { value: "carb", label: "碳水循环" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value as typeof activeTab)}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === tab.value ? "border-primary" : "border-transparent"
            }`}
            activeOpacity={0.7}
          >
            <Text className={activeTab === tab.value ? "text-primary font-semibold" : "text-muted"}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 饮食记录Tab */}
      {activeTab === "log" && (
        <View className="flex-1">
          {/* 今日统计 */}
          <View className="px-5 py-4 bg-primary/10">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground font-semibold">今日统计</Text>
              {dailyTarget && (
                <Text className="text-muted text-xs">目标 {dailyTarget.calories} kcal</Text>
              )}
            </View>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{todayTotals.calories}</Text>
                <Text className="text-muted text-xs">热量 (kcal)</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{todayTotals.protein.toFixed(1)}</Text>
                <Text className="text-muted text-xs">蛋白质 (g)</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{todayTotals.carbs.toFixed(1)}</Text>
                <Text className="text-muted text-xs">碳水 (g)</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-foreground">{todayTotals.fats.toFixed(1)}</Text>
                <Text className="text-muted text-xs">脂肪 (g)</Text>
              </View>
            </View>
          </View>

          {/* 常用食物 */}
          {favoriteFoods.length > 0 && (
            <View className="px-5 py-4">
              <Text className="text-foreground font-semibold mb-2">常用食物</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {favoriteFoods.map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    onPress={() => {
                      setIsAddingEntry(true);
                      handleSelectFood(food);
                    }}
                    className="bg-surface px-3 py-2 rounded-lg border border-border mr-2"
                    activeOpacity={0.7}
                  >
                    <Text className="text-foreground text-sm">{food.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 添加记录表单 */}
          {isAddingEntry && (
            <View className="px-5 py-4 border-b border-border bg-surface">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-foreground font-semibold">{editingItem ? "编辑记录" : "添加记录"}</Text>
                <TouchableOpacity onPress={() => {
                  setIsAddingEntry(false);
                  setEditingItem(null);
                  setSelectedFood(null);
                  setFoodName("");
                  setQuantity("100");
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFats("");
                }}>
                  <IconSymbol name="xmark" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* 食物搜索 */}
              <View className="mb-3">
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="搜索食物..."
                  placeholderTextColor={colors.muted}
                  className="bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
                {searchQuery.length > 0 && (
                  <View className="mt-2 max-h-40">
                    <FlatList
                      data={filteredFoods}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => handleSelectFood(item)}
                          onLongPress={() => {
                            if (item.source === "custom") {
                              setEditingFood(item);
                              setCustomFoodName(item.name);
                              setCustomCategory(item.category);
                              setCustomCalories(String(item.caloriesPer100g));
                              setCustomProtein(String(item.proteinPer100g));
                              setCustomCarbs(String(item.carbsPer100g));
                              setCustomFats(String(item.fatsPer100g));
                              setShowCustomFoodModal(true);
                            }
                          }}
                          className="py-2 border-b border-border"
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-foreground">{item.name}</Text>
                            <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
                              <IconSymbol
                                name={state.userProfile.favoriteFoodIds?.includes(item.id) ? "star.fill" : "star"}
                                size={18}
                                color={colors.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>

              <TextInput
                value={foodName}
                onChangeText={setFoodName}
                placeholder="食物名称"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-3 py-2 text-foreground border border-border mb-3"
              />
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="克数"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
                <TextInput
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="热量"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
              </View>
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="蛋白(g)"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
                <TextInput
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="碳水(g)"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
              </View>
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={fats}
                  onChangeText={setFats}
                  placeholder="脂肪(g)"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowCustomFoodModal(true);
                    setEditingFood(null);
                    setCustomFoodName("");
                    setCustomCalories("");
                    setCustomProtein("");
                    setCustomCarbs("");
                    setCustomFats("");
                  }}
                  className="flex-1 bg-muted/20 rounded-lg items-center justify-center"
                >
                  <Text className="text-foreground">添加自定义食物</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleAddEntry} className="bg-primary rounded-lg py-2 items-center">
                <Text className="text-background font-semibold">保存</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 记录列表 */}
          <FlatList
            data={todayEntry?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setEditingItem(item);
                  setSelectedFood(null);
                  setFoodName(item.name);
                  setQuantity(String(item.quantity));
                  setCalories(String(item.calories));
                  setProtein(String(item.protein));
                  setCarbs(String(item.carbs));
                  setFats(String(item.fats));
                  setIsAddingEntry(true);
                }}
                onLongPress={() => handleDeleteItem(item)}
                className="px-5 py-3 border-b border-border"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{item.name}</Text>
                    <Text className="text-muted text-sm">
                      {item.quantity}g · {item.calories} kcal
                    </Text>
                  </View>
                  <Text className="text-primary font-semibold">{item.calories}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !isAddingEntry ? (
                <View className="flex-1 items-center justify-center py-10">
                  <IconSymbol name="fork.knife" size={48} color={colors.muted} />
                  <Text className="text-muted mt-4">暂无记录</Text>
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          {/* 添加按钮 */}
          {!isAddingEntry && (
            <TouchableOpacity
              onPress={() => setIsAddingEntry(true)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" size={24} color={colors.background} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 营养建议Tab */}
      {activeTab === "recommend" && (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="px-5 py-4">
            {/* 目标选择 */}
            <Text className="text-foreground font-semibold mb-3">训练目标</Text>
            <View className="flex-row gap-2 mb-4">
              {(Object.keys(NUTRITION_GOAL_NAMES) as NutritionGoal[]).map((goal) => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => setCurrentGoal(goal)}
                  className={`flex-1 py-3 rounded-lg items-center ${
                    currentGoal === goal ? "bg-primary" : "bg-surface border border-border"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={currentGoal === goal ? "text-background font-semibold" : "text-foreground"}>
                    {NUTRITION_GOAL_NAMES[goal]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 体重输入 */}
            <Text className="text-foreground font-semibold mb-2">当前体重 (kg)</Text>
            <View className="flex-row gap-2 mb-4">
              <TextInput
                value={currentWeight}
                onChangeText={setCurrentWeight}
                keyboardType="decimal-pad"
                placeholder="输入体重"
                placeholderTextColor={colors.muted}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
              <TouchableOpacity
                onPress={handleCalculateRecommendation}
                className="bg-primary rounded-lg px-6 items-center justify-center"
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold">计算</Text>
              </TouchableOpacity>
            </View>

            {/* 推荐结果 */}
            {recommendation && (
              <View className="bg-primary/10 rounded-xl p-4 mb-4">
                <Text className="text-foreground font-semibold mb-4">营养推荐</Text>
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">每日热量</Text>
                    <Text className="text-primary font-bold text-lg">{recommendation.dailyCalories} kcal</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">蛋白质</Text>
                    <Text className="text-foreground">{recommendation.protein.grams}g ({recommendation.protein.percentage}%)</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">碳水化合物</Text>
                    <Text className="text-foreground">{recommendation.carbs.grams}g ({recommendation.carbs.percentage}%)</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground">脂肪</Text>
                    <Text className="text-foreground">{recommendation.fats.grams}g ({recommendation.fats.percentage}%)</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 推荐食物 */}
            {recommendation && (
              <View>
                <Text className="text-foreground font-semibold mb-3">推荐食物</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {([
                    { value: "all" as const, label: "全部" },
                    { value: "protein" as const, label: "蛋白质" },
                    { value: "carbs" as const, label: "碳水" },
                    { value: "fats" as const, label: "脂肪" },
                  ]).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setSelectedCategory(option.value)}
                      className={`px-4 py-2 rounded-lg ${
                        selectedCategory === option.value ? "bg-primary" : "bg-surface border border-border"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text className={selectedCategory === option.value ? "text-background text-sm font-semibold" : "text-foreground text-sm"}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FlatList
                  scrollEnabled={false}
                  data={recommendedFoods}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View className="bg-surface rounded-lg p-3 mb-2 border border-border">
                      <Text className="text-foreground font-medium">{item.name}</Text>
                      <Text className="text-muted text-sm">热量: {item.caloriesPer100g} kcal | 蛋白: {item.proteinPer100g}g</Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* 碳水循环Tab */}
      {activeTab === "carb" && (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="px-5 py-4">
            <Text className="text-foreground font-semibold mb-3">碳水循环计划</Text>
            <Text className="text-muted text-sm mb-4">设置高/中/低碳日的周期与宏量营养素目标。</Text>

            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <TextInput
                value={planName}
                onChangeText={setPlanName}
                placeholder="计划名称"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-3 py-2 text-foreground border border-border mb-3"
              />
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={String(cycleLength)}
                  onChangeText={(value) => {
                    const length = Math.max(3, Math.min(14, Number(value) || 7));
                    setCycleLength(length);
                    setDayTypes((prev) => {
                      const next = Array.from({ length }, (_, index) => prev[index] || "medium");
                      return next;
                    });
                  }}
                  keyboardType="number-pad"
                  placeholder="周期长度(天)"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
                <TextInput
                  value={planStartDate}
                  onChangeText={setPlanStartDate}
                  placeholder="开始日期"
                  placeholderTextColor={colors.muted}
                  className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                />
              </View>

              <Text className="text-foreground font-medium mb-2">每日类型</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {dayTypes.map((type, index) => (
                  <TouchableOpacity
                    key={`${type}-${index}`}
                    onPress={() => {
                      setDayTypes((prev) => prev.map((item, idx) => {
                        if (idx !== index) return item;
                        if (item === "high") return "medium";
                        if (item === "medium") return "low";
                        return "high";
                      }));
                    }}
                    className="px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <Text className="text-foreground text-sm">第 {index + 1} 天 · {CARB_DAY_NAMES[type]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(["high", "medium", "low"] as const).map((type) => (
                <View key={type} className="mb-3">
                  <Text className="text-foreground font-medium mb-2">{CARB_DAY_NAMES[type]} 宏量</Text>
                  <View className="flex-row gap-2 mb-2">
                    <TextInput
                      value={macroByType[type].calories}
                      onChangeText={(value) => setMacroByType((prev) => ({ ...prev, [type]: { ...prev[type], calories: value } }))}
                      placeholder="热量"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.muted}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                    />
                    <TextInput
                      value={macroByType[type].carbs}
                      onChangeText={(value) => setMacroByType((prev) => ({ ...prev, [type]: { ...prev[type], carbs: value } }))}
                      placeholder="碳水"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.muted}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={macroByType[type].protein}
                      onChangeText={(value) => setMacroByType((prev) => ({ ...prev, [type]: { ...prev[type], protein: value } }))}
                      placeholder="蛋白"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.muted}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                    />
                    <TextInput
                      value={macroByType[type].fat}
                      onChangeText={(value) => setMacroByType((prev) => ({ ...prev, [type]: { ...prev[type], fat: value } }))}
                      placeholder="脂肪"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.muted}
                      className="flex-1 bg-background rounded-lg px-3 py-2 text-foreground border border-border"
                    />
                  </View>
                </View>
              ))}
            </View>

            <View className="flex-row gap-3">
              {activeCarbPlan && (
                <TouchableOpacity
                  onPress={() => updateUserProfile({ activeCarbCyclePlanId: undefined })}
                  className="flex-1 bg-muted/20 rounded-xl py-3 items-center"
                >
                  <Text className="text-foreground">停用计划</Text>
                </TouchableOpacity>
              )}
              {activeCarbPlan && (
                <TouchableOpacity onPress={handlePlanDelete} className="flex-1 bg-error/10 rounded-xl py-3 items-center">
                  <Text className="text-error">删除计划</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handlePlanSave} className="flex-1 bg-primary rounded-xl py-3 items-center">
                <Text className="text-background font-semibold">保存计划</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 自定义食物弹窗 */}
      <Modal visible={showCustomFoodModal} animationType="slide" presentationStyle="pageSheet">
        <ScreenContainer className="flex-1">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => { setShowCustomFoodModal(false); setEditingFood(null); }}>
              <Text className="text-primary">取消</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">{editingFood ? "编辑食物" : "添加自定义食物"}</Text>
            <TouchableOpacity onPress={handleSaveCustomFood}>
              <Text className="text-primary font-semibold">保存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
            <TextInput
              value={customFoodName}
              onChangeText={setCustomFoodName}
              placeholder="食物名称"
              placeholderTextColor={colors.muted}
              className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border mb-3"
            />
            <View className="flex-row flex-wrap gap-2 mb-3">
              {FOOD_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setCustomCategory(category)}
                  className={`px-3 py-2 rounded-lg ${
                    customCategory === category ? "bg-primary" : "bg-surface border border-border"
                  }`}
                >
                  <Text className={customCategory === category ? "text-background" : "text-foreground"}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2 mb-3">
              <TextInput
                value={customCalories}
                onChangeText={setCustomCalories}
                placeholder="热量/100g"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
              <TextInput
                value={customProtein}
                onChangeText={setCustomProtein}
                placeholder="蛋白/100g"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
            <View className="flex-row gap-2">
              <TextInput
                value={customCarbs}
                onChangeText={setCustomCarbs}
                placeholder="碳水/100g"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
              <TextInput
                value={customFats}
                onChangeText={setCustomFats}
                placeholder="脂肪/100g"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>

            {editingFood && (
              <TouchableOpacity
                onPress={() => handleDeleteCustomFood(editingFood)}
                className="mt-4 bg-error/10 rounded-lg py-3 items-center"
              >
                <Text className="text-error">删除食物</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
