import { handleMockApiRequest } from '@/services/mock-service';

export const isPostgresApiConfigured = false; // Modo Demo Vercel ativo

/**
 * Cliente HTTP utilitário no Modo Demo Web (Bypass de autenticação e LocalStorage)
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Simula uma pequena latência de rede realista (80ms)
  await new Promise((resolve) => setTimeout(resolve, 80));
  return handleMockApiRequest<T>(endpoint, options);
}

/**
 * Envio de imagens no modo demo (retorna a própria URI local ou imagem demo)
 */
export async function uploadImageToPostgres(uri: string): Promise<string> {
  if (!uri) {
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';
  }
  return uri;
}

