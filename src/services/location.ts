import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  city?: string;
  state?: string;
  neighborhood?: string;
  formattedAddress?: string;
}

export interface UserLocationState extends LocationCoordinates, GeocodedAddress {
  label: string;
}

/**
 * Solicita permissão para acessar a localização do dispositivo
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return true;
      }
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('Erro ao solicitar permissão de localização:', err);
    return false;
  }
}

/**
 * Obtém a posição geográfica atual do usuário
 */
export async function getCurrentCoordinates(): Promise<LocationCoordinates | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            console.warn('Erro na geolocalização web:', err);
            resolve(null);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (err) {
    console.warn('Falha ao obter localização atual:', err);
    return null;
  }
}

/**
 * Obtém endereço/cidade a partir das coordenadas geográficas
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (results && results.length > 0) {
      const first = results[0];
      const city = first.city || first.subregion || first.region || '';
      const state = first.region || '';
      const neighborhood = first.district || first.street || '';

      const parts = [neighborhood, city, state].filter(Boolean);
      return {
        city,
        state,
        neighborhood,
        formattedAddress: parts.join(', '),
      };
    }
  } catch (err) {
    console.warn('Falha na geocodificação reversa:', err);
  }

  return {};
}

/**
 * Calcula a distância em quilômetros entre duas coordenadas (fórmula de Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Formata a distância para exibição amigável ao usuário
 */
export function formatDistance(distanceKm: number | null | undefined): string | null {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return null;
  }
  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000));
    return `a ${meters}m`;
  }
  return `a ${distanceKm.toFixed(1)} km`;
}
