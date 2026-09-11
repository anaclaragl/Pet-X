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
      if (Array.isArray(convs)) {
        const conversationsWithMessages = await Promise.all(
          convs.map(async (conv) => {
            try {
              const messages = await apiFetch<ChatMessage[]>(`/api/conversations/${conv.id}/messages`);
              return {
                ...conv,
                messages: Array.isArray(messages) ? messages : [],
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
      } else {
        setConversations([]);
      }
    } catch (err) {
      setConversations([]);
    }
  };

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
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
