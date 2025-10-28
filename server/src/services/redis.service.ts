// In-memory store for development
interface VoteStore {
  [pollId: string]: {
    votes: { [optionId: string]: number };
    userVotes: { [userId: string]: string };
  };
}

class InMemoryVoteService {
  private static instance: InMemoryVoteService;
  private store: VoteStore = {};

  private constructor() {
    console.log('Using in-memory vote store for development');
  }

  private getOrCreatePoll(pollId: string) {
    if (!this.store[pollId]) {
      this.store[pollId] = {
        votes: {},
        userVotes: {}
      };
    }
    return this.store[pollId];
  }

  public static getInstance(): InMemoryVoteService {
    if (!InMemoryVoteService.instance) {
      InMemoryVoteService.instance = new InMemoryVoteService();
    }
    return InMemoryVoteService.instance;
  }

  // Check if service is connected (always true for in-memory)
  public async isConnected(): Promise<boolean> {
    return true;
  }

  // Get vote counts for a poll
  public async getVoteCounts(pollId: string): Promise<Record<string, number>> {
    const poll = this.getOrCreatePoll(pollId);
    return { ...poll.votes };
  }

  // Record a vote
  public async recordVote(pollId: string, optionId: string, userId: string): Promise<boolean> {
    try {
      const poll = this.getOrCreatePoll(pollId);
      const previousVote = poll.userVotes[userId];

      // If user already voted for this option, do nothing
      if (previousVote === optionId) {
        return true;
      }

      // If user voted for a different option before, decrement that count
      if (previousVote) {
        poll.votes[previousVote] = (poll.votes[previousVote] || 1) - 1;
      }

      // Record the new vote
      poll.votes[optionId] = (poll.votes[optionId] || 0) + 1;
      poll.userVotes[userId] = optionId;

      return true;
    } catch (error) {
      console.error('Error recording vote:', error);
      return false;
    }
  }

  // Get user's vote for a poll
  public async getUserVote(pollId: string, userId: string): Promise<string | null> {
    const poll = this.getOrCreatePoll(pollId);
    return poll.userVotes[userId] || null;
  }
}

export const redisService = InMemoryVoteService.getInstance();
