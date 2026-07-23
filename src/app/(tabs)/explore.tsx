import { useState } from 'react';
import { StyleSheet, TextInput, View, FlatList, Image, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { usePosts } from '@/context/PostsContext';
import { useChat } from '@/context/ChatContext';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const theme = useTheme();
  const { posts, toggleLike } = usePosts();
  const { startOrOpenChat } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'perdido' | 'encontrado' | 'ong'>('todos');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const openViewer = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleOpenChat = (userName: string, userAvatar: string) => {
    const chatId = startOrOpenChat(userName, userAvatar);
    router.push(`/chat/${chatId}` as any);
  };

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'perdido', label: 'Perdidos', color: theme.lost },
    { id: 'encontrado', label: 'Encontrados', color: theme.found },
    { id: 'ong', label: 'ONGs', color: theme.ngo },
  ] as const;

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'todos' || post.type === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query || 
      post.content.toLowerCase().includes(query) ||
      post.user.toLowerCase().includes(query) ||
      post.type.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

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
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
            <MaterialIcons name="search" size={24} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar por pet, usuário ou palavra..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: isSelected 
                        ? (cat.id === 'todos' ? theme.brand : cat.color) 
                        : theme.backgroundElement,
                      borderColor: theme.border,
                    }
                  ]}
                >
                  <ThemedText style={{ color: isSelected ? '#FFF' : theme.text, fontWeight: '600', fontSize: 13 }}>
                    {cat.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {filteredPosts.length === 0 ? (
          <ThemedView style={styles.emptyContent}>
            <MaterialIcons name="pets" size={64} color={theme.border} />
            <ThemedText style={{ marginTop: 16, color: theme.textSecondary, fontSize: 16 }}>
              Nenhum resultado encontrado.
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const postImages: string[] = item.images && item.images.length > 0 
                ? item.images 
                : (item.image ? [item.image] : []);

              return (
                <View style={[styles.postContainer, { borderBottomColor: theme.border }]}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} resizeMode="cover" />
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
            }}
          />
        )}

        <ImageViewerModal
          visible={modalVisible}
          images={modalImages}
          initialIndex={modalInitialIndex}
          onClose={() => setModalVisible(false)}
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
    padding: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 24,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: '100%',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
