import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Post } from '@/context/PostsContext';

interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
  onSave: (postId: string, newContent: string) => void;
}

export function EditPostModal({
  visible,
  onClose,
  post,
  onSave,
}: EditPostModalProps) {
  const theme = useTheme();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (post) {
      setContent(post.content);
    }
  }, [post]);

  if (!post) return null;

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(post.id, content.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPress} onPress={onClose}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <ThemedText style={styles.headerTitle}>Editar Publicação</ThemedText>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Input area */}
            <View style={styles.body}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
                multiline
                numberOfLines={5}
                value={content}
                onChangeText={setContent}
                placeholder="Edite a descrição da sua publicação..."
                placeholderTextColor={theme.textSecondary}
              />

              <View style={styles.footer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    { borderColor: theme.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={onClose}
                >
                  <ThemedText style={{ fontWeight: '600' }}>Cancelar</ThemedText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { backgroundColor: theme.brand },
                    (!content.trim() || content.trim() === post.content) && { opacity: 0.5 },
                    pressed && { opacity: 0.8 },
                  ]}
                  disabled={!content.trim() || content.trim() === post.content}
                  onPress={handleSave}
                >
                  <ThemedText style={styles.saveBtnText}>Salvar Alterações</ThemedText>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayPress: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
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
  body: {
    padding: 20,
  },
  textInput: {
    width: '100%',
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
