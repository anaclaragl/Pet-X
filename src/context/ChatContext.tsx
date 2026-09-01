import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isUser: boolean;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

interface ChatContextType {
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  startOrOpenChat: (recipientId: string, userName: string, userAvatar: string) => Promise<string>;
  refreshConversations: () => Promise<void>;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    userName: 'João Silva',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    lastMessage: 'Acho que vi um cachorrinho com a mesma mancha perto da praça às 14h!',
    lastTime: '14:32',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'João Silva',
        text: 'Oi Ana, vi seu post sobre o pet!',
        timestamp: '14:30',
        isUser: false,
      },
      {
        id: 'm2',
        sender: 'Ana Clara',
        text: 'Oi João! Você viu o Rex por aí?',
        timestamp: '14:31',
        isUser: true,
      },
      {
        id: 'm3',
        sender: 'João Silva',
        text: 'Acho que vi um cachorrinho com a mesma mancha perto da praça às 14h!',
        timestamp: '14:32',
        isUser: false,
      },
    ],
  },
  {
    id: '2',
    userName: 'ONG Patinhas',
    userAvatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&q=80',
    lastMessage: 'Olá Ana! Obrigado por apoiar nossa campanha de ração!',
    lastTime: 'Ontem',
    unreadCount: 0,
    messages: [
      {
        id: 'm4',
        sender: 'ONG Patinhas',
        text: 'Olá Ana! Obrigado por apoiar nossa campanha de ração!',
        timestamp: 'Ontem',
        isUser: false,
      },
    ],
  },
];

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  sendMessage: async () => {},
  startOrOpenChat: async () => '',
  refreshConversations: async () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    try {
      const convs = await apiFetch<any[]>('/api/conversations');
      const conversationsWithMessages = await Promise.all(
        convs.map(async (conv) => {
          try {
            const messages = await apiFetch<ChatMessage[]>(`/api/conversations/${conv.id}/messages`);
            return {
              ...conv,
              messages,
            };
          } catch (e) {
            return {
              ...conv,
              messages: [],
            };
          }
        })
      );
      setConversations(conversationsWithMessages);
    } catch (err) {
      // Fallback para mock local se o servidor estiver inacessível
      setConversations(INITIAL_CONVERSATIONS);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Polling a cada 5s
    return () => clearInterval(interval);
  }, [user?.id]);

  const sendMessage = async (conversationId: string, text: string) => {
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const localMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.email || 'Eu',
      text: text.trim(),
      timestamp: timeStr,
      isUser: true,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: text.trim(),
            lastTime: timeStr,
            messages: [...conv.messages, localMsg],
          };
        }
        return conv;
      })
    );

    try {
      await apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      });
      fetchConversations();
    } catch (err) {
      // Falha silenciosa
    }
  };

  const startOrOpenChat = async (recipientId: string, userName: string, userAvatar: string): Promise<string> => {
    try {
      const res = await apiFetch<{ id: string }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientId }),
      });
      await fetchConversations();
      return res.id;
    } catch (err) {
      // Fallback caso sem conexão
      const existing = conversations.find((c) => c.userName.toLowerCase() === userName.toLowerCase());
      if (existing) {
        return existing.id;
      }

      const newId = Date.now().toString();
      const newConv: Conversation = {
        id: newId,
        userName,
        userAvatar,
        lastMessage: 'Iniciou uma conversa',
        lastTime: 'Agora',
        unreadCount: 0,
        messages: [],
      };

      setConversations((prev) => [newConv, ...prev]);
      return newId;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        sendMessage,
        startOrOpenChat,
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
