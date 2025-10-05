import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import Message from '../models/Message';
import nodemailer from 'nodemailer';

const router = Router();

// Create message (allow both authenticated and guest)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { subject, content, name, email } = req.body as { subject: string; content: string; name?: string; email?: string };
    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }

    const msg = await Message.create({
      subject,
      content,
      name,
      email,
      fromUserId: (req as any).auth?.userId,
    });

    // Emit socket update for admin dashboards
    try {
      const io = req.app.get('io');
      io?.emit('messages:new', { id: msg._id });
    } catch {}

    // Send email notification (best-effort)
    try {
      const to = process.env.FEEDBACK_EMAIL_TO || '231fa04b50@gmail.com';
      const useSendgrid = !!process.env.SENDGRID_API_KEY;
      if (useSendgrid) {
        // Lightweight SendGrid via SMTP if provided (optional); otherwise use nodemailer SMTP
        const transport = nodemailer.createTransport({
          service: 'SendGrid',
          auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
        });
        await transport.sendMail({
          from: process.env.EMAIL_FROM || 'no-reply@campus.local',
          to,
          subject: `[Feedback] ${subject}`,
          text: `${content}\n\nFrom: ${name || 'Anonymous'} ${email ? `<${email}>` : ''}`,
        });
      } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transport.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to,
          subject: `[Feedback] ${subject}`,
          text: `${content}\n\nFrom: ${name || 'Anonymous'} ${email ? `<${email}>` : ''}`,
        });
      }
    } catch (err) {
      console.warn('Email notification failed (non-fatal)', err);
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error('Create message error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List messages (authenticated users can view their own; admin can view all)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const isAdmin = req.auth?.role === 'admin';
  const query = isAdmin ? {} : { fromUserId: req.auth!.userId };
  const items = await Message.find(query).sort({ createdAt: -1 });
  res.json(items);
});

export default router;
