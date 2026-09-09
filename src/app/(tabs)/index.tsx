import { useState } from 'react';
import { StyleSheet, FlatList, View, Image, Pressable, ScrollView, Share, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Post, usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { PostActions } from '@/components/post-actions';
import { PostOptionsMenuModal } from '@/components/post-options-modal';
import { EditPostModal } from '@/components/edit-post-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const { posts, toggleLike, markAsResolved, deletePost, editPost, userProfile } = usePosts();
  const { startOrOpenChat } = useChat();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const [optionsPost, setOptionsPost] = useState<Post | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const [editPostTarget, setEditPostTarget] = useState<Post | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  const openViewer = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleShare = async (post: Post) => {
    try {
      await Share.share({
        title: `Pet-X: ${getTagLabel(post.type)} - ${post.user}`,
        message: `🐾 [Pet-X] ${getTagLabel(post.type).toUpperCase()}: ${post.content}\nPublicado por ${post.user}`,
      });
    } catch (err) {
      // Silencioso
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="title" style={{ fontSize: 24, color: theme.text }}>Início</ThemedText>
        </ThemedView>

        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const postImages: string[] = item.images && item.images.length > 0 
              ? item.images 
              : (item.image ? [item.image] : []);

            const isPostOwner = item.userId === currentUser?.id;

            return (
              <View style={[styles.postContainer, { borderBottomColor: theme.border }]}>
                {/* Avatar clicável que abre o perfil do usuário */}
                <Pressable
                  style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    if (isPostOwner) {
                      router.push('/(tabs)/profile' as any);
                    } else {
                      router.push(`/profile/${item.userId}` as any);
                    }
                  }}
                >
                  <Image source={{ uri: item.avatar }} style={styles.avatar} resizeMode="cover" />
                </Pressable>

                <View style={styles.postContent}>
                  {/* Header do Post */}
                  <View style={styles.postHeader}>
                    <Pressable
                      style={({ pressed }) => [styles.postUserInfo, pressed && { opacity: 0.7 }]}
                      onPress={() => {
                        if (isPostOwner) {
                          router.push('/(tabs)/profile' as any);
                        } else {
                          router.push(`/profile/${item.userId}` as any);
                        }
                      }}
                    >
                      <ThemedText style={styles.userName}>{item.user}</ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, marginLeft: 4 }}>· {item.time}</ThemedText>
                    </Pressable>

                    {/* Botão de 3 pontos EXCLUSIVO para o autor da publicação */}
                    {isPostOwner && (
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
                    )}
                  </View>
                  
                  {/* Corpo clicável que abre a tela de detalhes do post */}
                  <Pressable
                    style={({ pressed }) => [pressed && { opacity: 0.95 }]}
                    onPress={() => router.push(`/post/${item.id}` as any)}
                  >
                    <View style={styles.badgesRow}>
                      <View style={[styles.tagBadge, { backgroundColor: getTagColor(item.type) }]}>
                        <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                          {getTagLabel(item.type)}
                        </ThemedText>
                      </View>

                      {Boolean(item.city || item.state) ? (
                        <View style={[styles.locationBadge, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                          <MaterialIcons name="location-on" size={13} color={theme.textSecondary} />
                          <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                            {[item.city, item.state].filter(Boolean).join(', ')}
                          </ThemedText>
                        </View>
                      ) : null}

                      {Boolean(item.isResolved) ? (
                        <View style={[styles.resolvedBadge, { backgroundColor: '#00BA7C' }]}>
                          <MaterialIcons name="verified" size={14} color="#FFF" />
                          <ThemedText style={styles.resolvedBadgeText}>ENCONTRADO 🎉</ThemedText>
                        </View>
                      ) : null}
                    </View>

                    <ThemedText style={styles.textContent}>{item.content}</ThemedText>
                  </Pressable>

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
                    onShare={() => handleShare(item)}
                  />
                </View>
              </View>
            );
          }}
        />

        <ImageViewerModal
          visible={modalVisible}
          images={modalImages}
          initialIndex={modalInitialIndex}
          onClose={() => setModalVisible(false)}
        />

        <PostOptionsMenuModal
          visible={optionsVisible}
          post={optionsPost}
          onClose={() => setOptionsVisible(false)}
          onToggleResolved={(id) => markAsResolved(id)}
          onEdit={(p) => {
            setEditPostTarget(p);
            setEditVisible(true);
          }}
          onDelete={(id) => deletePost(id)}
        />

        <EditPostModal
          visible={editVisible}
          post={editPostTarget}
          onClose={() => setEditVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  postContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
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
