import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';

interface VoteUpdate {
  pollId: string;
  votes: Record<string, number>;
}

export const useVoting = (pollId: string) => {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle vote updates from WebSocket
  useEffect(() => {
    const handleVoteUpdate = (data: VoteUpdate) => {
      if (data.pollId === pollId) {
        setVotes(data.votes);
      }
    };

    // Subscribe to vote updates
    const unsubscribe = socketService.subscribeToVoteUpdates(pollId, handleVoteUpdate);

    // Initial connection status
    setIsConnected(socketService.isConnected());

    // Handle connection status changes
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Add event listeners for connection status
    window.addEventListener('online', handleConnect);
    window.addEventListener('offline', handleDisconnect);

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleConnect);
      window.removeEventListener('offline', handleDisconnect);
    };
  }, [pollId]);

  // Cast a vote
  const castVote = useCallback(
    async (optionId: string, userId: string) => {
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
    },
    [pollId, isConnected]
  );

  // Get vote percentage for an option
  const getVotePercentage = useCallback(
    (optionId: string): number => {
      const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
      if (totalVotes === 0) return 0;
      return Math.round((votes[optionId] || 0 / totalVotes) * 100);
    },
    [votes]
  );

  // Get user's current vote (if any)
  const getUserVote = useCallback(
    (userId: string): string | null => {
      // In a real app, you would fetch this from your API
      return null;
    },
    []
  );

  return {
    votes,
    isConnected,
    isVoting,
    error,
    castVote,
    getVotePercentage,
    getUserVote,
  };
};
