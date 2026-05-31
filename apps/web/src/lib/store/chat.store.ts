'use client';

import { create } from 'zustand';
import { chatApi, type ChatProduct } from '../api/chat';

export type { ChatProduct };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  sessionId: string;
  unreadCount: number;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const newSession = () => `${Date.now()}-${uid()}`;

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! 👋 I'm Luna, MoonLight's AI shopping assistant.\n\nI can help you find the perfect outfit, check sizes & stock, track orders, and more. What are you looking for today?",
  timestamp: Date.now(),
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [WELCOME],
  isOpen: false,
  isTyping: false,
  sessionId: newSession(),
  unreadCount: 0,

  sendMessage: async (content: string) => {
    const { sessionId } = get();

    const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: Date.now() };
    set(s => ({ messages: [...s.messages, userMsg], isTyping: true }));

    try {
      const res = await chatApi.send({ message: content, sessionId });
      const botMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: res.reply,
        products: res.products,
        timestamp: Date.now(),
      };
      set(s => ({
        messages: [...s.messages, botMsg],
        isTyping: false,
        unreadCount: s.isOpen ? 0 : s.unreadCount + 1,
      }));
    } catch {
      const errMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      set(s => ({ messages: [...s.messages, errMsg], isTyping: false }));
    }
  },

  toggleChat: () => set(s => ({ isOpen: !s.isOpen, unreadCount: 0 })),
  openChat:   () => set({ isOpen: true, unreadCount: 0 }),
  closeChat:  () => set({ isOpen: false }),

  clearChat: () => set({
    messages: [{ ...WELCOME, id: 'welcome-' + uid(), timestamp: Date.now() }],
    sessionId: newSession(),
    unreadCount: 0,
  }),
}));
