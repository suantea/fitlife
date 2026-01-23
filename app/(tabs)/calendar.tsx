import { useState, useMemo, type ReactElement } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { getTodayString } from "@/lib/storage";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useApp();
  const today = getTodayString();
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  
  const [selectedDate, setSelectedDate] = useState(today);

  const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
  const firstDay = getFirstDayOfMonth(currentDate.year, currentDate.month);

  // 获取当月数据标记
  const monthData = useMemo(() => {
    const data: Record<string, { hasWorkout: boolean; hasNutrition: boolean; hasBodyMetric: boolean }> = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentDate.year, currentDate.month, day);
      data[dateStr] = {
        hasWorkout: state.workoutSessions.some(s => s.date === dateStr),
        hasNutrition: state.nutritionEntries.some(e => e.date === dateStr),
        hasBodyMetric: state.bodyMetrics.some(m => m.date === dateStr),
      };
    }
    
    return data;
  }, [currentDate, state.workoutSessions, state.nutritionEntries, state.bodyMetrics, daysInMonth]);

  // 获取选中日期的数据
  const selectedDayData = useMemo(() => {
    const workouts = state.workoutSessions.filter(s => s.date === selectedDate);
    const nutrition = state.nutritionEntries.find(e => e.date === selectedDate);
    const bodyMetric = state.bodyMetrics.find(m => m.date === selectedDate);
    return { workouts, nutrition, bodyMetric };
  }, [selectedDate, state.workoutSessions, state.nutritionEntries, state.bodyMetrics]);

  if (state.isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const goToPrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const renderCalendarDays = () => {
    const days: ReactElement[] = [];
    
    // 空白天数
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} className="w-[14.28%] h-12" />);
    }
    
    // 实际天数
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentDate.year, currentDate.month, day);
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      const dayData = monthData[dateStr];
      
      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => setSelectedDate(dateStr)}
          className="w-[14.28%] h-12 items-center justify-center"
          activeOpacity={0.7}
        >
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isSelected ? "bg-primary" : isToday ? "bg-primary/20" : ""
            }`}
          >
            <Text
              className={`text-base ${
                isSelected ? "text-background font-semibold" : isToday ? "text-primary font-semibold" : "text-foreground"
              }`}
            >
              {day}
            </Text>
          </View>
          {/* 数据标记点 */}
          <View className="flex-row gap-0.5 mt-0.5 h-1.5">
            {dayData?.hasWorkout && <View className="w-1.5 h-1.5 rounded-full bg-primary" />}
            {dayData?.hasNutrition && <View className="w-1.5 h-1.5 rounded-full bg-success" />}
            {dayData?.hasBodyMetric && <View className="w-1.5 h-1.5 rounded-full bg-warning" />}
          </View>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-3xl font-bold text-foreground">日历</Text>
        </View>

        {/* 月份导航 */}
        <View className="px-5 flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={goToPrevMonth} className="p-2" activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">
            {currentDate.year}年{currentDate.month + 1}月
          </Text>
          <TouchableOpacity onPress={goToNextMonth} className="p-2" activeOpacity={0.7}>
            <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* 星期标题 */}
        <View className="px-5 flex-row mb-2">
          {WEEKDAYS.map((day) => (
            <View key={day} className="w-[14.28%] items-center">
              <Text className="text-muted text-sm">{day}</Text>
            </View>
          ))}
        </View>

        {/* 日历网格 */}
        <View className="px-5 flex-row flex-wrap mb-6">
          {renderCalendarDays()}
        </View>

        {/* 图例 */}
        <View className="px-5 flex-row gap-4 mb-6">
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-primary" />
            <Text className="text-muted text-sm">训练</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-success" />
            <Text className="text-muted text-sm">饮食</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-warning" />
            <Text className="text-muted text-sm">体测</Text>
          </View>
        </View>

        {/* 选中日期详情 */}
        <View className="px-5">
          <Text className="text-lg font-semibold text-foreground mb-4">
            {selectedDate.replace(/-/g, "/")} 记录
          </Text>

          {/* 训练记录 */}
          {selectedDayData.workouts.length > 0 ? (
            <View className="bg-surface rounded-xl p-4 border border-border mb-3">
              <View className="flex-row items-center gap-2 mb-3">
                <IconSymbol name="dumbbell.fill" size={20} color={colors.primary} />
                <Text className="text-foreground font-medium">训练记录</Text>
              </View>
              {selectedDayData.workouts.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  onPress={() => router.push({ pathname: "/training/session-detail", params: { id: session.id } })}
                  className="mb-2 last:mb-0"
                  activeOpacity={0.7}
                >
                  <Text className="text-foreground">
                    {session.templateName || "自由训练"}
                  </Text>
                  <Text className="text-muted text-sm">
                    {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5) || "进行中"} · {session.sets.length} 组
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-4 border border-border mb-3 items-center">
              <Text className="text-muted">当日无训练记录</Text>
            </View>
          )}

          {/* 饮食记录 */}
          {selectedDayData.nutrition ? (
            <View className="bg-surface rounded-xl p-4 border border-border mb-3">
              <View className="flex-row items-center gap-2 mb-3">
                <IconSymbol name="fork.knife" size={20} color={colors.success} />
                <Text className="text-foreground font-medium">饮食记录</Text>
              </View>
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{selectedDayData.nutrition.totalCalories}</Text>
                  <Text className="text-muted text-sm">热量</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{selectedDayData.nutrition.totalProtein}g</Text>
                  <Text className="text-muted text-sm">蛋白质</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{selectedDayData.nutrition.totalCarbs}g</Text>
                  <Text className="text-muted text-sm">碳水</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{selectedDayData.nutrition.totalFats}g</Text>
                  <Text className="text-muted text-sm">脂肪</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-4 border border-border mb-3 items-center">
              <Text className="text-muted">当日无饮食记录</Text>
            </View>
          )}

          {/* 体测记录 */}
          {selectedDayData.bodyMetric ? (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center gap-2 mb-3">
                <IconSymbol name="scalemass" size={20} color={colors.warning} />
                <Text className="text-foreground font-medium">体测记录</Text>
              </View>
              <View className="flex-row justify-between">
                {selectedDayData.bodyMetric.weight && (
                  <View className="items-center">
                    <Text className="text-foreground font-semibold">{selectedDayData.bodyMetric.weight} kg</Text>
                    <Text className="text-muted text-sm">体重</Text>
                  </View>
                )}
                {selectedDayData.bodyMetric.bodyFat && (
                  <View className="items-center">
                    <Text className="text-foreground font-semibold">{selectedDayData.bodyMetric.bodyFat}%</Text>
                    <Text className="text-muted text-sm">体脂率</Text>
                  </View>
                )}
                {selectedDayData.bodyMetric.bmi && (
                  <View className="items-center">
                    <Text className="text-foreground font-semibold">{selectedDayData.bodyMetric.bmi}</Text>
                    <Text className="text-muted text-sm">BMI</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-muted">当日无体测记录</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
