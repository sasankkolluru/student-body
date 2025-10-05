# Student Body Portal — Comprehensive Overview

## 1) Summary
A full‑stack college portal that centralizes student bodies, events, achievements, voting, ideas, gallery, news & live scores, messaging/feedback, and a real‑time chatbot.

- **Frontend**: React + TypeScript + Vite + Tailwind (`project/src/`)
- **Backend**: Node.js + Express + Socket.IO + Mongoose (`project/server/src/`)
- **Database**: MongoDB (local; visible in Compass)
- **Realtime**: WebSockets via Socket.IO
- **Chatbot**: Node NLP primary, optional Rasa fallback
- **Email**: Nodemailer SMTP (best‑effort notifications)

## 2) High‑Level Architecture
- `src/` (frontend SPA)
  - Global providers: `AuthProvider`, `PollProvider` in `src/contexts/`
  - App shell & routes: `src/App.tsx`
  - Chat widget: `src/components/chat/ChatInterface.tsx`
  - REST + Mock layer: `src/lib/api.ts`
- `server/src/` (backend API + websockets)
  - Entry: `server/src/index.ts` (Express + Socket.IO, `/api/*`, `/api/health`)
  - DB: `server/src/lib/db.ts` (connects to `MONGO_URI`, optional in‑memory)
  - Sockets: `server/src/sockets/chat.socket.ts`
  - Chatbot service: `server/src/services/chatbot.service.ts`
  - Routes: `server/src/routes/*.routes.ts` (auth, polls, messages, events, gallery, me, etc.)
  - Models: `server/src/models/*.ts`
- Rasa (optional): `project/rasa/` and `project/rasa-chatbot/`

## 3) Feature‑by‑Feature with Tech Stack

- **[Authentication]**
  - UI: `src/pages/Login.tsx`, `src/pages/Register.tsx`, context in `src/contexts/AuthContext.tsx`.
  - Backend: `server/src/routes/auth.routes.ts`, JWT via `jsonwebtoken`.
  - DB: Users in MongoDB via `mongoose`.
  - Tech: React Hook Form/UI, Express, JWT, Mongoose.

- **[Student Bodies & Councils]**
  - UI: `src/pages/Councils.tsx`, `src/pages/CouncilDetail.tsx`.
  - Tech: React Router, Tailwind.

- **[Events]**
  - UI: `src/pages/Events.tsx`.
  - Backend: `server/src/routes/events.routes.ts` (includes `/api/events/upcoming`, websocket push via `events:updated`).
  - Tech: React, Express, Socket.IO.

- **[Gallery]**
  - UI: `src/pages/Gallery.tsx`.
  - Backend: `server/src/routes/gallery.routes.ts` (file upload with `multer`, served from `/uploads/gallery`).
  - Storage: Local filesystem `server/uploads/gallery/`.
  - Tech: React, Express, Multer, Static hosting.

- **[News & Live Scores]**
  - UI: `src/pages/NewsAndScores.tsx`.
  - Backend: `server/src/routes/live.routes.ts` (news/matches), plus mock helpers in `src/lib/api.ts`.
  - Realtime match events (e.g., cricket/hockey/kabaddi) with specific endpoints.
  - Tech: React, Express, optional Socket.IO triggers, Mock fallbacks.

- **[Achievements]**
  - UI: `src/pages/Achievements.tsx`, profile view `src/pages/Profile.tsx`.
  - Backend: `server/src/routes/achievements.routes.ts`, `server/src/routes/me.routes.ts`.
  - DB: MongoDB collections for achievements and user data.
  - Tech: React, Express, Mongoose.

- **[Voting / Polls]**
  - UI: `src/pages/Voting.tsx`, Admin polls `src/pages/admin/PollsAdmin.tsx`.
  - Backend: `server/src/routes/polls.routes.ts`.
  - Tech: React, Express, Mongoose; localStorage‑backed mocks in `src/lib/api.ts` when mock mode.

- **[Ideas / Registrations]**
  - UI: `src/pages/Ideas.tsx` (generic forms).
  - Backend: `server/src/routes/registrations.routes.ts`.
  - Tech: React, Express, Mongoose.

- **[Messaging / Feedback + Email]**
  - UI: `src/pages/Messages.tsx`, admin view `src/pages/admin/MessagesAdmin.tsx`.
  - Backend: `server/src/routes/messages.routes.ts`
    - Creates MongoDB record and emits `messages:new`.
    - Email: Nodemailer SMTP using `SMTP_*` env vars (no SendGrid required), best‑effort.
  - Tech: React, Express, Mongoose, Nodemailer, Socket.IO.

- **[Chatbot]**
  - Frontend widget: `src/components/chat/ChatInterface.tsx`.
    - WebSocket connection (green dot) to `http://localhost:4000/socket.io/` (host from `VITE_SOCKET_HOST`).
    - Local instant replies for campus info; server fallback for richer responses.
  - Backend sockets: `server/src/sockets/chat.socket.ts` (handles `user_join`, `user_message`, `bot_message`, typing, connection test).
  - NLP: `server/src/services/chatbot.service.ts` (Node NLP primary). Optional Rasa via `rasa/` and `rasa-chatbot/`.
  - Tech: React, Socket.IO (client/server), Node NLP, optional Rasa.

## 4) Environment & Configuration

- **Frontend (`project/.env`)**
  - `VITE_API_BASE` (e.g., `http://localhost:4000/api`)
  - `VITE_SOCKET_HOST` (e.g., `http://localhost:4000`)
  - `VITE_USE_MOCK` (`false` for real API; `true` to force mock REST in `src/lib/api.ts`)

- **Backend (`project/server/.env`)**
  - `PORT=4000`
  - `MONGO_URI=mongodb://127.0.0.1:27017/studentbdy`
  - `USE_IN_MEMORY_DB=false` (enforce real MongoDB)
  - `ALLOW_MEMORY_FALLBACK=false` (optional, default false)
  - `JWT_SECRET=change_this_secret`
  - Email (choose SMTP):
    - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
    - `EMAIL_FROM`, `FEEDBACK_EMAIL_TO`

## 5) Running Locally

1. MongoDB
   - Start Windows service “MongoDB” and connect in Compass to `mongodb://127.0.0.1:27017`.
2. Backend
   - `cd server && npm install`
   - Development: `npm run dev` (ts-node-dev)
   - Production: `npm run build && node dist/index.js`
   - Health: `GET http://localhost:4000/api/health`
3. Frontend
   - `npm install`
   - `npm run dev` → open Vite URL (e.g., `http://localhost:5173`)
4. Chatbot
   - Open the app and click the chat bubble. The header dot turns green when Socket.IO connects.

## 6) Data & Persistence
- MongoDB via Mongoose models under `server/src/models/`.
- In mock mode (`VITE_USE_MOCK=true`), REST calls use localStorage mocks (no DB writes) — implemented in `src/lib/api.ts`.
- File uploads stored under `server/uploads/` and served at `/uploads/*`.

## 7) Security & Auth
- JWT‑based routes for user‑specific operations (`requireAuth` middleware).
- CORS open during dev (adjust in `server/src/index.ts` for production).
- Do not commit real secrets; use `.env` files.

## 8) Testing Utilities
- Socket test page: `project/test-websocket.html`
- Chatbot test script: `project/test-chatbot.js` (uses `server/dist/services/chatbot.service`)

## 9) Troubleshooting
- Chat dot yellow → ensure backend listening on `http://localhost:4000` and `VITE_SOCKET_HOST` is set; check `/api/health`.
- Mongo not in Compass → verify `MONGO_URI` and that `USE_IN_MEMORY_DB=false`; ensure service is running.
- Email not sending → confirm SMTP env vars; check backend logs for Nodemailer warnings.

## 10) Tech Stack Summary
- Frontend: React 18, TypeScript, Vite, Tailwind, Framer Motion, React Router, socket.io‑client, react‑markdown.
- Backend: Node.js, Express, Socket.IO, Mongoose, Multer, Morgan, JWT, dotenv, Nodemailer.
- NLP/Chatbot: Node NLP (primary), optional Rasa integration.
- DB: MongoDB (local), Compass for inspection.
- Dev tooling: TypeScript, ts-node-dev, ESLint.
