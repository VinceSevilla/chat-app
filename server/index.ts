import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/handlers';
import { SupabaseService } from './services/supabase.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

const supabaseService = new SupabaseService();

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all users endpoint
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await supabaseService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user's chats endpoint
app.get('/api/chats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const chats = await supabaseService.getUserChats(userId);
    
    // Enrich chats with member information
    const enrichedChats = await Promise.all(
      chats.map(async (chat: any) => {
        const members = await supabaseService.getChatMembers(chat.id);
        return { ...chat, members };
      })
    );
    
    res.json(enrichedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});
