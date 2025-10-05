import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import Poll from '../models/Poll';
import User from '../models/User';

const router = Router();

// Create poll (admin)
router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, options, endDate } = req.body as {
      title: string;
      description?: string;
      options: string[];
      endDate?: string;
    };
    console.log('[Polls] Create request', {
      userId: req.auth?.userId,
      title,
      optionsCount: Array.isArray(options) ? options.length : 0,
      endDate,
    });

// Admin: activate a poll (make visible to students)
router.patch('/:id/activate', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { isActive: true, visibleAt: new Date() }, { new: true });
    if (!poll) return res.status(404).json({ message: 'Not found' });
    try {
      const io = req.app.get('io');
      io?.emit('polls:visibility', { pollId: poll._id, isActive: true, visibleAt: poll.visibleAt });
      io?.emit('polls:updated', { pollId: poll._id });
    } catch {}
    res.json(poll);
  } catch (err) {
    console.error('[Polls] Activate error', { id: req.params.id, err });
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin: deactivate a poll (hide from students)
router.patch('/:id/deactivate', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!poll) return res.status(404).json({ message: 'Not found' });
    try {
      const io = req.app.get('io');
      io?.emit('polls:visibility', { pollId: poll._id, isActive: false });
      io?.emit('polls:updated', { pollId: poll._id });
    } catch {}
    res.json(poll);
  } catch (err) {
    console.error('[Polls] Deactivate error', { id: req.params.id, err });
    return res.status(500).json({ message: 'Server error' });
  }
});
    if (!title || !options || options.length < 2) {
      return res.status(400).json({ message: 'Title and at least 2 options are required' });
    }

    let normalizedEnd: Date | undefined = undefined;
    if (endDate) {
      const d = new Date(endDate);
      // If the provided endDate has no explicit time (00:00:00), push to end-of-day
      if (!isNaN(d.getTime())) {
        const hasTime = !(d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0);
        if (hasTime) {
          normalizedEnd = d;
        } else {
          const eod = new Date(d);
          eod.setHours(23, 59, 59, 999);
          normalizedEnd = eod;
        }
      }
    }

    const poll = await Poll.create({
      title,
      description,
      options: options.map((text) => ({ text, votes: 0 })),
      endDate: normalizedEnd,
      createdBy: req.auth?.userId,
    });
    console.log('[Polls] Created', { id: poll._id });
    // Emit socket update
    try {
      const io = req.app.get('io');
      io?.emit('polls:new', poll);
      io?.emit('polls:updated', { pollId: poll._id });
    } catch {}
    return res.status(201).json(poll);
  } catch (err) {
    console.error('[Polls] Create error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List polls
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const isAdmin = (req as any).auth?.role === 'admin';
    const all = String(req.query.all || '').toLowerCase() === 'true';
    const baseQuery: any = { $or: [
      { endDate: { $gte: now } },
      { endDate: null },
      { endDate: { $exists: false } }
    ] };
    // Students only see active polls; admin can request all
    const query = (isAdmin && all) ? baseQuery : { ...baseQuery, isActive: true };
    const polls = await Poll.find(query).sort({ createdAt: -1 });
    const userId = String((req as any).auth?.userId || '');
    const payload = polls.map((p: any) => {
      const obj = p.toObject ? p.toObject() : p;
      const hasVoted = Array.isArray(obj.voters)
        ? obj.voters.some((v: any) => String(v.userId) === userId)
        : false;
      // Omit voters array for privacy; include hasVoted flag
      const { voters, ...rest } = obj;
      return { ...rest, hasVoted };
    });
    res.json(payload);
  } catch (err) {
    console.error('[Polls] List error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get poll by id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });
    const obj = poll.toObject ? poll.toObject() : (poll as any);
    const userId = String(req.auth?.userId || '');
    const hasVoted = Array.isArray(obj.voters)
      ? obj.voters.some((v: any) => String(v.userId) === userId)
      : false;
    const { voters, ...rest } = obj;
    res.json({ ...rest, hasVoted });
  } catch (err) {
    console.error('[Polls] Get by id error', { id: req.params.id, err });
    return res.status(500).json({ message: 'Server error' });
  }
});

// Vote
router.post('/:id/vote', requireAuth, async (req: Request, res: Response) => {
  try {
    const { optionId } = req.body as { optionId: string };
    const pollId = req.params.id;
    console.log('[Polls] Vote request', { userId: req.auth?.userId, pollId, optionId });

    if (!optionId) {
      return res.status(400).json({ message: 'optionId is required' });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: 'Not found' });

    // Enforce deadline
    const now = new Date();
    if (poll.endDate && poll.endDate < now) {
      return res.status(400).json({ message: 'Poll is closed' });
    }

    // Enforce single vote per user
    const hasVoted = (poll.voters || []).some((v) => String(v.userId) === String(req.auth!.userId));
    if (hasVoted) {
      return res.status(409).json({ message: 'You have already responded' });
    }

    const option = (poll.options as any[]).find((o) => String(o._id) === String(optionId));
    if (!option) return res.status(400).json({ message: 'Invalid option' });

    option.votes += 1;
    poll.totalVotes += 1;
    // Record voter
    try {
      const user = req.auth?.userId ? await User.findById(req.auth.userId) : null;
      poll.voters = poll.voters || [];
      (poll.voters as any).push({ userId: req.auth!.userId as any, name: user?.name, email: user?.email, optionId: option._id, createdAt: new Date() });
    } catch {}
    await poll.save();
    console.log('[Polls] Vote recorded', { pollId: poll._id, totalVotes: poll.totalVotes });
    // Emit socket update (send updated poll payload)
    try {
      const io = req.app.get('io');
      io?.emit('polls:updated', { pollId: poll._id, poll });
    } catch {}
    res.json(poll);
  } catch (err) {
    console.error('[Polls] Vote error', { id: req.params.id, err });
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list voters for a poll
router.get('/:id/voters', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json(poll.voters || []);
  } catch (err) {
    console.error('[Polls] Voters list error', { id: req.params.id, err });
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete poll (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const poll = await Poll.findByIdAndDelete(req.params.id);
  if (!poll) return res.status(404).json({ message: 'Not found' });
  try {
    const io = req.app.get('io');
    io?.emit('polls:deleted', { pollId: req.params.id });
    io?.emit('polls:updated', { pollId: req.params.id });
  } catch {}
  res.json({ message: 'Deleted' });
});

export default router;
