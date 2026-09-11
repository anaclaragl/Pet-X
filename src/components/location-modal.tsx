import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { usePosts, ActiveLocation } from '@/context/PostsContext';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '15 km', value: 15 },
  { label: '30 km', value: 30 },
  { label: '50 km', value: 50 },
  { label: 'Todo o estado', value: null },
];

const PRESET_CITIES: Array<{ city: string; state: string; lat: number; lng: number }> = [
  { city: 'São Paulo', state: 'SP', lat: -23.5505, lng: -46.6333 },
  { city: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lng: -43.1729 },
  { city: 'Belo Horizonte', state: 'MG', lat: -19.9167, lng: -43.9345 },
  { city: 'Três Corações', state: 'MG', lat: -21.6944, lng: -45.2575 },
  { city: 'Curitiba', state: 'PR', lat: -25.4284, lng: -49.2733 },
  { city: 'Porto Alegre', state: 'RS', lat: -30.0346, lng: -51.2177 },
  { city: 'Brasília', state: 'DF', lat: -15.7975, lng: -47.8919 },
  { city: 'Campinas', state: 'SP', lat: -22.9056, lng: -47.0608 },
];

export function LocationModal({ visible, onClose }: LocationModalProps) {
  const theme = useTheme();
  const {
    activeLocation,
    searchRadius,
    setActiveLocation,
    setSearchRadius,
    requestCurrentLocation,
  } = usePosts();

  const [customCity, setCustomCity] = useState('');
  const [customState, setCustomState] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<number | null>(searchRadius);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseGps = async () => {
    setIsLocating(true);
    const success = await requestCurrentLocation();
    setIsLocating(false);
    if (success) {
      if (selectedRadius !== searchRadius) {
        setSearchRadius(selectedRadius);
      }
      onClose();
    } else {
      alert('Não foi possível obter a localização via GPS. Verifique as permissões de localização.');
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_CITIES[0]) => {
    const newLoc: ActiveLocation = {
      city: preset.city,
      state: preset.state,
      latitude: preset.lat,
      longitude: preset.lng,
      label: `${preset.city}, ${preset.state}`,
      isGps: false,
    };
    setActiveLocation(newLoc);
    if (selectedRadius !== searchRadius) {
      setSearchRadius(selectedRadius);
    }
    onClose();
  };

  const handleApplyCustom = () => {
    if (!customCity.trim()) return;
    const newLoc: ActiveLocation = {
      city: customCity.trim(),
      state: customState.trim() || undefined,
      label: `${customCity.trim()}${customState.trim() ? `, ${customState.trim().toUpperCase()}` : ''}`,
      isGps: false,
    };
    setActiveLocation(newLoc);
    if (selectedRadius !== searchRadius) {
      setSearchRadius(selectedRadius);
    }
    setCustomCity('');
    setCustomState('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(255, 107, 74, 0.15)' }]}>
                <MaterialIcons name="location-on" size={22} color={theme.brand} />
              </View>
              <ThemedText style={styles.title}>Definir Localização</ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* GPS Button */}
            <Pressable
              style={({ pressed, hovered }: any) => [
                styles.gpsButton,
                { backgroundColor: theme.background, borderColor: theme.brand },
                hovered && { backgroundColor: 'rgba(255, 107, 74, 0.08)' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleUseGps}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={theme.brand} style={{ marginRight: 10 }} />
              ) : (
                <MaterialIcons name="my-location" size={20} color={theme.brand} style={{ marginRight: 10 }} />
              )}
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.gpsText, { color: theme.brand }]}>
                  {isLocating ? 'Detectando GPS...' : 'Usar Localização Atual (GPS)'}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                  Busca posts mais próximos de onde você está
                </ThemedText>
              </View>
            </Pressable>

            {/* Radius Selector */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Raio de Proximidade</ThemedText>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((opt) => {
                  const isSelected = selectedRadius === opt.value;
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => setSelectedRadius(opt.value)}
                      style={[
                        styles.radiusChip,
                        {
                          backgroundColor: isSelected ? theme.brand : theme.background,
                          borderColor: isSelected ? theme.brand : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.radiusChipText,
                          { color: isSelected ? '#FFF' : theme.text },
                        ]}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Custom City Input */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Buscar por Cidade</ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.cityInput,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Nome da cidade (ex: Campinas)"
                  placeholderTextColor={theme.textSecondary}
                  value={customCity}
                  onChangeText={setCustomCity}
                />
                <TextInput
                  style={[
                    styles.stateInput,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="UF"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={2}
                  autoCapitalize="characters"
                  value={customState}
                  onChangeText={setCustomState}
                />
                <Pressable
                  style={[
                    styles.applyBtn,
                    { backgroundColor: customCity.trim() ? theme.brand : theme.border },
                  ]}
                  onPress={handleApplyCustom}
                  disabled={!customCity.trim()}
                >
                  <MaterialIcons name="check" size={20} color="#FFF" />
                </Pressable>
              </View>
            </View>

            {/* Quick Cities Presets */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Cidades Populares</ThemedText>
              <View style={styles.presetsGrid}>
                {PRESET_CITIES.map((c) => {
                  const isCurrent =
                    activeLocation?.city?.toLowerCase() === c.city.toLowerCase() &&
                    (!activeLocation.state || activeLocation.state.toLowerCase() === c.state.toLowerCase());

                  return (
                    <Pressable
                      key={`${c.city}-${c.state}`}
                      onPress={() => handleSelectPreset(c)}
                      style={({ pressed, hovered }: any) => [
                        styles.presetChip,
                        {
                          backgroundColor: isCurrent ? 'rgba(255, 107, 74, 0.15)' : theme.background,
                          borderColor: isCurrent ? theme.brand : theme.border,
                        },
                        hovered && !isCurrent && { backgroundColor: theme.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.presetText,
                          { color: isCurrent ? theme.brand : theme.text },
                          isCurrent && { fontWeight: '700' },
                        ]}
                      >
                        {c.city}, {c.state}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 16px 36px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 18,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  gpsText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    opacity: 0.8,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cityInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  stateInput: {
    width: 60,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  applyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  presetText: {
    fontSize: 13,
  },
});
