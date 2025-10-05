import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Clock, Calendar, Trophy, ArrowRight, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import {
  listNews,
  listMatches,
  createNews,
  createMatch,
  updateMatchScore,
  updateMatchStatus,
  recordCricketBall,
  recordHockeyGoal,
  completeMatch,
  recordKabaddiEvent,
  type NewsItemDto,
  type MatchScoreDto,
} from '../lib/api';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: Date;
  imageUrl?: string;
  author: string;
  category: 'news' | 'announcement' | 'event';
}

interface MatchScore {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: 'upcoming' | 'live' | 'completed';
  time?: string;
  date: Date;
  sport: string;
  venue: string;
  manOfTheMatch?: string;
  details?: {
    cricket?: {
      overs: number;
      balls: number;
      wickets: number;
      events: Array<{ over: number; ball: number; runs: number; wicket?: boolean; boundary4?: boolean; six?: boolean; batter?: string; bowler?: string; description?: string; at: string }>;
    };
    hockey?: {
      period: number;
      events: Array<{ team: 1|2; scorer?: string; assist?: string; minute?: number; description?: string; at: string }>;
    };
  };
}

const NewsAndScores = () => {
  const [activeTab, setActiveTab] = useState<'news' | 'scores'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [newNews, setNewNews] = useState<Omit<NewsItem, 'id' | 'date' | 'author'>>({ 
    title: '', 
    content: '', 
    category: 'news',
    imageUrl: '' 
  });
  const [newMatch, setNewMatch] = useState<Omit<MatchScore, 'id' | 'date'>>({ 
    team1: '',
    team2: '',
    score1: 0,
    score2: 0,
    status: 'upcoming',
    time: '',
    sport: 'Cricket',
    venue: 'University Ground'
  });
  const { currentUser, isAdmin } = useAuth();

  // Per-match admin form state for sport-specific events
  const [cricketInputs, setCricketInputs] = useState<Record<string, { runs: number | ''; wicket: boolean; boundary4: boolean; six: boolean; batter: string; bowler: string }>>({});
  const [hockeyInputs, setHockeyInputs] = useState<Record<string, { team: 1 | 2; scorer: string; assist: string; minute: number | '' }>>({});
  const [motmInputs, setMotmInputs] = useState<Record<string, string>>({});
  const [kabaddiInputs, setKabaddiInputs] = useState<Record<string, { team: 1|2; superRaid: boolean; superTackle: boolean }>>({});
  const [floatingEmojis, setFloatingEmojis] = useState<Record<string, Array<{ id: string; symbol: string }>>>({});

  const pushEmoji = (matchId: string, symbol: string) => {
    const id = Math.random().toString(36).slice(2);
    setFloatingEmojis(prev => ({ ...prev, [matchId]: [{ id, symbol }, ...(prev[matchId] || [])].slice(0, 6) }));
    setTimeout(() => {
      setFloatingEmojis(prev => ({ ...prev, [matchId]: (prev[matchId] || []).filter(e => e.id !== id) }));
    }, 1500);
  };

  // Loaders using REST API
  const loadNews = async () => {
    try {
      const data = await listNews();
      const items: NewsItem[] = (data as NewsItemDto[]).map(n => ({ ...n, date: new Date(n.date) }));
      setNews(items);
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const data = await listMatches();
      const items: MatchScore[] = (data as MatchScoreDto[]).map(m => ({ ...m, date: new Date(m.date) }));
      setMatches(items);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  // Initial load + realtime via Socket.IO + polling fallback
  useEffect(() => {
    let s: Socket | null = null;
    let pollId: any = null;

    // Initial fetch
    loadNews();
    loadMatches();

    // Connect socket using absolute candidates to bypass Vite proxy
    const socketBase = (import.meta.env.VITE_API_BASE as string || '').replace(/\/api\/?$/, '');
    const candidates = [socketBase, 'http://localhost:4000', 'http://127.0.0.1:4000'].filter(Boolean);
    let idx = 0;
    const tryConnect = (url: string) => {
      const client = io(url, { path: '/socket.io/' });
      client.on('connect_error', () => {
        if (idx < candidates.length - 1) {
          idx += 1;
          client.removeAllListeners();
          client.disconnect();
          tryConnect(candidates[idx]!);
        } else {
          console.warn('All Socket.IO candidates failed for News & Scores');
        }
      });
      client.on('news:updated', () => loadNews());
      client.on('scores:updated', () => loadMatches());
      s = client;
    };
    try {
      tryConnect(candidates[idx]!);
    } catch (e) {
      console.warn('Socket init failed, will rely on polling', e);
    }

    // Polling fallback every 5s
    pollId = setInterval(() => {
      loadNews();
      loadMatches();
    }, 5000);

    return () => {
      if (pollId) clearInterval(pollId);
      if (s) {
        s.removeAllListeners();
        s.disconnect();
      }
    };
  }, []);

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await createNews({
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        imageUrl: newNews.imageUrl || undefined,
      });
      setNewNews({ title: '', content: '', category: 'news', imageUrl: '' });
      setIsAddNewsOpen(false);
      await loadNews();
    } catch (error) {
      console.error('Error adding news:', error);
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMatch({
        team1: newMatch.team1,
        team2: newMatch.team2,
        sport: newMatch.sport,
        venue: newMatch.venue,
        status: newMatch.status,
        score1: Number(newMatch.score1) || 0,
        score2: Number(newMatch.score2) || 0,
        time: newMatch.time || undefined,
      });
      
      // Reset form
      setNewMatch({
        team1: '',
        team2: '',
        score1: 0,
        score2: 0,
        status: 'upcoming',
        time: '',
        sport: 'Cricket',
        venue: 'University Ground'
      });
      
      setIsAddMatchOpen(false);
      await loadMatches();
    } catch (error) {
      console.error('Error adding match:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    // Handle both Date objects and string dates
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">News & Live Scores</h1>
          <p className="mt-2 text-lg text-gray-600">
            Stay updated with the latest news and sports scores from around the campus
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('news')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'news'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Latest News
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'scores'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Live Scores
          </button>
        </div>

        {activeTab === 'news' ? (
          <div className="space-y-6">
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsAddNewsOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add News
                </button>
              </div>
            )}

            {news.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {news.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(item.date)}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{item.category}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 line-clamp-3">{item.content}</p>
                      <div className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800">
                        <span>Read more</span>
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No news items found. Check back later for updates.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setIsAddMatchOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Match
                </button>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Live Matches</h2>
              {matches.filter(m => m.status === 'live').length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches
                    .filter(match => match.status === 'live')
                    .map((match) => (
                      <div key={match.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            LIVE
                          </span>
                          <span className="text-sm text-gray-500">{match.sport}</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="text-lg font-medium">{match.team1}</div>
                            <div className="text-xl font-bold">{match.score1}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-lg font-medium">{match.team2}</div>
                            <div className="text-xl font-bold">{match.score2}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{match.time || 'In Progress'}</span>
                          </div>
                          <div className="mt-1">{match.venue}</div>
                        </div>
                        {/* Admin quick controls */}
                        {isAdmin && (
                          <div className="mt-4 flex gap-2">
                            <button
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                              onClick={async () => {
                                try { await updateMatchScore(match.id, match.score1 + 1, match.score2); await loadMatches(); } catch (e) { console.error(e); }
                              }}
                            >+1 {match.team1}</button>
                            <button
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                              onClick={async () => {
                                try { await updateMatchScore(match.id, match.score1, match.score2 + 1); await loadMatches(); } catch (e) { console.error(e); }
                              }}
                            >+1 {match.team2}</button>
                            <button
                              className="ml-auto px-2 py-1 text-xs bg-gray-700 text-white rounded"
                              onClick={async () => {
                                try { await updateMatchStatus(match.id, 'completed'); await loadMatches(); } catch (e) { console.error(e); }
                              }}
                            >Mark Completed</button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">No live matches at the moment. Check back later!</p>
                </div>
              )}
            </div>

            <div className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Matches</h2>
              {matches.filter(m => m.status === 'upcoming').length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Match
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Sport
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date & Time
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Venue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {matches
                        .filter(match => match.status === 'upcoming')
                        .map((match) => (
                          <tr key={match.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="font-medium text-gray-900">{match.team1} vs {match.team2}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {match.sport}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(match.date)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {match.venue}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">No upcoming matches scheduled. Check back later!</p>
                </div>
              )}
            </div>

            <div className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Recent Results</h2>
              {matches.filter(m => m.status === 'completed').length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches
                    .filter(match => match.status === 'completed')
                    .slice(0, 3)
                    .map((match) => (
                      <div key={match.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            COMPLETED
                          </span>
                          <span className="text-sm text-gray-500">{match.sport}</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="text-lg font-medium">{match.team1}</div>
                            <div className="text-xl font-bold">{match.score1}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-lg font-medium">{match.team2}</div>
                            <div className="text-xl font-bold">{match.score2}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                            <span>{match.score1 > match.score2 ? match.team1 : match.team2} won</span>
                          </div>
                          <div className="mt-1">{match.venue}</div>
                          <div className="mt-1">{match.manOfTheMatch ? `MOTM: ${match.manOfTheMatch}` : ''}</div>
                        </div>
                        {isAdmin && (
                          <div className="mt-3 flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Man of the Match"
                              className="border p-2 rounded text-sm flex-1"
                              value={motmInputs[match.id] ?? ''}
                              onChange={(e) => setMotmInputs(prev => ({...prev, [match.id]: e.target.value }))}
                            />
                            <button
                              className="px-3 py-2 text-xs bg-purple-600 text-white rounded"
                              onClick={async () => { try { await completeMatch(match.id, (motmInputs[match.id] || '').trim() || undefined); await loadMatches(); } catch (e) { console.error(e); } }}
                            >Set MOTM</button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">No recent results available. Check back after matches are completed.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add News Modal */}
      {isAddNewsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Add News</h2>
              <button
                onClick={() => setIsAddNewsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddNews}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newNews.title}
                    onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="Enter news title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newNews.category}
                    onChange={(e) => setNewNews({ ...newNews, category: e.target.value as any })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="news">News</option>
                    <option value="announcement">Announcement</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={newNews.content}
                    onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                    rows={4}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="Enter news content"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newNews.imageUrl || ''}
                    onChange={(e) => setNewNews({ ...newNews, imageUrl: e.target.value })}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddNewsOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {isAddMatchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Add Match</h2>
              <button
                onClick={() => setIsAddMatchOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddMatch}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 1 *
                  </label>
                  <input
                    type="text"
                    value={newMatch.team1}
                    onChange={(e) => setNewMatch({ ...newMatch, team1: e.target.value })}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="Team A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 2 *
                  </label>
                  <input
                    type="text"
                    value={newMatch.team2}
                    onChange={(e) => setNewMatch({ ...newMatch, team2: e.target.value })}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="Team B"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport *
                  </label>
                  <select
                    value={newMatch.sport}
                    onChange={(e) => setNewMatch({ ...newMatch, sport: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Table Tennis">Table Tennis</option>
                    <option value="Hockey">Hockey</option>
                    <option value="Athletics">Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={newMatch.status}
                    onChange={(e) => setNewMatch({ ...newMatch, status: e.target.value as any })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 1 Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMatch.score1}
                    onChange={(e) => setNewMatch({ ...newMatch, score1: Number(e.target.value) })}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team 2 Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMatch.score2}
                    onChange={(e) => setNewMatch({ ...newMatch, score2: Number(e.target.value) })}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <input
                    type="text"
                    value={newMatch.venue}
                    onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="University Ground"
                    required
                  />
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                >
                  Add Match
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMatchOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsAndScores;
