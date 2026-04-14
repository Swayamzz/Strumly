# Strumly – Musician Collaboration Platform

A full-stack web application for musicians to connect, collaborate, share content, form bands, buy and sell instruments, and generate AI-assisted song lyrics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express v5 |
| Database | PostgreSQL 16 + Prisma ORM |
| Authentication | JWT + bcrypt |
| Real-time | Socket.io |
| AI | Groq API (llama-3.1-8b-instant) |
| Frontend | React 19 + Vite + Tailwind CSS |

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 16
- A Groq API key (free at console.groq.com)

### Backend Setup

```bash
cd strumly-backend
npm install
cp .env.example .env        # fill in your values
npx prisma migrate dev      # apply database schema
node server.js              # starts on http://localhost:5000
```

### Frontend Setup

```bash
cd strumly-frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

## Features

- JWT authentication with bcrypt password hashing
- Social feed with posts, likes, comments, and stories
- Follow / unfollow system with request approval
- Real-time direct messaging (Socket.io)
- Band creation and membership management
- Instrument marketplace with image uploads
- AI Lyrics Generator powered by Groq API
- Notification system for social interactions
- Admin panel with user management
- Password reset via Gmail SMTP

## API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login and receive JWT |
| GET | /posts/feed | Get social feed |
| POST | /posts | Create a post |
| POST | /lyrics/generate | Generate AI lyrics |
| GET | /notifications | Get notifications |
| GET | /admin/stats | Admin dashboard stats |

## Environment Variables

See `.env.example` for all required variables.
