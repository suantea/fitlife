import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { exportAllData, importAllData } from "@/lib/storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  // 获取最新体测数据
  const latestBodyMetric = state.bodyMetrics.length > 0
    ? state.bodyMetrics.sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `health_training_backup_${new Date().toISOString().split("T")[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert("成功", `数据已导出到: ${filePath}`);
      }
    } catch (error) {
      Alert.alert("错误", "导出数据失败");
      console.error(error);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      
      if (result.canceled) return;
      
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(content);
      
      Alert.alert(
        "确认导入",
        "导入将覆盖现有数据，确定继续吗？",
        [
          { text: "取消", style: "cancel" },
          {
            text: "确定",
            style: "destructive",
            onPress: async () => {
              await importAllData(data);
              Alert.alert("成功", "数据导入成功，请重启应用");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("错误", "导入数据失败，请检查文件格式");
      console.error(error);
    }
  };

  const menuItems = [
    {
      title: "体测记录",
      icon: "scalemass" as const,
      subtitle: latestBodyMetric 
        ? `最新: ${latestBodyMetric.weight || "-"} kg` 
        : "记录体重、体脂等数据",
      route: "/profile/body-metrics",
    },
    {
      title: "AI 助手",
      icon: "brain" as const,
      subtitle: state.aiConfig.isConfigured ? "已配置" : "配置 API Key 开始使用",
      route: "/profile/ai",
    },
    {
      title: "设置",
      icon: "gearshape.fill" as const,
      subtitle: "单位、计时器等偏好设置",
      route: "/profile/settings",
    },
  ];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 头部 */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-3xl font-bold text-foreground">我的</Text>
        </View>

        {/* 用户信息卡片 */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
                <IconSymbol name="person.fill" size={32} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-foreground">健身用户</Text>
                <Text className="text-muted text-sm mt-1">
                  {state.userProfile.gender === "male" ? "男" : state.userProfile.gender === "female" ? "女" : "未设置"} · 
                  {state.userProfile.height ? ` ${state.userProfile.height} cm` : " 未设置身高"}
                </Text>
              </View>
            </View>

            {/* 数据统计 */}
            <View className="flex-row justify-between pt-4 border-t border-border">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-foreground">
                  {state.workoutSessions.length}
                </Text>
                <Text className="text-muted text-sm">训练次数</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-foreground">
                  {state.exercises.length}
                </Text>
                <Text className="text-muted text-sm">动作数量</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-foreground">
                  {state.nutritionEntries.length}
                </Text>
                <Text className="text-muted text-sm">饮食记录</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 菜单列表 */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                onPress={() => router.push(item.route as never)}
                className={`flex-row items-center p-4 ${
                  index < menuItems.length - 1 ? "border-b border-border" : ""
                }`}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <IconSymbol name={item.icon} size={20} color={colors.primary} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-foreground font-medium">{item.title}</Text>
                  <Text className="text-muted text-sm mt-0.5">{item.subtitle}</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 数据管理 */}
        <View className="px-5">
          <Text className="text-lg font-semibold text-foreground mb-4">数据管理</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleExportData}
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.up.doc" size={28} color={colors.primary} />
              <Text className="text-foreground font-medium mt-2">导出数据</Text>
              <Text className="text-muted text-xs mt-1">备份到文件</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImportData}
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.down.doc" size={28} color={colors.primary} />
              <Text className="text-foreground font-medium mt-2">导入数据</Text>
              <Text className="text-muted text-xs mt-1">从文件恢复</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 版本信息 */}
        <View className="px-5 mt-8 items-center">
          <Text className="text-muted text-sm">FitLife v2.0.0 · 何浩天 / Neal</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
