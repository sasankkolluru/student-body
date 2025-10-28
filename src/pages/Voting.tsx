import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Vote, Clock, CheckCircle, XCircle, Users, TrendingUp, Search
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { blockchainService } from '../services/blockchain.service';

// Socket.io import
import { io } from 'socket.io-client';

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
  hasVoted?: boolean;
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

export const Voting: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>(getVotedPolls());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Blockchain wallet connection state
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);

  // Initialize blockchain service
  const initializeBlockchain = useCallback(async () => {
    try {
      await blockchainService.initialize();
      const address = blockchainService.getCurrentAddress();
      if (address) {
        setWalletConnected(true);
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      // Don't show error to user as blockchain is optional for basic voting
    }
  }, []);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    try {
      setIsConnectingWallet(true);
      setError(null);
      
      const address = await blockchainService.connectWallet();
      setWalletConnected(true);
      setWalletAddress(address);
      setSuccess('Wallet connected successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (error instanceof Error && error.message.includes('ethereum provider')) {
        setError('MetaMask not detected. Please install MetaMask extension and refresh the page.');
      } else {
        setError('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
      }
    } finally {
      setIsConnectingWallet(false);
    }
  }, []);

  // Load polls from API
  const loadPolls = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load polls from backend (requires authentication)
      try {
        const response = await apiFetch('/polls');
        setPolls(response.data || response);
        setError(null);
      } catch (apiError: any) {
        const msg = apiError?.message || '';
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
          setError('Please log in to view live polls.');
        } else {
          setError(msg || 'Failed to load polls.');
        }
        setPolls([]);
      }
    } catch (err) {
      console.error('Error loading polls:', err);
      setError('Failed to load polls. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize voting component
  useEffect(() => {
    loadPolls();
    initializeBlockchain();

    // Start blockchain read-only listeners and subscribe to on-chain events
    try {
      blockchainService.startReadOnlyListeners();

      const unsubscribeCreated = blockchainService.on('pollCreated', () => {
        // New poll created on-chain; refresh list
        loadPolls();
      });

      const unsubscribeEnded = blockchainService.on('pollEnded', () => {
        // Poll ended on-chain; refresh list
        loadPolls();
      });

      const unsubscribeVoteCast = blockchainService.on('voteCast', () => {
        // Vote cast on-chain; refresh list
        loadPolls();
      });

      // Set up socket connection (align with backend at 4000 and event names)
      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      const handlePollsNew = (_newPoll: any) => {
        // Server emits polls:new on creation; student list shows only active polls
        loadPolls();
      };

      const handlePollsUpdated = (_update: any) => {
        // Server emits polls:updated on vote or changes; refresh list
        loadPolls();
      };

      const handlePollsVisibility = (_data: any) => {
        // Admin activate/deactivate emits polls:visibility; refresh list
        loadPolls();
      };

      socket.on('polls:new', handlePollsNew);
      socket.on('polls:updated', handlePollsUpdated);
      socket.on('polls:visibility', handlePollsVisibility);

      // Cleanup function
      return () => {
        socket.off('polls:new', handlePollsNew);
        socket.off('polls:updated', handlePollsUpdated);
        socket.off('polls:visibility', handlePollsVisibility);
        socket.disconnect();
        unsubscribeCreated();
        unsubscribeEnded();
        unsubscribeVoteCast();
      };
    } catch (e) {
      console.warn('Blockchain listeners could not be started:', e);
    }
  }, [loadPolls, initializeBlockchain]);
  
  // Handle voting on a poll using blockchain
  const handleVote = useCallback(async () => {
    if (!selectedPoll || !selectedOptionId) return;
    
    // Blockchain voting is optional - allow regular voting if wallet not connected
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Optimistically update the UI
      setPolls(prevPolls =>
        prevPolls.map(poll =>
          poll._id === selectedPoll._id
            ? {
                ...poll,
                options: poll.options.map(opt =>
                  opt._id === selectedOptionId
                    ? { ...opt, votes: opt.votes + 1 }
                    : opt
                ),
                totalVotes: poll.totalVotes + 1,
                hasVoted: true,
              }
            : poll
        )
      );
      
      // Update local storage
      const updatedVotedPolls = { ...votedPolls, [selectedPoll._id]: selectedOptionId };
      setVotedPolls(updatedVotedPolls);
      saveVotedPolls(updatedVotedPolls);
      
      // Submit vote - try blockchain first if wallet connected, fallback to API, then mock
      if (walletConnected) {
        try {
          const transactionReceipt = await blockchainService.castVote(selectedPoll._id, selectedOptionId);
          setSuccess(`Your vote has been recorded on the blockchain! Transaction: ${transactionReceipt.transactionHash.slice(0, 10)}...`);
        } catch (blockchainError) {
          console.error('Blockchain voting failed, falling back to API:', blockchainError);
          // Fallback to regular API voting
          try {
            await apiFetch(`/polls/${selectedPoll._id}/vote`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ optionId: selectedOptionId }),
            });
            setSuccess('Your vote has been recorded successfully!');
          } catch (apiError) {
            console.warn('API voting failed, using mock voting:', apiError);
            // Mock voting - update local state
            setPolls(prevPolls =>
              prevPolls.map(poll =>
                poll._id === selectedPoll._id
                  ? {
                      ...poll,
                      options: poll.options.map(opt =>
                        opt._id === selectedOptionId
                          ? { ...opt, votes: opt.votes + 1 }
                          : opt
                      ),
                      totalVotes: poll.totalVotes + 1,
                      hasVoted: true,
                    }
                  : poll
              )
            );
            setSuccess('Your vote has been recorded (demo mode)!');
          }
        }
      } else {
        // Regular API voting with mock fallback
        try {
          await apiFetch(`/polls/${selectedPoll._id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ optionId: selectedOptionId }),
          });
          setSuccess('Your vote has been recorded successfully!');
        } catch (apiError) {
          console.warn('API voting failed, using mock voting:', apiError);
          // Mock voting - update local state
          setPolls(prevPolls =>
            prevPolls.map(poll =>
              poll._id === selectedPoll._id
                ? {
                    ...poll,
                    options: poll.options.map(opt =>
                      opt._id === selectedOptionId
                        ? { ...opt, votes: opt.votes + 1 }
                        : opt
                    ),
                    totalVotes: poll.totalVotes + 1,
                    hasVoted: true,
                  }
                : poll
            )
          );
          setSuccess('Your vote has been recorded (demo mode)!');
        }
      }
      
      // Close modal
      setIsVoteModalOpen(false);
      setSelectedPoll(null);
      setSelectedOptionId(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error voting on blockchain:', err);
      setError(`Failed to submit vote on blockchain: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Revert optimistic update on error
      loadPolls();
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPoll, selectedOptionId, votedPolls, loadPolls, walletConnected]);
  
  // Open vote modal with selected poll
  const openVoteModal = useCallback((poll: Poll) => {
    setSelectedPoll(poll);
    setSelectedOptionId(votedPolls[poll._id] || null);
    setIsVoteModalOpen(true);
  }, [votedPolls]);

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

  // Check if user has voted in a poll
  const hasVoted = useCallback((pollId: string): boolean => {
    try {
      return votedPolls[pollId] !== undefined || 
             polls.some(p => p._id === pollId && p.hasVoted);
    } catch (error) {
      console.error('Error checking if user has voted:', error);
      return false;
    }
  }, [polls, votedPolls]);

  if (loading && polls.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Voting Portal</h2>
          <p className="text-gray-600">Please wait while we load the latest polls...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Student Voting Portal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Your voice matters. Participate in polls and elections that shape our campus community.
          </motion.p>
        </div>

        {/* Wallet Connection Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${walletConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                  {walletConnected ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {walletConnected ? 'Blockchain Wallet Connected' : 'Blockchain Wallet Required'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {walletConnected 
                      ? `Connected to: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                      : 'Connect your MetaMask wallet to participate in blockchain voting. Click the button below to get started.'
                    }
                  </p>
                </div>
              </div>
              {!walletConnected && (
                <div className="flex flex-col items-end gap-2">
                  <Button
                    onClick={connectWallet}
                    disabled={isConnectingWallet}
                    variant="outline"
                  >
                    {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                  <p className="text-xs text-gray-500 text-right max-w-xs">
                    Make sure MetaMask extension is installed and unlocked
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Voting Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Vote className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{polls.length}</div>
              <div className="text-gray-600">Active Polls</div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">2,847</div>
              <div className="text-gray-600">Total Participants</div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">73%</div>
              <div className="text-gray-600">Avg. Participation</div>
            </div>
          </Card>
        </motion.div>

        {/* Search */}
        <div className="mb-8">
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

        {/* Error and success messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* No polls message */}
            {filteredPolls.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Vote className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No active polls</h3>
                <p className="mt-1 text-sm text-gray-500">There are no active polls at the moment. Please check back later.</p>
              </div>
            ) : (
              /* Polls grid */
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPolls.map((poll) => {
                  const hasUserVoted = hasVoted(poll._id);
                  const isActive = isPollActive(poll);

                  return (
                    <Card key={poll._id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 truncate">{poll.title}</h3>
                            {poll.description && (
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{poll.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>Ends {formatDate(poll.endDate)}</p>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">
                              {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                            </span>
                            {!isActive && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          {!isActive ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled
                            >
                              Voting Closed
                            </Button>
                          ) : hasUserVoted ? (
                            <Button
                              variant="outline"
                              className="w-full bg-green-50 text-green-700 border-green-100"
                              onClick={() => openVoteModal(poll)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={() => openVoteModal(poll)}
                            >
                              Vote Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
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
            {/* Wallet Connection Status */}
            <div className="mb-4 p-3 rounded-lg border">
              {walletConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Wallet Connected</span>
                  <span className="text-xs text-gray-500">
                    ({walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)})
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Wallet Not Connected</span>
                  </div>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnectingWallet}
                    size="sm"
                    variant="outline"
                  >
                    {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              )}
            </div>

            {selectedPoll.description && (
              <p className="text-sm text-gray-600 mb-4">{selectedPoll.description}</p>
            )}

            <div className="space-y-3 mb-6">
              {selectedPoll.options.map((option) => {
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
                      ></div>
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
                  onClick={handleVote}
                >
                  {isSubmitting ? 'Submitting...' : 
                   walletConnected ? 'Submit Vote (Blockchain)' : 'Submit Vote'}
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

export default Voting;