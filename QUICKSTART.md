# Quick Start Guide

## Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

## Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create .env file**
   ```bash
   cp .env.example .env
   ```
   Then fill in your credentials:
   - Supabase URL and keys (from supabase.com/dashboard/project/_/settings/api)
   - OpenAI API key (from platform.openai.com/api-keys)

3. **Set up database**
   - Go to Supabase SQL Editor
   - Run the SQL from `database/schema.sql`

4. **Run the application**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## First Time Usage

1. Click "Sign Up" and create an account
2. Open an incognito window and create another account
3. Start a chat between the two accounts
4. Test all features:
   - Real-time messaging
   - Typing indicators
   - Message search
   - AI summary
   - AI moderation (try sending inappropriate content)

## Common Issues

### Socket not connecting?
- Check if backend is running on port 3001
- Verify CORS settings allow localhost:5173

### Database errors?
- Make sure you ran the schema.sql file
- Check Supabase credentials in .env

### OpenAI errors?
- Verify API key is correct
- Check you have credits in your OpenAI account

## Architecture Overview

```
Frontend (React + Vite)
    ↓
Socket.IO Client ←→ Socket.IO Server (Express)
                         ↓
                    Supabase (PostgreSQL)
                         ↓
                    OpenAI Moderation API
```

## Key Technologies

- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, Socket.IO, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (JWT + OAuth)
- **AI**: OpenAI Moderation API

## Features Implemented

✅ Real-time messaging (Socket.IO)
✅ 1-on-1 and group chats
✅ AI message moderation
✅ Email/password authentication
✅ Google OAuth login
✅ Online/offline presence
✅ Typing indicators
✅ Read receipts
✅ Message search
✅ AI chat summaries
✅ Responsive design

## Next Steps

- Deploy to production (see DOCUMENTATION.md)
- Add more AI features
- Implement file uploads
- Add voice/video calls
- Create mobile apps

For detailed documentation, see DOCUMENTATION.md
