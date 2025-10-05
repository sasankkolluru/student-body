import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import GalleryImage from '../models/GalleryImage';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

// Multer storage to /uploads/gallery
const uploadsBase = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsBase)) fs.mkdirSync(uploadsBase, { recursive: true });
const galleryDir = path.join(uploadsBase, 'gallery');
if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, galleryDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });

// Create/upload image (admin)
router.post('/', requireAuth, requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required (field name: image)' });
    const { title, description, category } = req.body as any;
    if (!title || !category) return res.status(400).json({ message: 'Title and category are required' });

    const fileUrl = `/uploads/gallery/${req.file.filename}`;
    const doc = await GalleryImage.create({
      url: fileUrl,
      title,
      description,
      category,
      uploadedBy: req.auth!.userId,
      uploadedAt: new Date(),
      likes: 0,
      likedBy: [],
      comments: []
    });

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('gallery:new', doc);

    return res.status(201).json(doc);
  } catch (err) {
    console.error('[Gallery] Upload error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// List images (optionally by category)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category } = req.query as { category?: string };
    const filter: any = {};
    if (category) filter.category = category;
    const images = await GalleryImage.find(filter).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error('[Gallery] List error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update metadata (admin)
router.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, category } = req.body as any;
    const update: any = {};
    if (typeof title === 'string') update.title = title;
    if (typeof description === 'string') update.description = description;
    if (typeof category === 'string') update.category = category;

    const doc = await GalleryImage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const io = req.app.get('io');
    io?.emit('gallery:update', doc);

    res.json(doc);
  } catch (err) {
    console.error('[Gallery] Update error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete image (admin)
router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const doc = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    // Delete file if exists
    const abs = path.join(__dirname, '../../', doc.url.replace(/^\//, ''));
    fs.promises.unlink(abs).catch(() => {});

    const io = req.app.get('io');
    io?.emit('gallery:delete', { _id: doc._id });

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[Gallery] Delete error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Toggle like
router.post('/:id/like', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId;
    const img = await GalleryImage.findById(req.params.id);
    if (!img) return res.status(404).json({ message: 'Not found' });

    const idx = img.likedBy.findIndex((u) => String(u) === String(userId));
    if (idx === -1) {
      img.likedBy.push(userId);
      img.likes = img.likedBy.length;
    } else {
      img.likedBy.splice(idx, 1);
      img.likes = img.likedBy.length;
    }
    await img.save();

    const io = req.app.get('io');
    io?.emit('gallery:like', { _id: img._id, likes: img.likes, likedBy: img.likedBy });

    res.json(img);
  } catch (err) {
    console.error('[Gallery] Like error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text: string };
    if (!text || !String(text).trim()) return res.status(400).json({ message: 'text is required' });
    const img = await GalleryImage.findById(req.params.id);
    if (!img) return res.status(404).json({ message: 'Not found' });

    const comment = { userId: req.auth!.userId, text: String(text).trim(), createdAt: new Date() } as any;
    (img.comments as any).push(comment);
    await img.save();

    const newComment = img.comments[img.comments.length - 1];
    const io = req.app.get('io');
    io?.emit('gallery:comment', { _id: img._id, comment: newComment });

    res.status(201).json({ image: img, comment: newComment });
  } catch (err) {
    console.error('[Gallery] Comment add error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (admin or owner)
router.delete('/:id/comments/:commentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params as { id: string; commentId: string };
    const img = await GalleryImage.findById(id);
    if (!img) return res.status(404).json({ message: 'Not found' });

    const idx = img.comments.findIndex((c: any) => String(c._id) === String(commentId));
    if (idx === -1) return res.status(404).json({ message: 'Comment not found' });

    const comment = img.comments[idx] as any;
    const isOwner = String(comment.userId) === String(req.auth!.userId);
    const isAdmin = req.auth!.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    img.comments.splice(idx, 1);
    await img.save();

    const io = req.app.get('io');
    io?.emit('gallery:comment:delete', { _id: img._id, commentId });

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[Gallery] Comment delete error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
