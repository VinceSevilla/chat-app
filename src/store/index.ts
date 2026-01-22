import { create } from 'zustand';
import type { User, Chat, Message } from '../types';
import { authService, supabase } from '../services/auth.service';
import { socketService } from '../services/socket.service';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Array<{ userId: string; userName: string }>>;
  users: User[];
  loading: boolean;
  error: string | null;
  searchResults: Message[];
  chatSummary: string | null;
  setCurrentChat: (chatId: string | null) => void;
  fetchChats: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createChat: (isGroup: boolean, memberIds: string[], name?: string) => void;
  sendMessage: (chatId: string, content: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  markMessageAsRead: (chatId: string, messageId: string) => void;
  searchMessages: (query: string) => void;
  requestChatSummary: (chatId: string) => void;
  updateUserStatus: (userId: string, online: boolean) => void;
  setupSocketListeners: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initAuth: async () => {
    try {
      const session = await authService.getSession();
      
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ user: userData, session, loading: false });

        // Connect to socket with session token
        await socketService.connect(session.access_token);
        
        // Setup socket listeners
        useChatStore.getState().setupSocketListeners();
      } else {
        set({ loading: false });
      }

      // Listen for auth changes
      authService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({ user: userData, session });

          // Connect to socket
          await socketService.connect(session.access_token);
          useChatStore.getState().setupSocketListeners();
        } else if (event === 'SIGNED_OUT') {
          socketService.disconnect();
          set({ user: null, session: null });
          useChatStore.setState({ chats: [], currentChatId: null, messages: {} });
        }
      });
    } catch (error: any) {
      console.error('Auth initialization error:', error);
      set({ error: error.message, loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    try {
      set({ loading: true, error: null });
      await authService.signUp(email, password, fullName);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      await authService.signIn(email, password);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      await authService.signInWithGoogle();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: {},
  typingUsers: {},
  users: [],
  loading: false,
  error: null,
  searchResults: [],
  chatSummary: null,

  setupSocketListeners: () => {
    // New message
    socketService.onNewMessage((message: Message) => {
      const { messages, currentChatId } = get();
      const chatMessages = messages[message.chat_id] || [];
      
      // Remove temp message if exists
      const filteredMessages = chatMessages.filter((m: Message) => m.tempId !== message.tempId);
      
      set({
        messages: {
          ...messages,
          [message.chat_id]: [...filteredMessages, message],
        },
      });

      // Mark as read if current chat
      if (currentChatId === message.chat_id) {
        socketService.markMessageAsRead(message.chat_id, message.id);
      }
    });

    // Message blocked
    socketService.onMessageBlocked((data: { tempId: string; reason: string }) => {
      const { messages } = get();
      // Remove temp message
      Object.keys(messages).forEach(chatId => {
        const filtered = messages[chatId].filter((m: Message) => m.tempId !== data.tempId);
        if (filtered.length !== messages[chatId].length) {
          set({
            messages: { ...messages, [chatId]: filtered },
            error: data.reason,
          });
        }
      });
    });

    // Messages fetched
    socketService.onMessagesFetched((data: { chatId: string; messages: Message[] }) => {
      const { messages } = get();
      set({
        messages: {
          ...messages,
          [data.chatId]: data.messages,
        },
      });
    });

    // Typing indicators
    socketService.onTypingStart((data: { chatId: string; userId: string; userName: string }) => {
      const { typingUsers } = get();
      const chatTyping = typingUsers[data.chatId] || [];
      
      if (!chatTyping.find((u: { userId: string; userName: string }) => u.userId === data.userId)) {
        set({
          typingUsers: {
            ...typingUsers,
            [data.chatId]: [...chatTyping, { userId: data.userId, userName: data.userName }],
          },
        });
      }
    });

    socketService.onTypingStop((data: { chatId: string; userId: string }) => {
      const { typingUsers } = get();
      const chatTyping = (typingUsers[data.chatId] || []).filter((u: { userId: string; userName: string }) => u.userId !== data.userId);
      
      set({
        typingUsers: {
          ...typingUsers,
          [data.chatId]: chatTyping,
        },
      });
    });

    // Read receipts
    socketService.onMessageRead((data: { messageId: string; userId: string }) => {
      const { messages } = get();
      
      Object.keys(messages).forEach(chatId => {
        const chatMessages = messages[chatId].map((msg: Message) => {
          if (msg.id === data.messageId) {
            const readBy = msg.read_by || [];
            if (!readBy.includes(data.userId)) {
              return { ...msg, read_by: [...readBy, data.userId] };
            }
          }
          return msg;
        });
        
        set({ messages: { ...messages, [chatId]: chatMessages } });
      });
    });

    // New chat
    socketService.onNewChat((chat: Chat) => {
      const { chats } = get();
      set({ chats: [...chats, chat] });
      socketService.fetchMessages(chat.id);
    });

    socketService.onChatCreated((chat: Chat) => {
      const { chats } = get();
      set({ chats: [...chats, chat], currentChatId: chat.id });
      socketService.fetchMessages(chat.id);
    });

    // User status
    socketService.onUserStatus((data: { userId: string; online: boolean }) => {
      get().updateUserStatus(data.userId, data.online);
    });

    // Search results
    socketService.onSearchResults((data: { results: Message[] }) => {
      set({ searchResults: data.results });
    });

    // Chat summary
    socketService.onChatSummary((data: { chatId: string; summary: string }) => {
      set({ chatSummary: data.summary });
    });
  },

  setCurrentChat: (chatId: string | null) => {
    set({ currentChatId: chatId });
    if (chatId) {
      socketService.fetchMessages(chatId);
    }
  },

  fetchChats: async () => {
    try {
      set({ loading: true });
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;

      const response = await fetch(`http://localhost:3001/api/chats/${userId}`);
      const chats = await response.json();
      
      set({ chats, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUsers: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const users = await response.json();
      set({ users });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createChat: (isGroup: boolean, memberIds: string[], name?: string) => {
    socketService.createChat(isGroup, memberIds, name);
  },

  sendMessage: (chatId: string, content: string) => {
    const tempId = `temp-${Date.now()}`;
    const userId = useAuthStore.getState().user?.id;
    
    if (!userId) return;

    // Add optimistic message
    const { messages } = get();
    const tempMessage: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: userId,
      content,
      is_flagged: false,
      is_blocked: false,
      created_at: new Date().toISOString(),
      tempId,
      sender: useAuthStore.getState().user!,
    };

    set({
      messages: {
        ...messages,
        [chatId]: [...(messages[chatId] || []), tempMessage],
      },
    });

    socketService.sendMessage(chatId, content, tempId);
  },

  startTyping: (chatId: string) => {
    socketService.startTyping(chatId);
  },

  stopTyping: (chatId: string) => {
    socketService.stopTyping(chatId);
  },

  markMessageAsRead: (chatId: string, messageId: string) => {
    socketService.markMessageAsRead(chatId, messageId);
  },

  searchMessages: (query: string) => {
    set({ searchResults: [] });
    socketService.searchMessages(query);
  },

  requestChatSummary: (chatId: string) => {
    set({ chatSummary: null });
    socketService.requestChatSummary(chatId);
  },

  updateUserStatus: (userId: string, online: boolean) => {
    const { users, chats } = get();
    
    // Update users list
    const updatedUsers = users.map((user: User) =>
      user.id === userId ? { ...user, online } : user
    );

    // Update chat members
    const updatedChats = chats.map((chat: Chat) => ({
      ...chat,
      members: chat.members?.map((member: User) =>
        member.id === userId ? { ...member, online } : member
      ),
    }));

    set({ users: updatedUsers, chats: updatedChats });
  },
}));
