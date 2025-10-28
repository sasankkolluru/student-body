import { ethers } from 'ethers';
import type { 
  ContractTransactionResponse, 
  Contract as EthersContract,
  BigNumberish,
  EventLog,
  BlockTag,
  Listener,
  EventFilter as EthersEventFilter
} from 'ethers';
import { WalletError, TransactionError } from '../utils/errorHandler';
import { isSupportedNetwork } from '../config';

// Import network config from the correct location
import { SUPPORTED_NETWORKS, NetworkConfig } from '../config/networks';

// Define our own types to avoid conflicts
export type Contract = EthersContract;
export type EventFilter = EthersEventFilter;

declare global {
  interface Window {
    ethereum?: any; // MetaMask's provider
  }
}

// Types
type Address = `0x${string}`;

// Error classes are imported from '../utils/errorHandler'

// Data interfaces
export interface VoteData {
  pollId: string;
  optionId: string;
  voter: Address;
  timestamp: number;
  transactionHash: string;
}

export interface PollData {
  question: string;
  options: string[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  creator: Address;
}

export interface PollResult {
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  totalVotes: number;
  endTime: number;
  isActive: boolean;
}

interface ContractError extends Error {
  code: string;
  reason?: string;
  method?: string;
  transaction?: {
    to?: string;
    from?: string;
    data?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

export interface TransactionReceipt {
  status: number;
  transactionHash: string;
  blockNumber?: number;
  confirmations: number;
  from: string;
  to?: string;
  events: Array<{
    event: string;
    args: Record<string, unknown>;
  }>;
}

// Voting contract ABI is now defined as a class property

// Define VotingContract as a type rather than an interface extending Contract
export type VotingContract = Contract & {
  castVote(
    pollId: string,
    optionId: string,
    overrides?: { gasLimit?: BigNumberish }
  ): Promise<ContractTransactionResponse>;
  
  getVoteCount(
    pollId: string,
    optionId: string,
    overrides?: { blockTag?: BlockTag }
  ): Promise<bigint>;
  
  hasVoted(
    pollId: string,
    voter: string,
    overrides?: { blockTag?: BlockTag }
  ): Promise<boolean>;
  
  getPoll(
    pollId: string,
    overrides?: { blockTag?: BlockTag }
  ): Promise<[string, string[], number, number, boolean, string]>;
  
  createPoll(
    question: string,
    options: string[],
    endTime: number,
    overrides?: { gasLimit?: BigNumberish }
  ): Promise<ContractTransactionResponse>;
  
  endPoll(
    pollId: string,
    overrides?: { gasLimit?: BigNumberish }
  ): Promise<ContractTransactionResponse>;
  
  filters: {
    VoteCast(
      voter?: string | null,
      pollId?: string | null,
      optionId?: null
    ): EventFilter;
  };
  
  on(
    event: string,
    listener: Listener
  ): VotingContract;
  
  queryFilter(
    event: EventFilter,
    fromBlock?: BlockTag,
    toBlock?: BlockTag
  ): Promise<EventLog[]>;
}

// Contract addresses are now managed through SUPPORTED_NETWORKS in config

// Network config is imported from '../config/networks'

export class BlockchainService {
  private static _instance: BlockchainService | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private votingContract: VotingContract | null = null;
  private votingContractReadonly: VotingContract | null = null;
  private readonlyProvider: ethers.JsonRpcProvider | null = null;
  private currentAccount: string | null = null;
  private currentNetworkId: number | null = null;
  private isInitialized = false;
  private eventListenersMap: Record<string, Array<(...args: any[]) => void>> = {};
  
  // Contract ABI - using const assertion for type safety
  private readonly VOTING_ABI = [
    'function castVote(string memory pollId, string memory optionId) external',
    'function getVoteCount(string memory pollId, string memory optionId) external view returns (uint256)',
    'function hasVoted(string memory pollId, address voter) external view returns (bool)',
    'function getPoll(string memory pollId) external view returns (string memory, string[] memory, uint256, uint256, bool, address)',
    'function createPoll(string memory question, string[] memory options, uint256 endTime) external',
    'function endPoll(string memory pollId) external',
    'event VoteCast(address indexed voter, string indexed pollId, string optionId, uint256 timestamp)',
    'event PollCreated(uint256 indexed pollId, string question, address indexed creator)',
    'event PollEnded(uint256 indexed pollId)'
  ] as const;

  // Singleton pattern
  public static getInstance(): BlockchainService {
    if (!BlockchainService._instance) {
      BlockchainService._instance = new BlockchainService();
    }
    return BlockchainService._instance;
  }

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  //#region Initialization
  
  /**
   * Initialize the blockchain service
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!window.ethereum) {
      throw new WalletError('No ethereum provider found. Please install MetaMask!', 'NO_ETHEREUM_PROVIDER');
    }

    try {
      // Initialize provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access if needed
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.handleAccountsChanged(accounts);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Get the network ID
      const network = await this.provider.getNetwork();
      this.currentNetworkId = Number(network.chainId);
      
      // Initialize contract
      await this.initializeContract();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw new WalletError(
        'Failed to initialize blockchain service', 
        'INITIALIZATION_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Initialize the voting contract
   */
  private async initializeContract(): Promise<void> {
    if (!this.provider) {
      throw new WalletError('Provider not initialized', 'PROVIDER_NOT_INITIALIZED');
    }
    // Get the signer
    this.signer = await this.provider.getSigner();
    // Get the current network
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);
    // Get contract address for the current network
    const contractAddress = this.getContractAddress(chainId);
    if (!contractAddress) {
      throw new WalletError(
        `No contract address found for network ${chainId}`,
        'UNSUPPORTED_NETWORK'
      );
    }
    // Create contract instance
    this.votingContract = new ethers.Contract(
      contractAddress,
      this.VOTING_ABI,
      this.signer
    ) as VotingContract;
    // Subscribe to contract events with signer-backed instance
    this.subscribeToContractEvents(this.votingContract);
  }
  
  /**
   * Get contract address for the current network
   * @param chainId - The chain ID
   * @returns The contract address or undefined if not found
   */
  private getContractAddress(chainId: number): string | undefined {
    const networkConfig = SUPPORTED_NETWORKS[chainId];
    return networkConfig?.contractAddress;
  }
  
  //#endregion
  
  //#region Wallet Connection
  
  /**
   * Connect to the user's wallet
   * @returns The connected wallet address
   */
  public async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new WalletError('No ethereum provider found. Please install MetaMask!', 'NO_ETHEREUM_PROVIDER');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new WalletError('No accounts found', 'NO_ACCOUNTS');
      }
      
      this.currentAccount = accounts[0];
      if (!this.currentAccount) {
        throw new WalletError('No account connected', 'NO_ACCOUNT');
      }
      return this.currentAccount;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new WalletError(
        'Failed to connect wallet', 
        'WALLET_CONNECTION_ERROR',
        error instanceof Error ? error.message : undefined
      );
    }
  }
  
  /**
   * Get the current wallet address
   * @returns The current wallet address or null if not connected
   */
  public getCurrentAddress(): string | null {
    return this.currentAccount;
  }
  
  /**
   * Get the current network ID
   * @returns The current network ID or null if not connected
   */
  public getCurrentNetworkId(): number | null {
    return this.currentNetworkId;
  }
  
  /**
   * Get the current network name
   * @returns The current network name or null if not connected
   */
  public getCurrentNetworkName(): string | null {
    if (!this.currentNetworkId) return null;
    return SUPPORTED_NETWORKS[this.currentNetworkId]?.name || `Unknown (${this.currentNetworkId})`;
  }
  
  /**
   * Check if the current network is supported
   * @returns True if the current network is supported
   */
  public isNetworkSupported(): boolean {
    if (!this.currentNetworkId) return false;
    return isSupportedNetwork(this.currentNetworkId);
  }
  
  /**
   * Get the list of supported networks
   * @returns Array of supported network configurations
   */
  public getSupportedNetworks(): NetworkConfig[] {
    return Object.values(SUPPORTED_NETWORKS);
  }
  
  //#endregion
  
  //#region Event Handling
  
  /**
   * Add an event listener
   * @param event - The event name
   * @param callback - The callback function
   * @returns A function to remove the event listener
   */
  public on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.eventListenersMap[event]) {
      this.eventListenersMap[event] = [];
    }
    this.eventListenersMap[event].push(callback);

    // Return cleanup function
    return () => {
      this.eventListenersMap[event] = this.eventListenersMap[event].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Emit an event
   * @param event - The event name
   * @param args - The event arguments
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListenersMap[event] || [];
    for (const listener of listeners) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    }
  }
  
  /**
   * Handle accounts changed event
   * @param accounts - The new accounts
   */
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      this.currentAccount = null;
      this.emit('disconnected');
    } else if (this.currentAccount !== accounts[0]) {
      this.currentAccount = accounts[0];
      this.emit('accountsChanged', this.currentAccount);
    }
  }
  
  /**
   * Handle chain changed event
   * @param chainId - The new chain ID
   */
  private handleChainChanged(chainId: string): void {
    this.currentNetworkId = parseInt(chainId, 16);
    this.emit('chainChanged', this.currentNetworkId);
    
    // Re-initialize contract when network changes
    this.initializeContract().catch(error => {
      console.error('Failed to reinitialize contract after chain change:', error);
      this.emit('error', new WalletError(
        'Failed to connect to contract on the new network', 
        'CONTRACT_INIT_ERROR',
        error instanceof Error ? error.message : undefined
      ));
    });
  }
  
  /**
   * Handle disconnect event
   * @param error - The error object
   */
  private handleDisconnect(error: any): void {
    console.error('Provider disconnected:', error);
    this.emit('disconnected', error);
  }
  
  /**
   * Set up event listeners for the Ethereum provider
   */
  private setupEventListeners(): void {
    if (!window.ethereum) return;
    
    // Remove any existing listeners first to prevent duplicates
    if (window.ethereum.removeListener) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.removeListener('chainChanged', this.handleChainChanged.bind(this));
      window.ethereum.removeListener('disconnect', this.handleDisconnect.bind(this));
    }
    
    // Add event listeners
    window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
    window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    
    // Cleanup function
    const cleanup = () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged.bind(this));
        window.ethereum.removeListener('chainChanged', this.handleChainChanged.bind(this));
        window.ethereum.removeListener('disconnect', this.handleDisconnect.bind(this));
      }
    };
    
    // Clean up on service destruction
    this.on('disconnected', cleanup);
  }
  
  //#endregion

  //#region Contract Interactions
  
  /**
   * Cast a vote in a poll
   * @param pollId - The ID of the poll
   * @param optionId - The ID of the option to vote for
   * @returns Transaction receipt
   */
  public async castVote(pollId: string, optionId: string): Promise<TransactionReceipt> {
    if (!this.votingContract) {
      throw new WalletError('Contract not initialized', 'CONTRACT_NOT_INITIALIZED');
    }
    
    if (!this.currentAccount) {
      throw new WalletError('No account connected', 'NO_ACCOUNT');
    }
    
    try {
      // Check if already voted
      const hasVoted = await this.votingContract.hasVoted(pollId, this.currentAccount);
      if (hasVoted) {
        throw new TransactionError('You have already voted in this poll', 'ALREADY_VOTED');
      }
      
      // Send transaction with fixed gas limit
      const tx = await this.votingContract.castVote(pollId, optionId, {
        gasLimit: ethers.parseUnits("300000", "wei") // Fixed gas limit
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Emit event
      this.emit('voteCast', {
        pollId,
        optionId,
        voter: this.currentAccount,
        transactionHash: receipt?.hash || ''
      });
      
      if (!receipt) {
        throw new TransactionError('Failed to get transaction receipt', 'NO_RECEIPT');
      }
      return this.formatTransactionReceipt(receipt);
    } catch (error) {
      this.handleContractError(error, 'Failed to cast vote');
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Get the vote count for a specific option in a poll
   * @param pollId - The ID of the poll
   * @param optionId - The ID of the option
   * @returns The number of votes for the option
   */
  public async getVoteCount(pollId: string, optionId: string): Promise<number> {
    if (!this.votingContract) {
      throw new WalletError('Contract not initialized', 'CONTRACT_NOT_INITIALIZED');
    }
    
    try {
      const count = await this.votingContract.getVoteCount(pollId, optionId);
      return Number(count);
    } catch (error) {
      this.handleContractError(error, 'Failed to get vote count');
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Check if an address has voted in a poll
   * @param pollId - The ID of the poll
   * @param voterAddress - The address to check
   * @returns True if the address has voted, false otherwise
   */
  public async hasVoted(pollId: string, voterAddress?: string): Promise<boolean> {
    if (!this.votingContract) {
      throw new WalletError('Contract not initialized', 'CONTRACT_NOT_INITIALIZED');
    }
    
    const addressToCheck = voterAddress || this.currentAccount;
    if (!addressToCheck) {
      throw new WalletError('No account provided and no connected account', 'NO_ACCOUNT');
    }
    
    try {
      return await this.votingContract.hasVoted(pollId, addressToCheck);
    } catch (error) {
      this.handleContractError(error, 'Failed to check voting status');
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Get poll details
   * @param pollId - The ID of the poll
   * @returns Poll data including question, options, and metadata
   */
  public async getPoll(pollId: string): Promise<PollData> {
    if (!this.votingContract) {
      throw new WalletError('Contract not initialized', 'CONTRACT_NOT_INITIALIZED');
    }
    
    try {
      const [question, options, startTime, endTime, isActive, creator] = 
        await this.votingContract.getPoll(pollId);
      
      return {
        question,
        options,
        startTime,
        endTime: Number(endTime) * 1000, // Convert to milliseconds
        isActive,
        creator: creator as `0x${string}`
      };
    } catch (error) {
      this.handleContractError(error, 'Failed to get poll');
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * Create a new poll
   * @param question - The poll question
   * @param options - Array of option strings
   * @param endTime - End time as a Unix timestamp (in seconds)
   * @returns Transaction receipt
   */
  public async createPoll(
    question: string,
    options: string[],
    endTime: number
  ): Promise<TransactionReceipt> {
    if (!this.votingContract) {
      throw new WalletError('Contract not initialized', 'CONTRACT_NOT_INITIALIZED');
    }
    
    if (!this.currentAccount) {
      throw new WalletError('No account connected', 'NO_ACCOUNT');
    }
    
    try {
      // Validate input
      if (!question.trim()) {
        throw new TransactionError('Question cannot be empty', 'INVALID_INPUT');
      }
      
      if (options.length < 2) {
        throw new TransactionError('At least two options are required', 'INVALID_INPUT');
      }
      
      const now = Math.floor(Date.now() / 1000);
      if (endTime <= now) {
        throw new TransactionError('End time must be in the future', 'INVALID_INPUT');
      }
      
      // Send transaction with fixed gas limit
      const tx = await this.votingContract.createPoll(question, options, endTime, {
        gasLimit: ethers.parseUnits("500000", "wei") // Fixed gas limit
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Emit event
      this.emit('pollCreated', {
        question,
        options,
        endTime,
        creator: this.currentAccount,
        transactionHash: receipt?.hash || ''
      });
      
      if (!receipt) {
        throw new TransactionError('Failed to get transaction receipt', 'NO_RECEIPT');
      }
      return this.formatTransactionReceipt(receipt);
    } catch (error) {
      this.handleContractError(error, 'Failed to create poll');
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  /**
   * End a poll
   * @param pollId - The ID of the poll to end
   * @returns Transaction receipt
   */
  public async endPoll(pollId: string): Promise<TransactionReceipt> {
    if (!this.votingContract) {
      throw new WalletError('Contract not initialized', 'CONTRACT_NOT_INITIALIZED');
    }
    
    if (!this.currentAccount) {
      throw new WalletError('No account connected', 'NO_ACCOUNT');
    }
    
    try {
      // Get poll details to verify ownership
      const poll = await this.getPoll(pollId);
      
      if (poll.creator.toLowerCase() !== this.currentAccount.toLowerCase()) {
        throw new TransactionError('Only the poll creator can end the poll', 'UNAUTHORIZED');
      }
      
      if (!poll.isActive) {
        throw new TransactionError('Poll is already ended', 'INVALID_STATE');
      }
      
      // Send transaction with fixed gas limit
      const tx = await this.votingContract.endPoll(pollId, {
        gasLimit: ethers.parseUnits("300000", "wei") // Fixed gas limit
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new TransactionError('Failed to get transaction receipt', 'RECEIPT_ERROR');
      }
      
      // Emit event
      this.emit('pollEnded', {
        pollId,
        ender: this.currentAccount,
        transactionHash: receipt.hash
      });
      
      return this.formatTransactionReceipt(receipt);
    } catch (error) {
      this.handleContractError(error, 'Failed to end poll');
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  //#endregion
  
  //#region Helper Methods
  
  /**
   * Format transaction receipt for consistent response
   */
  private formatTransactionReceipt(receipt: ethers.ContractTransactionReceipt): TransactionReceipt {
    return {
      status: receipt.status || 0,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      confirmations: Number(receipt.confirmations),
      from: receipt.from,
      to: receipt.to ?? undefined,
      events: receipt.logs.map(log => ({
        ...log,
        event: log.topics[0],
        args: log.data ? JSON.parse(log.data) : {}
      }))
    };
  }
  
  /**
   * Handle contract errors consistently
   */
  private handleContractError(error: unknown, defaultMessage: string): void {
    console.error('Contract error:', error);
    
    // Check for common error cases
    if (this.isContractError(error)) {
      const { code, reason } = error;
      
      // Handle specific error codes
      if (code === 'CALL_EXCEPTION') {
        throw new TransactionError(
          'Failed to execute contract call. Make sure you have the correct permissions.',
          'CALL_EXCEPTION',
          reason
        );
      } else if (code === 'INSUFFICIENT_FUNDS') {
        throw new TransactionError(
          'Insufficient funds to complete the transaction',
          'INSUFFICIENT_FUNDS',
          reason
        );
      } else if (code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new TransactionError(
          'Transaction would fail. Check your inputs and try again.',
          'TRANSACTION_REVERTED',
          reason
        );
      } else if (code === 'ACTION_REJECTED') {
        throw new TransactionError(
          'Transaction was rejected by user',
          'USER_REJECTED',
          reason
        );
      }
    }
    
    // For other errors, rethrow with the original message if available
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    throw new TransactionError(errorMessage, 'CONTRACT_ERROR', error instanceof Error ? error.message : undefined);
  }
  
  /**
   * Type guard for contract errors
   */
  private isContractError(error: unknown): error is ContractError {
    return (
      typeof error === 'object' && 
      error !== null && 
      'code' in error && 
      typeof (error as any).code === 'string'
    );
  }
  
  //#region Event Listeners
  
  /**
   * Subscribe to on-chain contract events
   */
  private subscribeToContractEvents(contract?: VotingContract): void {
    const target = contract || this.votingContract;
    if (!target) return;
    try {
      (target as any).removeAllListeners?.('PollCreated');
      (target as any).removeAllListeners?.('VoteCast');
      (target as any).removeAllListeners?.('PollEnded');
      target.on('PollCreated', (...args: any[]) => {
        this.emit('pollCreated', ...args);
      });
      target.on('VoteCast', (...args: any[]) => {
        this.emit('voteCast', ...args);
      });
      target.on('PollEnded', (...args: any[]) => {
        this.emit('pollEnded', ...args);
      });
    } catch (error) {
      console.error('Failed to subscribe to contract events', error);
    }
  }

  /**
   * Start read-only event listeners when wallet is not connected
   */
  public async startReadOnlyListeners(chainId?: number): Promise<void> {
    try {
      const id = chainId ?? this.currentNetworkId ?? 5; // default fallback chainId
      const networkConfig = SUPPORTED_NETWORKS[id];
      if (!networkConfig?.rpcUrl || !networkConfig.contractAddress) {
        console.warn('Missing RPC URL or contract address for read-only event subscription', { chainId: id });
        return;
      }
      this.readonlyProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const roContract = new ethers.Contract(
        networkConfig.contractAddress,
        this.VOTING_ABI,
        this.readonlyProvider
      ) as VotingContract;
      this.votingContractReadonly = roContract;
      this.subscribeToContractEvents(this.votingContractReadonly);
    } catch (error) {
      console.error('Failed to start read-only listeners', error);
    }
  }
  
  //#endregion
}

// Create a single instance of the service
export const blockchainService = BlockchainService.getInstance();

// Export error types for use in components
export { 
  AppError, 
  WalletError, 
  TransactionError,
  ApiError,
  ERROR_CODES
} from '../utils/errorHandler';
