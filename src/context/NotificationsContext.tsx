import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export type NotificationType = 'like' | 'comment' | 'message' | 'alert';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  user: string;
  userAvatar: string;
  text: string;
  targetId?: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'comment',
    user: 'João Silva',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    text: 'comentou no seu post: "Acho que vi um cachorrinho muito parecido..."',
    targetId: '1',
    timestamp: '1h',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'like',
    user: 'ONG Patinhas',
    userAvatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&q=80',
    text: 'curtiu a sua publicação.',
    targetId: '1',
    timestamp: '3h',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'message',
    user: 'João Silva',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    text: 'enviou uma nova mensagem direta.',
    targetId: '1',
    timestamp: '14:32',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'alert',
    user: 'Alerta Pet-X',
    userAvatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80',
    text: 'Novo pet com características similares ao Rex avistado perto do Centro.',
    targetId: '1',
    timestamp: 'Ontem',
    isRead: true,
  },
];

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const data = await apiFetch<NotificationItem[]>('/api/notifications');
      setNotifications(data);
    } catch (err) {
      // Fallback para dados locais fictícios se offline
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Polling a cada 5s
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      // Falha silenciosa
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      // Falha silenciosa
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
