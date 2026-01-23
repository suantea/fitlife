import type { UserProfile, NutritionGoal, FoodCategory } from "./types";

export interface NutritionRecommendation {
  dailyCalories: number;
  protein: { grams: number; percentage: number };
  carbs: { grams: number; percentage: number };
  fats: { grams: number; percentage: number };
  goal: NutritionGoal;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  goal: "all" | "fat_loss" | "muscle_gain";
}

// 食物数据库
const FOOD_DATABASE: FoodItem[] = [
  // 蛋白质食物
  { id: "chicken_breast", name: "鸡胸肉", category: "protein", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, goal: "all" },
  { id: "egg_white", name: "蛋清", category: "protein", caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatsPer100g: 0.2, goal: "all" },
  { id: "beef_lean", name: "瘦牛肉", category: "protein", caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatsPer100g: 15, goal: "muscle_gain" },
  { id: "fish_salmon", name: "三文鱼", category: "protein", caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatsPer100g: 13, goal: "all" },
  { id: "greek_yogurt", name: "希腊酸奶", category: "protein", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.3, fatsPer100g: 0.4, goal: "all" },
  { id: "cottage_cheese", name: "茅屋奶酪", category: "protein", caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatsPer100g: 5, goal: "all" },
  { id: "tofu", name: "豆腐", category: "protein", caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatsPer100g: 4.8, goal: "all" },
  { id: "protein_powder", name: "蛋白粉", category: "protein", caloriesPer100g: 408, proteinPer100g: 80, carbsPer100g: 7, fatsPer100g: 5, goal: "all" },
  
  // 碳水化合物
  { id: "brown_rice", name: "糙米", category: "carbs", caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatsPer100g: 0.9, goal: "all" },
  { id: "oatmeal", name: "燕麦", category: "carbs", caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatsPer100g: 6.9, goal: "all" },
  { id: "sweet_potato", name: "红薯", category: "carbs", caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatsPer100g: 0.1, goal: "all" },
  { id: "white_rice", name: "白米", category: "carbs", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, goal: "muscle_gain" },
  { id: "banana", name: "香蕉", category: "carbs", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, goal: "all" },
  { id: "whole_wheat_bread", name: "全麦面包", category: "carbs", caloriesPer100g: 265, proteinPer100g: 13, carbsPer100g: 49, fatsPer100g: 3.3, goal: "all" },
  { id: "pasta", name: "意面", category: "carbs", caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatsPer100g: 1.1, goal: "muscle_gain" },
  
  // 脂肪食物
  { id: "olive_oil", name: "橄榄油", category: "fats", caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatsPer100g: 100, goal: "all" },
  { id: "almonds", name: "杏仁", category: "fats", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatsPer100g: 50, goal: "all" },
  { id: "avocado", name: "牛油果", category: "fats", caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatsPer100g: 15, goal: "all" },
  { id: "peanut_butter", name: "花生酱", category: "fats", caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatsPer100g: 50, goal: "all" },
  { id: "coconut_oil", name: "椰子油", category: "fats", caloriesPer100g: 892, proteinPer100g: 0, carbsPer100g: 0, fatsPer100g: 99, goal: "all" },
  
  // 蔬菜
  { id: "broccoli", name: "西兰花", category: "vegetables", caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatsPer100g: 0.4, goal: "all" },
  { id: "spinach", name: "菠菜", category: "vegetables", caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatsPer100g: 0.4, goal: "all" },
  { id: "carrot", name: "胡萝卜", category: "vegetables", caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatsPer100g: 0.2, goal: "all" },
  { id: "bell_pepper", name: "彩椒", category: "vegetables", caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatsPer100g: 0.3, goal: "all" },
  
  // 水果
  { id: "apple", name: "苹果", category: "fruits", caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatsPer100g: 0.2, goal: "all" },
  { id: "orange", name: "橙子", category: "fruits", caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatsPer100g: 0.1, goal: "all" },
  { id: "blueberry", name: "蓝莓", category: "fruits", caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatsPer100g: 0.3, goal: "all" },
];

// 计算基础代谢率 (BMR) - 使用Mifflin-St Jeor公式
function calculateBMR(weight: number, height: number, age: number, gender: "male" | "female" | "other"): number {
  let bmr: number;
  
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    // 其他性别取平均值
    bmr = (10 * weight + 6.25 * height - 5 * age + 5 + 10 * weight + 6.25 * height - 5 * age - 161) / 2;
  }
  
  return Math.round(bmr);
}

// 根据活动水平调整热量
function adjustForActivityLevel(bmr: number, activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active" = "moderate"): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}

// 计算营养推荐
export function calculateNutritionRecommendation(
  userProfile: UserProfile,
  goal: NutritionGoal,
  weight: number,
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active" = "moderate"
): NutritionRecommendation {
  const height = userProfile.height || 170;
  const age = userProfile.age || 25;
  const gender = userProfile.gender || "male";

  // 计算每日热量
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = adjustForActivityLevel(bmr, activityLevel);

  let dailyCalories: number;
  let proteinGrams: number;
  let carbsGrams: number;
  let fatsGrams: number;

  switch (goal) {
    case "fat_loss":
      // 减脂：热量赤字20%，蛋白质2.2g/kg，脂肪0.8g/kg，碳水补充
      dailyCalories = Math.round(tdee * 0.8);
      proteinGrams = Math.round(weight * 2.2);
      fatsGrams = Math.round(weight * 0.8);
      carbsGrams = Math.round((dailyCalories - proteinGrams * 4 - fatsGrams * 9) / 4);
      break;

    case "muscle_gain":
      // 增肌：热量盈余10%，蛋白质2.2g/kg，脂肪1g/kg，碳水补充
      dailyCalories = Math.round(tdee * 1.1);
      proteinGrams = Math.round(weight * 2.2);
      fatsGrams = Math.round(weight * 1);
      carbsGrams = Math.round((dailyCalories - proteinGrams * 4 - fatsGrams * 9) / 4);
      break;

    case "maintenance":
    default:
      // 维持：热量平衡，蛋白质1.8g/kg，脂肪0.9g/kg，碳水补充
      dailyCalories = tdee;
      proteinGrams = Math.round(weight * 1.8);
      fatsGrams = Math.round(weight * 0.9);
      carbsGrams = Math.round((dailyCalories - proteinGrams * 4 - fatsGrams * 9) / 4);
      break;
  }

  // 确保碳水不为负
  if (carbsGrams < 0) carbsGrams = 0;

  return {
    dailyCalories,
    protein: {
      grams: proteinGrams,
      percentage: Math.round((proteinGrams * 4 / dailyCalories) * 100),
    },
    carbs: {
      grams: carbsGrams,
      percentage: Math.round((carbsGrams * 4 / dailyCalories) * 100),
    },
    fats: {
      grams: fatsGrams,
      percentage: Math.round((fatsGrams * 9 / dailyCalories) * 100),
    },
    goal,
  };
}

// 获取推荐食物列表
export function getRecommendedFoods(goal: NutritionGoal, category?: FoodCategory): FoodItem[] {
  return FOOD_DATABASE.filter(food => {
    const goalMatch = food.goal === "all" || food.goal === goal;
    const categoryMatch = !category || food.category === category;
    return goalMatch && categoryMatch;
  });
}

// 获取所有食物
export function getAllFoods(): FoodItem[] {
  return FOOD_DATABASE;
}

// 搜索食物
export function searchFoods(query: string): FoodItem[] {
  const lowerQuery = query.toLowerCase();
  return FOOD_DATABASE.filter(food => food.name.toLowerCase().includes(lowerQuery));
}
