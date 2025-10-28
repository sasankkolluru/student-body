import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { VotingSocket } from './websocket/voting.socket';
import { config } from 'dotenv';
import cors from 'cors';

// Load environment variables
config();

const app = express();
const server = createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Enable HTTP long-polling fallback
  transports: ['websocket', 'polling']
});

// Initialize WebSocket handlers
new VotingSocket(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    websocket: io.engine.clientsCount
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is running`);
  console.log(`CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
