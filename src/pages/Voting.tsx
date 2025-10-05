import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { apiFetch } from '../lib/api';
import { io, Socket } from 'socket.io-client';

interface PollOption {
  _id: string;
  text: string;
  votes: number;
}

interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  endDate?: string;
  createdBy?: string;
  hasVoted?: boolean; // provided by backend; student-specific
}

export const Voting: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Poll[]>('/polls');
      console.log('[Voting] loadPolls ->', Array.isArray(data) ? `${data.length} polls` : data);
      setPolls(data);
    } catch (err: any) {
      console.error('[Voting] loadPolls error:', err);
      setError(err.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let s: Socket | null = null;
    let pollId: any = null;

    // Initial fetch
    loadPolls();

    // Realtime via Socket.IO (absolute URL candidates to avoid Vite proxy)
    const socketBase = (import.meta.env.VITE_API_BASE as string || '').replace(/\/api\/?$/, '');
    const candidates = [
      socketBase,
      'http://localhost:4000',
      'http://127.0.0.1:4000',
    ].filter(Boolean);
    let idx = 0;
    const tryConnect = (url: string) => {
      const client = io(url, { path: '/socket.io/' });
      client.on('connect', () => {
        console.log('[Voting] Socket connected to', url);
      });
      client.on('connect_error', () => {
        if (idx < candidates.length - 1) {
          idx += 1;
          client.removeAllListeners();
          client.disconnect();
          tryConnect(candidates[idx]!);
        } else {
          console.warn('All Socket.IO candidates failed for Voting page');
        }
      });
      client.on('polls:updated', (payload: any) => {
        console.log('[Voting] polls:updated received', payload || '');
        loadPolls();
      });
      client.on('polls:new', (payload: any) => {
        console.log('[Voting] polls:new received', payload || '');
        loadPolls();
      });
      client.on('polls:deleted', (payload: any) => {
        console.log('[Voting] polls:deleted received', payload || '');
        loadPolls();
      });
      client.on('polls:visibility', (payload: any) => {
        console.log('[Voting] polls:visibility received', payload || '');
        loadPolls();
      });
      s = client;
    };
    try {
      tryConnect(candidates[idx]!);
    } catch (e) {
      console.warn('Socket init failed; will rely on polling', e);
    }

    // Polling fallback every 10s
    pollId = setInterval(() => loadPolls(), 10000);

    return () => {
      if (pollId) clearInterval(pollId);
      if (s) {
        s.removeAllListeners();
        s.disconnect();
      }
    };
  }, []);
  
  // Pagination settings
  const pollsPerPage = 6;
  
  // Filter and paginate polls
  const filteredPolls = useMemo(() => {
    return polls.filter(poll => {
      const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (poll.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm, polls]);
  
  // Get unique categories from activePolls
  const categories = useMemo(() => {
    return ['all', ...new Set((polls || []).map(poll => (poll.createdBy || 'unknown')))] as string[];
  }, [polls]);
  
  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await apiFetch(`/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId })
      });
      setVotedPolls((prev) => [...prev, pollId]);
      // Optimistically update local state
      setPolls((prev) => prev.map(p => {
        if (p._id !== pollId) return p;
        const updatedOptions = p.options.map(o => o._id === optionId ? { ...o, votes: o.votes + 1 } : o);
        return { ...p, options: updatedOptions, totalVotes: p.totalVotes + 1, hasVoted: true };
      }));
      setIsVoteModalOpen(false);
      setSelectedPoll(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote');
    }
  };

  const openVoteModal = (poll: Poll) => {
    setSelectedPoll(poll);
    setIsVoteModalOpen(true);
  };

  const renderPagination = () => {
    if (filteredPolls.length <= pollsPerPage) return null;
    
    const totalPages = Math.ceil(filteredPolls.length / pollsPerPage);
    const startItem = (currentPage - 1) * pollsPerPage + 1;
    const endItem = Math.min(currentPage * pollsPerPage, filteredPolls.length);

    return (
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{filteredPolls.length}</span> results
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i;
                  
              if (page < 1 || page > totalPages) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8">
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

        {/* Active Polls */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Active Polls</h2>
              <p className="text-gray-600 mt-1">Participate in ongoing polls and make your voice heard</p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock size={16} className="mr-1" />
              Updated in real-time
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search polls..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {filteredPolls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No polls found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-full text-center text-gray-500">Loading polls...</div>
                ) : error ? (
                  <div className="col-span-full text-center text-red-600">{error}</div>
                ) : filteredPolls
                  .slice((currentPage - 1) * pollsPerPage, currentPage * pollsPerPage)
                  .map((poll, index) => (
                    <motion.div
                      key={poll._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="h-full">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 pr-4">{poll.title}</h3>
                            {(poll.hasVoted || votedPolls.includes(poll._id)) && (
                              <div className="flex items-center text-green-600 text-sm">
                                <CheckCircle size={16} className="mr-1" />
                                Voted
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 mb-6">{poll.description}</p>

                          <div className="space-y-4">
                            {poll.options.map((option) => {
                              const percentage = poll.totalVotes > 0 
                                ? (option.votes / poll.totalVotes) * 100 
                                : 0;
                              
                              return (
                                <div key={option._id} className="mb-4">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700">
                                      {option.text}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {option.votes} votes ({percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                              <span>Total votes: {poll.totalVotes}</span>
                              <span>Ends: {poll.endDate ? new Date(poll.endDate).toLocaleDateString() : 'No deadline'}</span>
                            </div>

                            <div className="text-sm text-gray-600 mb-4">
                              Created by: <span className="font-medium">{poll.createdBy}</span>
                            </div>

                            <Button 
                              onClick={() => openVoteModal(poll)}
                              disabled={poll.hasVoted || votedPolls.includes(poll._id)}
                              className="w-full"
                              variant={(poll.hasVoted || votedPolls.includes(poll._id)) ? 'secondary' : 'primary'}
                            >
                              {(poll.hasVoted || votedPolls.includes(poll._id)) ? 'Vote Submitted' : 'Cast Your Vote'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </div>
              
              {renderPagination()}
            </>
          )}
        </div>

        {/* Voting Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Voting Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full text-white mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Login</h3>
              <p className="text-gray-600 text-sm">Use your student ID to ensure secure and verified voting.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full text-white mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">One Vote Per Poll</h3>
              <p className="text-gray-600 text-sm">Each student can vote once per poll to ensure fairness.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-full text-white mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Results</h3>
              <p className="text-gray-600 text-sm">View live results and track poll participation.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vote Modal */}
      {selectedPoll && (
        <Modal
          isOpen={isVoteModalOpen}
          onClose={() => setIsVoteModalOpen(false)}
          title="Cast Your Vote"
          maxWidth="max-w-md"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedPoll.title}
            </h3>
            <p className="text-gray-600 mb-6">{selectedPoll.description}</p>
            
            <div className="space-y-3">
              {selectedPoll.options.map((option) => (
                <button
                  key={option._id}
                  onClick={() => handleVote(selectedPoll._id, option._id)}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{option.text}</div>
                  <div className="text-sm text-gray-500">
                    Current votes: {option.votes}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Note: You can only vote once per poll. This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
