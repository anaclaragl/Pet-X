import React from 'react';
import { Modal, StyleSheet, View, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Post } from '@/context/PostsContext';

interface PostOptionsMenuModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
  onToggleResolved: (postId: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}

export function PostOptionsMenuModal({
  visible,
  onClose,
  post,
  onToggleResolved,
  onEdit,
  onDelete,
}: PostOptionsMenuModalProps) {
  const theme = useTheme();

  if (!post) return null;

  const handleToggleResolved = () => {
    onToggleResolved(post.id);
    onClose();
  };

  const handleEdit = () => {
    onClose();
    onEdit(post);
  };

  const handleDelete = () => {
    onDelete(post.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <ThemedText style={styles.headerTitle}>Opções do Post</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.optionsList}>
            {/* Toggle Resolved Option */}
            <Pressable
              style={({ pressed, hovered }: any) => [
                styles.optionItem,
                hovered && { backgroundColor: 'rgba(0, 186, 124, 0.1)' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleToggleResolved}
            >
              <View style={[styles.iconBg, { backgroundColor: '#00BA7C20' }]}>
                <MaterialIcons
                  name={post.isResolved ? 'undo' : 'verified'}
                  size={22}
                  color="#00BA7C"
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.optionTitle, { color: '#00BA7C' }]}>
                  {post.isResolved ? 'Desmarcar como Resolvido' : 'Marcar como Encontrado / Resolvido 🎉'}
                </ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                  {post.isResolved
                    ? 'Retornar o post ao estado normal'
                    : 'Adiciona o selo de sucesso ao post!'}
                </ThemedText>
              </View>
            </Pressable>

            {/* Edit Option */}
            <Pressable
              style={({ pressed, hovered }: any) => [
                styles.optionItem,
                hovered && { backgroundColor: theme.backgroundElement },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleEdit}
            >
              <View style={[styles.iconBg, { backgroundColor: theme.backgroundElement }]}>
                <MaterialIcons name="edit" size={22} color={theme.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.optionTitle}>Editar publicação</ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                  Altere a descrição do post
                </ThemedText>
              </View>
            </Pressable>

            {/* Delete Option */}
            <Pressable
              style={({ pressed, hovered }: any) => [
                styles.optionItem,
                hovered && { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleDelete}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EF444420' }]}>
                <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.optionTitle, { color: '#EF4444' }]}>
                  Excluir publicação
                </ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                  Essa ação removerá o post permanentemente
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 16px 32px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  optionsList: {
    padding: 12,
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 14,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
