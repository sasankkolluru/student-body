import { Server as SocketIOServer, Socket } from 'socket.io';
import { newsScoresService } from '../services/news-scores.service';

type MatchUpdatePayload = {
  matchId: string;
  scoreA?: number;
  scoreB?: number;
  status?: 'upcoming' | 'live' | 'completed';
};

type NewsUpdatePayload = {
  newsId: string;
  title?: string;
  content?: string;
  isPublished?: boolean;
};

export class NewsScoresSocket {
  private io: SocketIOServer;
  private adminSockets = new Set<string>();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializeSocket();
  }

  private initializeSocket() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Admin authentication (in a real app, use JWT or similar)
      socket.on('authenticate', async ({ isAdmin, token }: { isAdmin: boolean; token: string }) => {
        if (isAdmin && this.verifyAdminToken(token)) {
          this.adminSockets.add(socket.id);
          socket.emit('authenticated', { success: true });
          console.log(`Admin authenticated: ${socket.id}`);
        } else {
          socket.emit('authenticated', { success: true }); // Regular user
        }
      });

      // Subscribe to match updates
      socket.on('subscribe:matches', async () => {
        socket.join('matches');
        const matches = await newsScoresService.getAllMatches();
        socket.emit('matches:update', matches);
      });

      // Subscribe to news updates
      socket.on('subscribe:news', async () => {
        socket.join('news');
        const news = await newsScoresService.getAllNews();
        socket.emit('news:update', news);
      });

      // Admin-only: Update match score
      socket.on('match:update', async (payload: MatchUpdatePayload, ack: Function) => {
        if (!this.isAdmin(socket)) {
          return ack({ success: false, error: 'Unauthorized' });
        }

        try {
          const match = await newsScoresService.getMatch(payload.matchId);
          if (!match) {
            return ack({ success: false, error: 'Match not found' });
          }

          const updatedMatch = await newsScoresService.createOrUpdateMatch({
            ...match,
            scoreA: payload.scoreA !== undefined ? payload.scoreA : match.scoreA,
            scoreB: payload.scoreB !== undefined ? payload.scoreB : match.scoreB,
            status: payload.status || match.status
          }, payload.matchId);

          this.io.to('matches').emit('match:updated', updatedMatch);
          ack({ success: true, match: updatedMatch });
        } catch (error) {
          console.error('Error updating match:', error);
          ack({ success: false, error: 'Failed to update match' });
        }
      });

      // Admin-only: Start match
      socket.on('match:start', async (matchId: string, ack: Function) => {
        if (!this.isAdmin(socket)) {
          return ack({ success: false, error: 'Unauthorized' });
        }

        try {
          const match = await newsScoresService.startMatch(matchId);
          if (!match) {
            return ack({ success: false, error: 'Match not found' });
          }

          this.io.to('matches').emit('match:updated', match);
          ack({ success: true, match });
        } catch (error) {
          console.error('Error starting match:', error);
          ack({ success: false, error: 'Failed to start match' });
        }
      });

      // Admin-only: End match
      socket.on('match:end', async (matchId: string, ack: Function) => {
        if (!this.isAdmin(socket)) {
          return ack({ success: false, error: 'Unauthorized' });
        }

        try {
          const match = await newsScoresService.endMatch(matchId);
          if (!match) {
            return ack({ success: false, error: 'Match not found' });
          }

          this.io.to('matches').emit('match:updated', match);
          ack({ success: true, match });
        } catch (error) {
          console.error('Error ending match:', error);
          ack({ success: false, error: 'Failed to end match' });
        }
      });

      // Admin-only: Create/Update news
      socket.on('news:update', async (payload: NewsUpdatePayload, ack: Function) => {
        if (!this.isAdmin(socket)) {
          return ack({ success: false, error: 'Unauthorized' });
        }

        try {
          let article;
          if (payload.newsId) {
            const existing = await newsScoresService.getNews(payload.newsId);
            if (!existing) {
              return ack({ success: false, error: 'News article not found' });
            }
            article = await newsScoresService.createOrUpdateNews({
              ...existing,
              title: payload.title || existing.title,
              content: payload.content || existing.content,
              isPublished: payload.isPublished !== undefined ? payload.isPublished : existing.isPublished
            }, payload.newsId);
          } else {
            // Create new article
            article = await newsScoresService.createOrUpdateNews({
              title: payload.title || 'New Article',
              content: payload.content || '',
              author: 'Admin', // In a real app, get from auth
              isPublished: payload.isPublished !== undefined ? payload.isPublished : false
            });
          }

          this.io.to('news').emit('news:updated', article);
          ack({ success: true, article });
        } catch (error) {
          console.error('Error updating news:', error);
          ack({ success: false, error: 'Failed to update news' });
        }
      });

      // Admin-only: Delete news
      socket.on('news:delete', async (newsId: string, ack: Function) => {
        if (!this.isAdmin(socket)) {
          return ack({ success: false, error: 'Unauthorized' });
        }

        try {
          const success = await newsScoresService.deleteNews(newsId);
          if (!success) {
            return ack({ success: false, error: 'News article not found' });
          }

          this.io.to('news').emit('news:deleted', { id: newsId });
          ack({ success: true });
        } catch (error) {
          console.error('Error deleting news:', error);
          ack({ success: false, error: 'Failed to delete news' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.adminSockets.delete(socket.id);
      });
    });
  }

  private isAdmin(socket: Socket): boolean {
    return this.adminSockets.has(socket.id);
  }

  private verifyAdminToken(token: string): boolean {
    // In a real app, verify JWT or other auth token
    // This is a simplified example
    return token === process.env.ADMIN_TOKEN;
  }
}

export default NewsScoresSocket;
