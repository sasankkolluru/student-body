import React, { useState, useCallback, useEffect } from 'react';
import { useRealTimeVoting } from '../hooks/useRealTimeVoting';
import { motion, AnimatePresence } from 'framer-motion';

// Sample poll data
const SAMPLE_POLL = {
  id: 'sample_poll_1',
  question: 'What is your favorite programming language?',
  options: [
    { id: 'opt_1', text: 'JavaScript' },
    { id: 'opt_2', text: 'TypeScript' },
    { id: 'opt_3', text: 'Python' },
    { id: 'opt_4', text: 'Java' },
    { id: 'opt_5', text: 'Other' },
  ],
};

const VotePage: React.FC = () => {
  // Generate a unique user ID (in a real app, this would come from auth)
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    votes,
    isConnected,
    isVoting,
    error,
    castVote,
    getVotePercentage,
    getTotalVotes,
  } = useRealTimeVoting({
    pollId: SAMPLE_POLL.id,
    onVoteUpdate: () => setLastUpdated(new Date()),
  });

  // Handle vote submission
  const handleVote = useCallback(async (optionId: string) => {
    if (isVoting || hasVoted) return;
    
    setSelectedOption(optionId);
    const success = await castVote(optionId, userId);
    if (success) {
      setHasVoted(true);
    }
  }, [isVoting, hasVoted, castVote, userId]);

  // Format last updated time
  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return lastUpdated.toLocaleDateString();
  }, [lastUpdated]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Live Poll</h1>
            <div className="flex items-center">
              <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="ml-2 text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{SAMPLE_POLL.question}</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {formatLastUpdated()} • {getTotalVotes()} total votes
              </p>
            )}
          </div>

          <div className="space-y-4">
            {SAMPLE_POLL.options.map((option) => {
              const percentage = getVotePercentage(option.id);
              const isSelected = selectedOption === option.id;
              
              return (
                <div key={option.id} className="relative">
                  <button
                    onClick={() => handleVote(option.id)}
                    disabled={isVoting || hasVoted}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${(isVoting || hasVoted) && !isSelected ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{option.text}</span>
                      {(isVoting && isSelected) ? (
                        <span className="text-sm text-gray-500">Voting...</span>
                      ) : hasVoted ? (
                        <span className="text-sm font-semibold">{percentage}%</span>
                      ) : null}
                    </div>
                    
                    {hasVoted && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{votes[option.id] || 0} votes</span>
                          <span>{percentage}%</span>
                        </div>
                      </div>
                    )}
                  </button>
                  
                  {hasVoted && isSelected && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {hasVoted 
                ? 'Thank you for voting! Results update in real-time.'
                : 'Select an option to cast your vote.'}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                Your ID: {userId.substring(0, 8)}... • Updated: {formatLastUpdated()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotePage;
