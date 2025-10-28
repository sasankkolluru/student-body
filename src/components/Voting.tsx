import React, { useState } from 'react';
import { useVoting } from '../hooks/useVoting';
import { motion } from 'framer-motion';

interface VotingOption {
  id: string;
  text: string;
}

interface VotingProps {
  pollId: string;
  question: string;
  options: VotingOption[];
  userId: string;
}

export const Voting: React.FC<VotingProps> = ({ pollId, question, options, userId }) => {
  const { votes, isConnected, isVoting, error, castVote, getVotePercentage } = useVoting(pollId);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = async (optionId: string) => {
    if (isVoting || hasVoted) return;
    
    setSelectedOption(optionId);
    const success = await castVote(optionId, userId);
    if (success) {
      setHasVoted(true);
    }
  };

  // Calculate total votes for percentage
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

  return (
    <div className="voting-container">
      <h2 className="text-xl font-bold mb-4">{question}</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Connecting to server... Updates may be delayed.
        </div>
      )}

      <div className="space-y-4">
        {options.map((option) => {
          const voteCount = votes[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
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
                  {(isVoting && isSelected) && (
                    <span className="text-sm text-gray-500">Voting...</span>
                  )}
                  {hasVoted && (
                    <span className="text-sm font-semibold">{percentage}%</span>
                  )}
                </div>
                
                {hasVoted && (
                  <motion.div 
                    className="h-2 bg-blue-200 rounded-full mt-2 overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="h-full bg-blue-500"></div>
                  </motion.div>
                )}
                
                {hasVoted && (
                  <div className="text-xs text-gray-500 mt-1">
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
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
      
      {hasVoted && (
        <div className="mt-4 text-sm text-gray-500">
          Total votes: {totalVotes} • Results update in real-time
        </div>
      )}
    </div>
  );
};

export default Voting;
