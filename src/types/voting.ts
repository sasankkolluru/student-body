import { BigNumberish } from 'ethers';

export interface VotingResult {
  pollId: string;
  optionId: string;
  voter: string;
  timestamp: number;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  startTime: number;
  endTime: number;
  creator: string;
  isActive: boolean;
}

export interface Vote {
  pollId: string;
  optionId: string;
  voter: string;
  timestamp: number;
}

export interface PollWithResults extends Poll {
  results: {
    [optionId: string]: number;
  };
  totalVotes: number;
  hasVoted: boolean;
}

export interface ContractError extends Error {
  code?: string | number;
  reason?: string;
  error?: {
    code?: string | number;
    message?: string;
    data?: {
      message?: string;
      data?: string;
    };
  };
  transaction?: {
    from: string;
    to: string;
    data: string;
  };
  transactionHash?: string;
  receipt?: {
    status?: number;
    transactionHash: string;
  };
}

// Type guards
export function isContractError(error: unknown): error is ContractError {
  return (
    error instanceof Error &&
    (error as ContractError).code !== undefined
  );
}

// Utility types for contract interactions
export type TransactionResponse = {
  hash: string;
  wait: (confirmations?: number) => Promise<TransactionReceipt>;
};

export type TransactionReceipt = {
  status: number;
  transactionHash: string;
  blockNumber: number;
  confirmations: number;
  from: string;
  to: string;
  events: Event[];
};

export type Event = {
  event: string;
  args: any[];
  getBlock: () => Promise<{ timestamp: number }>;
  getTransactionReceipt: () => Promise<TransactionReceipt>;
};

// Contract ABI types
export type VotingContract = {
  castVote: (pollId: string, optionId: string) => Promise<TransactionResponse>;
  getVoteCount: (pollId: string, optionId: string) => Promise<BigNumberish>;
  hasVoted: (pollId: string, voter: string) => Promise<boolean>;
  getPoll: (pollId: string) => Promise<Poll>;
  createPoll: (question: string, options: string[], endTime: number) => Promise<TransactionResponse>;
  endPoll: (pollId: string) => Promise<TransactionResponse>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
  off: (eventName: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (eventName?: string) => void;
};

// Event types
export interface VoteCastEvent {
  pollId: string;
  optionId: string;
  voter: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface PollCreatedEvent {
  pollId: string;
  creator: string;
  question: string;
  options: string[];
  startTime: number;
  endTime: number;
  blockNumber: number;
  transactionHash: string;
}

export interface PollEndedEvent {
  pollId: string;
  endTime: number;
  blockNumber: number;
  transactionHash: string;
}
