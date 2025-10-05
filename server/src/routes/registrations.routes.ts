import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import Registration from '../models/Registration';
import User from '../models/User';
import { sendMail } from '../utils/mailer';

const router = Router();

// Create a registration entry
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { formType, data } = req.body as { formType: string; data: Record<string, any> };
    if (!formType || !data) return res.status(400).json({ message: 'formType and data required' });

    const doc = await Registration.create({
      formType,
      data,
      userId: req.auth?.userId,
      role: req.auth?.role,
    });
    // If this is an event registration, send a confirmation email
    if (formType === 'event') {
      try {
        const user = req.auth?.userId ? await User.findById(req.auth.userId) : null;
        const to = user?.email || (data.email as string) || '';
        if (to) {
          const studentName = user?.name || (data.name as string) || (data.studentName as string) || 'Student';
          const eventName = (data.eventName as string) || (data.title as string) || 'Event';
          const eventDate = (data.date as string) || (data.startAt as string) || '';
          const eventVenue = (data.venue as string) || (data.location as string) || '';
          const subject = `Thank You for Registering – ${eventName}`;
          const html = `Hello ${studentName},<br/><br/>Thank you for registering for <b>${eventName}</b>.<br/>📅 Date: ${eventDate}<br/>📍 Venue: ${eventVenue}<br/><br/>You will receive further updates and instructions shortly.<br/>We look forward to your participation!`;
          await sendMail({ to, subject, html });
        }
      } catch (e) {
        console.warn('[Registrations] email send failed (non-fatal):', (e as any)?.message || e);
      }
    }

    res.status(201).json(doc);
  } catch (err) {
    console.error('Create registration error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List registrations (admin = all, user = own)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const isAdmin = req.auth?.role === 'admin';
  const query = isAdmin ? {} : { userId: req.auth!.userId };
  const items = await Registration.find(query).sort({ createdAt: -1 });
  res.json(items);
});

// Get by id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const item = await Registration.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  // Ensure owner or admin
  if (req.auth?.role !== 'admin' && item.userId?.toString() !== req.auth?.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(item);
});

// Update (owner or admin)
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const item = await Registration.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  if (req.auth?.role !== 'admin' && item.userId?.toString() !== req.auth?.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { data } = req.body as { data?: Record<string, any> };
  if (data) item.data = data;
  await item.save();
  res.json(item);
});

// Update status for ideas (admin only): accepted/rejected
router.patch('/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.body as { status: 'pending' | 'accepted' | 'rejected' };
  if (!status) return res.status(400).json({ message: 'Missing status' });
  const item = await Registration.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  item.status = status;
  await item.save();
  res.json(item);
});

// Delete (owner or admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const item = await Registration.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  if (req.auth?.role !== 'admin' && item.userId?.toString() !== req.auth?.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await item.deleteOne();
  res.json({ message: 'Deleted' });
});

export default router;
