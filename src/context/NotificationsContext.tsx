import React, { createContext, useContext, useState } from 'react';

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
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
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
    userAvatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&q=80',
    text: 'Novo pet com características similares ao Rex avistado perto do Centro.',
    targetId: '1',
    timestamp: 'Ontem',
    isRead: true,
  },
];

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
