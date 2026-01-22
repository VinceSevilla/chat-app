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
  members?: User[];
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_flagged: boolean;
  is_blocked: boolean;
  created_at: string;
  read_by?: string[];
  sender?: User;
  tempId?: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
  };
}
