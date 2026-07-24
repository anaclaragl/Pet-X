import React from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';

interface PostActionsProps {
  postId: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare?: () => void;
}

export function PostActions({
  likesCount,
  isLiked = false,
  commentsCount,
  onLike,
  onComment,
  onShare,
}: PostActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.actionsContainer}>
      {/* Botão de Comentário */}
      <Pressable
        onPress={onComment}
        style={({ pressed, hovered }: any) => [
          styles.actionPill,
          hovered && styles.commentHoverBg,
          pressed && styles.pressedPill,
        ]}
      >
        {({ hovered }: any) => {
          const color = hovered ? '#1D9BF0' : theme.textSecondary;
          return (
            <>
              <View style={[styles.iconWrapper, hovered && styles.iconPop]}>
                <MaterialIcons name="chat-bubble-outline" size={19} color={color} />
              </View>
              {commentsCount > 0 && (
                <ThemedText style={[styles.actionText, { color }]}>
                  {commentsCount}
                </ThemedText>
              )}
            </>
          );
        }}
      </Pressable>

      {/* Botão de Curtir / Coração */}
      <Pressable
        onPress={onLike}
        style={({ pressed, hovered }: any) => [
          styles.actionPill,
          (hovered || isLiked) && styles.likeHoverBg,
          pressed && styles.pressedPill,
        ]}
      >
        {({ hovered }: any) => {
          const heartColor = isLiked ? '#E0245E' : hovered ? '#E0245E' : theme.textSecondary;
          return (
            <>
              <View style={[styles.iconWrapper, (hovered || isLiked) && styles.heartPop]}>
                <MaterialIcons
                  name={isLiked ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={heartColor}
                />
              </View>
              {likesCount > 0 && (
                <ThemedText style={[styles.actionText, { color: heartColor }]}>
                  {likesCount}
                </ThemedText>
              )}
            </>
          );
        }}
      </Pressable>

      {/* Botão de Compartilhar */}
      <Pressable
        onPress={onShare}
        style={({ pressed, hovered }: any) => [
          styles.actionPill,
          hovered && styles.shareHoverBg,
          pressed && styles.pressedPill,
        ]}
      >
        {({ hovered }: any) => {
          const color = hovered ? '#00BA7C' : theme.textSecondary;
          return (
            <View style={[styles.iconWrapper, hovered && styles.iconPop]}>
              <MaterialIcons name="share" size={19} color={color} />
            </View>
          );
        }}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 280,
    marginTop: 4,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pressedPill: {
    opacity: 0.75,
    transform: [{ scale: 0.92 }],
  },
  commentHoverBg: {
    backgroundColor: 'rgba(29, 155, 240, 0.12)',
  },
  likeHoverBg: {
    backgroundColor: 'rgba(224, 36, 94, 0.12)',
  },
  shareHoverBg: {
    backgroundColor: 'rgba(0, 186, 124, 0.12)',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPop: {
    transform: [{ scale: 1.2 }],
  },
  heartPop: {
    transform: [{ scale: 1.25 }],
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
