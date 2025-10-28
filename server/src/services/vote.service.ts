import { Redis } from 'ioredis';

interface VoteOperation {
  type: 'increment' | 'decrement' | 'delete';
  optionId: string;
  userId: string;
}

class VoteService {
  private static instance: VoteService;
  private client: Redis;
  private operationQueue: Map<string, VoteOperation[]> = new Map();
  private isProcessing = false;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 5000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        console.error('Redis connection error:', err);
        return true;
      }
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.processQueue();
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis error:', err);
    });
  }

  public static getInstance(): VoteService {
    if (!VoteService.instance) {
      VoteService.instance = new VoteService();
    }
    return VoteService.instance;
  }

  // Get vote counts for a poll
  public async getVoteCounts(pollId: string): Promise<Record<string, number>> {
    try {
      const votes = await this.client.hgetall(`poll:${pollId}:votes`);
      const result: Record<string, number> = {};
      
      for (const [optionId, count] of Object.entries(votes)) {
        result[optionId] = parseInt(count as string, 10) || 0;
      }
      
      return result;
    } catch (error) {
      console.error('Error getting vote counts:', error);
      return {};
    }
  }

  // Add vote operation to queue
  public async queueVoteOperation(
    pollId: string,
    operation: VoteOperation
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.operationQueue.has(pollId)) {
      this.operationQueue.set(pollId, []);
    }
    
    // Add operation to queue
    this.operationQueue.get(pollId)?.push(operation);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue();
    }
    
    return { success: true };
  }

  // Process queued operations
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.size === 0) return;
    
    this.isProcessing = true;
    
    try {
      for (const [pollId, operations] of this.operationQueue.entries()) {
        const multi = this.client.multi();
        const processedUsers = new Set<string>();
        
        // Process operations in order
        for (const op of operations) {
          const userKey = `poll:${pollId}:user:${op.userId}`;
          const pollKey = `poll:${pollId}:votes`;
          
          // Skip if we've already processed this user in this batch
          if (processedUsers.has(op.userId)) continue;
          
          switch (op.type) {
            case 'increment':
              multi.hincrby(pollKey, op.optionId, 1);
              multi.set(userKey, op.optionId, 'EX', 60 * 60 * 24 * 7);
              break;
              
            case 'decrement':
              multi.hincrby(pollKey, op.optionId, -1);
              multi.del(userKey);
              break;
              
            case 'delete':
              const currentVote = await this.client.get(userKey);
              if (currentVote) {
                multi.hincrby(pollKey, currentVote, -1);
                multi.del(userKey);
              }
              break;
          }
          
          processedUsers.add(op.userId);
        }
        
        await multi.exec();
        this.operationQueue.delete(pollId);
      }
    } catch (error) {
      console.error('Error processing vote operations:', error);
    } finally {
      this.isProcessing = false;
      
      // If new operations were added while processing, process them
      if (this.operationQueue.size > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  // Get user's vote for a poll
  public async getUserVote(pollId: string, userId: string): Promise<string | null> {
    try {
      return await this.client.get(`poll:${pollId}:user:${userId}`);
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  }

  // Delete a poll and all its data
  public async deletePoll(pollId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Get all user vote keys
      const userVoteKeys = await this.client.keys(`poll:${pollId}:user:*`);
      const multi = this.client.multi();
      
      // Delete all user votes and the poll data
      userVoteKeys.forEach(key => multi.del(key));
      multi.del(`poll:${pollId}:votes`);
      
      await multi.exec();
      return { success: true };
    } catch (error) {
      console.error('Error deleting poll:', error);
      return { success: false, message: 'Failed to delete poll' };
    }
  }

  // Get all polls
  public async getAllPolls(): Promise<string[]> {
    try {
      const keys = await this.client.keys('poll:*:votes');
      return keys.map(key => key.split(':')[1]); // Extract poll IDs
    } catch (error) {
      console.error('Error getting all polls:', error);
      return [];
    }
  }
}

export const voteService = VoteService.getInstance();
