import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './lib/db';
import authRoutes from './routes/auth.routes';
import achievementRoutes from './routes/achievements.routes';
import pollRoutes from './routes/polls.routes';
import messageRoutes from './routes/messages.routes';
import registrationRoutes from './routes/registrations.routes';
import type { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import galleryRoutes from './routes/gallery.routes';
import eventsRoutes from './routes/events.routes';
import meRoutes from './routes/me.routes';
import { ChatSocket } from './sockets/chat.socket';
import liveRoutes from './routes/live.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  path: '/socket.io/'
});

// Initialize Chat Socket
new ChatSocket(io);

// Make io available to routes via app locals
app.set('io', io);

// Middlewares
// Allow any origin during development (including 3000/5173)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static for uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const galleryDir = path.join(uploadsDir, 'gallery');
if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/me', meRoutes);
// Live news/scores (mounted at /api)
app.use('/api', liveRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 for unknown /api routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found', path: req.path });
});

// Global error handler to ensure JSON responses
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;

// Start server immediately so Socket.IO is available even if DB is slow/unavailable
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Attempt DB connection asynchronously; log errors but do not exit
connectDB()
  .then(() => {
    console.log('Database initialized');
  })
  .catch((err) => {
    console.error('Failed to connect to DB (continuing without DB):', err);
  });
