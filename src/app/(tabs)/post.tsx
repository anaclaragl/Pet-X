import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, Image, ScrollView, ActivityIndicator, Platform, Switch } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePosts, PostType, PostLocation } from '@/context/PostsContext';
import { getCurrentCoordinates, reverseGeocode } from '@/services/location';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StateCitySelector } from '@/components/state-city-selector';

export default function CreatePostScreen() {
  const theme = useTheme();
  const { addPost, activeLocation, userProfile } = usePosts();
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<PostType>('outro');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location State
  const [attachedLocation, setAttachedLocation] = useState<PostLocation | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [isApproximate, setIsApproximate] = useState(true);

  const tags: Array<{ id: PostType; label: string; color: string }> = [
    { id: 'perdido', label: 'Perdido', color: theme.lost },
    { id: 'encontrado', label: 'Encontrado', color: theme.found },
    { id: 'ong', label: 'ONG / Adoção', color: theme.ngo },
    { id: 'outro', label: 'Outro', color: theme.brand },
  ];

  const MAX_CHARS = 500;
  const MAX_IMAGES = 4;

  const pickImageFromGallery = async () => {
    if (imageUris.length >= MAX_IMAGES) {
      alert(`Você já atingiu o limite máximo de ${MAX_IMAGES} fotos.`);
      return;
    }

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
      const remainingSlots = MAX_IMAGES - imageUris.length;
      if (selected.length > remainingSlots) {
        alert(`Você só pode adicionar mais ${remainingSlots} foto(s). O limite de ${MAX_IMAGES} fotos por post foi aplicado.`);
        setImageUris(prev => [...prev, ...selected.slice(0, remainingSlots)]);
      } else {
        setImageUris(prev => [...prev, ...selected]);
      }
    }
  };

  const takePhotoWithCamera = async () => {
    if (imageUris.length >= MAX_IMAGES) {
      alert(`Você já atingiu o limite máximo de ${MAX_IMAGES} fotos.`);
      return;
    }

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

  const handleAttachGpsLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const coords = await getCurrentCoordinates();
      if (coords) {
        const address = await reverseGeocode(coords.latitude, coords.longitude);
        setAttachedLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          city: address.city || userProfile.city || '',
          state: address.state || userProfile.state || '',
          neighborhood: address.neighborhood || '',
          isApproximate: isApproximate,
        });
        setEditCity(address.city || userProfile.city || '');
        setEditState(address.state || userProfile.state || '');
        setEditNeighborhood(address.neighborhood || '');
        setShowLocationEditor(false);
      } else {
        // Fallback para edição manual
        setShowLocationEditor(true);
        setEditCity(userProfile.city || activeLocation?.city || '');
        setEditState(userProfile.state || activeLocation?.state || '');
      }
    } catch (e) {
      setShowLocationEditor(true);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSaveManualLocation = () => {
    if (!editCity.trim()) {
      alert('Por favor informe ao menos a cidade.');
      return;
    }
    setAttachedLocation({
      latitude: attachedLocation?.latitude || activeLocation?.latitude || null,
      longitude: attachedLocation?.longitude || activeLocation?.longitude || null,
      city: editCity.trim(),
      state: editState.trim(),
      neighborhood: editNeighborhood.trim(),
      isApproximate: isApproximate,
    });
    setShowLocationEditor(false);
  };

  const handlePost = async () => {
    if ((!content.trim() && imageUris.length === 0) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addPost(
        content.trim(), 
        tag, 
        imageUris, 
        attachedLocation ? {
          ...attachedLocation,
          isApproximate: isApproximate,
        } : undefined
      );
      setContent('');
      setImageUris([]);
      setAttachedLocation(null);
      router.replace('/(tabs)');
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const selectedTag = tags.find(t => t.id === tag) || tags[3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} style={styles.closeButton} disabled={isSubmitting}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="title" style={{ fontSize: 20 }}>Novo Post</ThemedText>
          <Pressable 
            style={[
              styles.postButton, 
              { backgroundColor: theme.brand, opacity: ((content.trim() || imageUris.length > 0) && !isSubmitting) ? 1 : 0.5 }
            ]} 
            onPress={handlePost}
            disabled={(!content.trim() && imageUris.length === 0) || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <ThemedText style={styles.postButtonText}>Postar</ThemedText>
            )}
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
            placeholder="O que está acontecendo? Descreva detalhes, pet, características..."
            placeholderTextColor={theme.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={MAX_CHARS}
            autoFocus
          />

          {/* Character Counter & Notice */}
          <View style={styles.counterRow}>
            {content.length >= MAX_CHARS ? (
              <View style={styles.limitNotice}>
                <MaterialIcons name="info-outline" size={14} color="#EF4444" />
                <ThemedText style={{ color: '#EF4444', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                  Limite de 500 caracteres atingido
                </ThemedText>
              </View>
            ) : (
              <View />
            )}
            <ThemedText
              style={[
                styles.charCounterText,
                { color: content.length >= MAX_CHARS ? '#EF4444' : theme.textSecondary },
              ]}
            >
              {content.length}/{MAX_CHARS}
            </ThemedText>
          </View>

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

          {/* Attached Location Card */}
          {attachedLocation && !showLocationEditor && (
            <View style={[styles.locationCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.locationCardHeader}>
                <MaterialIcons name="location-on" size={18} color={theme.brand} />
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                    {[attachedLocation.neighborhood, attachedLocation.city, attachedLocation.state].filter(Boolean).join(', ')}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, color: theme.textSecondary }}>
                    {isApproximate ? 'Localização aproximada (protege endereço exato)' : 'Ponto exato'}
                  </ThemedText>
                </View>
                <Pressable onPress={() => setShowLocationEditor(true)} style={{ padding: 4, marginRight: 4 }}>
                  <MaterialIcons name="edit" size={18} color={theme.textSecondary} />
                </Pressable>
                <Pressable onPress={() => setAttachedLocation(null)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>

              {/* Approximate Privacy Toggle */}
              <View style={[styles.approxRow, { borderTopColor: theme.border }]}>
                <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                  Ocultar endereço exato (Aproximado)
                </ThemedText>
                <Switch
                  value={isApproximate}
                  onValueChange={setIsApproximate}
                  trackColor={{ false: theme.border, true: theme.brand }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          )}

          {/* Manual Location Editor Form */}
          {showLocationEditor && (
            <View style={[styles.locationEditorBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <ThemedText style={{ fontSize: 14, fontWeight: '700' }}>Local do Acontecimento</ThemedText>
                <Pressable onPress={() => setShowLocationEditor(false)}>
                  <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>

              <StateCitySelector
                selectedState={editState}
                selectedCity={editCity}
                onStateChange={(uf) => setEditState(uf)}
                onCityChange={(city) => setEditCity(city)}
              />

              <TextInput
                style={[styles.smallInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, marginTop: 10, marginBottom: 8 }]}
                placeholder="Bairro ou ponto de referência (opcional)"
                placeholderTextColor={theme.textSecondary}
                value={editNeighborhood}
                onChangeText={setEditNeighborhood}
              />
              <Pressable
                style={[styles.saveLocationBtn, { backgroundColor: theme.brand }]}
                onPress={handleSaveManualLocation}
              >
                <ThemedText style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Salvar Localização</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Toolbar */}
          <View style={[styles.toolbar, { borderTopColor: theme.border }]}>
            <View style={styles.toolbarLeft}>
              <Pressable 
                style={[styles.toolbarAction, imageUris.length >= MAX_IMAGES && { opacity: 0.4 }]} 
                onPress={pickImageFromGallery}
              >
                <MaterialIcons name="photo-library" size={22} color={theme.brand} />
              </Pressable>
              <Pressable 
                style={[styles.toolbarAction, imageUris.length >= MAX_IMAGES && { opacity: 0.4 }]} 
                onPress={takePhotoWithCamera}
              >
                <MaterialIcons name="camera-alt" size={22} color={theme.brand} />
              </Pressable>
              <Pressable
                style={[
                  styles.toolbarAction,
                  attachedLocation && { backgroundColor: 'rgba(255, 107, 74, 0.25)' },
                ]}
                onPress={handleAttachGpsLocation}
                disabled={isFetchingLocation}
              >
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={theme.brand} />
                ) : (
                  <MaterialIcons
                    name="location-on"
                    size={22}
                    color={attachedLocation ? theme.brand : theme.textSecondary}
                  />
                )}
              </Pressable>

              {/* Photo Count Indicator */}
              <View style={styles.photoCountWrapper}>
                <ThemedText
                  style={{
                    fontSize: 12,
                    color: imageUris.length >= MAX_IMAGES ? '#EF4444' : theme.textSecondary,
                    fontWeight: imageUris.length >= MAX_IMAGES ? '700' : '500',
                  }}
                >
                  {imageUris.length}/{MAX_IMAGES} fotos
                </ThemedText>
              </View>
            </View>

            {attachedLocation && (
              <View style={styles.locationPillBadge}>
                <ThemedText style={{ color: theme.brand, fontSize: 11, fontWeight: '700' }}>
                  📍 {attachedLocation.city || 'Local Anexado'}
                </ThemedText>
              </View>
            )}
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
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 120,
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
  locationCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  locationEditorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  smallInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  saveLocationBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  toolbarAction: {
    padding: 8,
    backgroundColor: 'rgba(255,107,74,0.1)',
    borderRadius: 20,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  locationPillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 74, 0.1)',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charCounterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  photoCountWrapper: {
    justifyContent: 'center',
    marginLeft: 6,
  },
});
