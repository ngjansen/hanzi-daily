import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import Snoowrap from 'snoowrap';
import { BskyAgent } from '@atproto/api';
import wordsData from '../src/data/words.json';

const LAUNCH_DATE = new Date('2026-02-22');
function getDaysSinceStart(date: Date): number {
  const start = new Date(LAUNCH_DATE);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const CATEGORY_LABELS: Record<string, string> = {
  classical_idiom:  '成语典故',
  modern_tech:      '科技新词',
  business:         '商业用语',
  literature:       '文学典故',
  internet_culture: '网络用语',
};

async function postToX(entry: typeof wordsData.entries[0], dayNumber: number, ogImageUrl: string): Promise<string> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('Missing Twitter credentials');
  }

  const client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });

  const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category;
  const example = entry.examples[0];
  const siteUrl = process.env.SITE_URL ?? 'https://www.hanzidaily.com';

  // Upload image
  const imageResponse = await fetch(ogImageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const mediaId = await client.v1.uploadMedia(Buffer.from(imageBuffer), { mimeType: 'image/png' });

  const tweetText = `今日一词 Day ${dayNumber} · ${categoryLabel}

${entry.chinese} (${entry.pinyin})
${entry.english}

"${example.chinese}"

#LearnChinese #汉字 #Mandarin
${siteUrl}/word/${entry.id}`;

  const tweet = await client.v2.tweet({ text: tweetText, media: { media_ids: [mediaId] } });
  return tweet.data.id;
}

async function postToInstagram(entry: typeof wordsData.entries[0], dayNumber: number, ogImageUrl: string): Promise<string> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    throw new Error('Missing Instagram credentials');
  }

  const example = entry.examples[0];
  const caption = `今日一词 · Day ${dayNumber} ✨

${entry.chinese} (${entry.pinyin})
${entry.english}

例句:
"${example.chinese}"
"${example.english}"

Follow @hanzidaily for your daily Chinese word 🀄
.
#LearnChinese #汉字 #Mandarin #ChineseLanguage #HSK #中文 #学中文`;

  // Step 1: Create media container
  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${userId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: ogImageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );
  const createData = await createRes.json() as { id?: string; error?: { message: string } };
  if (!createData.id) {
    throw new Error(`Instagram media create failed: ${createData.error?.message ?? JSON.stringify(createData)}`);
  }

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${userId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: accessToken,
      }),
    }
  );
  const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
  if (!publishData.id) {
    throw new Error(`Instagram publish failed: ${publishData.error?.message ?? JSON.stringify(publishData)}`);
  }

  return publishData.id;
}

async function postToReddit(entry: typeof wordsData.entries[0], dayNumber: number): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  const siteUrl = process.env.SITE_URL ?? 'https://www.hanzidaily.com';

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Missing Reddit credentials');
  }

  const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category;
  // Alternate subreddits: odd days → r/ChineseLanguage, even days → r/languagelearning
  const subreddit = dayNumber % 2 === 1 ? 'ChineseLanguage' : 'languagelearning';
  const title = `Daily Chinese Word #${dayNumber}: ${entry.chinese} (${entry.pinyin}) — ${entry.english} [${categoryLabel}]`;
  const url = `${siteUrl}/word/${entry.id}`;

  const r = new Snoowrap({
    userAgent: 'HanziDailyBot/1.0 (by /u/' + username + ')',
    clientId,
    clientSecret,
    username,
    password,
  });

  const submission = await (r as any).getSubreddit(subreddit).submitLink({ title, url });
  return submission.name;
}

async function postToBluesky(entry: typeof wordsData.entries[0], dayNumber: number, ogImageUrl: string): Promise<string> {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  const siteUrl = process.env.SITE_URL ?? 'https://www.hanzidaily.com';

  if (!handle || !appPassword) {
    throw new Error('Missing Bluesky credentials');
  }

  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: handle, password: appPassword });

  const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category;
  const example = entry.examples[0];

  const postText = `今日一词 Day ${dayNumber} · ${categoryLabel}

${entry.chinese} (${entry.pinyin})
${entry.english}

"${example.chinese}"

#LearnChinese #汉字 #Mandarin
${siteUrl}/word/${entry.id}`;

  const imageResponse = await fetch(ogImageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const uploadRes = await agent.uploadBlob(Buffer.from(imageBuffer), { encoding: 'image/png' });

  const postRes = await agent.post({
    text: postText,
    embed: {
      $type: 'app.bsky.embed.images#main',
      images: [{ image: uploadRes.data.blob, alt: `${entry.chinese} (${entry.pinyin}) — ${entry.english}` }],
    },
  });

  return postRes.uri;
}

async function postToPinterest(entry: typeof wordsData.entries[0], dayNumber: number, ogImageUrl: string): Promise<string> {
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  const siteUrl = process.env.SITE_URL ?? 'https://www.hanzidaily.com';

  if (!accessToken || !boardId) {
    throw new Error('Missing Pinterest credentials');
  }

  const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category;
  const example = entry.examples[0];

  const title = `Day ${dayNumber}: ${entry.chinese} (${entry.pinyin}) — ${entry.english}`;
  const description = `今日一词 · ${entry.chinese} (${entry.pinyin})
${entry.english}

${categoryLabel} | ${example.chinese}
${example.english}

Learn a new Chinese word every day at hanzidaily.com
#LearnChinese #汉字 #Mandarin #ChineseLanguage #HSK`;

  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: boardId,
      media_source: { source_type: 'image_url', url: ogImageUrl },
      title,
      description,
      link: `${siteUrl}/word/${entry.id}`,
    }),
  });

  const data = await res.json() as { id?: string; code?: number; message?: string };
  if (!data.id) {
    throw new Error(`Pinterest pin failed: ${data.message ?? JSON.stringify(data)}`);
  }

  return data.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date();
  const daysSinceStart = getDaysSinceStart(today);
  const entries = (wordsData as { entries: typeof wordsData.entries }).entries;
  const index = daysSinceStart % entries.length;
  const entry = entries[index];
  const dayNumber = daysSinceStart + 1;

  const siteUrl = process.env.SITE_URL ?? 'https://www.hanzidaily.com';
  const ogImageUrl = `${siteUrl}/api/og?wordId=${entry.id}`;

  const results: Record<string, string> = {};

  // Post to X
  try {
    const tweetId = await postToX(entry, dayNumber, ogImageUrl);
    results.x = `ok:${tweetId}`;
  } catch (err) {
    console.error('X post error:', err);
    results.x = `error:${err instanceof Error ? err.message : String(err)}`;
  }

  // Post to Instagram
  try {
    const postId = await postToInstagram(entry, dayNumber, ogImageUrl);
    results.instagram = `ok:${postId}`;
  } catch (err) {
    console.error('Instagram post error:', err);
    results.instagram = `error:${err instanceof Error ? err.message : String(err)}`;
  }

  // Post to Reddit
  try {
    const submissionName = await postToReddit(entry, dayNumber);
    results.reddit = `ok:${submissionName}`;
  } catch (err) {
    console.error('Reddit post error:', err);
    results.reddit = `error:${err instanceof Error ? err.message : String(err)}`;
  }

  // Post to Bluesky
  try {
    const uri = await postToBluesky(entry, dayNumber, ogImageUrl);
    results.bluesky = `ok:${uri}`;
  } catch (err) {
    console.error('Bluesky post error:', err);
    results.bluesky = `error:${err instanceof Error ? err.message : String(err)}`;
  }

  // Post to Pinterest
  try {
    const pinId = await postToPinterest(entry, dayNumber, ogImageUrl);
    results.pinterest = `ok:${pinId}`;
  } catch (err) {
    console.error('Pinterest post error:', err);
    results.pinterest = `error:${err instanceof Error ? err.message : String(err)}`;
  }

  return res.status(200).json({ ...results, word: entry.chinese });
}
