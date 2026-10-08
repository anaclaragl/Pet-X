import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistanceKm } from './location';
import { ALICE_AVATAR, BASE_USER_AVATAR } from '@/constants/avatars';

// Tipos internos do Mock Service
export interface MockUser {
  id: string;
  email: string;
}

export interface MockProfile {
  id: string;
  user_id: string;
  name: string;
  username: string;
  bio: string;
  avatar_url: string;
  city: string;
  state: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  account_type: 'tutor' | 'ong' | 'protetor' | 'fisica';
  is_verified: boolean;
}

export interface MockComment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  time: string;
}

export interface MockPost {
  id: string;
  userId: string;
  user: string;
  avatar: string;
  type: 'perdido' | 'encontrado' | 'ong' | 'outro' | 'adocao' | 'resgatado';
  content: string;
  images: string[];
  image: string | null;
  city: string;
  state: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  isApproximate: boolean;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: MockComment[];
  isResolved: boolean;
  isVerified?: boolean;
  createdAt: string;
  time: string;
}

export interface MockMessage {
  id: string;
  sender_id: string;
  sender: string;
  text: string;
  timestamp: string;
  isUser: boolean;
}

export interface MockConversation {
  id: string;
  user1_id: string;
  user2_id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: MockMessage[];
}

export interface MockNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'message' | 'alert';
  user: string;
  userAvatar: string;
  sender_name: string;
  sender_avatar: string;
  text: string;
  targetId?: string;
  target_id?: string;
  timestamp: string;
  isRead: boolean;
  is_read: boolean;
}

// Chaves de Armazenamento
const STORAGE_KEYS = {
  INITIALIZED: '@petx_demo:initialized_v9',
  CURRENT_USER_ID: '@petx_demo:current_user_id',
  USERS: '@petx_demo:users',
  PROFILES: '@petx_demo:profiles',
  POSTS: '@petx_demo:posts',
  CONVERSATIONS: '@petx_demo:conversations',
  NOTIFICATIONS: '@petx_demo:notifications',
};

// Dados Iniciais Ricos para Demonstração
const INITIAL_USERS: MockUser[] = [
  { id: 'usr_alice_01', email: 'alice@petx.com' },
  { id: 'usr_ong_patas', email: 'contato@ongpatas.org' },
  { id: 'usr_carlos_02', email: 'carlos@petx.com' },
];

const INITIAL_PROFILES: MockProfile[] = [
  {
    id: 'prof_usr_alice_01',
    user_id: 'usr_alice_01',
    name: 'Alice',
    username: '@alice.vet',
    bio: 'Veterinária e protetora de animais. Apaixonada por resgates e cuidados especiais',
    avatar_url: ALICE_AVATAR,
    city: 'São Paulo',
    state: 'SP',
    neighborhood: 'Pinheiros',
    latitude: -23.561684,
    longitude: -46.690822,
    account_type: 'protetor',
    is_verified: true,
  },
  {
    id: 'prof_usr_ong_patas',
    user_id: 'usr_ong_patas',
    name: 'ONG Patas Amigas',
    username: '@ongpatasamigas',
    bio: 'Resgatamos e reabilitamos animais em situação de risco. Ajude-nos a encontrar um lar!',
    avatar_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    city: 'São Paulo',
    state: 'SP',
    neighborhood: 'Vila Mariana',
    latitude: -23.5898,
    longitude: -46.6346,
    account_type: 'ong',
    is_verified: true,
  },
  {
    id: 'prof_usr_carlos_02',
    user_id: 'usr_carlos_02',
    name: 'Carlos Eduardo',
    username: '@carlos_tutor',
    bio: 'Tutor do Max e do Pipoca. Defensor da adoção responsável',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhood: 'Copacabana',
    latitude: -22.9698,
    longitude: -43.1868,
    account_type: 'tutor',
    is_verified: false,
  },
];


const INITIAL_POSTS: MockPost[] = [
  {
    id: 'post_01',
    userId: 'usr_ong_patas',
    user: 'ONG Patas Amigas',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    type: 'ong',
    content: 'Thor procura um lar com muito amor! É um filhote de 8 meses, porte médio, já castrado e com vacinas em dia. Super dócil com crianças e outros cães.',
    images: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80',
    ],
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    city: 'São Paulo',
    state: 'SP',
    neighborhood: 'Vila Mariana',
    latitude: -23.5898,
    longitude: -46.6346,
    isApproximate: true,
    likesCount: 28,
    isLiked: false,
    commentsCount: 2,
    comments: [
      {
        id: 'c1',
        user: 'Alice',
        avatar: ALICE_AVATAR,
        content: 'Ele é lindo demais! Já compartilhei com o grupo da clínica.',
        time: 'Há 2h',
      },
      {
        id: 'c2',
        user: 'Carlos Eduardo',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        content: 'Que olhar doce! Tomara que encontre uma família logo!',
        time: 'Há 1h',
      },
    ],
    isResolved: false,
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    time: 'Há 4h',
  },
  {
    id: 'post_02',
    userId: 'usr_carlos_02',
    user: 'Carlos Eduardo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    type: 'perdido',
    content: 'URGENTE: Gatinha "Luna" desapareceu próximo à Av. Nossa Senhora de Copacabana. É dócil, cinza com olhos verdes. Usa coleira vermelha com plaquinha. Por favor entrem em contato se a virem!',
    images: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    ],
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhood: 'Copacabana',
    latitude: -22.9698,
    longitude: -43.1868,
    isApproximate: false,
    likesCount: 42,
    isLiked: false,
    commentsCount: 1,
    comments: [
      {
        id: 'c3',
        user: 'ONG Patas Amigas',
        avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
        content: 'Divulgado em nossas redes! Vamos torcer para que apareça logo.',
        time: 'Há 3h',
      },
    ],
    isResolved: false,
    isVerified: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    time: 'Há 6h',
  },
  {
    id: 'post_03',
    userId: 'usr_alice_01',
    user: 'Alice',
    avatar: ALICE_AVATAR,
    type: 'encontrado',
    content: 'Final feliz! Resgatamos este cãozinho assustado na Marginal Pinheiros hoje cedo. Já passou por consulta veterinária e agora está descansando e bem alimentado.',
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80',
    ],
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80',
    city: 'São Paulo',
    state: 'SP',
    neighborhood: 'Pinheiros',
    latitude: -23.561684,
    longitude: -46.690822,
    isApproximate: true,
    likesCount: 65,
    isLiked: true,
    commentsCount: 0,
    comments: [],
    isResolved: true,
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    time: 'Há 12h',
  },
  {
    id: 'post_04',
    userId: 'usr_ong_patas',
    user: 'ONG Patas Amigas',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    type: 'ong',
    content: 'Duplinha inseparável! Fred & Mel têm 3 meses, vermifugados e cheios de energia. Adoção conjunta prioritária para lares telados e seguros.',
    images: [
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
    ],
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
    city: 'São Paulo',
    state: 'SP',
    neighborhood: 'Moema',
    latitude: -23.6034,
    longitude: -46.6632,
    isApproximate: false,
    likesCount: 31,
    isLiked: false,
    commentsCount: 0,
    comments: [],
    isResolved: false,
    isVerified: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    time: 'Ontem',
  },
];

const INITIAL_CONVERSATIONS: MockConversation[] = [
  {
    id: 'conv_01',
    user1_id: 'usr_alice_01',
    user2_id: 'usr_ong_patas',
    userName: 'ONG Patas Amigas',
    userAvatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Olá! O Thor está disponível sim! Você tem outros animais?',
    lastTime: '10:35',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        sender_id: 'usr_alice_01',
        sender: 'Alice',
        text: 'Olá! Vi a publicação do Thor no feed de adoção e gostaria de saber mais.',
        timestamp: '10:30',
        isUser: true,
      },
      {
        id: 'm2',
        sender_id: 'usr_ong_patas',
        sender: 'ONG Patas Amigas',
        text: 'Olá! O Thor está disponível sim! Você tem outros animais?',
        timestamp: '10:35',
        isUser: false,
      },
    ],
  },
];

const INITIAL_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif_01',
    user_id: 'usr_alice_01',
    type: 'message',
    user: 'ONG Patas Amigas',
    userAvatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    sender_name: 'ONG Patas Amigas',
    sender_avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    text: 'respondeu a sua mensagem sobre o Thor',
    targetId: 'conv_01',
    target_id: 'conv_01',
    timestamp: 'Ha 15m',
    isRead: false,
    is_read: false,
  },
  {
    id: 'notif_02',
    user_id: 'usr_alice_01',
    type: 'like',
    user: 'Carlos Eduardo',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    sender_name: 'Carlos Eduardo',
    sender_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    text: 'curtiu seu resgate na Marginal Pinheiros',
    targetId: 'post_03',
    target_id: 'post_03',
    timestamp: 'Ha 2h',
    isRead: false,
    is_read: false,
  },
  {
    id: 'notif_03',
    user_id: 'usr_alice_01',
    type: 'comment',
    user: 'ONG Patas Amigas',
    userAvatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    sender_name: 'ONG Patas Amigas',
    sender_avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
    text: 'comentou: "Ele e lindo demais! Ja compartilhamos no grupo da clinica."',
    targetId: 'post_03',
    target_id: 'post_03',
    timestamp: 'Ha 3h',
    isRead: false,
    is_read: false,
  },
  {
    id: 'notif_04',
    user_id: 'usr_alice_01',
    type: 'alert',
    user: 'Pet-X Alerta',
    userAvatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
    sender_name: 'Pet-X Alerta',
    sender_avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
    text: 'Novo pet cadastrado em Pinheiros, proximo a voce',
    targetId: 'post_01',
    target_id: 'post_01',
    timestamp: 'Ontem',
    isRead: true,
    is_read: true,
  },
];

// Helper para gerar token JWT fake decodificável pelo frontend
function createMockToken(userId: string, email: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 ano
      iat: Math.floor(Date.now() / 1000),
    })
  );
  return `${header}.${payload}.mock_demo_signature`;
}

// Inicializador de LocalStorage / AsyncStorage
async function ensureInitialized() {
  try {
    const isInit = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  } catch (e) {
    console.warn('Erro ao inicializar mock data:', e);
  }
}

// Helper de normalização para garantir que avatares nunca fiquem vazios ou com links obsoletos
function normalizeProfile(p: MockProfile): MockProfile {
  if (p.user_id === 'usr_alice_01') {
    return { ...p, avatar_url: ALICE_AVATAR };
  }
  if (!p.avatar_url || p.avatar_url === '' || p.avatar_url.includes('photo-1580489944761') || p.avatar_url.includes('photo-1535713875002') || p.avatar_url.includes('photo-1544005313-94ddf0286df2') || p.avatar_url.includes('photo-1494790108377')) {
    if (p.user_id !== 'usr_ong_patas' && p.user_id !== 'usr_carlos_02') {
      return { ...p, avatar_url: BASE_USER_AVATAR };
    }
  }
  return p;
}

// Helper de normalizacao para garantir que notificacoes sempre tenham user e avatar preenchidos
function normalizeNotification(n: any): MockNotification {
  const user = n.user || n.sender_name || 'Usuario';
  const userAvatar = n.userAvatar || n.sender_avatar || BASE_USER_AVATAR;
  const isRead = Boolean(n.isRead !== undefined ? n.isRead : n.is_read);
  const targetId = n.targetId || n.target_id || undefined;
  return {
    id: String(n.id),
    user_id: n.user_id || 'usr_alice_01',
    type: n.type || 'alert',
    user,
    sender_name: user,
    userAvatar,
    sender_avatar: userAvatar,
    text: n.text || '',
    targetId,
    target_id: targetId,
    timestamp: n.timestamp || 'Agora',
    isRead,
    is_read: isRead,
  };
}

// Helpers de leitura/escrita
async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  await ensureInitialized();
  try {
    const item = await AsyncStorage.getItem(key);
    const parsed = item ? JSON.parse(item) : defaultValue;
    if (key === STORAGE_KEYS.PROFILES && Array.isArray(parsed)) {
      return parsed.map(normalizeProfile) as unknown as T;
    }
    if (key === STORAGE_KEYS.NOTIFICATIONS && Array.isArray(parsed)) {
      return parsed.map(normalizeNotification) as unknown as T;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Erro ao salvar no AsyncStorage:', e);
  }
}

/**
 * Roteador central do serviço Mock Bypass
 */
export async function handleMockApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  await ensureInitialized();

  const method = (options.method || 'GET').toUpperCase();
  const [path, queryString] = endpoint.split('?');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. AUTH: LOGIN (Bypass total: qualquer email e senha são aceitos!)
  if (path === '/api/auth/login' && method === 'POST') {
    const email = (body.email || 'demo@petx.com').trim().toLowerCase();
    const users = await getStorageItem<MockUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);

    let user = users.find((u) => u.email.toLowerCase() === email);
    let profile: MockProfile | undefined;

    if (!user) {
      // Cria automaticamente perfil para qualquer email informado!
      const newUserId = `usr_${Date.now()}`;
      const namePart = email.split('@')[0];
      const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      user = { id: newUserId, email };
      profile = {
        id: `prof_${newUserId}`,
        user_id: newUserId,
        name: cleanName || 'Visitante Pet-X',
        username: `@${namePart.toLowerCase()}`,
        bio: 'Adoro pets! Explorando o aplicativo Pet-X',
        avatar_url: BASE_USER_AVATAR,
        city: 'São Paulo',
        state: 'SP',
        neighborhood: 'Centro',
        latitude: -23.5505,
        longitude: -46.6333,
        account_type: 'tutor',
        is_verified: false,
      };

      users.push(user);
      profiles.push(profile);
      await setStorageItem(STORAGE_KEYS.USERS, users);
      await setStorageItem(STORAGE_KEYS.PROFILES, profiles);
    } else {
      profile = profiles.find((p) => p.user_id === user!.id);
      if (!profile) {
        profile = {
          id: `prof_${user.id}`,
          user_id: user.id,
          name: user.email.split('@')[0],
          username: `@${user.email.split('@')[0].toLowerCase()}`,
          bio: 'Tutor de pets',
          avatar_url: BASE_USER_AVATAR,
          city: 'São Paulo',
          state: 'SP',
          neighborhood: '',
          latitude: null,
          longitude: null,
          account_type: 'tutor',
          is_verified: false,
        };
        profiles.push(profile);
        await setStorageItem(STORAGE_KEYS.PROFILES, profiles);
      } else if (!profile.avatar_url) {
        profile.avatar_url = BASE_USER_AVATAR;
        await setStorageItem(STORAGE_KEYS.PROFILES, profiles);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    const token = createMockToken(user.id, user.email);

    return {
      token,
      user,
      profile,
    } as T;
  }

  // 2. AUTH: REGISTER (Bypass total: salva na hora em localstorage)
  if (path === '/api/auth/register' && method === 'POST') {
    const email = (body.email || 'novo@petx.com').trim().toLowerCase();
    const users = await getStorageItem<MockUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);

    const newUserId = `usr_${Date.now()}`;
    const user: MockUser = { id: newUserId, email };
    const profile: MockProfile = {
      id: `prof_${newUserId}`,
      user_id: newUserId,
      name: body.name || email.split('@')[0],
      username: body.username || `@${(body.name || email.split('@')[0]).toLowerCase().replace(/\s+/g, '')}`,
      bio: 'Novo tutor na comunidade Pet-X',
      avatar_url: body.avatarUrl || BASE_USER_AVATAR,
      city: body.city || 'São Paulo',
      state: body.state || 'SP',
      neighborhood: '',
      latitude: -23.5505,
      longitude: -46.6333,
      account_type: body.accountType || 'tutor',
      is_verified: body.accountType === 'ong',
    };

    users.push(user);
    profiles.push(profile);
    await setStorageItem(STORAGE_KEYS.USERS, users);
    await setStorageItem(STORAGE_KEYS.PROFILES, profiles);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUserId);

    const token = createMockToken(user.id, user.email);
    return { token, user, profile } as T;
  }

  // 3. AUTH: ME
  if (path === '/api/auth/me' && method === 'GET') {
    const currentUserId = (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || 'usr_alice_01';
    const users = await getStorageItem<MockUser[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);

    const user = users.find((u) => u.id === currentUserId) || users[0];
    const rawProfile = profiles.find((p) => p.user_id === user.id) || profiles[0];
    const profile = normalizeProfile(rawProfile);

    return { user, profile } as T;
  }

  // 4. AUTH: UPDATE PROFILE
  if (path === '/api/auth/profile' && method === 'PUT') {
    const currentUserId = (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || 'usr_alice_01';
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);

    let updatedProfile: MockProfile | undefined;
    const newProfiles = profiles.map((p) => {
      if (p.user_id === currentUserId) {
        updatedProfile = {
          ...p,
          name: body.name ?? p.name,
          username: body.username ?? p.username,
          bio: body.bio ?? p.bio,
          avatar_url: body.avatarUrl ?? p.avatar_url,
          city: body.city ?? p.city,
          state: body.state ?? p.state,
        };
        return updatedProfile;
      }
      return p;
    });

    await setStorageItem(STORAGE_KEYS.PROFILES, newProfiles);
    return { profile: updatedProfile } as T;
  }

  // 5. USERS: GET PROFILE & POSTS BY ID
  if (path.startsWith('/api/users/') && path.endsWith('/profile') && method === 'GET') {
    const targetUserId = path.split('/')[3];
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);

    const profile = profiles.find((p) => p.user_id === targetUserId);
    const userPosts = posts.filter((p) => p.userId === targetUserId);

    return {
      profile: profile ? normalizeProfile(profile) : null,
      posts: userPosts,
    } as T;
  }

  // 6. POSTS: LIST POSTS (com suporte a filtros de localização e raio)
  if (path === '/api/posts' && method === 'GET') {
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const queryParams = new URLSearchParams(queryString || '');

    const latParam = queryParams.get('lat');
    const lngParam = queryParams.get('lng');
    const radiusParam = queryParams.get('radius_km');
    const cityParam = queryParams.get('city');
    const stateParam = queryParams.get('state');

    let filtered = [...posts];

    // Se temos coordenadas (GPS ou cidade pré-definida com lat/lng):
    if (latParam && lngParam) {
      const uLat = parseFloat(latParam);
      const uLng = parseFloat(lngParam);

      // 1. Calcula a distância real para cada post que possui coordenadas
      filtered = filtered.map((p) => {
        if (p.latitude !== null && p.latitude !== undefined && p.longitude !== null && p.longitude !== undefined) {
          const distance = calculateDistanceKm(uLat, uLng, Number(p.latitude), Number(p.longitude));
          return { ...p, distanceKm: distance };
        }
        return p;
      });

      // 2. Se houver raio de proximidade selecionado (ex: 5km, 15km, 30km, 50km)
      if (radiusParam) {
        const maxRadius = parseFloat(radiusParam);
        const withinRadius = filtered.filter(
          (p) => (p as any).distanceKm !== undefined && (p as any).distanceKm <= maxRadius
        );

        if (withinRadius.length > 0) {
          filtered = withinRadius;
        }
        // Se nenhum post de exemplo estiver dentro do raio (ex: usuário testando de uma cidade distante),
        // mantemos os posts ordenados por proximidade com as tags de distância para não quebrar a demonstração.
      }

      // 3. Ordena os posts pelo mais próximo de onde o usuário está!
      filtered.sort((a, b) => {
        const distA = (a as any).distanceKm ?? 99999;
        const distB = (b as any).distanceKm ?? 99999;
        return distA - distB;
      });
    } else {
      // Sem coordenadas GPS: filtro textual por cidade/estado
      if (cityParam) {
        filtered = filtered.filter((p) => p.city?.toLowerCase() === cityParam.toLowerCase());
      }
      if (stateParam) {
        filtered = filtered.filter((p) => p.state?.toLowerCase() === stateParam.toLowerCase());
      }
      // Ordena pelos mais recentes
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered as T;
  }


  // 7. POSTS: CREATE POST
  if (path === '/api/posts' && method === 'POST') {
    const currentUserId = (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || 'usr_alice_01';
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);

    const profile = profiles.find((p) => p.user_id === currentUserId) || profiles[0];

    const images: string[] = Array.isArray(body.images) ? body.images : body.images ? [body.images] : [];

    const newPost: MockPost = {
      id: `post_${Date.now()}`,
      userId: currentUserId,
      user: profile.name,
      avatar: profile.avatar_url,
      type: body.type || 'outro',
      content: body.content,
      images,
      image: images[0] || null,
      city: body.city || profile.city,
      state: body.state || profile.state,
      neighborhood: body.neighborhood || profile.neighborhood,
      latitude: body.latitude ?? profile.latitude,
      longitude: body.longitude ?? profile.longitude,
      isApproximate: Boolean(body.isApproximate),
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      isResolved: false,
      isVerified: profile.is_verified,
      createdAt: new Date().toISOString(),
      time: 'Agora',
    };

    posts.unshift(newPost);
    await setStorageItem(STORAGE_KEYS.POSTS, posts);
    return newPost as T;
  }

  // 8. POSTS: LIKE
  if (path.match(/\/api\/posts\/.+\/like/) && method === 'POST') {
    const postId = path.split('/')[3];
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);

    const updated = posts.map((p) => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        const likesCount = isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
        return { ...p, isLiked, likesCount };
      }
      return p;
    });

    await setStorageItem(STORAGE_KEYS.POSTS, updated);
    return { success: true } as T;
  }

  // 9. POSTS: COMMENT
  if (path.match(/\/api\/posts\/.+\/comments/) && method === 'POST') {
    const postId = path.split('/')[3];
    const currentUserId = (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || 'usr_alice_01';
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);

    const profile = profiles.find((p) => p.user_id === currentUserId) || profiles[0];

    const newComment: MockComment = {
      id: `comm_${Date.now()}`,
      user: profile.name,
      avatar: profile.avatar_url,
      content: body.content || '',
      time: 'Agora',
    };

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...p.comments, newComment],
        };
      }
      return p;
    });

    await setStorageItem(STORAGE_KEYS.POSTS, updated);
    return newComment as T;
  }

  // 10. POSTS: RESOLVE
  if (path.match(/\/api\/posts\/.+\/resolve/) && method === 'PUT') {
    const postId = path.split('/')[3];
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);

    const updated = posts.map((p) => (p.id === postId ? { ...p, isResolved: !p.isResolved } : p));
    await setStorageItem(STORAGE_KEYS.POSTS, updated);
    return { success: true } as T;
  }

  // 11. POSTS: DELETE
  if (path.startsWith('/api/posts/') && method === 'DELETE') {
    const postId = path.split('/')[3];
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const updated = posts.filter((p) => p.id !== postId);
    await setStorageItem(STORAGE_KEYS.POSTS, updated);
    return { success: true } as T;
  }

  // 12. POSTS: EDIT
  if (path.startsWith('/api/posts/') && method === 'PUT') {
    const postId = path.split('/')[3];
    const posts = await getStorageItem<MockPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
    const updated = posts.map((p) => (p.id === postId ? { ...p, content: body.content ?? p.content } : p));
    await setStorageItem(STORAGE_KEYS.POSTS, updated);
    return { success: true } as T;
  }

  // 13. CONVERSATIONS: LIST
  if (path === '/api/conversations' && method === 'GET') {
    const convs = await getStorageItem<MockConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    return convs as T;
  }

  // 14. CONVERSATIONS: CREATE / OPEN
  if (path === '/api/conversations' && method === 'POST') {
    const currentUserId = (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || 'usr_alice_01';
    const recipientId = body.recipientId;
    const profiles = await getStorageItem<MockProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    const convs = await getStorageItem<MockConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);

    const targetProfile = profiles.find((p) => p.user_id === recipientId) || profiles[1];

    const existing = convs.find(
      (c) =>
        (c.user1_id === currentUserId && c.user2_id === recipientId) ||
        (c.user1_id === recipientId && c.user2_id === currentUserId)
    );

    if (existing) {
      return { id: existing.id } as T;
    }

    const newId = `conv_${Date.now()}`;
    const newConv: MockConversation = {
      id: newId,
      user1_id: currentUserId,
      user2_id: recipientId,
      userName: targetProfile.name,
      userAvatar: targetProfile.avatar_url,
      lastMessage: 'Conversa iniciada',
      lastTime: 'Agora',
      unreadCount: 0,
      messages: [],
    };

    convs.unshift(newConv);
    await setStorageItem(STORAGE_KEYS.CONVERSATIONS, convs);
    return { id: newId } as T;
  }

  // 15. CONVERSATIONS: GET MESSAGES
  if (path.match(/\/api\/conversations\/.+\/messages/) && method === 'GET') {
    const convId = path.split('/')[3];
    const convs = await getStorageItem<MockConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    const conv = convs.find((c) => c.id === convId);
    return (conv ? conv.messages : []) as T;
  }

  // 16. CONVERSATIONS: SEND MESSAGE
  if (path.match(/\/api\/conversations\/.+\/messages/) && method === 'POST') {
    const convId = path.split('/')[3];
    const currentUserId = (await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) || 'usr_alice_01';
    const convs = await getStorageItem<MockConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: MockMessage = {
      id: `msg_${Date.now()}`,
      sender_id: currentUserId,
      sender: 'Eu',
      text: body.text || '',
      timestamp: timeStr,
      isUser: true,
    };

    const updated = convs.map((c) => {
      if (c.id === convId) {
        return {
          ...c,
          lastMessage: body.text,
          lastTime: timeStr,
          messages: [...c.messages, newMsg],
        };
      }
      return c;
    });

    await setStorageItem(STORAGE_KEYS.CONVERSATIONS, updated);
    return newMsg as T;
  }

  // 17. NOTIFICATIONS: LIST
  if (path === '/api/notifications' && method === 'GET') {
    const notifs = await getStorageItem<MockNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return notifs as T;
  }

  // 18. NOTIFICATIONS: MARK ONE READ
  if (path.match(/\/api\/notifications\/.+\/read/) && method === 'PUT') {
    const notifId = path.split('/')[3];
    const notifs = await getStorageItem<MockNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.id === notifId ? { ...n, is_read: true, isRead: true } : n));
    await setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return { success: true } as T;
  }

  // 19. NOTIFICATIONS: MARK ALL READ
  if (path === '/api/notifications/read-all' && method === 'PUT') {
    const notifs = await getStorageItem<MockNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => ({ ...n, is_read: true, isRead: true }));
    await setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    return { success: true } as T;
  }

  // 20. UPLOAD: MOCK IMAGE UPLOAD (Retorna a própria URI)
  if (path === '/api/upload' && method === 'POST') {
    return { url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80' } as T;
  }

  // Fallback padrão
  return {} as T;
}
