import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redis = new Redis(url, { lazyConnect: false, enableAutoPipelining: true });
  }
  return redis;
}

function kvKey(wordId: string, reaction: 'knew' | 'new') {
  return `react:${wordId}:${reaction}`;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const { wordId } = req.query;
    if (!wordId || typeof wordId !== 'string') {
      return res.status(400).json({ error: 'wordId required' });
    }

    const r = getRedis();
    const [knew, newWord] = await Promise.all([
      r.get(kvKey(wordId, 'knew')),
      r.get(kvKey(wordId, 'new')),
    ]);

    return res.status(200).json({
      knew: Number(knew ?? 0),
      new: Number(newWord ?? 0),
      knewFormatted: formatCount(Number(knew ?? 0)),
      newFormatted: formatCount(Number(newWord ?? 0)),
    });
  }

  if (req.method === 'POST') {
    const { wordId, reaction } = req.body as { wordId?: string; reaction?: string };

    if (!wordId || (reaction !== 'knew' && reaction !== 'new')) {
      return res.status(400).json({ error: 'wordId and reaction ("knew"|"new") required' });
    }

    const r = getRedis();
    const newCount = await r.incr(kvKey(wordId, reaction));

    // Return both counts so client can update UI
    const otherKey = reaction === 'knew' ? kvKey(wordId, 'new') : kvKey(wordId, 'knew');
    const otherCount = Number((await r.get(otherKey)) ?? 0);

    const knew = reaction === 'knew' ? newCount : otherCount;
    const newWord = reaction === 'new' ? newCount : otherCount;

    return res.status(200).json({
      knew,
      new: newWord,
      knewFormatted: formatCount(knew),
      newFormatted: formatCount(newWord),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
