import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, uploadImageToPostgres } from '@/lib/api';

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
  userId: string;
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
  isResolved?: boolean;
}

interface PostsContextType {
  posts: Post[];
  userPosts: Post[];
  userProfile: UserProfile;
  addPost: (content: string, type: PostType, images?: string[] | string | null) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  markAsResolved: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editPost: (postId: string, newContent: string) => Promise<void>;
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
    userId: 'demo-user-1',
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
    userId: 'demo-user-2',
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
    userId: 'demo-user-3',
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
  markAsResolved: async () => {},
  deletePost: async () => {},
  editPost: async () => {},
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

  const fetchAllPosts = async () => {
    try {
      const serverPosts = await apiFetch<any[]>('/api/posts');
      if (serverPosts && Array.isArray(serverPosts) && serverPosts.length > 0) {
        const formatted: Post[] = serverPosts.map((item) => ({
          id: item.id,
          userId: item.userId,
          user: item.user || 'Usuário',
          avatar: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          type: item.type as PostType,
          content: item.content,
          images: Array.isArray(item.images) ? item.images : [],
          image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null,
          time: 'Recente',
          likesCount: item.likesCount || 0,
          isLiked: item.isLiked || false,
          commentsCount: item.commentsCount || 0,
          comments: Array.isArray(item.comments) ? item.comments : [],
          isResolved: item.isResolved || false,
        }));
        setPosts(formatted);
      }
    } catch (err) {
      // Backend server offline - keep initial posts
    }
  };

  useEffect(() => {
    fetchAllPosts();
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
      userId: user?.id || 'demo-user-1',
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

    try {
      const uploadedImages = await Promise.all(
        imagesList.map((img) => uploadImageToPostgres(img))
      );
      await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          type,
          content,
          images: uploadedImages,
        }),
      });
      fetchAllPosts();
    } catch (err) {
      // Keep local state if server offline
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

    try {
      await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
    } catch (err) {
      // Local state fallback
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

    try {
      await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
    } catch (err) {
      // Local state fallback
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

  const markAsResolved = async (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return { ...post, isResolved: !post.isResolved };
        }
        return post;
      })
    );
    try {
      await apiFetch(`/api/posts/${postId}/resolve`, { method: 'PUT' });
      fetchAllPosts();
    } catch (err) {
      // Falha silenciosa
    }
  };

  const deletePost = async (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      fetchAllPosts();
    } catch (err) {
      // Falha silenciosa
    }
  };

  const editPost = async (postId: string, newContent: string) => {
    if (!newContent.trim()) return;

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, content: newContent.trim() } : post
      )
    );
    try {
      await apiFetch(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: newContent.trim() }),
      });
      fetchAllPosts();
    } catch (err) {
      // Falha silenciosa
    }
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
        markAsResolved,
        deletePost,
        editPost,
        refreshPosts: fetchAllPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
