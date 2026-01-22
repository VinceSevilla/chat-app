# Real-Time Chat Web Application with AI Message Moderation

A production-ready, full-stack real-time chat application with AI-powered message moderation, built with modern web technologies.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **1-on-1 and Group Chats**: Support for both direct and group conversations
- **AI Message Moderation**: Automatic content moderation using OpenAI's Moderation API
  - Blocks toxic/inappropriate content before sending
  - Flags potentially problematic messages
  - Stores moderation logs for analysis
- **User Authentication**: 
  - Email/password authentication
  - Google OAuth integration
  - Secure session management with Supabase Auth
- **Online/Offline Presence**: Real-time user status tracking
- **Persistent Messages**: All messages stored in PostgreSQL via Supabase

### Advanced Features
- **Typing Indicators**: See when other users are typing
- **Read Receipts**: Track message read status
- **Message Search**: Search across all your conversations
- **AI Chat Summaries**: Generate AI-powered conversation summaries
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **Authentication**: Supabase Auth

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.IO Server
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI Moderation API
- **Authentication**: Supabase Auth with JWT

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chat-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Allowed Origins (for CORS)
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL to create all necessary tables, policies, and triggers

### 5. Configure Google OAuth (Optional)

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Add authorized redirect URLs

### 6. Get OpenAI API Key

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new API key
4. Add it to your `.env` file

## 🚀 Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Run Frontend Only

```bash
npm run dev:frontend
```

### Run Backend Only

```bash
npm run dev:backend
```

### Production Build

```bash
# Build frontend
npm run build

# Build backend
npm run build:backend

# Start production server
npm start
```

## 📁 Project Structure

```
chat-app/
├── server/                    # Backend code
│   ├── index.ts              # Express server setup
│   ├── services/             # Business logic
│   │   ├── supabase.service.ts
│   │   └── moderation.service.ts
│   ├── socket/               # Socket.IO handlers
│   │   └── handlers.ts
│   └── types/                # TypeScript types
│       └── index.ts
├── src/                      # Frontend code
│   ├── components/           # React components
│   │   ├── auth/            # Authentication components
│   │   │   ├── LoginModal.tsx
│   │   │   └── SignupModal.tsx
│   │   └── chat/            # Chat components
│   │       ├── Sidebar.tsx
│   │       └── ChatPanel.tsx
│   ├── services/            # API services
│   │   ├── auth.service.ts
│   │   └── socket.service.ts
│   ├── store/               # Zustand state management
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   └── date.ts
│   ├── App.tsx              # Main app component
│   └── main.tsx             # App entry point
├── database/                # Database schema
│   └── schema.sql
└── public/                  # Static assets
```

## 🗄️ Database Schema

### Tables

- **users**: User profiles and online status
- **chats**: Chat rooms (1-on-1 and groups)
- **chat_members**: Chat membership relationships
- **messages**: All chat messages with moderation status
- **moderation_logs**: AI moderation results

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access chats they're members of
- Automatic user profile creation on signup
- Real-time subscriptions enabled

## 🔐 Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Frontend receives JWT access token
3. Token is used to authenticate Socket.IO connection
4. Backend verifies token with Supabase
5. User is connected and can send/receive messages

## 🤖 AI Moderation

### How It Works

1. User types and sends a message
2. Message content is sent to backend via Socket.IO
3. Backend calls OpenAI Moderation API
4. Content is analyzed for:
   - Hate speech
   - Harassment
   - Self-harm content
   - Sexual content
   - Violence
   - Other inappropriate content
5. Based on moderation scores:
   - **Blocked**: High-risk content is rejected (score > 0.8)
   - **Flagged**: Medium-risk content is marked (score > 0.5)
   - **Allowed**: Safe content is delivered normally
6. Moderation results are logged to database
7. Message is saved and broadcast to chat members

### Customization

Modify thresholds in `server/services/moderation.service.ts`:

```typescript
private blockThreshold = 0.8;  // Block messages above this score
private flagThreshold = 0.5;   // Flag messages above this score
```

## 🔄 Real-Time Features

### Socket.IO Events

**Client → Server**:
- `message:send` - Send a new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - Mark message as read
- `chat:create` - Create new chat
- `messages:fetch` - Fetch chat history
- `messages:search` - Search messages
- `chat:summary` - Request AI summary

**Server → Client**:
- `message:new` - New message received
- `message:blocked` - Message was blocked
- `typing:start` - Someone is typing
- `typing:stop` - Someone stopped typing
- `message:read` - Message read by someone
- `chat:new` - New chat created
- `user:status` - User online/offline status

## 🎨 UI Components

### Authentication
- **LoginModal**: Email/password and Google login
- **SignupModal**: User registration with validation

### Chat Interface
- **Sidebar**: Chat list, search, and user menu
- **ChatPanel**: Message display and input
- **NewChatModal**: Create 1-on-1 or group chats

## 🧪 Testing

### Test User Flow

1. Sign up with a new account
2. Create a test chat with yourself (use incognito window)
3. Send messages and observe real-time delivery
4. Test moderation by sending inappropriate content
5. Try typing indicators and read receipts
6. Use search and AI summary features

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Update `ALLOWED_ORIGINS` in backend `.env`
2. Set environment variables in hosting platform
3. Deploy frontend build

### Backend (Railway/Render/Heroku)

1. Add all environment variables
2. Set `NODE_ENV=production`
3. Deploy backend code
4. Update frontend `SOCKET_URL` to point to backend

### Environment Variables for Production

```env
VITE_SUPABASE_URL=<production-supabase-url>
VITE_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-key>
OPENAI_API_KEY=<production-openai-key>
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## 📝 API Endpoints

### REST Endpoints

- `GET /health` - Health check
- `GET /api/users` - Get all users
- `GET /api/chats/:userId` - Get user's chats

### Socket.IO Connection

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: supabaseAccessToken }
});
```

## 🔒 Security Best Practices

- ✅ All passwords hashed by Supabase
- ✅ JWT tokens for authentication
- ✅ Row Level Security on database
- ✅ Input validation and sanitization
- ✅ Rate limiting on API endpoints (recommended)
- ✅ CORS properly configured
- ✅ Environment variables for secrets
- ✅ AI moderation for user content

## 🐛 Troubleshooting

### Socket Connection Issues

- Check if backend is running on port 3001
- Verify CORS settings in `server/index.ts`
- Ensure JWT token is valid

### Database Errors

- Verify Supabase credentials in `.env`
- Check if schema was executed successfully
- Review RLS policies if access denied

### OpenAI Moderation Fails

- Verify API key is correct
- Check OpenAI account has credits
- Review rate limits

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

## 🤝 Contributing

This is an interview-ready project demonstrating:
- Clean architecture patterns
- Type-safe TypeScript code
- Real-time communication
- AI integration
- Modern React patterns
- Production-ready error handling
- Scalable folder structure

## 📄 License

MIT

## 👨‍💻 Author

Built as a demonstration of full-stack development skills with modern technologies.
