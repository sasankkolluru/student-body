import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import User from '../models/User';
import Registration from '../models/Registration';
import Achievement from '../models/Achievement';

const router = Router();

// GET /api/me/profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.auth!.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user });
  } catch (err) {
    console.error('[Me] profile error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/me/ideas
router.get('/ideas', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = await Registration.find({ userId: req.auth!.userId, formType: 'idea' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('[Me] ideas error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/me/achievements
router.get('/achievements', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = await Achievement.find({ createdBy: req.auth!.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('[Me] achievements error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
