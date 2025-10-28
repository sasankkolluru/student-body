import 'module-alias/register';
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
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs/promises';
import galleryRoutes from './routes/gallery.routes';
import eventsRoutes from './routes/events.routes';
import meRoutes from './routes/me.routes';
import { ChatSocket } from './sockets/chat.socket';
import liveRoutes from './routes/live.routes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`) });

// Initialize Express
const app = express();
const server = http.createServer(app);

// Redis client setup for Socket.IO scaling
let pubClient: any;
let subClient: any;

// Initialize Redis if configured
if (process.env.REDIS_URL) {
  pubClient = createClient({ url: process.env.REDIS_URL });
  subClient = pubClient.duplicate();
  
  pubClient.on('error', (err: any) => console.error('Redis pub client error:', err));
  subClient.on('error', (err: any) => console.error('Redis sub client error:', err));
  
  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      const redisAdapter = createAdapter(pubClient, subClient);
      console.log('Redis connected successfully');
    })
    .catch((err) => console.error('Redis connection error:', err));
}

// Socket.IO setup with Redis for horizontal scaling
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000
});

// Initialize Chat Socket with error handling
try {
  new ChatSocket(io);
  console.log('ChatSocket initialized successfully');
} catch (error) {
  console.error('Failed to initialize ChatSocket:', error);
}

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Create necessary directories asynchronously
const createDirectories = async () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const galleryDir = path.join(uploadsDir, 'gallery');
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(galleryDir, { recursive: true });
    console.log('Upload directories verified/created');
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

createDirectories();

// Static file serving with cache control
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true,
  setHeaders: (res: any, path: string) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
};

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));

// API Routes with versioning
const API_PREFIX = '/api/v1';

// Health check endpoint
app.get(`${API_PREFIX}/health`, (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    database: 'connected',
    redis: pubClient ? 'connected' : 'not configured'
  };
  
  res.json(healthCheck);
});

// Apply routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/achievements`, achievementRoutes);
app.use(`${API_PREFIX}/polls`, pollRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/registrations`, registrationRoutes);
app.use(`${API_PREFIX}/gallery`, galleryRoutes);
app.use(`${API_PREFIX}/events`, eventsRoutes);
app.use(`${API_PREFIX}/me`, meRoutes);
app.use(`${API_PREFIX}`, liveRoutes);

// 404 handler for API routes
app.use(API_PREFIX, (_req: Request, res: Response) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Endpoint not found',
    documentation: '/api-docs'
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong on our end. Please try again later.' 
    : err.message || 'Internal Server Error';
  
  res.status(status).json({ 
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Server configuration
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const MAX_RETRIES = Number(process.env.PORT_RETRY_LIMIT) || 5;
const RETRY_DELAY_MS = 1000; // 1 second

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  try {
    // Close the HTTP server
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    // Close Socket.IO
    if (io) {
      io.close();
    }
    
    // Close Redis connections if they exist
    if (pubClient) await pubClient.quit();
    if (subClient) await subClient.quit();
    
    console.log('Server closed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server with port retry logic
const startServer = async (port: number, attempt = 0): Promise<void> => {
  return new Promise((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        if (attempt >= MAX_RETRIES) {
          console.error(`No available ports after ${MAX_RETRIES} attempts. Exiting.`);
          return reject(new Error('No available ports'));
        }
        
        console.log(`Port ${port} is in use, trying port ${port + 1}...`);
        setTimeout(() => {
          startServer(port + 1, attempt + 1).then(resolve).catch(reject);
        }, RETRY_DELAY_MS);
      } else {
        console.error('Server error:', error);
        reject(error);
      }
    };
    
    server.once('error', onError);
    
    server.listen(port, HOST, () => {
      console.log(`Server is running on http://${HOST}:${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Connect to database after server starts
      connectDB().catch(console.error);
      
      // Remove the error handler since we're connected
      server.off('error', onError);
      resolve();
    });
  });
};

// Start the server
startServer(PORT).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export the server for testing
if (process.env.NODE_ENV === 'test') {
  module.exports = { app, server, io };
}
