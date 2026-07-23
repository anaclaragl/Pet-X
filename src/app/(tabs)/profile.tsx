import { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/ThemeContext';
import { usePosts } from '@/context/PostsContext';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { theme, colorScheme, toggleTheme } = useAppTheme();
  const { userPosts, userProfile, toggleLike } = usePosts();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const openViewer = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
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
        <ScrollView style={{ flex: 1 }}>
          <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
            <Image 
              source={{ uri: userProfile.avatar }} 
              style={styles.avatar} 
              resizeMode="cover"
            />
            <ThemedText type="title" style={{ fontSize: 24, marginTop: 16 }}>{userProfile.name}</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>{userProfile.username}</ThemedText>
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
                <ThemedText style={[styles.statNumber, { color: theme.text }]}>4</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>Ajudou</ThemedText>
              </View>
            </View>
            
            <Pressable style={[styles.editButton, { borderColor: theme.border }]} onPress={() => setEditModalVisible(true)}>
              <ThemedText style={{ fontWeight: '600' }}>Editar Perfil</ThemedText>
            </Pressable>
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
                      <ThemedText style={styles.userName}>{item.user}</ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, marginLeft: 4 }}>· {item.time}</ThemedText>
                    </View>
                    
                    <View style={[styles.tagBadge, { backgroundColor: getTagColor(item.type) }]}>
                      <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                        {getTagLabel(item.type)}
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.textContent}>{item.content}</ThemedText>

                    {/* Photos Gallery */}
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

                    <View style={styles.actions}>
                      <Pressable style={styles.actionItem} onPress={() => router.push(`/post/${item.id}` as any)}>
                        <MaterialIcons name="chat-bubble-outline" size={20} color={theme.textSecondary} />
                        {item.commentsCount > 0 && (
                          <ThemedText style={{ marginLeft: 6, fontSize: 13, color: theme.textSecondary }}>
                            {item.commentsCount}
                          </ThemedText>
                        )}
                      </Pressable>
                      <Pressable style={styles.actionItem} onPress={() => toggleLike(item.id)}>
                        <MaterialIcons 
                          name={item.isLiked ? "favorite" : "favorite-border"} 
                          size={20} 
                          color={item.isLiked ? "#E0245E" : theme.textSecondary} 
                        />
                        {item.likesCount > 0 && (
                          <ThemedText style={{ marginLeft: 6, fontSize: 13, color: item.isLiked ? "#E0245E" : theme.textSecondary }}>
                            {item.likesCount}
                          </ThemedText>
                        )}
                      </Pressable>
                      <Pressable style={styles.actionItem}>
                        <MaterialIcons name="share" size={20} color={theme.textSecondary} />
                      </Pressable>
                    </View>
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
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
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
  stats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    fontSize: 20,
  },
  editButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 240,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
