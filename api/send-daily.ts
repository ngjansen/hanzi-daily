import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createElement } from 'react';
import { DailyWordEmail } from './emails/DailyWordEmail';
import wordsData from '../src/data/words.json';

const LAUNCH_DATE = new Date('2026-04-09');
function getDaysSinceStart(date: Date): number {
  const start = new Date(LAUNCH_DATE);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const BATCH_SIZE = 100;

function buildToken(email: string, secret: string): string {
  return Buffer.from(`${email}:${secret}`).toString('base64url');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  const siteUrl = process.env.SITE_URL ?? 'https://hanzidaily.vercel.app';

  if (!apiKey || !segmentId) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Determine today's word
  const today = new Date();
  const daysSinceStart = getDaysSinceStart(today);
  const entries = (wordsData as { entries: typeof wordsData.entries }).entries;
  const index = daysSinceStart % entries.length;
  const entry = entries[index];
  const dayNumber = daysSinceStart + 1;

  const resend = new Resend(apiKey);

  // List all contacts in segment
  const { data: listData, error: listError } = await resend.contacts.list({ segmentId });
  if (listError || !listData) {
    console.error('Resend list error:', listError);
    return res.status(500).json({ error: 'Failed to fetch subscribers' });
  }

  const activeContacts = listData.data.filter((c) => !c.unsubscribed);

  if (activeContacts.length === 0) {
    return res.status(200).json({ sent: 0, word: entry.chinese });
  }

  // Render and batch-send
  let sentCount = 0;

  for (let i = 0; i < activeContacts.length; i += BATCH_SIZE) {
    const batch = activeContacts.slice(i, i + BATCH_SIZE);

    const emails = await Promise.all(
      batch.map(async (contact) => {
        const token = buildToken(contact.email, cronSecret);
        const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}&token=${encodeURIComponent(token)}`;

        const html = await render(
          createElement(DailyWordEmail, {
            entry,
            dayNumber,
            siteUrl,
            unsubscribeUrl,
          }),
        );

        return {
          from: process.env.FROM_EMAIL ?? 'HanziDaily <onboarding@resend.dev>',
          to: [contact.email],
          subject: `每日一词 Day ${dayNumber}: ${entry.chinese} — ${entry.english}`,
          html,
        };
      }),
    );

    const { error: batchError } = await resend.batch.send(emails);
    if (batchError) {
      console.error('Resend batch error:', batchError);
    } else {
      sentCount += batch.length;
    }
  }

  return res.status(200).json({ sent: sentCount, word: entry.chinese });
}
