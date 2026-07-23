import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, TextInput, Pressable, FlatList, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { usePosts } from '@/context/PostsContext';
import { useChat } from '@/context/ChatContext';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PostDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, toggleLike, addComment } = usePosts();
  const { startOrOpenChat } = useChat();

  const [commentText, setCommentText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.responsiveWrapper}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="subtitle">Post não encontrado</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const postImages: string[] = post.images && post.images.length > 0
    ? post.images
    : (post.image ? [post.image] : []);

  const openViewer = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleOpenChat = () => {
    const chatId = startOrOpenChat(post.user, post.avatar);
    router.push(`/chat/${chatId}` as any);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText('');
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case 'perdido': return theme.lost;
      case 'encontrado': return theme.found;
      case 'ong': return theme.ngo;
      default: return theme.brand;
    }
  };

  const getTagLabel = (type: string) => {
    switch (type) {
      case 'perdido': return 'Perdido';
      case 'encontrado': return 'Encontrado';
      case 'ong': return 'ONG';
      default: return 'Outro';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="title" style={{ fontSize: 20 }}>Post</ThemedText>
          </View>

          <FlatList
            ref={flatListRef}
            data={post.comments}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <View style={[styles.mainPostContainer, { borderBottomColor: theme.border }]}>
                {/* User Info */}
                <View style={styles.postUserRow}>
                  <Image source={{ uri: post.avatar }} style={styles.avatar} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.userName}>{post.user}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>· {post.time}</ThemedText>
                  </View>
                  <View style={[styles.tagBadge, { backgroundColor: getTagColor(post.type) }]}>
                    <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                      {getTagLabel(post.type)}
                    </ThemedText>
                  </View>
                </View>

                {/* Content */}
                <ThemedText style={styles.postContentText}>{post.content}</ThemedText>

                {/* Photos */}
                {postImages.length === 1 && (
                  <Pressable onPress={() => openViewer(postImages, 0)}>
                    <Image
                      source={{ uri: postImages[0] }}
                      style={[styles.singlePostImage, { borderColor: theme.border }]}
                      resizeMode="cover"
                    />
                  </Pressable>
                )}

                {postImages.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multiImageContainer}>
                    {postImages.map((imgUri, idx) => (
                      <Pressable key={`${imgUri}-${idx}`} onPress={() => openViewer(postImages, idx)}>
                        <Image
                          source={{ uri: imgUri }}
                          style={[styles.multiPostImage, { borderColor: theme.border }]}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                {/* Action Toolbar */}
                <View style={[styles.actionsBar, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
                  <Pressable style={styles.actionItem} onPress={handleOpenChat}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color={theme.textSecondary} />
                  </Pressable>
                  <Pressable style={styles.actionItem} onPress={() => toggleLike(post.id)}>
                    <MaterialIcons
                      name={post.isLiked ? 'favorite' : 'favorite-border'}
                      size={20}
                      color={post.isLiked ? '#E0245E' : theme.textSecondary}
                    />
                    {post.likesCount > 0 && (
                      <ThemedText style={{ marginLeft: 6, fontSize: 13, color: post.isLiked ? '#E0245E' : theme.textSecondary }}>
                        {post.likesCount}
                      </ThemedText>
                    )}
                  </Pressable>
                  <Pressable style={styles.actionItem}>
                    <MaterialIcons name="share" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  {post.comments.length === 1 ? '1 Resposta' : `${post.comments.length} Respostas`}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={[styles.commentRow, { borderBottomColor: theme.border }]}>
                <Image source={{ uri: item.avatar }} style={styles.commentAvatar} resizeMode="cover" />
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <ThemedText style={styles.commentUser}>{item.user}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 4 }}>· {item.time}</ThemedText>
                  </View>
                  <ThemedText style={styles.commentText}>{item.content}</ThemedText>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyComments}>
                <ThemedText style={{ color: theme.textSecondary }}>Seja o primeiro a responder!</ThemedText>
              </View>
            )}
          />

          {/* Comment Input */}
          <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
              placeholder="Responder a este post..."
              placeholderTextColor={theme.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: theme.brand, opacity: commentText.trim() ? 1 : 0.5 },
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim()}
            >
              <MaterialIcons name="send" size={20} color="#FFF" />
            </Pressable>
          </View>

          <ImageViewerModal
            visible={modalVisible}
            images={modalImages}
            initialIndex={modalInitialIndex}
            onClose={() => setModalVisible(false)}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  mainPostContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  postUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postContentText: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
  },
  singlePostImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  multiImageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  multiPostImage: {
    width: 220,
    height: 190,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  commentRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '700',
    fontSize: 15,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 21,
  },
  emptyComments: {
    padding: 32,
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
