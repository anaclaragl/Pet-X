import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePosts, PostType } from '@/context/PostsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreatePostScreen() {
  const theme = useTheme();
  const { addPost } = usePosts();
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<PostType>('outro');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const tags: Array<{ id: PostType; label: string; color: string }> = [
    { id: 'perdido', label: 'Perdido', color: theme.lost },
    { id: 'encontrado', label: 'Encontrado', color: theme.found },
    { id: 'ong', label: 'ONG / Adoção', color: theme.ngo },
    { id: 'outro', label: 'Outro', color: theme.brand },
  ];

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permissão para acessar a galeria é necessária!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selected = result.assets.map(a => a.uri);
      setImageUris(prev => [...prev, ...selected]);
    }
  };

  const takePhotoWithCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permissão para usar a câmera é necessária!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUris(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUris(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePost = () => {
    if (!content.trim() && imageUris.length === 0) return;
    addPost(content.trim(), tag, imageUris);
    setContent('');
    setImageUris([]);
    router.replace('/(tabs)');
  };

  const selectedTag = tags.find(t => t.id === tag) || tags[3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="title" style={{ fontSize: 20 }}>Novo Post</ThemedText>
          <Pressable 
            style={[styles.postButton, { backgroundColor: theme.brand, opacity: (content.trim() || imageUris.length > 0) ? 1 : 0.5 }]} 
            onPress={handlePost}
            disabled={!content.trim() && imageUris.length === 0}
          >
            <ThemedText style={styles.postButtonText}>Postar</ThemedText>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.tagSelectorContainer}>
            <Pressable 
              style={[styles.tagSelector, { borderColor: theme.border }]} 
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <View style={[styles.tagBadge, { backgroundColor: selectedTag.color }]}>
                <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                  {selectedTag.label}
                </ThemedText>
              </View>
              <MaterialIcons name={dropdownOpen ? "arrow-drop-up" : "arrow-drop-down"} size={24} color={theme.text} />
            </Pressable>

            {dropdownOpen && (
              <View style={[styles.dropdown, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                {tags.map((t) => (
                  <Pressable 
                    key={t.id} 
                    style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                    onPress={() => { setTag(t.id); setDropdownOpen(false); }}
                  >
                    <View style={[styles.tagBadge, { backgroundColor: t.color }]}>
                      <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                        {t.label}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="O que está acontecendo?"
            placeholderTextColor={theme.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
          />

          {imageUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageListContainer}>
              {imageUris.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri }} style={[styles.imagePreview, { borderColor: theme.border }]} resizeMode="cover" />
                  <Pressable style={styles.removeImageButton} onPress={() => removeImage(idx)}>
                    <MaterialIcons name="close" size={16} color="#FFF" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.toolbar}>
            <Pressable style={styles.toolbarAction} onPress={pickImageFromGallery}>
              <MaterialIcons name="photo-library" size={24} color={theme.brand} />
            </Pressable>
            <Pressable style={styles.toolbarAction} onPress={takePhotoWithCamera}>
              <MaterialIcons name="camera-alt" size={24} color={theme.brand} />
            </Pressable>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tagSelectorContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 16,
  },
  tagSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    width: 150,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 150,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 20,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 18,
    textAlignVertical: 'top',
  },
  imageListContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxHeight: 140,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 130,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    gap: 16,
  },
  toolbarAction: {
    padding: 8,
    backgroundColor: 'rgba(255,107,74,0.1)',
    borderRadius: 20,
  }
});
