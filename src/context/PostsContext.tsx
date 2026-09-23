import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, uploadImageToPostgres } from '@/lib/api';
import { getCurrentCoordinates, reverseGeocode, calculateDistanceKm } from '@/services/location';
import { formatRelativeTime } from '@/utils/date';

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
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  hideExactLocation?: boolean;
  accountType?: string;
  isVerified?: boolean;
}

export interface PostLocation {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  state?: string;
  neighborhood?: string;
  isApproximate?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  user: string;
  avatar: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
  isApproximate?: boolean;
  distanceKm?: number | null;
  type: PostType;
  content: string;
  images?: string[];
  image?: string | null;
  createdAt?: string;
  time: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  comments: Comment[];
  isVerified?: boolean;
  isResolved?: boolean;
}

export interface ActiveLocation {
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  state?: string;
  neighborhood?: string;
  label: string;
  isGps?: boolean;
}

interface PostsContextType {
  posts: Post[];
  userPosts: Post[];
  userProfile: UserProfile;
  activeLocation: ActiveLocation | null;
  searchRadius: number | null;
  setActiveLocation: (loc: ActiveLocation | null) => void;
  setSearchRadius: (radius: number | null) => void;
  requestCurrentLocation: () => Promise<boolean>;
  addPost: (
    content: string, 
    type: PostType, 
    images?: string[] | string | null, 
    locationData?: Partial<PostLocation>
  ) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null; suggestion?: string }>;
  markAsResolved: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editPost: (postId: string, newContent: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const EMPTY_PROFILE: UserProfile = {
  name: '',
  username: '',
  bio: '',
  avatar: '',
  city: '',
  state: '',
};

const PostsContext = createContext<PostsContextType>({
  posts: [],
  userPosts: [],
  userProfile: EMPTY_PROFILE,
  activeLocation: null,
  searchRadius: null,
  setActiveLocation: () => {},
  setSearchRadius: () => {},
  requestCurrentLocation: async () => false,
  addPost: async () => {},
  toggleLike: async () => {},
  addComment: async () => {},
  updateUserProfile: async () => ({ error: null }),
  markAsResolved: async () => {},
  deletePost: async () => {},
  editPost: async () => {},
  refreshPosts: async () => {},
});

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const { profile: authProfile, user, updateProfile: updateAuthProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  const [activeLocation, setActiveLocationState] = useState<ActiveLocation | null>(null);
  const [searchRadius, setSearchRadiusState] = useState<number | null>(null);

  const userProfile: UserProfile = authProfile
    ? {
        name: authProfile.name,
        username: authProfile.username,
        bio: authProfile.bio || '',
        avatar: authProfile.avatarUrl || '',
        city: authProfile.city || '',
        state: authProfile.state || '',
        neighborhood: (authProfile as any).neighborhood || '',
        latitude: (authProfile as any).latitude || null,
        longitude: (authProfile as any).longitude || null,
        hideExactLocation: (authProfile as any).hide_exact_location || false,
        accountType: authProfile.accountType,
        isVerified: authProfile.isVerified,
      }
    : EMPTY_PROFILE;

  // Atualiza a localização inicial caso o perfil do usuário possua cidade cadastrada
  useEffect(() => {
    if (authProfile?.city && (!activeLocation || !activeLocation.isGps)) {
      setActiveLocationState({
        city: authProfile.city,
        state: authProfile.state || '',
        neighborhood: (authProfile as any).neighborhood || '',
        latitude: (authProfile as any).latitude || null,
        longitude: (authProfile as any).longitude || null,
        label: `${authProfile.city}${authProfile.state ? `, ${authProfile.state}` : ''}`,
        isGps: false,
      });
    }
  }, [authProfile?.city, authProfile?.state]);

  const fetchAllPosts = async (customLoc?: ActiveLocation | null, customRadius?: number | null) => {
    const loc = customLoc !== undefined ? customLoc : activeLocation;
    const radius = customRadius !== undefined ? customRadius : searchRadius;

    try {
      let url = '/api/posts';
      const params = new URLSearchParams();

      if (loc?.latitude && loc?.longitude && radius) {
        params.append('lat', loc.latitude.toString());
        params.append('lng', loc.longitude.toString());
        params.append('radius_km', radius.toString());
        if (loc.city) params.append('city', loc.city);
        if (loc.state) params.append('state', loc.state);
      } else if (loc?.latitude && loc?.longitude) {
        params.append('lat', loc.latitude.toString());
        params.append('lng', loc.longitude.toString());
        if (loc.state) params.append('state', loc.state);
      } else {
        if (loc?.city && radius) {
          params.append('city', loc.city);
        }
        if (loc?.state) {
          params.append('state', loc.state);
        }
        if (loc?.city && !loc?.state) {
          params.append('city', loc.city);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const serverPosts = await apiFetch<any[]>(url);
      if (serverPosts && Array.isArray(serverPosts)) {
        const formatted: Post[] = serverPosts.map((item) => ({
          id: item.id,
          userId: item.userId,
          user: item.user || 'Usuário',
          avatar: item.avatar || '',
          city: item.city || '',
          state: item.state || '',
          neighborhood: item.neighborhood || '',
          latitude: item.latitude !== null && item.latitude !== undefined ? Number(item.latitude) : null,
          longitude: item.longitude !== null && item.longitude !== undefined ? Number(item.longitude) : null,
          isApproximate: Boolean(item.isApproximate),
          distanceKm: item.distanceKm !== null && item.distanceKm !== undefined ? Number(item.distanceKm) : null,
          type: item.type as PostType,
          content: item.content,
          images: Array.isArray(item.images) ? item.images : [],
          image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null,
          createdAt: item.createdAt || item.created_at,
          time: item.time && item.time !== 'Recente' ? item.time : formatRelativeTime(item.createdAt || item.created_at),
          likesCount: item.likesCount || 0,
          isLiked: item.isLiked || false,
          commentsCount: item.commentsCount || 0,
          comments: Array.isArray(item.comments) ? item.comments : [],
          isResolved: item.isResolved || false,
        }));
        setPosts(formatted);
      } else {
        setPosts([]);
      }
    } catch (err) {
      setPosts([]);
    }
  };

  useEffect(() => {
    if (!user) {
      setPosts([]);
      return;
    }
    fetchAllPosts();
  }, [user?.id, activeLocation?.latitude, activeLocation?.longitude, activeLocation?.city, searchRadius]);

  const requestCurrentLocation = async (): Promise<boolean> => {
    try {
      const coords = await getCurrentCoordinates();
      if (!coords) return false;

      const address = await reverseGeocode(coords.latitude, coords.longitude);
      const label = address.formattedAddress || `${address.city || 'Minha Localização'}${address.state ? `, ${address.state}` : ''}`;

      const newLoc: ActiveLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: address.city,
        state: address.state,
        neighborhood: address.neighborhood,
        label: label || 'Localização Atual',
        isGps: true,
      };

      setActiveLocationState(newLoc);
      fetchAllPosts(newLoc, searchRadius);
      return true;
    } catch (e) {
      console.warn('Erro ao solicitar localização atual:', e);
      return false;
    }
  };

  const setActiveLocation = (loc: ActiveLocation | null) => {
    setActiveLocationState(loc);
    fetchAllPosts(loc, searchRadius);
  };

  const setSearchRadius = (radius: number | null) => {
    setSearchRadiusState(radius);
    fetchAllPosts(activeLocation, radius);
  };

  const addPost = async (
    content: string, 
    type: PostType, 
    imagesInput?: string[] | string | null,
    locationData?: Partial<PostLocation>
  ) => {
    let imagesList: string[] = [];
    if (Array.isArray(imagesInput)) {
      imagesList = imagesInput.filter(Boolean);
    } else if (typeof imagesInput === 'string' && imagesInput.trim()) {
      imagesList = [imagesInput];
    }

    const postCity = locationData?.city || activeLocation?.city || userProfile.city || '';
    const postState = locationData?.state || activeLocation?.state || userProfile.state || '';
    const postNeighborhood = locationData?.neighborhood || activeLocation?.neighborhood || '';
    const postLat = locationData?.latitude !== undefined ? locationData.latitude : (activeLocation?.latitude || null);
    const postLng = locationData?.longitude !== undefined ? locationData.longitude : (activeLocation?.longitude || null);
    const postApprox = Boolean(locationData?.isApproximate);

    const newPostLocal: Post = {
      id: Date.now().toString(),
      userId: user?.id || '',
      user: userProfile.name,
      avatar: userProfile.avatar,
      city: postCity,
      state: postState,
      neighborhood: postNeighborhood,
      latitude: postLat,
      longitude: postLng,
      isApproximate: postApprox,
      distanceKm: null,
      type,
      content,
      images: imagesList,
      image: imagesList[0] || null,
      createdAt: new Date().toISOString(),
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
          latitude: postLat,
          longitude: postLng,
          city: postCity,
          state: postState,
          neighborhood: postNeighborhood,
          isApproximate: postApprox,
        }),
      });
      fetchAllPosts();
    } catch (err) {
      // Falha silenciosa na sincronização offline
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
    return await updateAuthProfile({
      name: data.name,
      username: data.username,
      bio: data.bio,
      avatarUrl: data.avatar,
      city: data.city,
      state: data.state,
      neighborhood: data.neighborhood,
      latitude: data.latitude,
      longitude: data.longitude,
      hideExactLocation: data.hideExactLocation,
    } as any);
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
        activeLocation,
        searchRadius,
        setActiveLocation,
        setSearchRadius,
        requestCurrentLocation,
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
