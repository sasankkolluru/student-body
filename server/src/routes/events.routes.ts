import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import Event from '../models/Event';

const router = Router();

// Create event (admin)
router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, location, startAt, endAt, isActive } = req.body as {
      title: string;
      description?: string;
      location?: string;
      startAt: string;
      endAt?: string;
      isActive?: boolean;
    };

    if (!title || !startAt) {
      return res.status(400).json({ message: 'title and startAt are required' });
    }

    const ev = await Event.create({
      title,
      description,
      location,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : undefined,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.auth?.userId,
    });
    // Emit socket update
    try {
      const io = req.app.get('io');
      io?.emit('events:updated');
    } catch {}
    return res.status(201).json(ev);
  } catch (err) {
    console.error('[Events] Create error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List active/ongoing events (public)
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const events = await Event.find({
      $and: [
        { isActive: true },
        { startAt: { $lte: now } },
        { $or: [{ endAt: { $gte: now } }, { endAt: null }] }
      ]
    }).sort({ startAt: 1 });

    res.json(events);
  } catch (err) {
    console.error('[Events] Active list error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List upcoming events (next N days) (public)
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days || 7);
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const events = await Event.find({
      isActive: true,
      startAt: { $gte: now, $lte: until }
    }).sort({ startAt: 1 });

    res.json(events);
  } catch (err) {
    console.error('[Events] Upcoming list error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
 
// Update event (admin)
router.patch('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, location, startAt, endAt, isActive } = req.body as any;
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (startAt !== undefined) update.startAt = new Date(startAt);
    if (endAt !== undefined) update.endAt = endAt ? new Date(endAt) : null;
    if (isActive !== undefined) update.isActive = !!isActive;
    const ev = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ev) return res.status(404).json({ message: 'Not found' });
    try {
      const io = req.app.get('io');
      io?.emit('events:updated');
    } catch {}
    res.json(ev);
  } catch (err) {
    console.error('[Events] Update error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Close event (admin)
router.patch('/:id/close', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const ev = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false, endAt: new Date() },
      { new: true }
    );
    if (!ev) return res.status(404).json({ message: 'Not found' });
    try {
      const io = req.app.get('io');
      io?.emit('events:updated');
    } catch {}
    res.json(ev);
  } catch (err) {
    console.error('[Events] Close error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
