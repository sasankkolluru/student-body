import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

interface MatchScore {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'upcoming' | 'live' | 'completed';
  startTime: string;
  endTime?: string;
  updatedAt: string;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  isPublished: boolean;
  imageUrl?: string;
}

class NewsScoresSocketService extends EventEmitter {
  private static instance: NewsScoresSocketService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000; // 1 second
  private readonly SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

  private constructor() {
    super();
    this.initialize();
  }

  public static getInstance(): NewsScoresSocketService {
    if (!NewsScoresSocketService.instance) {
      NewsScoresSocketService.instance = new NewsScoresSocketService();
    }
    return NewsScoresSocketService.instance;
  }

  private initialize() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
      autoConnect: true,
      withCredentials: true,
      timeout: 10000, // 10 seconds
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to NewsScores WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect');
      
      // Re-authenticate if needed
      const token = localStorage.getItem('authToken');
      if (token) {
        this.authenticate(token);
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from NewsScores WebSocket server:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
      
      if (reason === 'io server disconnect') {
        // Reconnect if the server disconnects us
        setTimeout(() => {
          this.socket?.connect();
        }, this.RECONNECT_DELAY);
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('NewsScores WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Handle incoming events
    this.socket.on('match:updated', (match: MatchScore) => {
      this.emit('match:updated', match);
    });

    this.socket.on('matches:update', (matches: MatchScore[]) => {
      this.emit('matches:update', matches);
    });

    this.socket.on('news:updated', (article: NewsArticle) => {
      this.emit('news:updated', article);
    });

    this.socket.on('news:deleted', (data: { id: string }) => {
      this.emit('news:deleted', data);
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

  // Authentication
  public authenticate(token: string): void {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { isAdmin: true, token });
    } else {
      // Queue the authentication for when connected
      const onConnect = () => {
        this.socket?.emit('authenticate', { isAdmin: true, token });
        this.off('connect', onConnect);
      };
      this.once('connect', onConnect);
    }
  }

  // Matches
  public subscribeToMatches(): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:matches');
    } else {
      const onConnect = () => {
        this.socket?.emit('subscribe:matches');
        this.off('connect', onConnect);
      };
      this.once('connect', onConnect);
    }
  }

  public updateMatchScore(
    matchId: string, 
    updates: { scoreA?: number; scoreB?: number; status?: 'upcoming' | 'live' | 'completed' }
  ): Promise<{ success: boolean; match?: MatchScore; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 5000);

      this.socket.emit('match:update', 
        { 
          matchId,
          scoreA: updates.scoreA,
          scoreB: updates.scoreB,
          status: updates.status
        }, 
        (response: { success: boolean; match?: MatchScore; error?: string }) => {
          clearTimeout(timeout);
          resolve(response);
        }
      );
    });
  }

  public startMatch(matchId: string): Promise<{ success: boolean; match?: MatchScore; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 5000);

      this.socket.emit('match:start', matchId, (response: { success: boolean; match?: MatchScore; error?: string }) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  public endMatch(matchId: string): Promise<{ success: boolean; match?: MatchScore; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 5000);

      this.socket.emit('match:end', matchId, (response: { success: boolean; match?: MatchScore; error?: string }) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  // News
  public subscribeToNews(): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:news');
    } else {
      const onConnect = () => {
        this.socket?.emit('subscribe:news');
        this.off('connect', onConnect);
      };
      this.once('connect', onConnect);
    }
  }

  public updateNews(
    newsId: string, 
    updates: { title?: string; content?: string; isPublished?: boolean }
  ): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 5000);

      this.socket.emit('news:update', 
        { 
          newsId,
          ...updates
        }, 
        (response: { success: boolean; article?: NewsArticle; error?: string }) => {
          clearTimeout(timeout);
          resolve(response);
        }
      );
    });
  }

  public createNews(
    data: { title: string; content: string; isPublished: boolean }
  ): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 5000);

      this.socket.emit('news:update', 
        { 
          ...data,
          newsId: '' // Indicates new article
        }, 
        (response: { success: boolean; article?: NewsArticle; error?: string }) => {
          clearTimeout(timeout);
          resolve(response);
        }
      );
    });
  }

  public deleteNews(newsId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timeout' });
      }, 5000);

      this.socket.emit('news:delete', newsId, (response: { success: boolean; error?: string }) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  // Connection status
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  // Disconnect
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export const newsScoresSocket = NewsScoresSocketService.getInstance();
