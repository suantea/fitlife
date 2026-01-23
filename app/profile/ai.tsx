import { useState, useRef, useEffect, useMemo } from "react";
import { Text, View, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import type { AIMessage, AIConfig } from "@/lib/types";
import Markdown from "react-native-markdown-display";
import { buildAISnapshot } from "@/lib/ai/data-model";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

type AIProvider = AIConfig["provider"];

const PROVIDERS: { value: AIProvider; label: string; defaultUrl: string; defaultModel: string }[] = [
  { value: "openai", label: "OpenAI", defaultUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  { value: "dashscope", label: "阿里百炼", defaultUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen-turbo" },
  { value: "kimi", label: "Kimi (月之暗面)", defaultUrl: "https://api.moonshot.cn/v1", defaultModel: "moonshot-v1-8k" },
  { value: "custom", label: "自定义", defaultUrl: "", defaultModel: "" },
];

export default function AIScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, updateAIConfig, addAIMessage, clearAIMessages } = useApp();
  const flatListRef = useRef<FlatList>(null);
  
  // 配置状态
  const [showConfig, setShowConfig] = useState(!state.aiConfig.isConfigured);
  const [provider, setProvider] = useState<AIProvider>(state.aiConfig.provider);
  const [baseUrl, setBaseUrl] = useState(state.aiConfig.baseUrl || "");
  const [apiKey, setApiKey] = useState(state.aiConfig.apiKey || "");
  const [model, setModel] = useState(state.aiConfig.model || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // 对话状态
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 当provider变化时更新默认值
  useEffect(() => {
    const providerConfig = PROVIDERS.find(p => p.value === provider);
    if (providerConfig && provider !== "custom") {
      setBaseUrl(providerConfig.defaultUrl);
      setModel(providerConfig.defaultModel);
    }
  }, [provider]);

  const generateSystemPrompt = () => buildSystemPrompt(buildAISnapshot(state));

  // 测试API连接
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert("提示", "请输入API Key");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        Alert.alert("成功", "API连接测试成功！");
      } else {
        const error = await response.json();
        Alert.alert("失败", `连接失败: ${error.error?.message || response.statusText}`);
      }
    } catch (error) {
      Alert.alert("错误", `连接错误: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsTesting(false);
    }
  };

  // 保存配置
  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      Alert.alert("提示", "请输入API Key");
      return;
    }

    try {
      await updateAIConfig({
        provider,
        baseUrl,
        apiKey,
        model,
        isConfigured: true,
      });
      setShowConfig(false);
      Alert.alert("成功", "配置已保存");
    } catch {
      Alert.alert("错误", "保存失败");
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!state.aiConfig.isConfigured) {
      Alert.alert("提示", "请先配置API Key");
      setShowConfig(true);
      return;
    }

    const userMessage = inputText.trim();
    setInputText("");
    
    // 添加用户消息
    addAIMessage({ role: "user", content: userMessage });
    
    setIsLoading(true);
    try {
      // 构建消息历史
      const messages = [
        { role: "system", content: generateSystemPrompt() },
        ...state.aiMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ];

      const response = await fetch(`${state.aiConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: state.aiConfig.model,
          messages,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = data.choices[0]?.message?.content || "抱歉，我无法生成回复。";
        addAIMessage({ role: "assistant", content: assistantMessage });
      } else {
        const error = await response.json();
        addAIMessage({ 
          role: "assistant", 
          content: `抱歉，请求失败: ${error.error?.message || "未知错误"}` 
        });
      }
    } catch (error) {
      addAIMessage({ 
        role: "assistant", 
        content: `抱歉，发生错误: ${error instanceof Error ? error.message : "未知错误"}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 清除对话
  const handleClearMessages = () => {
    Alert.alert(
      "清除对话",
      "确定要清除所有对话记录吗？",
      [
        { text: "取消", style: "cancel" },
        { text: "清除", style: "destructive", onPress: clearAIMessages },
      ]
    );
  };

  // 滚动到底部
  useEffect(() => {
    if (state.aiMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [state.aiMessages.length]);

  const markdownStyles = useMemo(() => ({
    body: { color: colors.foreground, fontSize: 15, lineHeight: 22 },
    paragraph: { marginTop: 0, marginBottom: 8 },
    code_inline: {
      backgroundColor: colors.surface,
      color: colors.foreground,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      fontFamily: "Menlo",
      fontSize: 14,
    },
    code_block: {
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 8,
      fontFamily: "Menlo",
      fontSize: 13,
    },
    fence: {
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 8,
      fontFamily: "Menlo",
      fontSize: 13,
    },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    blockquote: {
      borderLeftColor: colors.border,
      borderLeftWidth: 4,
      paddingLeft: 10,
      color: colors.muted,
    },
    link: { color: colors.primary },
  }), [colors]);

  const renderMessage = ({ item }: { item: AIMessage }) => (
    <View className={`mb-3 ${item.role === "user" ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          item.role === "user" ? "bg-primary" : "bg-surface border border-border"
        }`}
      >
        {item.role === "user" ? (
          <Text className="text-background">{item.content}</Text>
        ) : (
          <Markdown style={markdownStyles}>{item.content}</Markdown>
        )}
      </View>
      <Text className="text-muted text-xs mt-1 px-2">
        {new Date(item.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="flex-1">
      {/* 头部 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">AI 助手</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setShowConfig(!showConfig)} className="p-1">
            <IconSymbol name="gearshape.fill" size={22} color={showConfig ? colors.primary : colors.muted} />
          </TouchableOpacity>
          {state.aiMessages.length > 0 && (
            <TouchableOpacity onPress={handleClearMessages} className="p-1">
              <IconSymbol name="trash" size={22} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 配置面板 */}
      {showConfig && (
        <View className="px-5 py-4 border-b border-border bg-surface">
          <Text className="text-foreground font-semibold mb-4">API 配置</Text>

          {/* Provider选择 */}
          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">服务商</Text>
            <View className="flex-row flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setProvider(p.value)}
                  className={`px-4 py-2 rounded-lg ${
                    provider === p.value ? "bg-primary" : "bg-background border border-border"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={provider === p.value ? "text-background" : "text-foreground"}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Base URL */}
          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">API Base URL</Text>
            <TextInput
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://api.openai.com/v1"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* API Key */}
          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">API Key</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor={colors.muted}
                secureTextEntry={!showApiKey}
                className="flex-1 bg-background rounded-xl px-4 py-3 text-foreground border border-border"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowApiKey(!showApiKey)}
                className="p-3 bg-background rounded-xl border border-border"
              >
                <IconSymbol 
                  name={showApiKey ? "xmark" : "checkmark"} 
                  size={18} 
                  color={colors.muted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Model */}
          <View className="mb-4">
            <Text className="text-muted text-sm mb-2">模型</Text>
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="gpt-4o-mini"
              placeholderTextColor={colors.muted}
              className="bg-background rounded-xl px-4 py-3 text-foreground border border-border"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 操作按钮 */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleTestConnection}
              disabled={isTesting}
              className="flex-1 bg-muted/20 rounded-xl py-3 items-center"
              activeOpacity={0.8}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text className="text-foreground font-medium">测试连接</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveConfig}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-background font-semibold">保存配置</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 对话区域 */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* 消息列表 */}
        <FlatList
          ref={flatListRef}
          data={state.aiMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
          ListEmptyComponent={
            <View className="items-center py-10">
              <IconSymbol name="brain" size={48} color={colors.muted} />
              <Text className="text-muted mt-4 text-center">
                {state.aiConfig.isConfigured 
                  ? "开始和AI助手对话吧\n我可以帮你分析训练数据、提供建议"
                  : "请先配置API Key\n点击右上角齿轮图标"
                }
              </Text>
            </View>
          }
        />

        {/* 加载指示器 */}
        {isLoading && (
          <View className="px-5 pb-2">
            <View className="bg-surface rounded-2xl px-4 py-3 self-start border border-border">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}

        {/* 输入区域 */}
        <View className="px-5 py-3 border-t border-border bg-background">
          <View className="flex-row items-end gap-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入消息..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={1000}
              className="flex-1 bg-surface rounded-2xl px-4 py-3 text-foreground border border-border max-h-32"
              style={{ minHeight: 44 }}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                inputText.trim() && !isLoading ? "bg-primary" : "bg-muted/30"
              }`}
              activeOpacity={0.8}
            >
              <IconSymbol 
                name="paperplane.fill" 
                size={20} 
                color={inputText.trim() && !isLoading ? colors.background : colors.muted} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
