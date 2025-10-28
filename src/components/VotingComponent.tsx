import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Vote, Clock, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Types
interface PollOption {
  _id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  startDate: string;
  endDate: string;
  createdBy?: string;
  isActive: boolean;
  voters: string[];
}

const VOTED_POLLS_KEY = 'votedPolls';

// Helper to get/set voted polls from localStorage
const getVotedPolls = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const votedPolls = localStorage.getItem(VOTED_POLLS_KEY);
    return votedPolls ? JSON.parse(votedPolls) : {};
  } catch (error) {
    console.error('Error reading voted polls from localStorage:', error);
    return {};
  }
};

// Helper to save voted polls to localStorage
const saveVotedPolls = (votedPolls: Record<string, string>) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(votedPolls));
    } catch (error) {
      console.error('Error saving voted polls to localStorage:', error);
    }
  }
};

const VotingComponent: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Load polls and check voting status
  const loadPolls = useCallback(async () => {
    if (!user?.email) {
      setError('Please log in to view and vote in polls');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch<Poll[]>('/polls');
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array of polls');
      }
      
      // Filter active polls (not expired and active)
      const now = new Date();
      const activePolls = data.filter(poll => {
        try {
          const endDate = new Date(poll.endDate);
          const startDate = new Date(poll.startDate || 0);
          return poll.isActive && endDate > now && startDate <= now;
        } catch (error) {
          console.error('Error processing poll dates:', error);
          return false;
        }
      });
      
      // Mark polls where user has already voted
      const updatedPolls = activePolls.map(poll => ({
        ...poll,
        options: poll.options.map(opt => ({
          ...opt,
          voters: Array.isArray(opt.voters) ? opt.voters : []
        })),
        voters: Array.isArray(poll.voters) ? poll.voters : [],
        hasVoted: Array.isArray(poll.voters) && poll.voters.includes(user.email)
      }));
      
      setPolls(updatedPolls);
      setError(null);
    } catch (err: any) {
      console.error('[Voting] loadPolls error:', err);
      setError(err.message || 'Failed to load polls. Please try again later.');
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Load polls on component mount and when user changes
  useEffect(() => {
    // Load voted polls from localStorage
    const votedPolls = getVotedPolls();
    setVotedPolls(votedPolls);
    
    // Load polls
    loadPolls();
  }, [loadPolls]);

  // Handle vote submission
  const handleVote = useCallback(async (pollId: string, optionId: string) => {
    if (!user?.email) {
      setError('You must be logged in to vote');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Optimistic UI update
      setPolls(prevPolls => 
        prevPolls.map(poll => {
          if (poll._id === pollId) {
            const updatedOptions = poll.options.map(opt => {
              if (opt._id === optionId) {
                return {
                  ...opt,
                  votes: opt.votes + 1,
                  voters: [...opt.voters, user.email]
                };
              }
              return opt;
            });
            
            return {
              ...poll,
              options: updatedOptions,
              totalVotes: poll.totalVotes + 1,
              voters: [...poll.voters, user.email],
              hasVoted: true
            };
          }
          return poll;
        })
      );
      
      // Update local storage
      const updatedVotedPolls = { ...votedPolls, [pollId]: optionId };
      setVotedPolls(updatedVotedPolls);
      saveVotedPolls(updatedVotedPolls);
      
      // Close modal
      setIsVoteModalOpen(false);
      setSelectedPoll(null);
      setSelectedOptionId(null);
      
      // Send vote to server
      await apiFetch(`/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, voterEmail: user.email })
      });
      
      setSuccess('Your vote has been recorded successfully!');
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error('Error submitting vote:', err);
      setError(err.message || 'Failed to submit vote. Please try again.');
      
      // Revert optimistic update on error
      await loadPolls();
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.email, votedPolls, loadPolls]);

  // Check if user has voted in a poll
  const hasVoted = useCallback((pollId: string): boolean => {
    return votedPolls[pollId] !== undefined || 
           polls.some(p => p._id === pollId && p.hasVoted);
  }, [polls, votedPolls]);

  // Check if a poll is active (not expired and active flag is true)
  const isPollActive = useCallback((poll: Poll): boolean => {
    if (!poll.isActive) return false;
    try {
      const now = new Date();
      const endDate = new Date(poll.endDate);
      const startDate = new Date(poll.startDate || 0);
      return startDate <= now && endDate > now;
    } catch (error) {
      console.error('Error checking if poll is active:', error);
      return false;
    }
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  // Filter polls based on search term and active status
  const filteredPolls = useMemo(() => {
    try {
      if (!Array.isArray(polls)) return [];
      
      const searchLower = searchTerm.trim().toLowerCase();
      const now = new Date();
      
      return polls.filter(poll => {
        // Filter by search term if provided
        const matchesSearch = !searchLower || 
          poll.title.toLowerCase().includes(searchLower) ||
          (poll.description?.toLowerCase().includes(searchLower) ?? false);
        
        // Only show active polls
        try {
          const endDate = new Date(poll.endDate);
          const startDate = new Date(poll.startDate || 0);
          const isActive = poll.isActive && startDate <= now && endDate > now;
          
          return matchesSearch && isActive;
        } catch (error) {
          console.error('Error checking poll dates:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error filtering polls:', error);
      return [];
    }
  }, [polls, searchTerm]);

  // Open vote modal with poll details
  const openVoteModal = useCallback((poll: Poll) => {
    if (poll.hasVoted || hasVoted(poll._id)) {
      // If already voted, show results
      setSelectedPoll({
        ...poll,
        hasVoted: true
      });
    } else {
      setSelectedPoll(poll);
    }
    setSelectedOptionId(null);
    setIsVoteModalOpen(true);
  }, [hasVoted]);

  // Loading state
  if (loading && polls.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading polls...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Voting Center</h1>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Polls list */}
        {filteredPolls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Vote className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No active polls</h3>
            <p className="mt-1 text-sm text-gray-500">There are no active polls at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPolls.map(poll => (
              <Card key={poll._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                    {poll.description && (
                      <p className="mt-1 text-sm text-gray-500">{poll.description}</p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Ends {formatDate(poll.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {hasVoted(poll._id) ? (
                      <Button
                        variant="outline"
                        onClick={() => openVoteModal(poll)}
                      >
                        View Results
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openVoteModal(poll)}
                        disabled={!isPollActive(poll)}
                      >
                        {isPollActive(poll) ? 'Vote Now' : 'Voting Closed'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Vote Modal */}
      <Modal
        isOpen={isVoteModalOpen}
        onClose={() => {
          setIsVoteModalOpen(false);
          setSelectedPoll(null);
          setSelectedOptionId(null);
        }}
        title={selectedPoll?.title || 'Cast Your Vote'}
      >
        {selectedPoll && (
          <div>
            {selectedPoll.description && (
              <p className="text-sm text-gray-600 mb-4">{selectedPoll.description}</p>
            )}
            
            <div className="space-y-3 mb-6">
              {selectedPoll.options.map(option => {
                const optionVotes = option.votes || 0;
                const percentage = selectedPoll.totalVotes > 0 
                  ? Math.round((optionVotes / selectedPoll.totalVotes) * 100) 
                  : 0;
                
                const isSelected = selectedOptionId === option._id;
                const hasVotedInThisPoll = hasVoted(selectedPoll._id);
                const userVotedForThisOption = option.voters?.includes(user?.email || '');
                
                return (
                  <div 
                    key={option._id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${
                      hasVotedInThisPoll ? 'cursor-default' : ''
                    }`}
                    onClick={() => {
                      if (!hasVotedInThisPoll) {
                        setSelectedOptionId(option._id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {option.text}
                        {userVotedForThisOption && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Your Vote
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="mt-1 text-xs text-gray-500 text-right">
                      {optionVotes} {optionVotes === 1 ? 'vote' : 'votes'}
                    </div>
                    
                    {isSelected && !hasVotedInThisPoll && (
                      <div className="absolute top-2 right-2">
                        <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {!hasVoted(selectedPoll._id) ? (
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVoteModalOpen(false);
                    setSelectedPoll(null);
                    setSelectedOptionId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!selectedOptionId || isSubmitting}
                  onClick={() => selectedOptionId && handleVote(selectedPoll._id, selectedOptionId)}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  You've already voted in this poll.
                </p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Poll ends on {formatDate(selectedPoll.endDate)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VotingComponent;
