import { Server as SocketIOServer, Socket } from 'socket.io';
import { voteService } from '../services/vote.service';

export class VoteSocket {
  private io: SocketIOServer;
  private connectedClients: Map<string, string> = new Map(); // socketId -> userId
  private readonly VOTE_RATE_LIMIT_MS = 1000; // 1 second between votes
  private lastVoteTimestamps: Map<string, number> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializeSocket();
  }

  private initializeSocket() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle joining a poll room
      socket.on('joinPoll', async (pollId: string, userId: string = 'anonymous') => {
        try {
          if (!pollId) {
            throw new Error('Poll ID is required');
          }

          // Store client info
          this.connectedClients.set(socket.id, userId);
          
          // Join the room for this poll
          await socket.join(pollId);
          console.log(`User ${userId} joined poll ${pollId}`);
          
          // Send current vote counts to the newly joined client
          const votes = await voteService.getVoteCounts(pollId);
          socket.emit('voteUpdate', { pollId, votes });
          
        } catch (error) {
          console.error('Error joining poll:', error);
          socket.emit('error', { message: 'Failed to join poll' });
        }
      });

      // Handle voting operations
      socket.on('voteOperation', async (
        { pollId, operationType, optionId, userId }: 
        { pollId: string; operationType: 'increment' | 'decrement' | 'delete'; optionId: string; userId: string },
        ack: (response: { success: boolean; message?: string }) => void
      ) => {
        try {
          if (!pollId || !optionId) {
            throw new Error('Poll ID and option ID are required');
          }

          // Rate limiting
          const now = Date.now();
          const lastVoteTime = this.lastVoteTimestamps.get(userId) || 0;
          
          if (now - lastVoteTime < this.VOTE_RATE_LIMIT_MS) {
            ack({ success: false, message: 'Voting too quickly. Please wait a moment.' });
            return;
          }
          
          this.lastVoteTimestamps.set(userId, now);

          // Queue the vote operation
          const result = await voteService.queueVoteOperation(pollId, {
            type: operationType,
            optionId,
            userId
          });

          if (!result.success) {
            throw new Error(result.message || 'Failed to process vote');
          }

          // Get updated vote counts
          const votes = await voteService.getVoteCounts(pollId);
          
          // Broadcast the update to all clients in the poll room
          this.io.to(pollId).emit('voteUpdate', { pollId, votes });
          
          ack({ success: true });
          
        } catch (error) {
          console.error('Error processing vote operation:', error);
          ack({ 
            success: false, 
            message: error instanceof Error ? error.message : 'An error occurred while processing your vote' 
          });
        }
      });

      // Handle poll deletion (admin only)
      socket.on('deletePoll', async (
        { pollId, userId }: { pollId: string; userId: string },
        ack: (response: { success: boolean; message?: string }) => void
      ) => {
        try {
          // TODO: Add admin verification
          const result = await voteService.deletePoll(pollId);
          
          if (result.success) {
            // Notify all clients in the poll room
            this.io.to(pollId).emit('pollDeleted', { pollId });
          }
          
          ack(result);
          
        } catch (error) {
          console.error('Error deleting poll:', error);
          ack({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Failed to delete poll' 
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
  }
}

export default VoteSocket;
