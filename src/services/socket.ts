import { io, Socket } from 'socket.io-client';
import { Poll } from '../types/poll';

type PollUpdateData = {
  poll: Poll;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
};

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000; // 1 second
  
  // Store callbacks for poll updates
  private pollUpdateCallbacks: Map<string, (data: PollUpdateData) => void> = new Map();

  private constructor() {
    this.initialize();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private initialize() {
    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
      autoConnect: true,
      withCredentials: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      if (reason === 'io server disconnect') {
        // Reconnect if the server disconnects us
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`);
      setTimeout(() => {
        this.socket?.connect();
      }, this.RECONNECT_DELAY * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Subscribe to poll updates
  public subscribeToPollUpdates(pollId: string, callback: (data: PollUpdateData) => void): () => void {
    if (!this.socket) return () => {};
    
    const eventName = `poll:${pollId}`;
    this.pollUpdateCallbacks.set(`${eventName}:${Date.now()}`, callback);
    
    // Set up the listener if not already set up
    if (!this.socket.hasListeners(eventName)) {
      this.socket.on(eventName, (data: PollUpdateData) => {
        this.pollUpdateCallbacks.forEach(cb => cb(data));
      });
    }
    
    // Return unsubscribe function
    return () => {
      this.pollUpdateCallbacks.delete(eventName);
      if (this.socket && !this.pollUpdateCallbacks.size) {
        this.socket.off(eventName);
      }
    };
  }
  
  // Subscribe to all polls updates (for dashboard)
  public subscribeToAllPolls(callback: (data: PollUpdateData) => void): () => void {
    if (!this.socket) return () => {};
    
    const eventName = 'polls:update';
    const callbackId = `${eventName}:${Date.now()}`;
    this.pollUpdateCallbacks.set(callbackId, callback);
    
    // Set up the listener if not already set up
    if (!this.socket.hasListeners(eventName)) {
      this.socket.on(eventName, (data: PollUpdateData) => {
        this.pollUpdateCallbacks.forEach(cb => cb(data));
      });
    }
    
    // Return unsubscribe function
    return () => {
      this.pollUpdateCallbacks.delete(callbackId);
      if (this.socket && !this.pollUpdateCallbacks.size) {
        this.socket.off(eventName);
      }
    };
  }

  // Cast a vote
  public async castVote(pollId: string, optionId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    if (!this.socket?.connected) {
      console.error('Not connected to WebSocket server');
      return { success: false, message: 'Not connected to server' };
    }

    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, message: 'Socket not initialized' });
      
      this.socket.emit('vote', { 
        pollId, 
        optionId, 
        userId,
        timestamp: new Date().toISOString()
      }, (response: { success: boolean; message?: string }) => {
        resolve(response || { success: false, message: 'Vote failed' });
      });
      
      // Add timeout
      setTimeout(() => {
        resolve({ success: false, message: 'Vote timed out' });
      }, 5000);
    });
  }
  
  // Create a new poll
  public async createPoll(poll: Omit<Poll, '_id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{ success: boolean; poll?: Poll; message?: string }> {
    if (!this.socket?.connected) {
      return { success: false, message: 'Not connected to server' };
    }
    
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, message: 'Socket not initialized' });
      
      this.socket.emit('poll:create', poll, (response: { success: boolean; poll?: Poll; message?: string }) => {
        resolve(response);
      });
      
      setTimeout(() => {
        resolve({ success: false, message: 'Request timed out' });
      }, 5000);
    });
  }
  
  // Update poll status (start/end)
  public async updatePollStatus(pollId: string, status: 'active' | 'ended'): Promise<{ success: boolean; message?: string }> {
    if (!this.socket?.connected) {
      return { success: false, message: 'Not connected to server' };
    }
    
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, message: 'Socket not initialized' });
      
      this.socket.emit('poll:updateStatus', { 
        pollId, 
        status,
        timestamp: new Date().toISOString()
      }, (response: { success: boolean; message?: string }) => {
        resolve(response);
      });
      
      setTimeout(() => {
        resolve({ success: false, message: 'Request timed out' });
      }, 5000);
    });
  }

  // Get current socket connection status
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect socket
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = SocketService.getInstance();
