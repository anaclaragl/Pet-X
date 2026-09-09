import { EditProfileModal } from '@/components/edit-profile-modal';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { PostActions } from '@/components/post-actions';
import { PostOptionsMenuModal } from '@/components/post-options-modal';
import { EditPostModal } from '@/components/edit-post-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Post, usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, View, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { theme, colorScheme, toggleTheme } = useAppTheme();
  const { userPosts, userProfile, toggleLike, markAsResolved, deletePost, editPost } = usePosts();
  const { signOut } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);

  const [optionsPost, setOptionsPost] = useState<Post | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const [editPostTarget, setEditPostTarget] = useState<Post | null>(null);
  const [editPostVisible, setEditPostVisible] = useState(false);

  const openViewer = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja sair da sua conta?')) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sair da Conta',
        'Tem certeza de que deseja sair da sua conta?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: () => signOut() },
        ]
      );
    }
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

  const resolvedCount = userPosts.filter(p => p.isResolved).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
          <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <ThemedText type="title" style={{ fontSize: 24, marginTop: 16 }}>{userProfile.name}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>{userProfile.username}</ThemedText>
            
            {Boolean(userProfile.city || userProfile.state) ? (
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={15} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {[userProfile.city, userProfile.state].filter(Boolean).join(', ')}
                </ThemedText>
              </View>
            ) : null}

            {userProfile.bio ? (
              <ThemedText style={[styles.bio, { color: theme.text }]}>
                {userProfile.bio}
              </ThemedText>
            ) : null}

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: theme.text }]}>{userPosts.length}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>{userPosts.length === 1 ? 'Post' : 'Posts'}</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: '#00BA7C' }]}>{resolvedCount}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>Ajudou</ThemedText>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.editButton, 
                  { borderColor: theme.border }, 
                  hovered && { backgroundColor: theme.backgroundElement },
                  pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }
                ]}
                onPress={() => setEditProfileModalVisible(true)}
              >
                <MaterialIcons name="edit" size={16} color={theme.text} style={{ marginRight: 6 }} />
                <ThemedText style={{ fontWeight: '600', fontSize: 14 }}>Editar Perfil</ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed, hovered }: any) => [
                  styles.logoutButton, 
                  { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }, 
                  hovered && { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
                  pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] }
                ]}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <ThemedText style={{ color: '#EF4444', fontWeight: '600', fontSize: 14 }}>Sair</ThemedText>
              </Pressable>
            </View>
          </ThemedView>

          <View style={[styles.themeToggle, { borderBottomColor: theme.border, borderTopColor: theme.border }]}>
            <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>Modo Escuro</ThemedText>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.brand }}
            />
          </View>

          <View style={styles.postsHeader}>
            <ThemedText type="subtitle" style={{ fontSize: 18 }}>Meus Posts</ThemedText>
          </View>

          {userPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <ThemedText style={{ color: theme.textSecondary }}>Seus posts aparecerão aqui.</ThemedText>
            </View>
          ) : (
            userPosts.map((item) => {
              const postImages: string[] = item.images && item.images.length > 0
                ? item.images
                : (item.image ? [item.image] : []);

              return (
                <View key={item.id} style={[styles.postContainer, { borderBottomColor: theme.border }]}>
                  <Image source={{ uri: item.avatar }} style={styles.postAvatar} resizeMode="cover" />
                  <View style={styles.postContent}>
                    <View style={styles.postHeader}>
                      <View style={styles.postUserInfo}>
                        <ThemedText style={styles.userName}>{item.user}</ThemedText>
                        <ThemedText style={{ color: theme.textSecondary, marginLeft: 4 }}>· {item.time}</ThemedText>
                      </View>

                      <Pressable
                        style={({ pressed, hovered }: any) => [
                          styles.moreBtn,
                          hovered && { backgroundColor: theme.backgroundElement },
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => {
                          setOptionsPost(item);
                          setOptionsVisible(true);
                        }}
                      >
                        <MaterialIcons name="more-horiz" size={20} color={theme.textSecondary} />
                      </Pressable>
                    </View>

                    <View style={styles.badgesRow}>
                      <View style={[styles.tagBadge, { backgroundColor: getTagColor(item.type) }]}>
                        <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                          {getTagLabel(item.type)}
                        </ThemedText>
                      </View>

                      {Boolean(item.isResolved) ? (
                        <View style={[styles.resolvedBadge, { backgroundColor: '#00BA7C' }]}>
                          <MaterialIcons name="verified" size={14} color="#FFF" />
                          <ThemedText style={styles.resolvedBadgeText}>ENCONTRADO 🎉</ThemedText>
                        </View>
                      ) : null}
                    </View>

                    <ThemedText style={styles.textContent}>{item.content}</ThemedText>

                    {/* Photos Gallery */}
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

                    <PostActions
                      postId={item.id}
                      likesCount={item.likesCount}
                      isLiked={item.isLiked}
                      commentsCount={item.commentsCount}
                      onLike={() => toggleLike(item.id)}
                      onComment={() => router.push(`/post/${item.id}` as any)}
                    />
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <ImageViewerModal
          visible={modalVisible}
          images={modalImages}
          initialIndex={modalInitialIndex}
          onClose={() => setModalVisible(false)}
        />

        <EditProfileModal
          visible={editProfileModalVisible}
          onClose={() => setEditProfileModalVisible(false)}
        />

        <PostOptionsMenuModal
          visible={optionsVisible}
          post={optionsPost}
          onClose={() => setOptionsVisible(false)}
          onToggleResolved={(id) => markAsResolved(id)}
          onEdit={(p) => {
            setEditPostTarget(p);
            setEditPostVisible(true);
          }}
          onDelete={(id) => deletePost(id)}
        />

        <EditPostModal
          visible={editPostVisible}
          post={editPostTarget}
          onClose={() => setEditPostVisible(false)}
          onSave={(id, newContent) => editPost(id, newContent)}
        />
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
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  bio: {
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    fontSize: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  postsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  emptyPosts: {
    padding: 32,
    alignItems: 'center',
  },
  postContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
  },
  moreBtn: {
    padding: 4,
    borderRadius: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  textContent: {
    lineHeight: 22,
    marginBottom: 12,
  },
  singlePostImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  multiImageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  multiPostImage: {
    width: 200,
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
  },
});
