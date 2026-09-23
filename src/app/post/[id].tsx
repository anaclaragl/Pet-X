import { EditPostModal } from '@/components/edit-post-modal';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { PostOptionsMenuModal } from '@/components/post-options-modal';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { usePosts } from '@/context/PostsContext';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance } from '@/services/location';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, Share, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesktopSidebar } from '@/components/desktop-sidebar';

export default function PostDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, toggleLike, addComment, markAsResolved, deletePost, editPost, userProfile } = usePosts();
  const { user } = useAuth();
  const { startOrOpenChat } = useChat();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [commentText, setCommentText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, isDesktop && { paddingLeft: 260 }, { backgroundColor: theme.background }]}>
        <DesktopSidebar currentTab="index" />
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

  const isMyPost = (user && post.userId === user.id) || post.user === userProfile.name;

  const postImages: string[] = post.images && post.images.length > 0
    ? post.images
    : (post.image ? [post.image] : []);

  const openViewer = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleOpenChat = async () => {
    if (!post) return;
    try {
      const convId = await startOrOpenChat(
        post.userId,
        post.user,
        post.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
      );
      router.push(`/chat/${convId}` as any);
    } catch (e) {
      console.warn('Erro ao abrir conversa:', e);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira este post de ${post.user} no Pet-X: ${post.content}`,
        title: 'Pet-X',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await addComment(post.id, commentText.trim());
    setCommentText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
    <SafeAreaView style={[styles.container, isDesktop && { paddingLeft: 260 }, { backgroundColor: theme.background }]}>
      <DesktopSidebar currentTab="index" />
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
                <View style={styles.postUserRow}>
                  <Pressable
                    style={({ pressed }) => [styles.authorProfileLink, pressed && { opacity: 0.75 }]}
                    onPress={() => {
                      if (isMyPost) {
                        router.push('/(tabs)/profile' as any);
                      } else {
                        router.push(`/profile/${post.userId}` as any);
                      }
                    }}
                  >
                    <Image source={{ uri: post.avatar }} style={styles.avatar} resizeMode="cover" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <ThemedText style={styles.userName}>{post.user}</ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>· {post.time}</ThemedText>
                    </View>
                  </Pressable>

                  {!isMyPost && (
                    <Pressable
                      style={({ pressed, hovered }: any) => [
                        styles.chatAuthorBtn,
                        { backgroundColor: 'rgba(255, 107, 74, 0.12)', borderColor: theme.brand },
                        hovered && { backgroundColor: 'rgba(255, 107, 74, 0.22)' },
                        pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                      ]}
                      onPress={handleOpenChat}
                    >
                      <MaterialIcons name="chat" size={16} color={theme.brand} style={{ marginRight: 4 }} />
                      <ThemedText style={{ color: theme.brand, fontWeight: '700', fontSize: 12 }}>
                        Conversar
                      </ThemedText>
                    </Pressable>
                  )}

                  {isMyPost && (
                    <Pressable
                      style={({ pressed, hovered }: any) => [
                        styles.moreBtn,
                        hovered && { backgroundColor: theme.backgroundElement },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setOptionsVisible(true)}
                    >
                      <MaterialIcons name="more-horiz" size={20} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>

                <View style={styles.badgesRow}>
                  <View style={[styles.tagBadge, { backgroundColor: getTagColor(post.type) }]}>
                    <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                      {getTagLabel(post.type)}
                    </ThemedText>
                  </View>

                  {/* Distance Badge */}
                  {formatDistance(post.distanceKm) ? (
                    <View style={[styles.distanceBadge, { backgroundColor: 'rgba(255, 107, 74, 0.12)', borderColor: theme.brand }]}>
                      <MaterialIcons name="near-me" size={12} color={theme.brand} />
                      <ThemedText style={{ color: theme.brand, fontSize: 11, fontWeight: '700' }}>
                        {formatDistance(post.distanceKm)}
                      </ThemedText>
                    </View>
                  ) : null}

                  {Boolean(post.city || post.state || post.neighborhood) ? (
                    <View style={[styles.locationBadge, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                      <MaterialIcons name="location-on" size={13} color={theme.textSecondary} />
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                        {[post.neighborhood, post.city, post.state].filter(Boolean).join(', ')} {post.isApproximate ? '(Aproximado)' : ''}
                      </ThemedText>
                    </View>
                  ) : null}

                  {Boolean(post.isResolved) ? (
                    <View style={[styles.resolvedBadge, { backgroundColor: '#00BA7C' }]}>
                      <MaterialIcons name="verified" size={14} color="#FFF" />
                      <ThemedText style={styles.resolvedBadgeText}>ENCONTRADO 🎉</ThemedText>
                    </View>
                  ) : null}
                </View>

                <ThemedText style={styles.postContentText}>{post.content}</ThemedText>

                {postImages.length === 1 && (
                  <Pressable
                    style={({ pressed, hovered }: any) => [
                      hovered && { opacity: 0.92, transform: [{ scale: 1.005 }] },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => openViewer(postImages, 0)}
                  >
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
                      <Pressable
                        key={`${imgUri}-${idx}`}
                        style={({ pressed, hovered }: any) => [
                          hovered && { opacity: 0.92, transform: [{ scale: 1.01 }] },
                          pressed && { opacity: 0.8 }
                        ]}
                        onPress={() => openViewer(postImages, idx)}
                      >
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
                  <Pressable style={styles.actionItem} onPress={() => { }}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color={theme.textSecondary} />
                    {post.comments.length > 0 && (
                      <ThemedText style={{ marginLeft: 6, fontSize: 13, color: theme.textSecondary }}>
                        {post.comments.length}
                      </ThemedText>
                    )}
                  </Pressable>
                  <Pressable style={styles.actionItem} onPress={() => toggleLike(post.id)}>
                    <MaterialIcons
                      name={post.isLiked ? 'favorite' : 'favorite-border'}
                      size={20}
                      color={post.isLiked ? '#EF4444' : theme.textSecondary}
                    />
                    {post.likesCount > 0 && (
                      <ThemedText style={{ marginLeft: 6, fontSize: 13, color: post.isLiked ? '#EF4444' : theme.textSecondary }}>
                        {post.likesCount}
                      </ThemedText>
                    )}
                  </Pressable>
                  <Pressable style={styles.actionItem} onPress={handleShare}>
                    <MaterialIcons name="share" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  {post.comments.length === 1 ? '1 Resposta' : `${post.comments.length} Respostas`}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => {
              const isMyComment = item.userId === user?.id;
              return (
                <View style={[styles.commentRow, { borderBottomColor: theme.border }]}>
                  <Pressable
                    onPress={() => {
                      if (isMyComment) {
                        router.push('/(tabs)/profile' as any);
                      } else if (item.userId) {
                        router.push(`/profile/${item.userId}` as any);
                      }
                    }}
                    disabled={!item.userId}
                    style={({ pressed }) => [pressed && Boolean(item.userId) && { opacity: 0.75 }]}
                  >
                    <Image source={{ uri: item.avatar }} style={styles.commentAvatar} resizeMode="cover" />
                  </Pressable>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Pressable
                        onPress={() => {
                          if (isMyComment) {
                            router.push('/(tabs)/profile' as any);
                          } else if (item.userId) {
                            router.push(`/profile/${item.userId}` as any);
                          }
                        }}
                        disabled={!item.userId}
                      >
                        <ThemedText style={styles.commentUser}>{item.user}</ThemedText>
                      </Pressable>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 4 }}>· {item.time}</ThemedText>
                    </View>
                    <ThemedText style={styles.commentText}>{item.content}</ThemedText>
                  </View>
                </View>
              );
            }}
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

          <PostOptionsMenuModal
            visible={optionsVisible}
            post={post}
            onClose={() => setOptionsVisible(false)}
            onToggleResolved={(postId) => markAsResolved(postId)}
            onEdit={() => setEditVisible(true)}
            onDelete={(postId) => {
              deletePost(postId);
              router.back();
            }}
          />

          <EditPostModal
            visible={editVisible}
            post={post}
            onClose={() => setEditVisible(false)}
            onSave={(postId, newContent) => editPost(postId, newContent)}
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
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resolvedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
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
  moreBtn: {
    padding: 4,
    borderRadius: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  chatAuthorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  authorProfileLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
});
