import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body as { email?: string };

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;

  if (!apiKey || !segmentId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.contacts.create({
    email,
    segments: [{ id: segmentId }],
    unsubscribed: false,
  });

  // Already exists — treat as success
  if (error && error.name !== 'validation_error') {
    console.error('Resend subscribe error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }

  return res.status(200).json({ success: true });
}
