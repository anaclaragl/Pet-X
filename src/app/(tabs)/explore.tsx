import { useState } from 'react';
import { StyleSheet, TextInput, View, FlatList, Image, Pressable, ScrollView, Share, Platform } from 'react-native';
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
import { LocationModal } from '@/components/location-modal';
import { formatDistance } from '@/services/location';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const { 
    posts, 
    toggleLike, 
    markAsResolved, 
    deletePost, 
    editPost,
    activeLocation,
    searchRadius,
    setSearchRadius,
  } = usePosts();
  const { startOrOpenChat } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'perdido' | 'encontrado' | 'ong'>('todos');
  const [locationModalVisible, setLocationModalVisible] = useState(false);

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
      // Falha silenciosa
    }
  };

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'perdido', label: 'Perdidos', color: theme.lost },
    { id: 'encontrado', label: 'Encontrados', color: theme.found },
    { id: 'ong', label: 'ONGs', color: theme.ngo },
  ] as const;

  const radiusFilters = [
    { label: 'Todas as regiões', value: null },
    { label: '5 km', value: 5 },
    { label: '15 km', value: 15 },
    { label: '30 km', value: 30 },
    { label: '50 km', value: 50 },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'todos' || post.type === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query || 
      post.content.toLowerCase().includes(query) ||
      post.user.toLowerCase().includes(query) ||
      post.type.toLowerCase().includes(query) ||
      (post.neighborhood && post.neighborhood.toLowerCase().includes(query)) ||
      (post.city && post.city.toLowerCase().includes(query)) ||
      (post.state && post.state.toLowerCase().includes(query));

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
          {/* Search Bar + Location shortcut */}
          <View style={styles.searchBarRow}>
            <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
              <MaterialIcons name="search" size={22} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar por pet, cidade, bairro ou palavra..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            <Pressable
              style={({ pressed, hovered }: any) => [
                styles.locationFilterBtn,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                hovered && { borderColor: theme.brand },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setLocationModalVisible(true)}
            >
              <MaterialIcons name="location-on" size={20} color={theme.brand} />
            </Pressable>
          </View>

          {/* Category Chips */}
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
                  style={({ pressed, hovered }: any) => [
                    styles.chip,
                    { 
                      backgroundColor: isSelected 
                        ? (cat.id === 'todos' ? theme.brand : cat.color) 
                        : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    hovered && !isSelected && { backgroundColor: theme.border },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <ThemedText style={{ color: isSelected ? '#FFF' : theme.text, fontWeight: '600', fontSize: 13 }}>
                    {cat.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Radius Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.radiusChipsContainer}
          >
            {radiusFilters.map((rf) => {
              const isSelected = searchRadius === rf.value;
              return (
                <Pressable
                  key={rf.label}
                  onPress={() => setSearchRadius(rf.value)}
                  style={({ pressed, hovered }: any) => [
                    styles.radiusFilterChip,
                    {
                      backgroundColor: isSelected ? 'rgba(255, 107, 74, 0.15)' : 'transparent',
                      borderColor: isSelected ? theme.brand : theme.border,
                    },
                    hovered && !isSelected && { backgroundColor: theme.backgroundElement },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: isSelected ? theme.brand : theme.textSecondary,
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                  >
                    {rf.label}
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
              
              const isPostOwner = item.userId === currentUser?.id;
              const distanceText = formatDistance(item.distanceKm);

              const displayLocationParts = [
                item.neighborhood,
                item.city,
                item.state,
              ].filter(Boolean);
              const locationText = displayLocationParts.join(', ');

              return (
                <View style={[styles.postContainer, { borderBottomColor: theme.border }]}>
                  <Pressable
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
                    <View style={styles.postHeader}>
                      <Pressable
                        style={styles.postUserInfo}
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
                      {isPostOwner && (
                        <Pressable style={styles.moreBtn} onPress={() => { setOptionsPost(item); setOptionsVisible(true); }}>
                          <MaterialIcons name="more-horiz" size={20} color={theme.textSecondary} />
                        </Pressable>
                      )}
                    </View>
                    
                    <Pressable onPress={() => router.push(`/post/${item.id}` as any)}>
                      <View style={styles.badgesRow}>
                        <View style={[styles.tagBadge, { backgroundColor: getTagColor(item.type) }]}>
                          <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                            {getTagLabel(item.type)}
                          </ThemedText>
                        </View>

                        {/* Distance Badge */}
                        {distanceText ? (
                          <View style={[styles.distanceBadge, { backgroundColor: 'rgba(255, 107, 74, 0.12)', borderColor: theme.brand }]}>
                            <MaterialIcons name="near-me" size={12} color={theme.brand} />
                            <ThemedText style={{ color: theme.brand, fontSize: 11, fontWeight: '700' }}>
                              {distanceText}
                            </ThemedText>
                          </View>
                        ) : null}

                        {/* Location Name */}
                        {locationText ? (
                          <View style={[styles.locationBadge, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                            <MaterialIcons name="location-on" size={13} color={theme.textSecondary} />
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                              {locationText} {item.isApproximate ? '(Aprox.)' : ''}
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
        )}

        <LocationModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
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
          onToggleResolved={(postId) => markAsResolved(postId)}
          onEdit={(post) => {
            setEditPostTarget(post);
            setEditVisible(true);
          }}
          onDelete={(postId) => deletePost(postId)}
        />

        <EditPostModal
          visible={editVisible}
          post={editPostTarget}
          onClose={() => setEditVisible(false)}
          onSave={(postId, newContent) => editPost(postId, newContent)}
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
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 24,
    height: 44,
  },
  locationFilterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    height: '100%',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  radiusChipsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  radiusFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  moreBtn: {
    padding: 4,
    borderRadius: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    maxWidth: 240,
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
