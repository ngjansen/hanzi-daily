import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

function buildToken(email: string, secret: string): string {
  return Buffer.from(`${email}:${secret}`).toString('base64url');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, token } = req.body as { email?: string; token?: string };

  if (!email || !token) {
    return res.status(400).json({ error: 'Missing email or token' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const cronSecret = process.env.CRON_SECRET;

  if (!apiKey || !cronSecret) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const expected = buildToken(email, cronSecret);
  if (token !== expected) {
    return res.status(403).json({ error: 'Invalid unsubscribe token' });
  }

  const resend = new Resend(apiKey);

  // Update by email directly — no lookup needed
  const { error: updateError } = await resend.contacts.update({
    email,
    unsubscribed: true,
  });

  if (updateError) {
    console.error('Resend update error:', updateError);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }

  return res.status(200).json({ success: true });
}
