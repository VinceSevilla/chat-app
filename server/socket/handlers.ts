import { Server, Socket } from 'socket.io';
import { supabase } from '../services/supabase.service';
import { SupabaseService } from '../services/supabase.service';
import { ModerationService } from '../services/moderation.service';
import { MessageData, TypingData, ReadReceiptData } from '../types';

const supabaseService = new SupabaseService();
const moderationService = new ModerationService();

// Track online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const setupSocketHandlers = (io: Server) => {
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify Supabase JWT token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return next(new Error('Authentication error'));
      }

      socket.data.userId = user.id;
      
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    
    console.log(`User connected: ${userId}`);

    // Add user to online users
    onlineUsers.set(userId, socket.id);

    // Update user's online status in database
    try {
      await supabaseService.updateUserOnlineStatus(userId, true);
      
      // Broadcast user online status to all clients
      io.emit('user:status', { userId, online: true });
    } catch (error) {
      console.error('Error updating user status:', error);
    }

    // Join user's chat rooms
    try {
      const userChats = await supabaseService.getUserChats(userId);
      userChats.forEach((chat: any) => {
        socket.join(`chat:${chat.id}`);
      });
    } catch (error) {
      console.error('Error joining chat rooms:', error);
    }

    // Handle sending messages
    socket.on('message:send', async (data: MessageData) => {
      try {
        const { chatId, content, tempId } = data;

        // Moderate the message
        const moderationResult = await moderationService.moderateMessage(content);

        if (moderationResult.blocked) {
          // Notify sender that message was blocked
          socket.emit('message:blocked', {
            tempId,
            reason: 'Message contains inappropriate content',
          });
          return;
        }

        // Save message to database
        const message = await supabaseService.createMessage(
          chatId,
          userId,
          content,
          moderationResult.flagged,
          moderationResult.blocked
        );

        // Save moderation log
        await supabaseService.createModerationLog(
          message.id,
          moderationResult.flagged,
          moderationResult.categories,
          moderationResult.categoryScores
        );

        // Get sender info
        const sender = await supabaseService.getUserById(userId);

        // Emit message to all users in the chat room
        io.to(`chat:${chatId}`).emit('message:new', {
          ...message,
          sender,
          tempId,
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', {
          tempId: data.tempId,
          error: 'Failed to send message',
        });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', async (data: TypingData) => {
      try {
        const user = await supabaseService.getUserById(userId);
        socket.to(`chat:${data.chatId}`).emit('typing:start', {
          chatId: data.chatId,
          userId,
          userName: user.full_name,
        });
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing:stop', (data: TypingData) => {
      socket.to(`chat:${data.chatId}`).emit('typing:stop', {
        chatId: data.chatId,
        userId,
      });
    });

    // Handle read receipts
    socket.on('message:read', async (data: ReadReceiptData) => {
      try {
        const { chatId, messageId } = data;
        
        await supabaseService.updateMessageReadBy(messageId, userId);
        await supabaseService.updateLastReadAt(chatId, userId);

        // Notify other users in the chat
        socket.to(`chat:${chatId}`).emit('message:read', {
          messageId,
          userId,
        });
      } catch (error) {
        console.error('Error handling read receipt:', error);
      }
    });

    // Handle creating new chats
    socket.on('chat:create', async (data: { isGroup: boolean; name?: string; memberIds: string[] }) => {
      try {
        const { isGroup, name, memberIds } = data;

        // For direct chats, check if chat already exists
        if (!isGroup && memberIds.length === 1) {
          const chat = await supabaseService.getOrCreateDirectChat(userId, memberIds[0]);
          
          // Join the room
          socket.join(`chat:${chat.id}`);
          
          // Get chat details with members
          const members = await supabaseService.getChatMembers(chat.id);
          
          socket.emit('chat:created', { ...chat, members });
          
          // Notify other user
          const otherUserSocketId = onlineUsers.get(memberIds[0]);
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit('chat:new', { ...chat, members });
            io.to(otherUserSocketId).socketsJoin(`chat:${chat.id}`);
          }
          
          return;
        }

        // Create group chat
        const chat = await supabaseService.createChat(isGroup, userId, name);

        // Add creator
        await supabaseService.addChatMember(chat.id, userId);

        // Add other members
        for (const memberId of memberIds) {
          await supabaseService.addChatMember(chat.id, memberId);
        }

        // Get chat details with members
        const members = await supabaseService.getChatMembers(chat.id);

        // All members join the room
        socket.join(`chat:${chat.id}`);
        
        for (const memberId of memberIds) {
          const memberSocketId = onlineUsers.get(memberId);
          if (memberSocketId) {
            io.to(memberSocketId).socketsJoin(`chat:${chat.id}`);
          }
        }

        // Notify all members
        io.to(`chat:${chat.id}`).emit('chat:new', { ...chat, members });
      } catch (error) {
        console.error('Error creating chat:', error);
        socket.emit('chat:error', { error: 'Failed to create chat' });
      }
    });

    // Handle getting chat messages
    socket.on('messages:fetch', async (data: { chatId: string; limit?: number; offset?: number }) => {
      try {
        const { chatId, limit, offset } = data;
        const messages = await supabaseService.getChatMessages(chatId, limit, offset);
        
        socket.emit('messages:fetched', { chatId, messages });
      } catch (error) {
        console.error('Error fetching messages:', error);
        socket.emit('messages:error', { error: 'Failed to fetch messages' });
      }
    });

    // Handle chat summary request
    socket.on('chat:summary', async (data: { chatId: string }) => {
      try {
        const messages = await supabaseService.getChatMessages(data.chatId, 50);
        
        const formattedMessages = messages.map(msg => ({
          sender_name: msg.sender.full_name,
          content: msg.content,
        }));

        const summary = await moderationService.generateChatSummary(formattedMessages);
        
        socket.emit('chat:summary', { chatId: data.chatId, summary });
      } catch (error) {
        console.error('Error generating summary:', error);
        socket.emit('chat:summary:error', { error: 'Failed to generate summary' });
      }
    });

    // Handle message search
    socket.on('messages:search', async (data: { query: string }) => {
      try {
        const results = await supabaseService.searchMessages(userId, data.query);
        socket.emit('messages:search:results', { results });
      } catch (error) {
        console.error('Error searching messages:', error);
        socket.emit('messages:search:error', { error: 'Failed to search messages' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      
      onlineUsers.delete(userId);

      try {
        await supabaseService.updateUserOnlineStatus(userId, false);
        
        // Broadcast user offline status to all clients
        io.emit('user:status', { userId, online: false });
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    });
  });
};
