import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  FlatList,
  Pressable,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PostActions } from '@/components/post-actions';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { PostOptionsMenuModal } from '@/components/post-options-modal';
import { EditPostModal } from '@/components/edit-post-modal';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { usePosts, Post } from '@/context/PostsContext';
import { useChat } from '@/context/ChatContext';
import { apiFetch } from '@/lib/api';

import { DesktopSidebar } from '@/components/desktop-sidebar';
import { useWindowDimensions } from 'react-native';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { user: currentUser } = useAuth();
  const { posts: allPosts, toggleLike, markAsResolved, deletePost, editPost } = usePosts();
  const { startOrOpenChat } = useChat();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  // Modal states
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const isOwner = currentUser?.id === id;

  useEffect(() => {
    if (id && currentUser?.id && id === currentUser.id) {
      router.replace('/(tabs)/profile' as any);
      return;
    }
  }, [id, currentUser?.id]);

  useEffect(() => {
    async function loadUserProfile() {
      if (!id || (currentUser?.id && id === currentUser.id)) return;
      setLoading(true);
      try {
        const res = await apiFetch<any>(`/api/users/${id}/profile`);
        if (res && res.profile) {
          setProfileData(res.profile);
          if (Array.isArray(res.posts)) {
            setUserPosts(res.posts);
          }
        }
      } catch (err) {
        // Fallback: busca nos posts locais se o backend estiver offline
        const localMatches = allPosts.filter((p) => p.userId === id);
        setUserPosts(localMatches);
        if (localMatches.length > 0) {
          setProfileData({
            name: localMatches[0].user,
            username: `@${localMatches[0].user.toLowerCase().replace(/\s+/g, '')}`,
            avatar_url: localMatches[0].avatar,
            city: localMatches[0].city,
            state: localMatches[0].state,
            bio: '',
            account_type: 'tutor',
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [id, allPosts]);

  const handleOpenChat = async () => {
    if (!profileData || !id) return;
    try {
      const convId = await startOrOpenChat(
        id,
        profileData.name || 'Usuário',
        profileData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
      );
      router.push(`/chat/${convId}` as any);
    } catch (e) {
      console.warn('Erro ao abrir conversa:', e);
    }
  };

  const handleShare = async (post: Post) => {
    try {
      await Share.share({
        message: `Confira este pet no Pet-X: ${post.content}`,
        title: 'Pet-X - Ajudando Pets',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const openViewer = (images: string[], index: number = 0) => {
    setViewerImages(images);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <DesktopSidebar currentTab="profile" />
        <View style={[styles.mainArea, isDesktop && { marginLeft: 260 }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.brand} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl =
    profileData?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80';
  const displayName = profileData?.name || 'Usuário';
  const usernameStr = profileData?.username || `@${displayName.toLowerCase().replace(/\s+/g, '')}`;
  const isOng = profileData?.account_type === 'ong';
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Desktop Persistent Sidebar */}
      <DesktopSidebar currentTab="profile" />

      <View style={[styles.mainArea, isDesktop && { marginLeft: 260 }]}>
        <View style={styles.responsiveWrapper}>
          {/* Header */}
          <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="title" style={{ fontSize: 20 }}>
              {displayName}
            </ThemedText>
            <View style={{ width: 32 }} />
          </ThemedView>

        <FlatList
          data={userPosts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View style={[styles.profileHeader, { borderBottomColor: theme.border }]}>
              {/* Avatar e Badges */}
              <View style={styles.avatarSection}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
                {isOng && (
                  <View style={[styles.ongBadge, { backgroundColor: theme.ngo }]}>
                    <MaterialIcons name="verified" size={14} color="#FFF" />
                    <ThemedText style={styles.ongBadgeText}>ONG</ThemedText>
                  </View>
                )}
              </View>

              <ThemedText style={styles.name}>{displayName}</ThemedText>
              <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
                {usernameStr}
              </ThemedText>

              {/* Localização */}
              {(profileData?.city || profileData?.state) && (
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={14} color={theme.textSecondary} />
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}>
                    {[profileData.city, profileData.state].filter(Boolean).join(', ')}
                  </ThemedText>
                </View>
              )}

              {/* Bio */}
              {Boolean(profileData?.bio) && (
                <ThemedText style={[styles.bio, { color: theme.text }]}>
                  {profileData.bio}
                </ThemedText>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {!isOwner ? (
                  <Pressable
                    style={({ pressed, hovered }: any) => [
                      styles.messageButton,
                      { backgroundColor: theme.brand },
                      hovered && { opacity: 0.92 },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={handleOpenChat}
                  >
                    <MaterialIcons name="chat-bubble-outline" size={18} color="#FFF" />
                    <ThemedText style={styles.messageButtonText}>Enviar Mensagem</ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed, hovered }: any) => [
                      styles.editProfileButton,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                      hovered && { borderColor: theme.brand },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => router.push('/(tabs)/profile' as any)}
                  >
                    <MaterialIcons name="edit" size={16} color={theme.text} />
                    <ThemedText style={[styles.editProfileText, { color: theme.text }]}>
                      Meu Perfil
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              {/* Stats */}
              <View style={[styles.statsContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{userPosts.length}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Publicações
                  </ThemedText>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{totalLikes}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                    Curtidas
                  </ThemedText>
                </View>
              </View>

              {/* Feed Title */}
              <View style={styles.feedTitleSection}>
                <ThemedText type="subtitle" style={{ fontSize: 16, fontWeight: '700' }}>
                  Publicações de {displayName}
                </ThemedText>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="pets" size={44} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhuma publicação encontrada.
              </ThemedText>
            </View>
          )}
          renderItem={({ item }) => {
            const postImages: string[] =
              item.images && item.images.length > 0
                ? item.images
                : item.image
                ? [item.image]
                : [];

            return (
              <View style={[styles.postContainer, { borderBottomColor: theme.border }]}>
                {/* Clickable Card Body */}
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.95 }]}
                  onPress={() => router.push(`/post/${item.id}` as any)}
                >
                  <View style={styles.postInner}>
                    <Image source={{ uri: item.avatar }} style={styles.postAvatar} resizeMode="cover" />
                    <View style={styles.postContent}>
                      <View style={styles.postHeaderRow}>
                        <View style={styles.postUserInfo}>
                          <ThemedText style={styles.postUserName}>{item.user}</ThemedText>
                          <ThemedText style={{ color: theme.textSecondary, marginLeft: 4 }}>
                            · {item.time}
                          </ThemedText>
                        </View>

                        {/* More options button only for post owner */}
                        {item.userId === currentUser?.id && (
                          <Pressable
                            style={({ pressed }: any) => [styles.moreBtn, pressed && { opacity: 0.6 }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedPost(item);
                              setOptionsVisible(true);
                            }}
                          >
                            <MaterialIcons name="more-horiz" size={20} color={theme.textSecondary} />
                          </Pressable>
                        )}
                      </View>

                      {/* Badges */}
                      <View style={styles.badgesRow}>
                        <View style={[styles.tagBadge, { backgroundColor: item.type === 'perdido' ? theme.lost : item.type === 'encontrado' ? theme.found : theme.ngo }]}>
                          <ThemedText style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                            {item.type.toUpperCase()}
                          </ThemedText>
                        </View>

                        {Boolean(item.isResolved) && (
                          <View style={[styles.resolvedBadge, { backgroundColor: '#00BA7C' }]}>
                            <MaterialIcons name="verified" size={13} color="#FFF" />
                            <ThemedText style={styles.resolvedBadgeText}>ENCONTRADO 🎉</ThemedText>
                          </View>
                        )}
                      </View>

                      <ThemedText style={styles.textContent}>{item.content}</ThemedText>

                      {/* Gallery */}
                      {postImages.length === 1 && (
                        <Pressable
                          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            openViewer(postImages, 0);
                          }}
                        >
                          <Image
                            source={{ uri: postImages[0] }}
                            style={[styles.singlePostImage, { borderColor: theme.border }]}
                            resizeMode="cover"
                          />
                        </Pressable>
                      )}

                      {postImages.length > 1 && (
                        <FlatList
                          horizontal
                          data={postImages}
                          keyExtractor={(img, idx) => `${img}-${idx}`}
                          showsHorizontalScrollIndicator={false}
                          style={styles.multiImageContainer}
                          renderItem={({ item: imgUri, index: idx }) => (
                            <Pressable
                              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                              onPress={(e) => {
                                e.stopPropagation();
                                openViewer(postImages, idx);
                              }}
                            >
                              <Image
                                source={{ uri: imgUri }}
                                style={[styles.multiPostImage, { borderColor: theme.border }]}
                                resizeMode="cover"
                              />
                            </Pressable>
                          )}
                        />
                      )}

                      <PostActions
                        postId={item.id}
                        likesCount={item.likesCount}
                        isLiked={item.isLiked}
                        commentsCount={item.commentsCount}
                        onLike={() => toggleLike(item.id)}
                        onComment={() => router.push(`/post/${item.id}` as any)}
                        onShare={() => handleShare(item)}
                      />
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />

        <ImageViewerModal
          visible={viewerVisible}
          images={viewerImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
        />

        <PostOptionsMenuModal
          visible={optionsVisible}
          post={selectedPost}
          onClose={() => setOptionsVisible(false)}
          onToggleResolved={(postId) => markAsResolved(postId)}
          onEdit={(post) => {
            setEditingPost(post);
            setEditModalVisible(true);
          }}
          onDelete={(postId) => deletePost(postId)}
        />

        <EditPostModal
          visible={editModalVisible}
          post={editingPost}
          onClose={() => setEditModalVisible(false)}
          onSave={(postId, newContent) => editPost(postId, newContent)}
        />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  ongBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ongBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  bio: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  messageButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  feedTitleSection: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  postContainer: {
    borderBottomWidth: 1,
    padding: 16,
  },
  postInner: {
    flexDirection: 'row',
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserName: {
    fontWeight: '700',
    fontSize: 15,
  },
  moreBtn: {
    padding: 4,
    borderRadius: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  resolvedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  textContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  singlePostImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  multiImageContainer: {
    marginBottom: 10,
  },
  multiPostImage: {
    width: 170,
    height: 170,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
});
