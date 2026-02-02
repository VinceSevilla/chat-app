import { io, Socket } from 'socket.io-client';
import type { Message, Chat } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to server'));
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Message events
  sendMessage(chatId: string, content: string, tempId: string) {
    this.socket?.emit('message:send', { chatId, content, tempId });
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onMessageBlocked(callback: (data: { tempId: string; reason: string }) => void) {
    this.socket?.on('message:blocked', callback);
  }

  onMessageError(callback: (data: { tempId: string; error: string }) => void) {
    this.socket?.on('message:error', callback);
  }

  fetchMessages(chatId: string, limit = 50, offset = 0) {
    this.socket?.emit('messages:fetch', { chatId, limit, offset });
  }

  onMessagesFetched(callback: (data: { chatId: string; messages: Message[] }) => void) {
    this.socket?.on('messages:fetched', callback);
  }

  // Typing events
  startTyping(chatId: string) {
    this.socket?.emit('typing:start', { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit('typing:stop', { chatId });
  }

  onTypingStart(callback: (data: { chatId: string; userId: string; userName: string }) => void) {
    this.socket?.on('typing:start', callback);
  }

  onTypingStop(callback: (data: { chatId: string; userId: string }) => void) {
    this.socket?.on('typing:stop', callback);
  }

  // Read receipts
  markMessageAsRead(chatId: string, messageId: string) {
    this.socket?.emit('message:read', { chatId, messageId });
  }

  onMessageRead(callback: (data: { messageId: string; userId: string }) => void) {
    this.socket?.on('message:read', callback);
  }

  // Message delivery and seen
  markMessageDelivered(chatId: string, messageId: string) {
    this.socket?.emit('message:delivered', { chatId, messageId });
  }

  markMessagesAsSeen(chatId: string, messageIds: string[]) {
    this.socket?.emit('message:seen', { chatId, messageIds });
  }

  onMessageDelivered(callback: (data: { messageId: string; userId: string }) => void) {
    this.socket?.on('message:delivered', callback);
  }

  onMessagesSeen(callback: (data: { messageIds: string[]; userId: string }) => void) {
    this.socket?.on('messages:seen', callback);
  }

  // Chat events
  createChat(isGroup: boolean, memberIds: string[], name?: string) {
    this.socket?.emit('chat:create', { isGroup, memberIds, name });
  }

  onChatCreated(callback: (chat: Chat) => void) {
    this.socket?.on('chat:created', callback);
  }

  onNewChat(callback: (chat: Chat) => void) {
    this.socket?.on('chat:new', callback);
  }

  onChatError(callback: (error: { error: string }) => void) {
    this.socket?.on('chat:error', callback);
  }


  // User presence
  onUserStatus(callback: (data: { userId: string; online: boolean }) => void) {
    this.socket?.on('user:status', callback);
  }

  // Message search
  searchMessages(query: string) {
    this.socket?.emit('messages:search', { query });
  }

  onSearchResults(callback: (data: { results: Message[] }) => void) {
    this.socket?.on('messages:search:results', callback);
  }

  onSearchError(callback: (error: { error: string }) => void) {
    this.socket?.on('messages:search:error', callback);
  }

  // Chat summary
  requestChatSummary(chatId: string) {
    this.socket?.emit('chat:summary', { chatId });
  }

  onChatSummary(callback: (data: { chatId: string; summary: string }) => void) {
    this.socket?.on('chat:summary', callback);
  }

  onChatSummaryError(callback: (error: { error: string }) => void) {
    this.socket?.on('chat:summary:error', callback);
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();
