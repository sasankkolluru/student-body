import dotenv from 'dotenv';
dotenv.config();

// Minimal mailer that tries to use nodemailer if available; otherwise logs to console.
export async function sendMail(opts: { to: string; subject: string; html?: string; text?: string; fromOverride?: string; }): Promise<{ ok: boolean; messageId?: string }> {
  const { to, subject, html, text, fromOverride } = opts;
  const from = fromOverride || process.env.SMTP_FROM || 'no-reply@example.com';

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('[Mailer] SMTP env not fully configured. Logging email instead.');
      console.log(`[Mailer] To: ${to}`);
      console.log(`[Mailer] Subject: ${subject}`);
      console.log('[Mailer] Body:', html || text);
      return { ok: true };
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { ok: true, messageId: info?.messageId };
  } catch (err) {
    console.warn('[Mailer] nodemailer not installed or failed. Falling back to console log.', (err as any)?.message || err);
    console.log(`[Mailer] To: ${to}`);
    console.log(`[Mailer] Subject: ${subject}`);
    console.log('[Mailer] Body:', html || text);
    return { ok: true };
  }
}
