import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type PostType = 'perdido' | 'encontrado' | 'ong' | 'outro';

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  time: string;
}

export interface UserProfile {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  city?: string;
  state?: string;
  accountType?: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  user: string;
  avatar: string;
  type: PostType;
  content: string;
  images?: string[];
  image?: string | null;
  time: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: Comment[];
  isVerified?: boolean;
}

interface PostsContextType {
  posts: Post[];
  userPosts: Post[];
  userProfile: UserProfile;
  addPost: (content: string, type: PostType, images?: string[] | string | null) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const INITIAL_PROFILE: UserProfile = {
  name: 'Ana Clara',
  username: '@anaclara',
  bio: 'Amante de animais, sempre ajudando a encontrar os pets perdidos do bairro! 🐶🐱',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
};

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    user: 'Ana Clara',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    type: 'perdido',
    content: 'Meu cachorro fugiu ontem perto da praça central. Ele atende por Rex e tem uma mancha no olho.',
    images: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    ],
    time: '2h',
    likesCount: 12,
    isLiked: false,
    commentsCount: 2,
    comments: [
      {
        id: 'c1',
        user: 'João Silva',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        content: 'Acho que vi um cachorrinho muito parecido perto da padaria hoje cedo!',
        time: '1h',
      },
      {
        id: 'c2',
        user: 'ONG Patinhas',
        avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&q=80',
        content: 'Compartilhamos no nosso grupo de resgate!',
        time: '45m',
      },
    ],
  },
  {
    id: '2',
    user: 'ONG Patinhas',
    avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&q=80',
    type: 'ong',
    content: 'Estamos precisando de doação de ração para os filhotes que resgatamos essa semana!',
    images: [],
    time: '4h',
    likesCount: 34,
    isLiked: true,
    commentsCount: 1,
    isVerified: true,
    comments: [
      {
        id: 'c3',
        user: 'Ana Clara',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        content: 'Posso levar 2 sacos amanhã de manhã!',
        time: '2h',
      },
    ],
  },
  {
    id: '3',
    user: 'João Silva',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    type: 'encontrado',
    content: 'Encontrei esse gatinho perto do mercado. É muito dócil, alguém perdeu?',
    images: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    ],
    time: '5h',
    likesCount: 8,
    isLiked: false,
    commentsCount: 0,
    comments: [],
  },
];

const PostsContext = createContext<PostsContextType>({
  posts: [],
  userPosts: [],
  userProfile: INITIAL_PROFILE,
  addPost: async () => {},
  toggleLike: async () => {},
  addComment: async () => {},
  updateUserProfile: async () => {},
  refreshPosts: async () => {},
});

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const { profile: authProfile, user, updateProfile: updateAuthProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

  const userProfile: UserProfile = authProfile
    ? {
        name: authProfile.name,
        username: authProfile.username,
        bio: authProfile.bio || '',
        avatar: authProfile.avatarUrl || INITIAL_PROFILE.avatar,
        city: authProfile.city,
        state: authProfile.state,
        accountType: authProfile.accountType,
        isVerified: authProfile.isVerified,
      }
    : INITIAL_PROFILE;

  const fetchPostsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          type,
          content,
          created_at,
          user_id,
          profiles (name, avatar_url, is_verified),
          post_images (image_url),
          likes (id, user_id),
          comments (id, content, created_at, profiles (name, avatar_url))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar posts do Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const formatted: Post[] = data.map((item: any) => {
          const author = item.profiles || {};
          const imagesList = (item.post_images || []).map((img: any) => img.image_url);
          const likesCount = (item.likes || []).length;
          const isLiked = user ? (item.likes || []).some((l: any) => l.user_id === user.id) : false;

          const commentsList: Comment[] = (item.comments || []).map((c: any) => ({
            id: c.id,
            user: c.profiles?.name || 'Usuário',
            avatar: c.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            content: c.content,
            time: 'Recente',
          }));

          return {
            id: item.id,
            user: author.name || 'Usuário',
            avatar: author.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            type: item.type as PostType,
            content: item.content,
            images: imagesList,
            image: imagesList[0] || null,
            time: 'Recente',
            likesCount,
            isLiked,
            commentsCount: commentsList.length,
            comments: commentsList,
            isVerified: author.is_verified || false,
          };
        });
        setPosts(formatted);
      }
    } catch (e) {
      console.warn('Erro na consulta Supabase:', e);
    }
  };

  useEffect(() => {
    fetchPostsFromSupabase();
  }, [user?.id]);

  const addPost = async (content: string, type: PostType, imagesInput?: string[] | string | null) => {
    let imagesList: string[] = [];
    if (Array.isArray(imagesInput)) {
      imagesList = imagesInput.filter(Boolean);
    } else if (typeof imagesInput === 'string' && imagesInput.trim()) {
      imagesList = [imagesInput];
    }

    const newPostLocal: Post = {
      id: Date.now().toString(),
      user: userProfile.name,
      avatar: userProfile.avatar,
      type,
      content,
      images: imagesList,
      image: imagesList[0] || null,
      time: 'Agora',
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      comments: [],
      isVerified: userProfile.isVerified,
    };

    setPosts((prevPosts) => [newPostLocal, ...prevPosts]);

    if (isSupabaseConfigured && user) {
      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            type,
            content,
          })
          .select()
          .single();

        if (postError) {
          console.warn('Erro ao salvar post no Supabase:', postError.message);
          return;
        }

        if (postData && imagesList.length > 0) {
          const { uploadImageToSupabase } = await import('@/lib/supabase');
          const uploadedUrls = await Promise.all(
            imagesList.map((imgUri) => uploadImageToSupabase(imgUri, 'posts'))
          );
          const imageInserts = uploadedUrls.map((url) => ({
            post_id: postData.id,
            image_url: url,
          }));
          await supabase.from('post_images').insert(imageInserts);
        }
      } catch (err) {
        console.warn('Exceção ao inserir post no Supabase:', err);
      }
    }
  };

  const toggleLike = async (postId: string) => {
    let newLikedState = false;
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          newLikedState = !post.isLiked;
          const likesCount = newLikedState ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          return { ...post, isLiked: newLikedState, likesCount };
        }
        return post;
      })
    );

    if (isSupabaseConfigured && user) {
      try {
        if (newLikedState) {
          await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
        } else {
          await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
        }
      } catch (err) {
        console.warn('Erro ao atualizar like no Supabase:', err);
      }
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!content.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: userProfile.name,
      avatar: userProfile.avatar,
      content: content.trim(),
      time: 'Agora',
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('comments').insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        });
      } catch (err) {
        console.warn('Erro ao adicionar comentário no Supabase:', err);
      }
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    await updateAuthProfile({
      name: data.name,
      username: data.username,
      bio: data.bio,
      avatarUrl: data.avatar,
      city: data.city,
      state: data.state,
    });
  };

  const userPosts = posts.filter((post) => post.user === userProfile.name);

  return (
    <PostsContext.Provider
      value={{
        posts,
        userPosts,
        userProfile,
        addPost,
        toggleLike,
        addComment,
        updateUserProfile,
        refreshPosts: fetchPostsFromSupabase,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
