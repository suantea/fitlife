import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';
import { MarkdownText } from '@/components/markdown-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatScreen() {
  const colors = useColors();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的个人健身助手。有什么可以帮你的吗？你可以问我关于训练计划、饮食建议或动作要领的问题。' }
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
        const responseText = typeof data === 'string' ? data : (data as any).message || JSON.stringify(data);
        
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: responseText
        };
        setMessages(prev => [...prev, newMessage]);
    },
    onError: (error) => {
        const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `出错了: ${error.message}`
        };
        setMessages(prev => [...prev, errorMessage]);
    }
  });

  const sendMessage = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    chatMutation.mutate({ message: input.trim() });
    setInput('');
  };

  useEffect(() => {
    setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100} 
    >
      <Stack.Screen options={{ title: 'AI 智能助手', headerBackTitle: '返回' }} />
      
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageBubble, 
              msg.role === 'user' 
                ? { alignSelf: 'flex-end', backgroundColor: colors.tint } 
                : { alignSelf: 'flex-start', backgroundColor: colors.surface }
            ]}
          >
            {msg.role === 'assistant' ? (
                <MarkdownText content={msg.content} style={{}} />
            ) : (
                <Text style={{ color: '#fff', fontSize: 16 }}>{msg.content}</Text>
            )}
          </View>
        ))}
        {chatMutation.isPending && (
            <View style={[styles.messageBubble, { alignSelf: 'flex-start', backgroundColor: colors.surface }]}>
                <ActivityIndicator color={colors.tint} />
            </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          value={input}
          onChangeText={setInput}
          placeholder="输入你的问题..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <TouchableOpacity 
            onPress={sendMessage} 
            disabled={!input.trim() || chatMutation.isPending}
            style={[styles.sendButton, { backgroundColor: input.trim() ? colors.tint : colors.muted }]}
        >
            <IconSymbol name="arrow.up" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
