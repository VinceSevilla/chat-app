import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class SupabaseService {
  // User operations
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserOnlineStatus(userId: string, online: boolean) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        online, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (error) throw error;
    return data;
  }

  // Chat operations
  async createChat(isGroup: boolean, createdBy: string, name?: string) {
    const { data, error } = await supabase
      .from('chats')
      .insert({ is_group: isGroup, created_by: createdBy, name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserChats(userId: string) {
    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        chats (
          id,
          name,
          is_group,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map((item: any) => item.chats).flat();
  }

  async getChatMembers(chatId: string) {
    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        user_id,
        users (
          id,
          email,
          full_name,
          avatar_url,
          online,
          last_seen
        )
      `)
      .eq('chat_id', chatId);

    if (error) throw error;
    return data.map(item => item.users);
  }

  async addChatMember(chatId: string, userId: string) {
    const { data, error } = await supabase
      .from('chat_members')
      .insert({ chat_id: chatId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrCreateDirectChat(user1Id: string, user2Id: string) {
    // Check if a direct chat already exists between these users
    const { data: existingChats, error: fetchError } = await supabase
      .from('chat_members')
      .select('chat_id, chats!inner(id, is_group)')
      .eq('user_id', user1Id);

    if (fetchError) throw fetchError;

    for (const chatMember of existingChats as any[]) {
      const chat = Array.isArray(chatMember.chats) ? chatMember.chats[0] : chatMember.chats;
      if (!chat.is_group) {
        const { data: members, error: membersError } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chatMember.chat_id);

        if (membersError) throw membersError;

        const memberIds = members.map((m: any) => m.user_id);
        if (memberIds.includes(user2Id) && memberIds.length === 2) {
          const { data: fullChat, error: chatError } = await supabase
            .from('chats')
            .select('*')
            .eq('id', chatMember.chat_id)
            .single();

          if (chatError) throw chatError;
          return fullChat;
        }
      }
    }

    // Create new direct chat
    const chat = await this.createChat(false, user1Id);
    await this.addChatMember(chat.id, user1Id);
    await this.addChatMember(chat.id, user2Id);

    return chat;
  }

  // Message operations
  async createMessage(chatId: string, senderId: string, content: string, isFlagged: boolean, isBlocked: boolean) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content,
        is_flagged: isFlagged,
        is_blocked: isBlocked,
      })
      .select()
      .single();

    if (error) throw error;

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return data;
  }

  async getChatMessages(chatId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.reverse();
  }

  async updateMessageReadBy(messageId: string, userId: string) {
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('read_by')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    const readBy = message.read_by || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ read_by: readBy })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLastReadAt(chatId: string, userId: string) {
    const { data, error } = await supabase
      .from('chat_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchMessages(userId: string, query: string) {
    // Get user's chats
    const userChats = await this.getUserChats(userId);
    const chatIds = userChats.map((chat: any) => chat.id);

    if (chatIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        chat:chats (
          id,
          name,
          is_group
        )
      `)
      .in('chat_id', chatIds)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }

  // Moderation operations
  async createModerationLog(messageId: string, flagged: boolean, categories: Record<string, boolean>, categoryScores: Record<string, number>) {
    const { data, error } = await supabase
      .from('moderation_logs')
      .insert({
        message_id: messageId,
        flagged,
        categories,
        category_scores: categoryScores,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
