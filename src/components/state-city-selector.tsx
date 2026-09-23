import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import {
  BRAZILIAN_STATES,
  BrazilianState,
  getCitiesForState,
  POPULAR_CITIES_BY_STATE,
} from '@/data/brazil-locations';

interface StateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  layout?: 'row' | 'column';
  stateLabel?: string;
  cityLabel?: string;
  disabled?: boolean;
}

export function StateCitySelector({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  layout = 'row',
  stateLabel = 'Estado (UF)',
  cityLabel = 'Cidade',
  disabled = false,
}: StateCitySelectorProps) {
  const theme = useTheme();

  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Carrega as cidades sempre que o estado selecionado mudar
  useEffect(() => {
    if (!selectedState) {
      setCitiesList([]);
      return;
    }

    const cleanUf = selectedState.toUpperCase().trim();
    const immediateFallback = POPULAR_CITIES_BY_STATE[cleanUf] || [];
    setCitiesList(immediateFallback);

    let isMounted = true;
    setIsLoadingCities(true);

    getCitiesForState(cleanUf).then((cities) => {
      if (isMounted) {
        if (cities.length > 0) {
          setCitiesList(cities);
        }
        setIsLoadingCities(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  // Filtro de Estados
  const filteredStates = useMemo(() => {
    const q = stateSearch.toLowerCase().trim();
    if (!q) return BRAZILIAN_STATES;
    return BRAZILIAN_STATES.filter(
      (s) =>
        s.sigla.toLowerCase().includes(q) ||
        s.nome.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  // Filtro de Cidades
  const filteredCities = useMemo(() => {
    const q = citySearch.toLowerCase().trim();
    if (!q) return citiesList;
    return citiesList.filter((c) => c.toLowerCase().includes(q));
  }, [citySearch, citiesList]);

  const handleSelectState = (state: BrazilianState) => {
    onStateChange(state.sigla);
    // Se o estado mudou, limpa a cidade anterior para obrigar nova seleção correta
    if (selectedState !== state.sigla) {
      onCityChange('');
    }
    setStateModalVisible(false);
    setStateSearch('');
  };

  const handleSelectCity = (cityName: string) => {
    onCityChange(cityName);
    setCityModalVisible(false);
    setCitySearch('');
  };

  const selectedStateObj = BRAZILIAN_STATES.find(
    (s) => s.sigla.toUpperCase() === selectedState.toUpperCase()
  );

  return (
    <View style={[styles.container, layout === 'row' ? styles.rowLayout : styles.columnLayout]}>
      {/* SELETOR DE ESTADO (UF) */}
      <View style={[styles.fieldWrapper, layout === 'row' && styles.stateFieldRow]}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {stateLabel}
        </ThemedText>
        <Pressable
          style={({ pressed, hovered }: any) => [
            styles.selectButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: selectedState ? theme.brand : theme.border,
            },
            hovered && { borderColor: theme.brand },
            pressed && { opacity: 0.8 },
            disabled && { opacity: 0.5 },
          ]}
          onPress={() => !disabled && setStateModalVisible(true)}
          disabled={disabled}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons
              name="map"
              size={18}
              color={selectedState ? theme.brand : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              style={[
                styles.selectText,
                { color: selectedState ? theme.text : theme.textSecondary },
                selectedState && { fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {selectedStateObj ? `${selectedStateObj.sigla} - ${selectedStateObj.nome}` : 'Selecione o Estado'}
            </ThemedText>
          </View>
          <MaterialIcons name="arrow-drop-down" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      {/* SELETOR DE CIDADE (Desabilitado até o estado ser preenchido) */}
      <View style={[styles.fieldWrapper, layout === 'row' && styles.cityFieldRow]}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {cityLabel}
        </ThemedText>
        <Pressable
          style={({ pressed, hovered }: any) => [
            styles.selectButton,
            {
              backgroundColor: selectedState ? theme.backgroundElement : theme.background,
              borderColor: selectedCity ? theme.brand : theme.border,
            },
            selectedState && hovered && { borderColor: theme.brand },
            pressed && selectedState && { opacity: 0.8 },
            (!selectedState || disabled) && styles.disabledButton,
          ]}
          onPress={() => {
            if (!selectedState) {
              setStateModalVisible(true);
            } else if (!disabled) {
              setCityModalVisible(true);
            }
          }}
          disabled={disabled}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons
              name="location-city"
              size={18}
              color={selectedCity ? theme.brand : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              style={[
                styles.selectText,
                { color: selectedCity ? theme.text : theme.textSecondary },
                selectedCity && { fontWeight: '600' },
                !selectedState && { fontStyle: 'italic', opacity: 0.7 },
              ]}
              numberOfLines={1}
            >
              {!selectedState
                ? 'Escolha o estado primeiro'
                : selectedCity || 'Selecione a Cidade'}
            </ThemedText>
          </View>
          {isLoadingCities ? (
            <ActivityIndicator size="small" color={theme.brand} />
          ) : (
            <MaterialIcons
              name="arrow-drop-down"
              size={22}
              color={selectedState ? theme.textSecondary : 'rgba(150,150,150,0.4)'}
            />
          )}
        </Pressable>
      </View>

      {/* MODAL DE SELEÇÃO DE ESTADO */}
      <Modal
        visible={stateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStateModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setStateModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="subtitle" style={{ fontSize: 17, fontWeight: '700' }}>
                Selecione o Estado
              </ThemedText>
              <Pressable onPress={() => setStateModalVisible(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Campo de Busca de Estado */}
            <View style={[styles.searchBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <MaterialIcons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar estado (ex: MG ou Minas Gerais)..."
                placeholderTextColor={theme.textSecondary}
                value={stateSearch}
                onChangeText={setStateSearch}
                autoFocus
              />
              {stateSearch.length > 0 && (
                <Pressable onPress={() => setStateSearch('')}>
                  <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item.sigla}
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
              renderItem={({ item }) => {
                const isSelected = selectedState.toUpperCase() === item.sigla.toUpperCase();
                return (
                  <Pressable
                    style={({ pressed, hovered }: any) => [
                      styles.listItem,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: 'rgba(255, 107, 74, 0.12)' },
                      hovered && !isSelected && { backgroundColor: theme.border },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSelectState(item)}
                  >
                    <View style={styles.stateItemRow}>
                      <View
                        style={[
                          styles.stateBadge,
                          {
                            backgroundColor: isSelected ? theme.brand : theme.background,
                            borderColor: isSelected ? theme.brand : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          style={{
                            color: isSelected ? '#FFF' : theme.text,
                            fontWeight: '700',
                            fontSize: 12,
                          }}
                        >
                          {item.sigla}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={[
                          styles.stateNameText,
                          { color: isSelected ? theme.brand : theme.text },
                          isSelected && { fontWeight: '700' },
                        ]}
                      >
                        {item.nome}
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color={theme.brand} />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL DE SELEÇÃO DE CIDADE */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCityModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View>
                <ThemedText type="subtitle" style={{ fontSize: 17, fontWeight: '700' }}>
                  Cidades de {selectedStateObj ? selectedStateObj.nome : selectedState}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                  {filteredCities.length} cidades disponíveis
                </ThemedText>
              </View>
              <Pressable onPress={() => setCityModalVisible(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Campo de Busca de Cidade */}
            <View style={[styles.searchBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <MaterialIcons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Buscar cidade em ${selectedState}... (ex: ${selectedState === 'MG' ? 'Itaúna' : 'Capital'})`}
                placeholderTextColor={theme.textSecondary}
                value={citySearch}
                onChangeText={setCitySearch}
                autoFocus
              />
              {citySearch.length > 0 && (
                <Pressable onPress={() => setCitySearch('')}>
                  <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Opção de Usar Texto Digitado caso não encontre na lista */}
            {citySearch.trim().length > 0 && !filteredCities.some(c => c.toLowerCase() === citySearch.trim().toLowerCase()) && (
              <Pressable
                style={[styles.customCityOption, { borderColor: theme.brand, backgroundColor: 'rgba(255, 107, 74, 0.08)' }]}
                onPress={() => handleSelectCity(citySearch.trim())}
              >
                <MaterialIcons name="add-location" size={18} color={theme.brand} />
                <ThemedText style={{ color: theme.brand, fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                  Usar "{citySearch.trim()}"
                </ThemedText>
              </Pressable>
            )}

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  {isLoadingCities ? (
                    <ActivityIndicator size="small" color={theme.brand} />
                  ) : (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>
                      Nenhuma cidade encontrada com esse nome.
                    </ThemedText>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedCity.toLowerCase() === item.toLowerCase();
                return (
                  <Pressable
                    style={({ pressed, hovered }: any) => [
                      styles.listItem,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: 'rgba(255, 107, 74, 0.12)' },
                      hovered && !isSelected && { backgroundColor: theme.border },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSelectCity(item)}
                  >
                    <ThemedText
                      style={[
                        styles.cityNameText,
                        { color: isSelected ? theme.brand : theme.text },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item}
                    </ThemedText>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color={theme.brand} />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowLayout: {
    flexDirection: 'row',
    gap: 10,
  },
  columnLayout: {
    flexDirection: 'column',
    gap: 12,
  },
  fieldWrapper: {
    flex: 1,
  },
  stateFieldRow: {
    flex: 1.1,
  },
  cityFieldRow: {
    flex: 1.9,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  selectButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  disabledButton: {
    opacity: 0.6,
    borderStyle: 'dashed',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  selectText: {
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
  customCityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  listContainer: {
    paddingHorizontal: 12,
    maxHeight: 340,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  stateItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 10,
  },
  stateNameText: {
    fontSize: 15,
  },
  cityNameText: {
    fontSize: 15,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
