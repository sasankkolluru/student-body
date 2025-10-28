import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { redisService } from '../services/redis.service';
import { v4 as uuidv4 } from 'uuid';

interface IVotingSocket {
  pollId: string;
  socketId: string;
  userId: string;
}

export class VotingSocket {
  private io: SocketIOServer;
  private redisClient: Redis;
  private pubClient: Redis;
  private subClient: Redis;
  private connectedClients: Map<string, IVotingSocket> = new Map();
  private readonly VOTE_RATE_LIMIT_MS = 1000; // 1 second between votes
  private lastVoteTimestamps: Map<string, number> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    
    // Create Redis clients
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.pubClient = this.redisClient.duplicate();
    this.subClient = this.redisClient.duplicate();
    
    this.initializeSocket();
    this.setupRedisAdapter();
    this.setupEventHandlers();
  }

  private initializeSocket() {
    // Enable CORS for WebSocket connections
    this.io.engine.on('headers', (headers) => {
      headers['Access-Control-Allow-Origin'] = process.env.CLIENT_URL || 'http://localhost:3000';
      headers['Access-Control-Allow-Credentials'] = 'true';
    });
  }

  private setupRedisAdapter() {
    const adapter = createAdapter(this.pubClient, this.subClient);
    this.io.adapter(adapter);

    // Handle Redis connection errors
    [this.redisClient, this.pubClient, this.subClient].forEach((client) => {
      client.on('error', (err) => {
        console.error('Redis error:', err);
      });
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle joining a poll room
      socket.on('joinPoll', async (pollId: string, userId: string = 'anonymous') => {
        try {
          if (!pollId) {
            throw new Error('Poll ID is required');
          }

          // Store client info
          const clientInfo: IVotingSocket = {
            pollId,
            socketId: socket.id,
            userId: userId || `user_${socket.id}`
          };
          
          this.connectedClients.set(socket.id, clientInfo);
          
          // Join the room for this poll
          await socket.join(pollId);
          console.log(`User ${clientInfo.userId} joined poll ${pollId}`);
          
          // Send current vote counts to the newly joined client
          const votes = await redisService.getVoteCounts(pollId);
          socket.emit('voteUpdate', { pollId, votes });
          
        } catch (error) {
          console.error('Error joining poll:', error);
          socket.emit('error', { message: 'Failed to join poll' });
        }
      });

      // Handle voting
      socket.on('vote', async (
        { pollId, optionId, userId }: { pollId: string; optionId: string; userId: string },
        ack: (response: { success: boolean; message?: string }) => void
      ) => {
        try {
          if (!pollId || !optionId) {
            throw new Error('Poll ID and option ID are required');
          }

          // Check Redis connection
          const isRedisConnected = await redisService.isConnected();
          if (!isRedisConnected) {
            throw new Error('Voting system is currently unavailable. Please try again later.');
          }

          // Rate limiting
          const now = Date.now();
          const lastVoteTime = this.lastVoteTimestamps.get(userId) || 0;
          
          if (now - lastVoteTime < this.VOTE_RATE_LIMIT_MS) {
            ack({ 
              success: false, 
              message: 'Voting too quickly. Please wait a moment before voting again.' 
            });
            return;
          }
          
          this.lastVoteTimestamps.set(userId, now);
          console.log(`Processing vote: poll=${pollId}, option=${optionId}, user=${userId}`);

          // Record the vote in Redis
          const success = await redisService.recordVote(pollId, optionId, userId);
          
          if (!success) {
            throw new Error('Failed to record your vote. Please try again.');
          }

          // Get updated vote counts
          const votes = await redisService.getVoteCounts(pollId);
          console.log('Updated vote counts:', votes);
          
          // Broadcast the update to all clients in the poll room
          this.io.to(pollId).emit('voteUpdate', { 
            pollId, 
            votes,
            timestamp: new Date().toISOString()
          });
          
          ack({ 
            success: true,
            message: 'Your vote has been recorded!'
          });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your vote';
          console.error('Error processing vote:', errorMessage, error);
          
          ack({ 
            success: false, 
            message: errorMessage
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  // Cleanup resources
  public async close() {
    this.connectedClients.clear();
    await Promise.all([
      this.redisClient.quit(),
      this.pubClient.quit(),
      this.subClient.quit()
    ]);
  }
}
