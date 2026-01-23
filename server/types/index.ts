export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  online: boolean;
  last_seen: string;
  created_at: string;
}

export interface Chat {
  id: string;
  name?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_flagged: boolean;
  is_blocked: boolean;
  created_at: string;
  status: 'sent' | 'delivered' | 'seen';
  delivered_to?: string[];
  read_by?: string[];
}

export interface ModerationLog {
  id: string;
  message_id: string;
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
  created_at: string;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  online: boolean;
}

export interface TypingData {
  chatId: string;
  userId: string;
  userName: string;
}

export interface MessageData {
  chatId: string;
  content: string;
  tempId?: string;
}

export interface ReadReceiptData {
  chatId: string;
  messageId: string;
}

export interface MessageStatusData {
  chatId: string;
  messageId: string;
  userId: string;
  status: 'delivered' | 'seen';
}
