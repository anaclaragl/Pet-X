import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AccountType, DbProfile } from '@/types/supabase';

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
  user: User | null;
  session: Session | null;
  profile: UserProfileData | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signIn: (params: SignInParams) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileData>) => Promise<{ error: string | null }>;
}

const DEFAULT_PROFILE: UserProfileData = {
  id: 'demo-user-1',
  name: 'Ana Clara',
  username: '@anaclara',
  accountType: 'fisica',
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
  isLoading: false,
  isConfigured: isSupabaseConfigured,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Erro ao buscar perfil:', error.message);
        return;
      }

      if (data) {
        const dbProfile = data as DbProfile;
        setProfile({
          id: dbProfile.id,
          name: dbProfile.name,
          username: dbProfile.username,
          accountType: dbProfile.account_type,
          bio: dbProfile.bio || '',
          avatarUrl: dbProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          city: dbProfile.city || '',
          state: dbProfile.state || '',
          isVerified: dbProfile.is_verified,
        });
      }
    } catch (e) {
      console.warn('Exceção ao buscar perfil:', e);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(DEFAULT_PROFILE);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password = '', name, accountType, city, state }: SignUpParams) => {
    if (!isSupabaseConfigured) {
      // Demo fallback mode
      const username = '@' + name.toLowerCase().replace(/\s+/g, '');
      const mockProfile: UserProfileData = {
        id: Date.now().toString(),
        name,
        username,
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error: error.message };

      if (data.user) {
        const username = '@' + name.toLowerCase().replace(/\s+/g, '');
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name,
          username,
          account_type: accountType,
          city,
          state,
          is_verified: accountType === 'ong',
          avatar_url: accountType === 'ong'
            ? 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        });

        if (profileError) {
          console.warn('Erro ao criar perfil:', profileError.message);
        } else {
          await fetchProfile(data.user.id);
        }
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Ocorreu um erro ao cadastrar.' };
    }
  };

  const signIn = async ({ email, password = '' }: SignInParams) => {
    if (!isSupabaseConfigured) {
      // Demo fallback mode
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Erro ao realizar login.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(DEFAULT_PROFILE);
  };

  const updateProfile = async (data: Partial<UserProfileData>) => {
    if (!profile) return { error: 'Perfil não carregado.' };

    let uploadedAvatarUrl = data.avatarUrl;
    if (data.avatarUrl && isSupabaseConfigured && (data.avatarUrl.startsWith('file:') || data.avatarUrl.startsWith('blob:') || data.avatarUrl.startsWith('data:'))) {
      const { uploadImageToSupabase } = await import('@/lib/supabase');
      uploadedAvatarUrl = await uploadImageToSupabase(data.avatarUrl, 'avatars');
    }

    const updatedProfile = { 
      ...profile, 
      ...data,
      avatarUrl: uploadedAvatarUrl || profile.avatarUrl 
    };
    setProfile(updatedProfile);

    if (isSupabaseConfigured && user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: data.name ?? profile.name,
            username: data.username ?? profile.username,
            bio: data.bio ?? profile.bio,
            avatar_url: uploadedAvatarUrl ?? profile.avatarUrl,
            city: data.city ?? profile.city,
            state: data.state ?? profile.state,
          })
          .eq('id', user.id);

        if (error) return { error: error.message };
      } catch (err: any) {
        return { error: err?.message || 'Erro ao atualizar perfil.' };
      }
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
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
