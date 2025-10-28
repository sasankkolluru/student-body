import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Poll, PollOption } from '../types/poll';
import { socketService } from '../services/socket';
import { apiFetch } from '../lib/api';

// Helper function to calculate poll status
const calculatePollStatus = (startDate: string, endDate: string): 'upcoming' | 'active' | 'ended' => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
};

// Helper to update poll status based on current time
const updatePollStatuses = (polls: Poll[]): Poll[] => {
  const now = new Date();
  return polls.map(poll => {
    const status = calculatePollStatus(poll.startDate, poll.endDate);
    const isActive = status === 'active';
    
    // If poll has ended but is still marked as active, update it
    if (status === 'ended' && poll.isActive) {
      return { 
        ...poll, 
        status: 'ended',
        isActive: false,
        updatedAt: now.toISOString()
      };
    }
    
    // If poll should be active but isn't marked as such
    if (status === 'active' && !poll.isActive) {
      return { 
        ...poll, 
        status: 'active',
        isActive: true,
        updatedAt: now.toISOString()
      };
    }
    
    return { ...poll, status };
  });
};

interface PollContextType {
  // Polls data
  polls: Poll[];
  activePolls: Poll[];
  upcomingPolls: Poll[];
  endedPolls: Poll[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  createPoll: (poll: Omit<Poll, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'totalVotes' | 'voters' | 'options'> & { 
    options: Array<{ text: string }>;
    startDate: string;
    endDate: string;
  }) => Promise<{ success: boolean; poll?: Poll; message?: string }>;
  
  updatePoll: (id: string, updates: Partial<Poll>) => Promise<{ success: boolean; poll?: Poll; message?: string }>;
  deletePoll: (id: string) => Promise<{ success: boolean; message?: string }>;
  addVote: (pollId: string, optionId: string, userId: string) => Promise<{ success: boolean; message?: string }>;
  getPollById: (id: string) => Poll | undefined;
  refreshPolls: () => Promise<void>;
  
  // Admin actions
  startPoll: (pollId: string) => Promise<{ success: boolean; message?: string }>;
  endPoll: (pollId: string) => Promise<{ success: boolean; message?: string }>;
}

const PollContext = createContext<PollContextType | null>(null);

// Key for storing polls in localStorage
const POLLS_STORAGE_KEY = 'app_polls';

// Get polls from localStorage or initialize with empty array
const getStoredPolls = (): Poll[] => {
  if (typeof window === 'undefined') return [];
  
  const storedPolls = localStorage.getItem(POLLS_STORAGE_KEY);
  return storedPolls ? JSON.parse(storedPolls) : [];
};

export const PollProvider = ({ children }: { children: ReactNode }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Categorize polls
  const activePolls = polls.filter(poll => poll.status === 'active' && poll.isActive);
  const upcomingPolls = polls.filter(poll => poll.status === 'upcoming');
  const endedPolls = polls.filter(poll => poll.status === 'ended' || !poll.isActive);

  // Load polls from API on mount
  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ success: boolean; polls: Poll[] }>('/polls');
      if (response.success && response.polls) {
        const pollsWithStatus = updatePollStatuses(response.polls);
        setPolls(pollsWithStatus);
      }
    } catch (err) {
      setError('Failed to load polls');
      console.error('Error loading polls:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchPolls();
    
    // Set up interval to check for poll status updates (every minute)
    const statusCheckInterval = setInterval(() => {
      setPolls(currentPolls => updatePollStatuses(currentPolls));
    }, 60000);
    
    // Set up WebSocket subscription for poll updates
    const unsubscribe = socketService.subscribeToAllPolls(({ poll, action }) => {
      setPolls(currentPolls => {
        let updatedPolls = [...currentPolls];
        
        switch (action) {
          case 'created':
            return [...currentPolls, { ...poll, status: calculatePollStatus(poll.startDate, poll.endDate) }];
            
          case 'updated':
          case 'status_changed':
            return currentPolls.map(p => 
              p._id === poll._id 
                ? { ...poll, status: calculatePollStatus(poll.startDate, poll.endDate) } 
                : p
            );
            
          case 'deleted':
            return currentPolls.filter(p => p._id !== poll._id);
            
          default:
            return currentPolls;
        }
      });
    });
    
    // Cleanup
    return () => {
      clearInterval(statusCheckInterval);
      unsubscribe();
    };
  }, [fetchPolls]);
  
  // Create a new poll
  const createPoll = async (pollData: Omit<Poll, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'totalVotes' | 'voters' | 'options'> & { 
    options: Array<{ text: string }>;
    startDate: string;
    endDate: string;
  }) => {
    try {
      // Add default values for new poll
      const newPoll = {
        ...pollData,
        options: pollData.options.map(opt => ({
          ...opt,
          _id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          votes: 0,
          voters: []
        })),
        totalVotes: 0,
        voters: [],
        isActive: false,
        status: 'upcoming' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Send to server via WebSocket
      const result = await socketService.createPoll(newPoll);
      
      if (result.success && result.poll) {
        // The WebSocket will handle the update via subscription
        return { success: true, poll: result.poll };
      } else {
        throw new Error(result.message || 'Failed to create poll');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Update a poll
  const updatePoll = async (id: string, updates: Partial<Poll>) => {
    try {
      // In a real app, you would send this to your server
      // For now, we'll update local state
      setPolls(currentPolls => {
        return currentPolls.map(poll => 
          poll._id === id 
            ? { 
                ...poll, 
                ...updates, 
                updatedAt: new Date().toISOString(),
                status: updates.startDate && updates.endDate 
                  ? calculatePollStatus(updates.startDate, updates.endDate)
                  : poll.status
              } 
            : poll
        );
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update poll';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Delete a poll
  const deletePoll = async (id: string) => {
    try {
      // In a real app, you would call an API to delete the poll
      // For now, we'll update local state
      setPolls(currentPolls => currentPolls.filter(poll => poll._id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete poll';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Add a vote to a poll
  const addVote = async (pollId: string, optionId: string, userId: string) => {
    try {
      // Check if user has already voted
      const poll = polls.find(p => p._id === pollId);
      if (!poll) {
        return { success: false, message: 'Poll not found' };
      }
      
      if (poll.voters?.includes(userId)) {
        return { success: false, message: 'You have already voted in this poll' };
      }
      
      // Send vote to server via WebSocket
      const result = await socketService.castVote(pollId, optionId, userId);
      
      if (!result.success) {
        return { success: false, message: result.message || 'Failed to cast vote' };
      }
      
      // The WebSocket will handle the update via subscription
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cast vote';
      return { success: false, message: errorMessage };
    }
  };

  // Get a poll by ID
  const getPollById = (id: string): Poll | undefined => {
    return polls.find(poll => poll._id === id);
  };
  
  // Refresh polls from the server
  const refreshPolls = async () => {
    await fetchPolls();
  };
  
  // Admin: Start a poll
  const startPoll = async (pollId: string) => {
    try {
      const result = await socketService.updatePollStatus(pollId, 'active');
      if (result.success) {
        // The WebSocket will handle the update via subscription
        return { success: true };
      }
      return { success: false, message: result.message || 'Failed to start poll' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start poll';
      return { success: false, message: errorMessage };
    }
  };
  
  // Admin: End a poll
  const endPoll = async (pollId: string) => {
    try {
      const result = await socketService.updatePollStatus(pollId, 'ended');
      if (result.success) {
        // The WebSocket will handle the update via subscription
        return { success: true };
      }
      return { success: false, message: result.message || 'Failed to end poll' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end poll';
      return { success: false, message: errorMessage };
    }
  };

  return (
    <PollContext.Provider 
      value={{
        polls,
        activePolls,
        upcomingPolls,
        endedPolls,
        loading,
        error,
        createPoll,
        updatePoll,
        deletePoll,
        addVote,
        getPollById,
        refreshPolls,
        startPoll,
        endPoll,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePolls = (): PollContextType => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePolls must be used within a PollProvider');
  }
  return context;
};
