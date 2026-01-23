import React from 'react';
import Markdown from 'react-native-markdown-display';
import { View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface MarkdownTextProps {
  content: string;
  style?: ViewStyle;
}

export function MarkdownText({ content, style }: MarkdownTextProps) {
  const colors = useColors();

  if (!content) return null;

  return (
    <View style={style}>
      <Markdown
        style={{
        body: { color: colors.foreground, fontSize: 15, lineHeight: 22 },
        paragraph: { marginTop: 0, marginBottom: 8 },
        code_inline: {
          backgroundColor: colors.surface,
          color: colors.foreground,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
          fontFamily: 'Menlo',
          fontSize: 14,
        },
        code_block: {
          backgroundColor: colors.surface,
          padding: 10,
          borderRadius: 8,
          fontFamily: 'Menlo',
          fontSize: 13,
        },
        fence: {
          backgroundColor: colors.surface,
          padding: 10,
          borderRadius: 8,
          fontFamily: 'Menlo',
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
        }}
      >
        {content}
      </Markdown>
    </View>
  );
}
