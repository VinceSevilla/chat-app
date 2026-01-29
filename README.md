# Chat App

A modern, full-stack chat application built with React, TypeScript, and Express. Features real-time messaging, AI-powered content moderation, and user authentication.

## Features

- **Real-time Chat**: Socket.io powered instant messaging
- **User Authentication**: Secure sign-up and login with JWT
- **AI Moderation**: Content safety checks using Hugging Face API
- **AI Integration**: OpenAI chat capabilities
- **User Profiles**: Manage user information and authentication
- **Type-Safe**: Full TypeScript implementation across frontend and backend
- **Responsive Design**: Tailwind CSS for modern UI

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Zustand (state management)
- Socket.io Client
- Tailwind CSS

**Backend:**
- Express.js
- Socket.io
- Supabase (database)
- JWT (authentication)
- Hugging Face API
- OpenAI API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Environment variables configured (see `.env`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
- Frontend: `npm run dev:frontend` (Vite dev server)
- Backend: `npm run dev:backend` (Express with auto-reload)

### Build

```bash
npm run build
```

This compiles TypeScript and builds the frontend with Vite.

### Production

Build the project and start the server:
```bash
npm run build
npm start
```

## Project Structure

```
├── src/                    # Frontend (React)
│   ├── components/        # React components
│   ├── services/          # API and socket services
│   ├── store/             # Zustand state
│   └── types/             # TypeScript types
├── server/                # Backend (Express)
│   ├── services/          # Business logic
│   ├── socket/            # Socket.io handlers
│   └── types/             # Shared types
└── public/                # Static assets
```

## Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run dev:frontend` - Start frontend dev server only
- `npm run dev:backend` - Start backend dev server with auto-reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the project root with the necessary configuration variables for:
- Supabase credentials
- OpenAI API key
- Hugging Face API key
- JWT secret
- Server port

## License

Proprietary
