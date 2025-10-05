import { Router } from 'express';
import type { Request, Response } from 'express';

// In-memory stores (can be replaced with Mongo later)
let newsStore: Array<{
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  author: string;
  category: 'news' | 'announcement' | 'event';
}> = [];

let matchStore: Array<{
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
      overs: number; // total overs bowled (e.g., 12.3 -> store as 12.5 with balls counted separately if needed)
      balls: number; // balls in current over (0-5)
      wickets: number;
      events: Array<{ over: number; ball: number; runs: number; wicket?: boolean; boundary4?: boolean; six?: boolean; batter?: string; bowler?: string; description?: string; at: string }>;
    };
    hockey?: {
      period: number; // 1..4
      events: Array<{ team: 1|2; scorer?: string; assist?: string; minute?: number; description?: string; at: string }>;
    };
    kabaddi?: {
      events: Array<{ team: 1|2; type: 'raid' | 'tackle'; points: 1|2|3|4|5; superRaid?: boolean; superTackle?: boolean; raider?: string; defenders?: string; description?: string; at: string }>;
    };
  };
}> = [];

const router = Router();

// Helpers
const broadcast = (req: Request, event: string, payload?: any) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

// -------- NEWS --------
router.get('/news', (_req: Request, res: Response) => {
  const sorted = [...newsStore].sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  res.json(sorted);
});

router.post('/news', (req: Request, res: Response) => {
  const { title, content, category = 'news', imageUrl = '', author = 'Admin' } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' });
  const item = {
    id: Math.random().toString(36).slice(2),
    title,
    content,
    category,
    imageUrl,
    author,
    date: new Date().toISOString(),
  } as (typeof newsStore)[number];
  newsStore = [item, ...newsStore];
  broadcast(req, 'news:updated');
  res.status(201).json(item);
});

// -------- MATCHES / SCORES --------
router.get('/matches', (_req: Request, res: Response) => {
  const sorted = [...matchStore].sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  res.json(sorted);
});

router.post('/matches', (req: Request, res: Response) => {
  const { team1, team2, sport, venue, status = 'upcoming', score1 = 0, score2 = 0, time = '' } = req.body || {};
  if (!team1 || !team2 || !sport || !venue) return res.status(400).json({ message: 'team1, team2, sport, venue are required' });
  const item = {
    id: Math.random().toString(36).slice(2),
    team1,
    team2,
    sport,
    venue,
    status,
    score1: Number(score1) || 0,
    score2: Number(score2) || 0,
    time,
    date: new Date().toISOString(),
    details: sport.toLowerCase() === 'cricket' ? { cricket: { overs: 0, balls: 0, wickets: 0, events: [] } } :
             sport.toLowerCase() === 'hockey' ? { hockey: { period: 1, events: [] } } : undefined,
  } as (typeof matchStore)[number];
  matchStore = [item, ...matchStore];
  broadcast(req, 'scores:updated');
  res.status(201).json(item);
});

router.put('/matches/:id/score', (req: Request, res: Response) => {
  const { id } = req.params;
  const { score1, score2 } = req.body || {};
  const idx = matchStore.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Match not found' });
  matchStore[idx] = { ...matchStore[idx], score1: Number(score1) ?? matchStore[idx].score1, score2: Number(score2) ?? matchStore[idx].score2 };
  broadcast(req, 'scores:updated');
  res.json(matchStore[idx]);
});

router.put('/matches/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body || {} as { status: 'upcoming' | 'live' | 'completed' };
  if (!['upcoming', 'live', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const idx = matchStore.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Match not found' });
  matchStore[idx] = { ...matchStore[idx], status };
  broadcast(req, 'scores:updated', { id, status });
  res.json(matchStore[idx]);
});

// -------- SPORT-SPECIFIC EVENTS --------
// Cricket: record a ball event and update scores/overs/wickets
router.post('/matches/:id/cricket/ball', (req: Request, res: Response) => {
  const { id } = req.params;
  const { runs = 0, wicket = false, boundary4 = false, six = false, batter = '', bowler = '', description = '' } = req.body || {};
  const idx = matchStore.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Match not found' });
  const match = matchStore[idx];
  if ((match.sport || '').toLowerCase() !== 'cricket') return res.status(400).json({ message: 'Not a cricket match' });
  if (match.status !== 'live') return res.status(400).json({ message: 'Match must be live' });

  const det = match.details?.cricket || { overs: 0, balls: 0, wickets: 0, events: [] };
  // Increment ball
  let balls = det.balls + 1;
  let overs = det.overs;
  if (balls >= 6) { overs += 1; balls = 0; }
  const wickets = det.wickets + (wicket ? 1 : 0);

  // Update scores
  const score1 = match.score1 + Number(runs || (six ? 6 : boundary4 ? 4 : 0));

  const event = {
    over: overs,
    ball: balls,
    runs: Number(runs || (six ? 6 : boundary4 ? 4 : 0)) || 0,
    wicket: Boolean(wicket),
    boundary4: Boolean(boundary4),
    six: Boolean(six),
    batter,
    bowler,
    description,
    at: new Date().toISOString(),
  };

  const updated: typeof match = {
    ...match,
    score1,
    details: {
      ...match.details,
      cricket: { overs, balls, wickets, events: [event, ...(det.events || [])] },
    },
  };
  matchStore[idx] = updated;
  broadcast(req, 'match:event', { id, sport: 'cricket', event });
  broadcast(req, 'scores:updated');
  res.json(updated);
});

// Hockey: record a goal event and update score
router.post('/matches/:id/hockey/goal', (req: Request, res: Response) => {
  const { id } = req.params;
  const { team, scorer = '', assist = '', minute, description = '' } = req.body || {};
  const idx = matchStore.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Match not found' });
  const match = matchStore[idx];
  if ((match.sport || '').toLowerCase() !== 'hockey') return res.status(400).json({ message: 'Not a hockey match' });
  if (match.status !== 'live') return res.status(400).json({ message: 'Match must be live' });
  if (![1,2,'1','2'].includes(team)) return res.status(400).json({ message: 'team must be 1 or 2' });

  const det = match.details?.hockey || { period: 1, events: [] };
  const event = { team: Number(team) as 1|2, scorer, assist, minute: minute ? Number(minute) : undefined, description, at: new Date().toISOString() };
  const updated: typeof match = {
    ...match,
    score1: event.team === 1 ? match.score1 + 1 : match.score1,
    score2: event.team === 2 ? match.score2 + 1 : match.score2,
    details: { ...match.details, hockey: { ...det, events: [event, ...(det.events || [])] } },
  };
  matchStore[idx] = updated;
  broadcast(req, 'match:event', { id, sport: 'hockey', event });
  broadcast(req, 'scores:updated');
  res.json(updated);
});

// Complete match and set Man of the Match
router.post('/matches/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const { manOfTheMatch = '' } = req.body || {};
  const idx = matchStore.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Match not found' });
  const updated = { ...matchStore[idx], status: 'completed' as const, manOfTheMatch };
  matchStore[idx] = updated;
  broadcast(req, 'scores:updated', { id, status: 'completed', manOfTheMatch });
  res.json(updated);
});

// Kabaddi: record an event (raid or tackle) and update score
router.post('/matches/:id/kabaddi/event', (req: Request, res: Response) => {
  const { id } = req.params;
  const { team, type, points, superRaid = false, superTackle = false, raider = '', defenders = '', description = '' } = req.body || {};
  const idx = matchStore.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Match not found' });
  const match = matchStore[idx];
  if ((match.sport || '').toLowerCase() !== 'kabaddi') return res.status(400).json({ message: 'Not a kabaddi match' });
  if (match.status !== 'live') return res.status(400).json({ message: 'Match must be live' });
  if (![1,2,'1','2'].includes(team)) return res.status(400).json({ message: 'team must be 1 or 2' });
  if (!['raid','tackle'].includes(type)) return res.status(400).json({ message: 'type must be raid or tackle' });
  const pts = Number(points);
  if (![1,2,3,4,5].includes(pts)) return res.status(400).json({ message: 'points must be 1|2|3|4|5' });

  const det = match.details?.kabaddi || { events: [] };
  const event = { team: Number(team) as 1|2, type, points: pts as 1|2|3|4|5, superRaid: Boolean(superRaid), superTackle: Boolean(superTackle), raider, defenders, description, at: new Date().toISOString() };
  const updated: typeof match = {
    ...match,
    score1: event.team === 1 ? match.score1 + pts : match.score1,
    score2: event.team === 2 ? match.score2 + pts : match.score2,
    details: { ...match.details, kabaddi: { events: [event, ...(det.events || [])] } },
  };
  matchStore[idx] = updated;
  broadcast(req, 'match:event', { id, sport: 'kabaddi', event });
  broadcast(req, 'scores:updated');
  res.json(updated);
});

export default router;
