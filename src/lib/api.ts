import { activePolls as seedPolls } from '../data/mockData';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
const USE_MOCK = (import.meta.env.VITE_USE_MOCK || '').toString().toLowerCase() === 'true';

export const getAuthToken = () => localStorage.getItem('auth_token') || '';
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const clearAuthToken = () => localStorage.removeItem('auth_token');

async function withTimeoutFetch(resource: RequestInfo | URL, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(resource: RequestInfo | URL, options: RequestInit, retries = 2, backoffBaseMs = 400): Promise<Response> {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= retries) {
    try {
      const res = await withTimeoutFetch(resource, options, 12000);
      return res;
    } catch (err: any) {
      lastErr = err;
      // Retry only on network errors/aborts
      if (attempt === retries) break;
      const delay = backoffBaseMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr;
}

// -----------------------------
// Mock API implementation
// -----------------------------
type MockPollOption = { _id: string; text: string; votes: number };

type MockMessage = {
  _id: string;
  subject: string;
  content: string;
  name?: string;
  email?: string;
  createdAt: string;
};
type MockPoll = {
  _id: string;
  title: string;
  description?: string;
  options: MockPollOption[];
  totalVotes: number;
  endDate?: string;
  createdBy?: string;
};

const LS_KEYS = {
  POLLS: 'mock_polls',
  USERS: 'mock_users',
  NEWS: 'mock_news',
  MATCHES: 'mock_matches',
  MESSAGES: 'mock_messages',
};

function seedMockPolls(): MockPoll[] {
  const existing = localStorage.getItem(LS_KEYS.POLLS);
  if (existing) return JSON.parse(existing);
  // Transform seedPolls (from mockData) to match Voting.tsx expectations
  const polls: MockPoll[] = (seedPolls || []).map((p, idx) => ({
    _id: p.id || String(idx + 1),
    title: (p as any).title || (p as any).question || 'Untitled',
    description: (p as any).description || '',
    options: (p.options || []).map((o, i) => ({ _id: o.id || String(i + 1), text: o.text, votes: o.votes })),
    totalVotes: (p as any).totalVotes ?? (p.options || []).reduce((sum, o) => sum + (o.votes || 0), 0),
    endDate: (p as any).endDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    createdBy: (p as any).createdBy || 'Student Council',
  }));
  localStorage.setItem(LS_KEYS.POLLS, JSON.stringify(polls));
  return polls;
}

function readMockPolls(): MockPoll[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.POLLS);
    return raw ? JSON.parse(raw) : seedMockPolls();
  } catch {
    return seedMockPolls();
  }
}

function writeMockPolls(polls: MockPoll[]) {
  localStorage.setItem(LS_KEYS.POLLS, JSON.stringify(polls));
}

async function mockApiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  // Very small router for endpoints used in the app
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://mock.local');
  const pathname = url.pathname;

  // Auth endpoints
  if (pathname === '/auth/login' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const user = {
      id: 'u1',
      email: body.email,
      name: body.email?.split('@')[0] || 'User',
      role: body.role || 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const token = 'mock-token-' + Math.random().toString(36).slice(2);
    setAuthToken(token);
    return { token, user } as T;
  }
  if (pathname === '/auth/register' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const user = {
      id: 'u' + Math.random().toString(36).slice(2),
      email: body.email,
      name: body.name || 'New User',
      role: body.role || 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const token = 'mock-token-' + Math.random().toString(36).slice(2);
    setAuthToken(token);
    return { token, user } as T;
  }
  if (pathname === '/auth/me' && method === 'GET') {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const user = {
      id: 'u1',
      email: 'mock@student.edu',
      name: 'Mock User',
      role: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { user } as T;
  }

  // Polls endpoints
  if (pathname === '/polls' && method === 'GET') {
    const polls = readMockPolls();
    return polls as unknown as T;
  }
  if (pathname === '/polls' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const polls = readMockPolls();
    const newPoll: MockPoll = {
      _id: Math.random().toString(36).slice(2),
      title: body.title || 'Untitled',
      description: body.description || '',
      options: (body.options || []).map((text: string, i: number) => ({ _id: String(i + 1), text, votes: 0 })),
      totalVotes: 0,
      endDate: body.endDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      createdBy: 'Student Council',
    };
    const next = [newPoll, ...polls];
    writeMockPolls(next);
    return newPoll as unknown as T;
  }
  const voteMatch = pathname.match(/^\/polls\/(.+)\/vote$/);
  if (voteMatch && method === 'POST') {
    const pollId = voteMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const optionId = body.optionId;
    const polls = readMockPolls();
    const idx = polls.findIndex(p => p._id === pollId);
    if (idx === -1) throw new Error('Poll not found');
    const poll = polls[idx];
    const oIdx = poll.options.findIndex(o => o._id === optionId);
    if (oIdx === -1) throw new Error('Option not found');
    poll.options[oIdx] = { ...poll.options[oIdx], votes: poll.options[oIdx].votes + 1 };
    poll.totalVotes += 1;
    polls[idx] = { ...poll };
    writeMockPolls(polls);
    return { success: true } as T;
  }
  const deleteMatch = pathname.match(/^\/polls\/(.+)$/);
  if (deleteMatch && method === 'DELETE') {
    const pollId = deleteMatch[1];
    const polls = readMockPolls().filter(p => p._id !== pollId);
    writeMockPolls(polls);
    return { success: true } as T;
  }

  // Messages endpoints
  if (pathname === '/messages' && method === 'GET') {
    const list = readMockMessages().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list as unknown as T;
  }
  if (pathname === '/messages' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (!body.subject || !body.content) throw new Error('subject and content are required');
    const items = readMockMessages();
    const msg: MockMessage = {
      _id: Math.random().toString(36).slice(2),
      subject: String(body.subject),
      content: String(body.content),
      name: body.name || undefined,
      email: body.email || undefined,
      createdAt: new Date().toISOString(),
    };
    const next = [msg, ...items];
    writeMockMessages(next);
    return msg as unknown as T;
  }

  // News endpoints
  if (pathname === '/news' && method === 'GET') {
    return readMockNews() as unknown as T;
  }
  if (pathname === '/news' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockNews();
    const item: MockNews = {
      id: Math.random().toString(36).slice(2),
      title: body.title || 'Untitled',
      content: body.content || '',
      category: body.category || 'news',
      imageUrl: body.imageUrl || '',
      author: 'Admin',
      date: new Date().toISOString(),
    };
    const next = [item, ...items];
    writeMockNews(next);
    return item as unknown as T;
  }

  // Matches endpoints
  if (pathname === '/matches' && method === 'GET') {
    return readMockMatches() as unknown as T;
  }
  if (pathname === '/matches' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const match: MockMatch = {
      id: Math.random().toString(36).slice(2),
      team1: body.team1 || 'Team A',
      team2: body.team2 || 'Team B',
      sport: body.sport || 'Sport',
      venue: body.venue || 'Venue',
      status: body.status || 'upcoming',
      score1: Number(body.score1 ?? 0),
      score2: Number(body.score2 ?? 0),
      time: body.time || '',
      date: new Date().toISOString(),
    };
    const next = [match, ...items];
    writeMockMatches(next);
    return match as unknown as T;
  }
  const scoreMatch = pathname.match(/^\/matches\/([^/]+)\/score$/);
  if (scoreMatch && method === 'PUT') {
    const id = scoreMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Match not found');
    const updated = { ...items[idx], score1: Number(body.score1 ?? items[idx].score1), score2: Number(body.score2 ?? items[idx].score2) };
    const next = [...items];
    next[idx] = updated;
    writeMockMatches(next);
    return updated as unknown as T;
  }
  const statusMatch = pathname.match(/^\/matches\/([^/]+)\/status$/);
  if (statusMatch && method === 'PUT') {
    const id = statusMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Match not found');
    const updated = { ...items[idx], status: body.status || items[idx].status };
    const next = [...items];
    next[idx] = updated;
    writeMockMatches(next);
    return updated as unknown as T;
  }

  // Mock: cricket ball event
  const cricketEvent = pathname.match(/^\/matches\/([^/]+)\/cricket\/ball$/);
  if (cricketEvent && method === 'POST') {
    const id = cricketEvent[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Match not found');
    const match = items[idx];
    if ((match.sport || '').toLowerCase() !== 'cricket') throw new Error('Not a cricket match');
    if (match.status !== 'live') throw new Error('Match must be live');
    const det = (match.details?.cricket) || { overs: 0, balls: 0, wickets: 0, events: [] as any[] };
    let balls = det.balls + 1;
    let overs = det.overs;
    if (balls >= 6) { overs += 1; balls = 0; }
    const wickets = det.wickets + (body.wicket ? 1 : 0);
    const runs = Number(body.runs ?? (body.six ? 6 : body.boundary4 ? 4 : 0)) || 0;
    const event = {
      over: overs,
      ball: balls,
      runs,
      wicket: !!body.wicket,
      boundary4: !!body.boundary4,
      six: !!body.six,
      batter: body.batter || '',
      bowler: body.bowler || '',
      description: body.description || '',
      at: new Date().toISOString(),
    };
    const updated = {
      ...match,
      score1: (match.score1 || 0) + runs,
      details: { ...match.details, cricket: { overs, balls, wickets, events: [event, ...(det.events || [])] } },
    };
    const next = [...items];
    next[idx] = updated as any;
    writeMockMatches(next);
    return updated as unknown as T;
  }

  // Mock: hockey goal event
  const hockeyGoal = pathname.match(/^\/matches\/([^/]+)\/hockey\/goal$/);
  if (hockeyGoal && method === 'POST') {
    const id = hockeyGoal[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Match not found');
    const match = items[idx];
    if ((match.sport || '').toLowerCase() !== 'hockey') throw new Error('Not a hockey match');
    if (match.status !== 'live') throw new Error('Match must be live');
    const det = (match.details?.hockey) || { period: 1, events: [] as any[] };
    const event = { team: Number(body.team) as 1|2, scorer: body.scorer || '', assist: body.assist || '', minute: body.minute ? Number(body.minute) : undefined, description: body.description || '', at: new Date().toISOString() };
    const updated = {
      ...match,
      score1: event.team === 1 ? (match.score1 || 0) + 1 : match.score1 || 0,
      score2: event.team === 2 ? (match.score2 || 0) + 1 : match.score2 || 0,
      details: { ...match.details, hockey: { ...det, events: [event, ...(det.events || [])] } },
    };
    const next = [...items];
    next[idx] = updated as any;
    writeMockMatches(next);
    return updated as unknown as T;
  }

  // Mock: complete match + MOTM
  const complete = pathname.match(/^\/matches\/([^/]+)\/complete$/);
  if (complete && method === 'POST') {
    const id = complete[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Match not found');
    const updated = { ...items[idx], status: 'completed', manOfTheMatch: body.manOfTheMatch || items[idx].manOfTheMatch } as any;
    const next = [...items];
    next[idx] = updated;
    writeMockMatches(next);
    return updated as unknown as T;
  }

  // Mock: kabaddi event
  const kabaddiEvent = pathname.match(/^\/matches\/([^/]+)\/kabaddi\/event$/);
  if (kabaddiEvent && method === 'POST') {
    const id = kabaddiEvent[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const items = readMockMatches();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Match not found');
    const match = items[idx];
    if ((match.sport || '').toLowerCase() !== 'kabaddi') throw new Error('Not a kabaddi match');
    if (match.status !== 'live') throw new Error('Match must be live');
    const det = (match.details?.kabaddi) || { events: [] as any[] };
    const pts = Number(body.points);
    const ev = { team: Number(body.team) as 1|2, type: body.type as 'raid'|'tackle', points: pts as 1|2|3|4|5, superRaid: !!body.superRaid, superTackle: !!body.superTackle, raider: body.raider || '', defenders: body.defenders || '', description: body.description || '', at: new Date().toISOString() };
    const updated = {
      ...match,
      score1: ev.team === 1 ? (match.score1 || 0) + pts : match.score1 || 0,
      score2: ev.team === 2 ? (match.score2 || 0) + pts : match.score2 || 0,
      details: { ...match.details, kabaddi: { events: [ev, ...(det.events || [])] } },
    };
    const next = [...items];
    next[idx] = updated as any;
    writeMockMatches(next);
    return updated as unknown as T;
  }

  // Default fallback for unmocked endpoints
  throw new Error(`No mock implemented for ${method} ${pathname}`);
}

// ---------------------------------
// Mock: News and Matches (Admin)
// ---------------------------------
type MockNews = {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  author: string;
  category: 'news' | 'announcement' | 'event';
};

type MockMatch = {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: 'upcoming' | 'live' | 'completed';
  time?: string;
  date: string;
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
    kabaddi?: {
      events: Array<{ team: 1|2; type: 'raid'|'tackle'; points: 1|2|3|4|5; superRaid?: boolean; superTackle?: boolean; raider?: string; defenders?: string; description?: string; at: string }>;
    };
  };
};

function readMockNews(): MockNews[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.NEWS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMockNews(items: MockNews[]) {
  localStorage.setItem(LS_KEYS.NEWS, JSON.stringify(items));
}

function readMockMatches(): MockMatch[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.MATCHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMockMatches(items: MockMatch[]) {
  localStorage.setItem(LS_KEYS.MATCHES, JSON.stringify(items));
}

function seedMockMessages(): MockMessage[] {
  const existing = localStorage.getItem(LS_KEYS.MESSAGES);
  if (existing) return JSON.parse(existing);
  const now = Date.now();
  const items: MockMessage[] = [
    { _id: 'm1', subject: 'Welcome!', content: 'Great app, keep it up!', name: 'Student A', email: 'a@college.edu', createdAt: new Date(now - 3600_000).toISOString() },
    { _id: 'm2', subject: 'Event Query', content: 'When is the sports meet?', name: 'Student B', email: 'b@college.edu', createdAt: new Date(now - 2*3600_000).toISOString() },
  ];
  localStorage.setItem(LS_KEYS.MESSAGES, JSON.stringify(items));
  return items;
}

function readMockMessages(): MockMessage[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.MESSAGES);
    return raw ? JSON.parse(raw) : seedMockMessages();
  } catch {
    return seedMockMessages();
  }
}

function writeMockMessages(items: MockMessage[]) {
  localStorage.setItem(LS_KEYS.MESSAGES, JSON.stringify(items));
}


export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    if (USE_MOCK) {
      // Simulate slight latency
      await new Promise(r => setTimeout(r, 200));
      // Delegate to mock router
      return await mockApiFetch<T>(path, { ...options, headers });
    }
    res = await fetchWithRetry(`${API_BASE}${path}`, { ...options, headers });
  } catch (e: any) {
    // Improve error message for network issues
    const reason = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Network error';
    // If backend unreachable and mock not enabled, try mock as a graceful fallback
    if (!USE_MOCK) {
      try {
        await new Promise(r => setTimeout(r, 200));
        return await mockApiFetch<T>(path, { ...options, headers });
      } catch (_) {
        // ignore and rethrow original error
      }
    }
    throw new Error(`Failed to fetch ${path}: ${reason}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : (await res.text() as any);
  if (!res.ok) {
    const message = data?.message || res.statusText || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function apiFetchForm<T = any>(path: string, formData: FormData, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    if (USE_MOCK) {
      // No form uploads in mock layer yet
      throw new Error('Form uploads not supported in mock mode');
    }
    res = await fetchWithRetry(`${API_BASE}${path}`, { method: 'POST', body: formData, headers });
  } catch (e: any) {
    const reason = e?.name === 'AbortError' ? 'Request timed out' : e?.message || 'Network error';
    throw new Error(`Failed to upload to ${path}: ${reason}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : (await res.text() as any);
  if (!res.ok) {
    const message = data?.message || res.statusText || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

// Domain-specific helpers
export async function postRegistration(formType: string, data: Record<string, any>) {
  return apiFetch('/registrations', {
    method: 'POST',
    body: JSON.stringify({ formType, data })
  });
}

export async function createPoll(payload: { title: string; description?: string; options: string[]; endDate?: string; }) {
  return apiFetch('/polls', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deletePoll(pollId: string) {
  return apiFetch(`/polls/${pollId}`, { method: 'DELETE' });
}

export async function activatePoll(pollId: string) {
  return apiFetch(`/polls/${pollId}/activate`, { method: 'PATCH' });
}

export async function deactivatePoll(pollId: string) {
  return apiFetch(`/polls/${pollId}/deactivate`, { method: 'PATCH' });
}

// Achievements API
export interface AchievementItem {
  _id: string;
  studentName: string;
  registrationNumber: string;
  branch?: string;
  course?: string;
  eventName: string;
  eventType?: string;
  eventClassification?: string;
  venue?: string;
  dateOfParticipation?: string;
  meritPosition?: string;
  description?: string;
  certificateUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export async function listAchievements(status?: 'pending'|'approved'|'rejected'): Promise<AchievementItem[]> {
  const qs = status ? `?status=${status}` : '';
  return apiFetch(`/achievements${qs}`);
}

export async function updateAchievementStatus(id: string, status: 'pending'|'approved'|'rejected'): Promise<AchievementItem> {
  return apiFetch(`/achievements/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function listMyAchievements(): Promise<AchievementItem[]> {
  return apiFetch(`/me/achievements`);
}

// -----------------------------
// Gallery helpers
// -----------------------------
export interface GalleryItem {
  _id: string;
  url: string; // relative path: /uploads/gallery/xyz.jpg
  title: string;
  description?: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  likes: number;
  likedBy: string[];
  comments: Array<{ _id: string; userId: string; text: string; createdAt: string }>;
}

export async function listGallery(category?: string): Promise<GalleryItem[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch(`/gallery${qs}`);
}

export async function uploadGallery(form: { image: File; title: string; description?: string; category: string; }): Promise<GalleryItem> {
  const fd = new FormData();
  fd.append('image', form.image);
  fd.append('title', form.title);
  fd.append('category', form.category);
  if (form.description) fd.append('description', form.description);
  return apiFetchForm('/gallery', fd);
}

export async function updateGallery(id: string, payload: { title?: string; description?: string; category?: string; }): Promise<GalleryItem> {
  return apiFetch(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteGallery(id: string): Promise<{ message: string }> {
  return apiFetch(`/gallery/${id}`, { method: 'DELETE' });
}

export async function toggleLikeGallery(id: string): Promise<GalleryItem> {
  return apiFetch(`/gallery/${id}/like`, { method: 'POST' });
}

export async function addGalleryComment(id: string, text: string): Promise<{ image: GalleryItem; comment: GalleryItem['comments'][number] }> {
  return apiFetch(`/gallery/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
}

export async function deleteGalleryComment(id: string, commentId: string): Promise<{ message: string }> {
  return apiFetch(`/gallery/${id}/comments/${commentId}`, { method: 'DELETE' });
}

// -----------------------------
// News & Live Scores helpers
// -----------------------------
export interface NewsItemDto {
  id: string;
  title: string;
  content: string;
  date: string; // ISO string
  imageUrl?: string;
  author: string;
  category: 'news' | 'announcement' | 'event';
}

export interface MatchScoreDto {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: 'upcoming' | 'live' | 'completed';
  time?: string;
  date: string; // ISO string
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

export async function listNews(): Promise<NewsItemDto[]> {
  return apiFetch('/news');
}

export async function createNews(payload: { title: string; content: string; category?: 'news'|'announcement'|'event'; imageUrl?: string; }): Promise<NewsItemDto> {
  return apiFetch('/news', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listMatches(): Promise<MatchScoreDto[]> {
  return apiFetch('/matches');
}

export async function createMatch(payload: { team1: string; team2: string; sport: string; venue: string; status?: 'upcoming'|'live'|'completed'; score1?: number; score2?: number; time?: string; }): Promise<MatchScoreDto> {
  return apiFetch('/matches', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateMatchScore(id: string, score1: number, score2: number): Promise<MatchScoreDto> {
  return apiFetch(`/matches/${id}/score`, { method: 'PUT', body: JSON.stringify({ score1, score2 }) });
}

export async function updateMatchStatus(id: string, status: 'upcoming'|'live'|'completed'): Promise<MatchScoreDto> {
  return apiFetch(`/matches/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

// Realtime sport-specific helpers
export async function recordCricketBall(id: string, payload: { runs?: number; wicket?: boolean; boundary4?: boolean; six?: boolean; batter?: string; bowler?: string; description?: string; }): Promise<MatchScoreDto> {
  return apiFetch(`/matches/${id}/cricket/ball`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function recordHockeyGoal(id: string, payload: { team: 1|2; scorer?: string; assist?: string; minute?: number; description?: string; }): Promise<MatchScoreDto> {
  return apiFetch(`/matches/${id}/hockey/goal`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function completeMatch(id: string, manOfTheMatch?: string): Promise<MatchScoreDto> {
  return apiFetch(`/matches/${id}/complete`, { method: 'POST', body: JSON.stringify({ manOfTheMatch }) });
}

export async function recordKabaddiEvent(id: string, payload: { team: 1|2; type: 'raid'|'tackle'; points: 1|2|3|4|5; superRaid?: boolean; superTackle?: boolean; raider?: string; defenders?: string; description?: string; }): Promise<MatchScoreDto> {
  return apiFetch(`/matches/${id}/kabaddi/event`, { method: 'POST', body: JSON.stringify(payload) });
}
