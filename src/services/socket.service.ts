import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

class SocketService extends EventEmitter {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000; // 1 second
  private readonly SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

  private constructor() {
    super();
    this.initialize();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private initialize() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      withCredentials: true,
      timeout: 10000, // 10 seconds
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
      
      if (reason === 'io server disconnect') {
        // Reconnect if the server disconnects us
        setTimeout(() => {
          this.socket?.connect();
        }, this.RECONNECT_DELAY);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('voteUpdate', (data: any) => {
      this.emit('voteUpdate', data);
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
      this.emit('reconnect_failed');
    }
  }

  // Join a poll room
  public joinPoll(pollId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinPoll', pollId);
    } else {
      // Queue the join request if not connected
      const onConnect = () => {
        this.socket?.emit('joinPoll', pollId);
        this.off('connect', onConnect);
      };
      this.once('connect', onConnect);
    }
  }

  // Cast a vote
  public async castVote(pollId: string, optionId: string, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        console.error('Not connected to WebSocket server');
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket.emit('vote', { pollId, optionId, userId }, (response: { success: boolean }) => {
        clearTimeout(timeout);
        resolve(response?.success || false);
      });
    });
  }

  // Subscribe to vote updates
  public subscribeToVoteUpdates(pollId: string, callback: (data: any) => void): () => void {
    const voteUpdateHandler = (data: any) => {
      if (data.pollId === pollId) {
        callback(data);
      }
    };

    this.on('voteUpdate', voteUpdateHandler);

    // Return unsubscribe function
    return () => {
      this.off('voteUpdate', voteUpdateHandler);
    };
  }

  // Check connection status
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  // Disconnect socket
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export const socketService = SocketService.getInstance();
