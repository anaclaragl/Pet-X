import { apiFetch, isPostgresApiConfigured, uploadImageToPostgres } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccountType = 'tutor' | 'ong' | 'protetor' | 'fisica';

export interface UserProfileData {
  id?: string;
  name: string;
  username: string;
  accountType: AccountType;
  bio?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
}

export interface DecodedToken {
  userId: string;
  email: string;
  exp?: number;
  iat?: number;
}

interface SignUpParams {
  email: string;
  password?: string;
  name: string;
  accountType: AccountType;
  city?: string;
  state?: string;
}

interface SignInParams {
  email: string;
  password?: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: { token: string } | null;
  profile: UserProfileData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signIn: (params: SignInParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileData>) => Promise<{ error: string | null; suggestion?: string }>;
}

export function isTokenValid(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded) return false;
    if (decoded.exp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return decoded.exp > nowInSeconds;
    }
    return true;
  } catch (e) {
    return false;
  }
}

const DEFAULT_PROFILE: UserProfileData = {
  id: 'demo-user-1',
  name: 'Ana Clara',
  username: '@anaclara',
  accountType: 'tutor',
  bio: 'Amante de animais, sempre ajudando a encontrar os pets perdidos do bairro! 🐶🐱',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  city: 'São Paulo',
  state: 'SP',
  isVerified: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: DEFAULT_PROFILE,
  isLoading: true,
  isAuthenticated: false,
  isConfigured: isPostgresApiConfigured,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => { },
  updateProfile: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const storedToken = await AsyncStorage.getItem('petx_token');
        if (storedToken && isTokenValid(storedToken)) {
          setSession({ token: storedToken });
          const decoded = jwtDecode<DecodedToken>(storedToken);
          setUser({ id: decoded.userId, email: decoded.email });

          try {
            const res = await apiFetch('/api/auth/me');
            if (res && res.user) {
              setUser(res.user);
              if (res.profile) {
                setProfile({
                  id: res.profile.user_id,
                  name: res.profile.name,
                  username: res.profile.username,
                  accountType: res.profile.account_type || 'tutor',
                  bio: res.profile.bio || '',
                  avatarUrl: res.profile.avatar_url || DEFAULT_PROFILE.avatarUrl,
                  city: res.profile.city || 'São Paulo',
                  state: res.profile.state || 'SP',
                  isVerified: res.profile.account_type === 'ong',
                });
              }
            }
          } catch (fetchError) {
            // Backend offline but token is valid locally
          }
        } else {
          // Token expired or invalid
          if (storedToken) {
            await AsyncStorage.removeItem('petx_token');
          }
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthStatus();
  }, []);

  const signUp = async ({ email, password = '', name, accountType, city, state }: SignUpParams) => {
    try {
      const username = '@' + name.toLowerCase().replace(/\s+/g, '');
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, username, accountType, city, state }),
      });

      if (res.token) {
        await AsyncStorage.setItem('petx_token', res.token);
        setSession({ token: res.token });
        setUser(res.user);
        if (res.profile) {
          setProfile({
            id: res.profile.user_id,
            name: res.profile.name,
            username: res.profile.username,
            accountType: res.profile.account_type || accountType,
            bio: res.profile.bio || '',
            avatarUrl: res.profile.avatar_url || DEFAULT_PROFILE.avatarUrl,
            city: city || 'São Paulo',
            state: state || 'SP',
            isVerified: accountType === 'ong',
          });
        }
        return { error: null };
      }
    } catch (err: any) {
      // Demo fallback if backend is offline
      const mockProfile: UserProfileData = {
        id: Date.now().toString(),
        name,
        username: '@' + name.toLowerCase().replace(/\s+/g, ''),
        accountType,
        city: city || 'São Paulo',
        state: state || 'SP',
        bio: accountType === 'ong' ? 'ONG focada em proteção animal e resgate.' : 'Tutor e amante de pets.',
        avatarUrl: accountType === 'ong'
          ? 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        isVerified: accountType === 'ong',
      };
      setProfile(mockProfile);
      return { error: null };
    }
    return { error: null };
  };

  const signIn = async ({ email, password = '' }: SignInParams) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.token) {
        await AsyncStorage.setItem('petx_token', res.token);
        setSession({ token: res.token });
        setUser(res.user);
        if (res.profile) {
          setProfile({
            id: res.profile.user_id,
            name: res.profile.name,
            username: res.profile.username,
            accountType: res.profile.account_type || 'tutor',
            bio: res.profile.bio || '',
            avatarUrl: res.profile.avatar_url || DEFAULT_PROFILE.avatarUrl,
            city: res.profile.city || 'São Paulo',
            state: res.profile.state || 'SP',
            isVerified: res.profile.account_type === 'ong',
          });
        }
        return { error: null };
      }
    } catch (err: any) {
      return { error: err?.message || 'Erro ao realizar login.' };
    }
    return { error: null };
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('petx_token');
    } catch (e) { }
    setUser(null);
    setSession(null);
    setProfile(DEFAULT_PROFILE);
  };

  const updateProfile = async (data: Partial<UserProfileData>): Promise<{ error: string | null; suggestion?: string }> => {
    if (!profile) return { error: 'Perfil não carregado.' };

    let uploadedAvatarUrl = data.avatarUrl;
    if (data.avatarUrl && (data.avatarUrl.startsWith('file:') || data.avatarUrl.startsWith('blob:') || data.avatarUrl.startsWith('data:'))) {
      uploadedAvatarUrl = await uploadImageToPostgres(data.avatarUrl);
    }

    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name ?? profile.name,
          username: data.username ?? profile.username,
          bio: data.bio ?? profile.bio,
          avatarUrl: uploadedAvatarUrl ?? profile.avatarUrl,
          city: data.city ?? profile.city,
          state: data.state ?? profile.state,
        }),
      });

      const updatedProfile: UserProfileData = {
        ...profile,
        ...data,
        username: res?.username || data.username || profile.username,
        avatarUrl: uploadedAvatarUrl || profile.avatarUrl,
      };
      setProfile(updatedProfile);
      return { error: null };
    } catch (err: any) {
      return {
        error: err.message || 'Erro ao atualizar perfil',
        suggestion: err.suggestion,
      };
    }
  };

  const isAuthenticated = Boolean(session?.token && isTokenValid(session.token));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        isConfigured: isPostgresApiConfigured,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
