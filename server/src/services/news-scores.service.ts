import { Redis } from 'ioredis';

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

class NewsScoresService {
  private static instance: NewsScoresService;
  private client: Redis;
  private readonly MATCHES_KEY = 'sports:matches';
  private readonly NEWS_KEY = 'news:articles';

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 5000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        console.error('Redis connection error:', err);
        return true;
      }
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis NewsScoresService');
    });
  }

  public static getInstance(): NewsScoresService {
    if (!NewsScoresService.instance) {
      NewsScoresService.instance = new NewsScoresService();
    }
    return NewsScoresService.instance;
  }

  // Match Scores CRUD Operations
  public async createOrUpdateMatch(match: Omit<MatchScore, 'id' | 'updatedAt'>, id?: string): Promise<MatchScore> {
    const matchId = id || `match_${Date.now()}`;
    const now = new Date().toISOString();
    
    const matchData: MatchScore = {
      ...match,
      id: matchId,
      updatedAt: now
    };

    await this.client.hset(
      this.MATCHES_KEY, 
      matchId, 
      JSON.stringify(matchData)
    );

    return matchData;
  }

  public async getMatch(matchId: string): Promise<MatchScore | null> {
    const match = await this.client.hget(this.MATCHES_KEY, matchId);
    return match ? JSON.parse(match) : null;
  }

  public async getAllMatches(): Promise<MatchScore[]> {
    const matches = await this.client.hvals(this.MATCHES_KEY);
    return matches.map(match => JSON.parse(match)).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async deleteMatch(matchId: string): Promise<boolean> {
    const result = await this.client.hdel(this.MATCHES_KEY, matchId);
    return result > 0;
  }

  public async startMatch(matchId: string): Promise<MatchScore | null> {
    const match = await this.getMatch(matchId);
    if (!match) return null;

    return this.createOrUpdateMatch({
      ...match,
      status: 'live',
      startTime: new Date().toISOString() // Update start time when match actually starts
    }, matchId);
  }

  public async endMatch(matchId: string): Promise<MatchScore | null> {
    const match = await this.getMatch(matchId);
    if (!match) return null;

    return this.createOrUpdateMatch({
      ...match,
      status: 'completed',
      endTime: new Date().toISOString()
    }, matchId);
  }

  // News CRUD Operations
  public async createOrUpdateNews(
    article: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
    id?: string
  ): Promise<NewsArticle> {
    const articleId = id || `news_${Date.now()}`;
    const now = new Date().toISOString();
    
    const articleData: NewsArticle = {
      ...article,
      id: articleId,
      publishedAt: article.isPublished ? now : '',
      updatedAt: now
    };

    await this.client.hset(
      this.NEWS_KEY,
      articleId,
      JSON.stringify(articleData)
    );

    return articleData;
  }

  public async getNews(newsId: string): Promise<NewsArticle | null> {
    const article = await this.client.hget(this.NEWS_KEY, newsId);
    return article ? JSON.parse(article) : null;
  }

  public async getAllNews(publishedOnly: boolean = true): Promise<NewsArticle[]> {
    const articles = await this.client.hvals(this.NEWS_KEY);
    const parsed = articles.map(article => JSON.parse(article));
    
    return parsed
      .filter(article => publishedOnly ? article.isPublished : true)
      .sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  public async deleteNews(newsId: string): Promise<boolean> {
    const result = await this.client.hdel(this.NEWS_KEY, newsId);
    return result > 0;
  }

  public async publishNews(newsId: string, publish: boolean = true): Promise<NewsArticle | null> {
    const article = await this.getNews(newsId);
    if (!article) return null;

    return this.createOrUpdateNews({
      ...article,
      isPublished: publish,
      publishedAt: publish && !article.publishedAt ? new Date().toISOString() : article.publishedAt
    }, newsId);
  }
}

export const newsScoresService = NewsScoresService.getInstance();
