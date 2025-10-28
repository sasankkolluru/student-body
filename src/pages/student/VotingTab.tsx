import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Vote, 
  Clock, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { format, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface PollOption {
  _id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  _id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasVoted?: boolean;
  selectedOption?: string;
  createdAt: string;
}

export const VotingTab: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
  }, [isAuthenticated, navigate]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  const fetchPolls = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/polls/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (response.status === 401) {
        // Token is invalid or expired, redirect to login
        localStorage.removeItem('token');
        navigate('/login', { state: { from: location } });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch polls');
      }
      
      const data = await response.json();
      const now = new Date();
      
      // Trust the server's isActive status but verify end date
      const processedPolls = (data.polls || []).map((poll: any) => {
        const endDate = new Date(poll.endDate);
        const isActive = poll.isActive && isAfter(endDate, now);
        
        return {
          ...poll,
          isActive,
          options: Array.isArray(poll.options) ? poll.options : [],
          totalVotes: Array.isArray(poll.options) 
            ? poll.options.reduce((sum: number, opt: any) => sum + (Number(opt.votes) || 0), 0)
            : 0
        };
      });
      
      setPolls(processedPolls);
      
    } catch (err) {
      console.error('Failed to fetch polls:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load voting data';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'bottom-right' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;

    const setupWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws/voting`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'POLL_UPDATED' || data.type === 'NEW_POLL') {
              fetchPolls(false); // Silent refresh
              toast('New poll available!', { icon: '📊' });
            }
          } catch (e) {
            console.error('Error processing WebSocket message:', e);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
            console.log(`Attempting to reconnect in ${delay}ms...`);
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              setupWebSocket();
            }, delay);
          } else {
            console.error('Max reconnection attempts reached');
            toast.error('Disconnected from live updates. Please refresh the page.', {
              duration: 5000,
              position: 'bottom-right'
            });
          }
        };
      } catch (err) {
        console.error('WebSocket setup error:', err);
      }
    };

    // Initial fetch and WebSocket setup
    fetchPolls();
    setupWebSocket();

    // Cleanup function
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [fetchPolls]);

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      setIsSubmitting(prev => ({ ...prev, [pollId]: true }));
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: location } });
        return;
      }
      
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ optionId }),
        credentials: 'include'
      });
      
      if (response.status === 401) {
        // Token is invalid or expired, redirect to login
        localStorage.removeItem('token');
        navigate('/login', { state: { from: location } });
        return;
      }

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to submit vote');
      }

      // Optimistic UI update
      setPolls(prevPolls => 
        prevPolls.map(poll => {
          if (poll._id === pollId) {
            const updatedOptions = poll.options.map(opt => ({
              ...opt,
              votes: opt._id === optionId ? opt.votes + 1 : opt.votes,
              voters: opt._id === optionId 
                ? [...(opt.voters || []), 'current-user-id'] // Will be replaced by server data
                : (opt.voters || []).filter((id: string) => id !== 'current-user-id')
            }));
            
            const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt.votes, 0);
            
            return {
              ...poll,
              options: updatedOptions,
              totalVotes,
              hasVoted: true,
              selectedOption: optionId
            };
          }
          return poll;
        })
      );
      
      toast.success('Vote submitted successfully!');
      
      // Refresh data from server to ensure consistency
      fetchPolls(false);
      
    } catch (err) {
      console.error('Vote submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit your vote';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'bottom-right' });
      
      // Revert optimistic update on error
      fetchPolls(false);
    } finally {
      setIsSubmitting(prev => ({ ...prev, [pollId]: false }));
    }
  };

  if (loading && polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
        <p className="text-xl font-medium text-gray-700">Loading voting data...</p>
        <p className="text-sm text-gray-500">Please wait while we load the latest polls</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-red-50 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error loading polls</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => fetchPolls(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setError(null)}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Polls</h1>
          <p className="mt-1 text-sm text-gray-500">
            Participate in ongoing polls and make your voice heard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchPolls(true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Vote className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No active polls available</h3>
          <p className="mt-1 text-gray-500 max-w-md mx-auto">
            There are no active polls at the moment. New polls will appear here when they become available.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => fetchPolls(true)}
              variant="outline"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check for new polls
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <div key={poll._id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col h-full">
              <div className="px-4 py-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                    {poll.description && (
                      <p className="mt-1 text-sm text-gray-600">{poll.description}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    poll.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {poll.isActive ? 'Active' : 'Ended'}
                  </span>
                </div>

                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>
                    {poll.isActive 
                      ? `Ends ${format(new Date(poll.endDate), 'MMM d, yyyy h:mm a')}` 
                      : `Ended on ${format(new Date(poll.endDate), 'MMM d, yyyy')}`}
                  </span>
                </div>

                <div className="mt-4 flex-1">
                  {poll.hasVoted || !poll.isActive ? (
                    <div className="space-y-3">
                      <div className="flex items-center text-sm font-medium text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        {poll.isActive ? 'You have already voted' : 'Poll has ended'}
                      </div>
                      
                      <div className="space-y-2">
                        {poll.options.map((option) => (
                          <div key={option._id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${
                                poll.selectedOption === option._id ? 'text-indigo-700' : 'text-gray-700'
                              }`}>
                                {option.text}
                                {poll.selectedOption === option._id && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Your choice
                                  </span>
                                )}
                              </span>
                              <span className="text-gray-500">
                                {poll.totalVotes > 0 
                                  ? `${Math.round((option.votes / poll.totalVotes) * 100)}%` 
                                  : '0%'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  poll.selectedOption === option._id 
                                    ? 'bg-indigo-600' 
                                    : 'bg-blue-500'
                                }`}
                                style={{
                                  width: `${poll.totalVotes > 0 
                                    ? (option.votes / poll.totalVotes) * 100 
                                    : 0}%`
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-500">
                              {option.votes} vote{option.votes !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-2 text-sm text-gray-500 border-t border-gray-100">
                        Total votes: {poll.totalVotes}
                      </div>
                    </div>
                  ) : (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const selectedOption = formData.get('vote') as string;
                        if (selectedOption) {
                          await handleVote(poll._id, selectedOption);
                        }
                      }}
                      className="space-y-4"
                    >
                      <fieldset className="space-y-3">
                        <legend className="sr-only">Vote for {poll.title}</legend>
                        {poll.options.map((option) => (
                          <div key={option._id} className="flex items-center">
                            <input
                              id={`${poll._id}-${option._id}`}
                              name="vote"
                              type="radio"
                              value={option._id}
                              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                              required
                              disabled={isSubmitting[poll._id]}
                            />
                            <label 
                              htmlFor={`${poll._id}-${option._id}`} 
                              className="ml-3 block text-sm font-medium text-gray-700"
                            >
                              {option.text}
                            </label>
                          </div>
                        ))}
                      </fieldset>
                      
                      <Button
                        type="submit"
                        disabled={isSubmitting[poll._id]}
                        className="w-full justify-center mt-4"
                      >
                        {isSubmitting[poll._id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Vote className="mr-2 h-4 w-4" />
                            Submit Vote
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
              
              {!poll.isActive && (
                <div className="bg-gray-50 px-4 py-3 text-right text-sm text-gray-500 border-t border-gray-200">
                  Poll ended on {format(new Date(poll.endDate), 'MMM d, yyyy h:mm a')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

};

export default VotingTab;
