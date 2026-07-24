import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Validação estrita do formato da URL e da chave do Supabase
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('dashboard/project') &&
  rawUrl.startsWith('https://') &&
  (rawUrl.endsWith('.supabase.co') || rawUrl.endsWith('.supabase.in'))
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

// SSR-safe storage wrapper para renderização estática do Expo Router / Node.js
const SSRSafeAsyncStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SSRSafeAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Função utilitária para fazer upload de imagens (avatar ou fotos de pets) para o Supabase Storage
 */
export async function uploadImageToSupabase(uri: string, folder = 'avatars'): Promise<string> {
  if (!uri || !isSupabaseConfigured || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri; // Se já for URL remota ou o Supabase não estiver configurado
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pet-photos')
      .upload(fileName, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Aviso: Não foi possível enviar imagem para o Storage:', uploadError.message);
      return uri;
    }

    const { data } = supabase.storage.from('pet-photos').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.warn('Erro ao processar upload de imagem:', err);
    return uri;
  }
}
