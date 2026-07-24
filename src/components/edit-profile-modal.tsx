import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Image, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePosts } from '@/context/PostsContext';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const theme = useTheme();
  const { userProfile, updateUserProfile } = usePosts();

  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar);

  useEffect(() => {
    if (visible) {
      setName(userProfile.name);
      setUsername(userProfile.username);
      setBio(userProfile.bio);
      setAvatar(userProfile.avatar);
    }
  }, [visible, userProfile]);

  if (!visible) return null;

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permissão para acessar a galeria é necessária!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    updateUserProfile({
      name: name.trim() || userProfile.name,
      username: username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`,
      bio: bio.trim(),
      avatar,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.border }]} 
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }]}>
              <ThemedText style={{ color: theme.textSecondary }}>Cancelar</ThemedText>
            </Pressable>
            <ThemedText type="subtitle" style={{ fontSize: 18 }}>Editar Perfil</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.brand }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              onPress={handleSave}
            >
              <ThemedText style={{ color: '#FFF', fontWeight: '700' }}>Salvar</ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {/* Avatar picker */}
            <View style={styles.avatarSection}>
              <Pressable style={({ pressed }) => [styles.avatarContainer, pressed && { opacity: 0.85 }]} onPress={pickAvatar}>
                <Image source={{ uri: avatar }} style={styles.avatarImage} resizeMode="cover" />
                <View style={styles.cameraBadge}>
                  <MaterialIcons name="camera-alt" size={18} color="#FFF" />
                </View>
              </Pressable>
              <Pressable onPress={pickAvatar} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <ThemedText style={{ color: theme.brand, marginTop: 8, fontSize: 13, fontWeight: '600' }}>
                  Alterar Foto
                </ThemedText>
              </Pressable>
            </View>

            {/* Inputs */}
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Nome</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Nome de usuário</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                value={username}
                onChangeText={setUsername}
                placeholder="@usuario"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Bio</ThemedText>
              <TextInput
                style={[styles.input, styles.bioInput, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Fale um pouco sobre você..."
                placeholderTextColor={theme.textSecondary}
                multiline
              />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  body: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  bioInput: {
    height: 90,
    textAlignVertical: 'top',
  },
});
