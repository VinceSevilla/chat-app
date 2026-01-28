import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket/handlers.js';
import { SupabaseService } from './services/supabase.service.js';

dotenv.config();

console.log('=== SERVER INITIALIZATION START ===');
console.log('Environment variables check:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
console.log('PORT:', process.env.PORT || 'DEFAULT (3001)');

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']).map(origin => origin.trim());

console.log('Allowed origins:', allowedOrigins);

// CORS configuration
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Middleware
// Manual CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(express.json());

let supabaseService: SupabaseService;

try {
  supabaseService = new SupabaseService();
  console.log('SupabaseService initialized successfully');
} catch (error) {
  console.error('Failed to initialize SupabaseService:', error);
  // Continue anyway - health endpoint will still work
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all users endpoint
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({ error: 'Service unavailable' });
    }
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
    if (!supabaseService) {
      return res.status(503).json({ error: 'Service unavailable' });
    }
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

// Catch-all for unhandled routes (debugging)
app.use((req: Request, res: Response) => {
  console.log(`Unhandled request: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

  const PORT = parseInt(process.env.PORT || '3001', 10);

  console.log(`Attempting to start server on port ${PORT}`);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server ready`);
    console.log('=== SERVER INITIALIZATION COMPLETE ===');
  });
