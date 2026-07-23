import React, { createContext, useContext, useState } from 'react';

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
  sendMessage: (conversationId: string, text: string) => void;
  startOrOpenChat: (userName: string, userAvatar: string) => string;
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
  sendMessage: () => {},
  startOrOpenChat: () => '',
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  const sendMessage = (conversationId: string, text: string) => {
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'Ana Clara',
            text: text.trim(),
            timestamp: timeStr,
            isUser: true,
          };
          return {
            ...conv,
            lastMessage: text.trim(),
            lastTime: timeStr,
            unreadCount: 0,
            messages: [...conv.messages, newMessage],
          };
        }
        return conv;
      })
    );
  };

  const startOrOpenChat = (userName: string, userAvatar: string): string => {
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
  };

  return (
    <ChatContext.Provider value={{ conversations, sendMessage, startOrOpenChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
