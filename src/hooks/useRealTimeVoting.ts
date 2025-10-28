import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socket.service';

export interface VoteUpdate {
  pollId: string;
  votes: Record<string, number>;
}

interface UseRealTimeVotingProps {
  pollId: string;
  initialVotes?: Record<string, number>;
  onVoteUpdate?: (update: VoteUpdate) => void;
}

export const useRealTimeVoting = ({
  pollId,
  initialVotes = {},
  onVoteUpdate
}: UseRealTimeVotingProps) => {
  const [votes, setVotes] = useState<Record<string, number>>(initialVotes);
  const [isConnected, setIsConnected] = useState(socketService.isConnectedToServer());
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voteUpdateRef = useRef<() => void>();

  // Handle vote updates from WebSocket
  useEffect(() => {
    // Join the poll room when component mounts or pollId changes
    socketService.joinPoll(pollId);

    // Subscribe to vote updates
    const unsubscribe = socketService.subscribeToVoteUpdates(pollId, (update: VoteUpdate) => {
      setVotes(update.votes);
      onVoteUpdate?.(update);
    });

    // Handle connection status changes
    const handleConnect = () => {
      setIsConnected(true);
      // Rejoin poll room if we reconnect
      socketService.joinPoll(pollId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Set up event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    // Clean up
    return () => {
      unsubscribe();
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
    };
  }, [pollId, onVoteUpdate]);

  // Cast a vote
  const castVote = useCallback(async (optionId: string, userId: string): Promise<boolean> => {
    if (!isConnected) {
      setError('Not connected to the server. Please check your internet connection.');
      return false;
    }

    setIsVoting(true);
    setError(null);

    try {
      const success = await socketService.castVote(pollId, optionId, userId);
      if (!success) {
        throw new Error('Failed to cast vote');
      }
      return true;
    } catch (err) {
      console.error('Error casting vote:', err);
      setError('Failed to cast vote. Please try again.');
      return false;
    } finally {
      setIsVoting(false);
    }
  }, [isConnected, pollId]);

  // Get vote percentage for an option
  const getVotePercentage = useCallback((optionId: string): number => {
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    if (totalVotes === 0) return 0;
    return Math.round(((votes[optionId] || 0) / totalVotes) * 100);
  }, [votes]);

  // Get total number of votes
  const getTotalVotes = useCallback((): number => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  }, [votes]);

  // Reset voting state
  const resetVoting = useCallback(() => {
    setVotes({});
    setError(null);
    setIsVoting(false);
  }, []);

  return {
    votes,
    isConnected,
    isVoting,
    error,
    castVote,
    getVotePercentage,
    getTotalVotes,
    resetVoting,
  };
};
