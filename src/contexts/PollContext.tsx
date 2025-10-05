import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Poll, PollOption } from '../types/poll';

interface PollContextType {
  polls: Poll[];
  loading: boolean;
  error: string | null;
  createPoll: (poll: Omit<Poll, 'id' | 'createdAt' | 'totalVotes'>) => Promise<Poll>;
  updatePoll: (id: string, updates: Partial<Poll>) => Promise<Poll>;
  deletePoll: (id: string) => Promise<void>;
  addVote: (pollId: string, optionId: string) => Promise<Poll>;
  getPollById: (id: string) => Poll | undefined;
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

  // Load polls from localStorage on mount
  useEffect(() => {
    try {
      const storedPolls = getStoredPolls();
      setPolls(storedPolls);
    } catch (err) {
      setError('Failed to load polls');
      console.error('Error loading polls:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save polls to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(polls));
    }
  }, [polls, loading]);

  const createPoll = async (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalVotes'>): Promise<Poll> => {
    setLoading(true);
    try {
      const newPoll: Poll = {
        ...pollData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        totalVotes: 0,
      };
      
      setPolls([...polls, newPoll]);
      return newPoll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updatePoll = async (id: string, updates: Partial<Poll>): Promise<Poll> => {
    setLoading(true);
    try {
      const updatedPolls = polls.map(poll => 
        poll.id === id ? { ...poll, ...updates } : poll
      );
      
      setPolls(updatedPolls);
      const updatedPoll = updatedPolls.find(poll => poll.id === id);
      if (!updatedPoll) throw new Error('Poll not found');
      
      return updatedPoll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update poll';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deletePoll = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setPolls(polls.filter(poll => poll.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete poll';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addVote = async (pollId: string, optionId: string): Promise<Poll> => {
    setLoading(true);
    try {
      const updatedPolls = polls.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option => 
            option.id === optionId 
              ? { ...option, votes: option.votes + 1 } 
              : option
          );
          
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1
          };
        }
        return poll;
      });
      
      setPolls(updatedPolls);
      const updatedPoll = updatedPolls.find(poll => poll.id === pollId);
      if (!updatedPoll) throw new Error('Poll not found');
      
      return updatedPoll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add vote';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPollById = (id: string): Poll | undefined => {
    return polls.find(poll => poll.id === id);
  };

  return (
    <PollContext.Provider 
      value={{
        polls,
        loading,
        error,
        createPoll,
        updatePoll,
        deletePoll,
        addVote,
        getPollById,
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
