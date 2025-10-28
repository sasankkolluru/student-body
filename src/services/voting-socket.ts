import { io, Socket } from 'socket.io-client';

// Types
type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  // Add other poll properties as needed
};

// Constants
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds
const HEARTBEAT_INTERVAL = 15000; // 15 seconds

export class VotingSocketService {
  private static instance: VotingSocketService;
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private connectionReject: ((error: Error) => void) | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isExplicitDisconnect = false;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private isConnected = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private newPollSubscribers: Array<(poll: Poll) => void> = [];
  private voteUpdateSubscribers: Array<(update: { pollId: string; optionId: string; voterId: string }) => void> = [];

  private constructor() {
    this.initializeSocket();
    this.setupConnectionMonitor();
  }

  public static getInstance(): VotingSocketService {
    if (!VotingSocketService.instance) {
      VotingSocketService.instance = new VotingSocketService();
    }
    return VotingSocketService.instance;
  }

  public on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback);
    
    // Forward the event from socket to our listeners
    this.socket?.on(event, callback);
    
    // Return cleanup function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      this.socket?.off(event, callback);
    };
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('[VotingSocket] Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.isExplicitDisconnect = false;
      this.lastHeartbeat = Date.now();

      // Clear any pending timeouts
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Resolve any pending connection promise
      if (this.connectionResolve) {
        this.connectionResolve();
        this.cleanupState();
      }
      
      // Start heartbeat monitoring
      this.setupHeartbeat();

      // Notify listeners
      this.emitEvent('connection', {
        status: 'connected',
        timestamp: new Date().toISOString()
      });
    });

    // Connection lost
    this.socket.on('disconnect', (reason: string) => {
      console.log(`[VotingSocket] Disconnected: ${reason}`);
      this.isConnected = false;

      if (this.isExplicitDisconnect) {
        console.log('[VotingSocket] Disconnected by user request');
        return;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[VotingSocket] Attempting to reconnect in ${delay}ms...`);

      // Schedule reconnection
      const reconnectTimer = setTimeout(() => {
        if (!this.isExplicitDisconnect) {
          this.reconnectAttempts++;
          this.reconnect();
        }
      }, delay);

      // Cleanup on unmount
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }
      this.connectionTimeout = reconnectTimer as unknown as NodeJS.Timeout;

      // Notify listeners
      this.emitEvent('connection', {
        status: 'disconnected',
        reason,
        reconnectIn: delay,
        timestamp: new Date().toISOString()
      });
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('[VotingSocket] Connection error:', error.message);
      this.isConnected = false;

      // Reject any pending connection promise
      if (this.connectionReject) {
        this.connectionReject(error);
        this.cleanupState();
      }

      // Handle reconnection if not explicitly disconnected
      if (!this.isExplicitDisconnect) {
        const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`[VotingSocket] Will retry connection in ${delay}ms...`);

        const reconnectTimer = setTimeout(() => {
          if (!this.isExplicitDisconnect) {
            this.reconnectAttempts++;
            this.reconnect();
          }
        }, delay);

        // Cleanup on unmount
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        this.connectionTimeout = reconnectTimer as unknown as NodeJS.Timeout;
      }

      // Notify listeners
      this.emitEvent('connection:error', {
        error: error.message,
        reconnectIn: this.isExplicitDisconnect ? 0 : RECONNECT_DELAY,
        timestamp: new Date().toISOString()
      });
    });

    // Heartbeat/ping-pong for connection monitoring
    if (this.socket.io) {
      this.socket.io.on('ping', () => {
        this.lastHeartbeat = Date.now();
        console.debug('[VotingSocket] Heartbeat received');
      });
    }

    // Handle vote-related events
    this.socket.on('vote:update', (data: unknown) => {
      this.emitEvent('vote:update', data);
    });

    this.socket.on('vote:error', (error: unknown) => {
      console.error('[VotingSocket] Vote error:', error);
      this.emitEvent('vote:error', error);
    });
  }

  private async initializeSocket(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.isConnected && this.socket?.connected) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;

      try {
        // Clean up any existing socket connection
        this.cleanupSocket();

        // Get socket URL from environment or use default
        let socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

        // Ensure proper WebSocket protocol
        if (socketUrl.startsWith('http:')) {
          socketUrl = socketUrl.replace('http', 'ws');
        } else if (!socketUrl.startsWith('ws:') && !socketUrl.startsWith('wss:')) {
          socketUrl = `ws://${socketUrl}`;
        }

        console.log('[VotingSocket] Initializing connection to:', socketUrl);

        // Initialize socket with optimized settings
        this.socket = io(socketUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: RECONNECT_DELAY,
          reconnectionDelayMax: 10000,
          timeout: CONNECTION_TIMEOUT,
          forceNew: true
        });

        // Set up socket event listeners
        this.setupSocketListeners();

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            const error = new Error('Connection timeout');
            console.error('[VotingSocket] Connection timeout');
            
            if (this.connectionReject) {
              this.connectionReject(error);
              this.cleanupState();
            }
            
            this.scheduleReconnect();
          }
        }, CONNECTION_TIMEOUT);

        // Set up one-time connection handler
        const onConnect = () => {
          clearTimeout(connectionTimeout);
          
          if (this.connectionResolve) {
            this.connectionResolve();
            this.cleanupState();
          }
          
          // Start heartbeat monitoring
          this.setupHeartbeat();
        };
        
        // Set up one-time connection handler
        this.socket.once('connect', onConnect);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[VotingSocket] Initialization failed:', errorMsg);
        this.cleanupState();
        reject(new Error(`Failed to initialize socket: ${errorMsg}`));
        this.scheduleReconnect();
      }
    });
    
    return this.connectionPromise;
  }

  private setupConnectionMonitor() {
    // Check connection status periodically
    this.connectionCheckInterval = setInterval(() => {
      if (!this.isConnected) {
        console.log('[VotingSocket] Connection check: Not connected, attempting to reconnect...');
        this.reconnect();
      } else if (Date.now() - this.lastHeartbeat > HEARTBEAT_INTERVAL * 2) {
        console.warn('[VotingSocket] No recent heartbeat, reconnecting...');
        this.reconnect();
      }
    }, HEARTBEAT_INTERVAL);
  }
  
  private setupHeartbeat() {
    // Clear existing interval if any
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Set up new heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, HEARTBEAT_INTERVAL);
  }
  
  private cleanupState() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.connectionPromise = null;
    this.connectionResolve = null;
    this.connectionReject = null;
  }
  
  private cleanupSocket() {
    // Clear all listeners
    if (this.socket) {
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('vote:update');
      this.socket.off('vote:error');
      
      if (this.socket.io) {
        this.socket.io.off('ping');
      }
      
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
  }
  
  private scheduleReconnect() {
    if (this.isExplicitDisconnect) return;
    
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[VotingSocket] Scheduling reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      if (!this.isExplicitDisconnect) {
        this.reconnect();
      }
    }, delay);
  }
  
  private async reconnect() {
    if (this.isExplicitDisconnect) return;
    
    console.log(`[VotingSocket] Attempting to reconnect (attempt ${this.reconnectAttempts + 1})`);
    
    try {
      await this.initializeSocket();
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('[VotingSocket] Reconnection failed:', error);
      this.reconnectAttempts++;
      this.scheduleReconnect();
    }
  }
  
  private emitEvent(event: string, data: unknown) {
    const listeners = this.eventListeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[VotingSocket] Error in event listener for '${event}':`, error);
      }
    }
  }
  
  private async ensureConnected(): Promise<void> {
    if (this.isConnected && this.socket?.connected) {
      return Promise.resolve();
    }
    
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    return this.initializeSocket();
  }
  
  public async vote(pollId: string, optionId: string, userId: string): Promise<void> {
    try {
      await this.ensureConnected();
      
      if (!this.socket || !this.isConnected) {
        throw new Error('Not connected to server');
      }
      
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }
        
        // Set a timeout for the vote operation
        const voteTimeout = setTimeout(() => {
          reject(new Error('Vote operation timed out'));
        }, 10000); // 10 second timeout
        
        this.socket.emit('vote', 
          { 
            pollId, 
            optionId, 
            userId,
            timestamp: Date.now()
          }, 
          (response: { success: boolean; message?: string }) => {
            clearTimeout(voteTimeout);
            
            if (response.success) {
              resolve();
            } else {
              const error = new Error(response.message || 'Failed to cast vote');
              console.error('[VotingSocket] Vote failed:', error);
              reject(error);
              
              // Try to reconnect if the vote failed due to connection issues
              if (response.message?.includes('disconnected') || 
                  response.message?.includes('not connected')) {
                this.scheduleReconnect();
              }
            }
          }
        );
      });
    } catch (error) {
      console.error('[VotingSocket] Error in vote:', error);
      this.scheduleReconnect();
      throw error;
    }
  }
  
  public disconnect() {
    this.isExplicitDisconnect = true;
    this.cleanupSocket();
    
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.cleanupState();
  }
  
  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat ? new Date(this.lastHeartbeat).toISOString() : null
    };
  }
  public subscribeToNewPolls(callback: (poll: Poll) => void): () => void {
    this.newPollSubscribers.push(callback);
    
    // Return cleanup function
    return () => {
      this.newPollSubscribers = this.newPollSubscribers.filter(cb => cb !== callback);
    };
  }

  public subscribeToVoteUpdates(callback: (update: { pollId: string; optionId: string; voterId: string }) => void): () => void {
    this.voteUpdateSubscribers.push(callback);
    
    // Return cleanup function
    return () => {
      this.voteUpdateSubscribers = this.voteUpdateSubscribers.filter(cb => cb !== callback);
    };
  }

  // Simple verification - in a real app, this would check the blockchain
  public verifyVote(pollId: string): boolean {
    // For now, just check localStorage as a simple solution
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '{}');
    return !!votedPolls[pollId];
  }
}

export const votingSocket = VotingSocketService.getInstance();
