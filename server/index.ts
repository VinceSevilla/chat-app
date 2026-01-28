console.log('=== SERVER STARTING ===');

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('Imports loaded');

dotenv.config();

console.log('Environment loaded, PORT:', process.env.PORT);

try {
  const { setupSocketHandlers } = await import('./socket/handlers.js');
  const { SupabaseService } = await import('./services/supabase.service.js');

  console.log('Services imported successfully');


dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']).map(origin => origin.trim());

console.log('Allowed origins:', allowedOrigins);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    console.log('CORS check for origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors(corsOptions));
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

  const PORT = parseInt(process.env.PORT || '3001', 10);

  console.log(`Attempting to start server on port ${PORT}`);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server ready`);
  });
} catch (error) {
  console.error('=== FATAL ERROR ===');
  console.error(error);
  process.exit(1);
}
