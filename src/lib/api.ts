import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const isPostgresApiConfigured = true;

/**
 * Cliente HTTP utilitário para comunicação com o backend PostgreSQL
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  let token: string | null = null;
  try {
    token = await AsyncStorage.getItem('petx_token');
  } catch (e) {
    // Ignore storage errors on web static render
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Erro ${response.status} ao comunicar com o servidor PostgreSQL`);
  }

  return data as T;
}

/**
 * Função utilitária para enviar imagens para o servidor PostgreSQL
 */
export async function uploadImageToPostgres(uri: string): Promise<string> {
  if (!uri || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  try {
    const formData = new FormData();
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `upload_${Date.now()}.${fileExt}`;

    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      } as any);
    }

    const token = await AsyncStorage.getItem('petx_token');
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (data && data.url) {
      return data.url;
    }
    return uri;
  } catch (err) {
    console.warn('Aviso: Falha ao enviar imagem para o servidor, usando URI local:', err);
    return uri;
  }
}
