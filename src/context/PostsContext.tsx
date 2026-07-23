import React, { createContext, useContext, useState } from 'react';

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
}

interface PostsContextType {
  posts: Post[];
  userPosts: Post[];
  userProfile: UserProfile;
  addPost: (content: string, type: PostType, images?: string[] | string | null) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
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
  addPost: () => {},
  toggleLike: () => {},
  addComment: () => {},
  updateUserProfile: () => {},
});

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

  const addPost = (content: string, type: PostType, imagesInput?: string[] | string | null) => {
    let imagesList: string[] = [];
    if (Array.isArray(imagesInput)) {
      imagesList = imagesInput.filter(Boolean);
    } else if (typeof imagesInput === 'string' && imagesInput.trim()) {
      imagesList = [imagesInput];
    }

    const newPost: Post = {
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
    };
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const toggleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          const likesCount = isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          return { ...post, isLiked, likesCount };
        }
        return post;
      })
    );
  };

  const addComment = (postId: string, content: string) => {
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
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...data };
      
      // Also update author name & avatar on user's posts
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.user === prev.name) {
            return {
              ...post,
              user: updated.name,
              avatar: updated.avatar,
            };
          }
          return post;
        })
      );

      return updated;
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
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
