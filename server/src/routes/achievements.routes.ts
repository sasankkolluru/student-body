import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Achievement from '../models/Achievement';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'dist', 'uploads');
const devUploadsDir = path.join(process.cwd(), 'src', '..', 'uploads');
const ensureDir = (dir: string) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
ensureDir(uploadsDir);
ensureDir(devUploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Save in server/uploads during dev; dist/uploads in production
    const target = process.env.NODE_ENV === 'production' ? uploadsDir : devUploadsDir;
    cb(null, target);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `certificate-${unique}${ext}`);
  }
});

const upload = multer({ storage });

// Create achievement submission
router.post('/', requireAuth, upload.single('certificate'), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const certificateUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const ach = await Achievement.create({
      studentName: body.studentName,
      registrationNumber: body.registrationNumber,
      branch: body.branch,
      course: body.course,
      eventName: body.eventName,
      eventType: body.eventType,
      eventClassification: body.eventClassification,
      venue: body.venue,
      dateOfParticipation: new Date(body.dateOfParticipation),
      meritPosition: body.meritPosition,
      description: body.description,
      certificateUrl,
      sportsCategory: body.sportsCategory || undefined,
      teamEventType: body.teamEventType || undefined,
      individualEventType: body.individualEventType || undefined,
      trackAndFieldEvent: body.trackAndFieldEvent || undefined,
      status: 'pending',
      createdBy: req.auth?.userId,
    });

    return res.status(201).json(ach);
  } catch (err) {
    console.error('Create achievement error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List achievements (optionally filter by status)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  const query: any = {};
  if (status) query.status = status;
  const items = await Achievement.find(query).sort({ createdAt: -1 });
  res.json(items);
});

// Get by id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const item = await Achievement.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

// Update status (admin)
router.patch('/:id/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.body as { status: 'pending' | 'approved' | 'rejected' };
  if (!status) return res.status(400).json({ message: 'Missing status' });
  const item = await Achievement.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

// Delete (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const item = await Achievement.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

export default router;
