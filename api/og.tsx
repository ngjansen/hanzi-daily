import { ImageResponse } from '@vercel/og';
import type { VercelRequest } from '@vercel/node';
import wordsData from '../src/data/words.json';

export const config = { runtime: 'edge' };

const CATEGORY_LABELS: Record<string, string> = {
  classical_idiom:  '成语典故',
  modern_tech:      '科技新词',
  business:         '商业用语',
  literature:       '文学典故',
  internet_culture: '网络用语',
};

export default async function handler(req: VercelRequest) {
  const { searchParams } = new URL(req.url as string, 'https://www.hanzidaily.com');
  const wordId = Number(searchParams.get('wordId') ?? '1');

  const entry = wordsData.entries.find((e) => e.id === wordId);
  if (!entry) {
    return new Response('Not found', { status: 404 });
  }

  const dayNumber = wordsData.entries.findIndex((e) => e.id === wordId) + 1;
  const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category;

  // Fetch Noto Serif SC for Chinese characters (regular weight for body, 900 for display)
  const [notoSerifSC700, notoSerifSC400] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/notoserifsc/v23/H4c8BXePl9DZ0Xe7gG9cyOj7mgq0SBnQ_HMB.woff').then((r) => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/notoserifsc/v23/H4c8BXePl9DZ0Xe7gG9cyOj7uAq0SBnQ_HMB.woff').then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f0f0f',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Noto Serif SC", serif',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(200,71,58,0.22) 0%, transparent 68%)',
          display: 'flex',
        }}
      />

      {/* Watermark character */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '-30px',
          transform: 'translateY(-50%)',
          fontSize: '380px',
          fontWeight: 900,
          color: '#C8473A',
          opacity: 0.06,
          lineHeight: 1,
          display: 'flex',
          fontFamily: '"Noto Serif SC", serif',
        }}
      >
        {entry.chinese}
      </div>

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 72px',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top row: day + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#666',
              fontFamily: 'sans-serif',
            }}
          >
            DAY {dayNumber}
          </span>
          <span style={{ color: '#333', fontSize: '14px', fontFamily: 'sans-serif' }}>·</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#C8473A',
              letterSpacing: '0.05em',
              fontFamily: '"Noto Serif SC", serif',
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {/* Chinese characters */}
          <div
            style={{
              fontSize: '128px',
              fontWeight: 700,
              color: '#f5f0eb',
              letterSpacing: '0.06em',
              lineHeight: 1.05,
              fontFamily: '"Noto Serif SC", serif',
              display: 'flex',
            }}
          >
            {entry.chinese}
          </div>

          {/* Pinyin */}
          <div
            style={{
              fontSize: '28px',
              color: '#888',
              letterSpacing: '0.04em',
              marginTop: '12px',
              fontFamily: 'sans-serif',
              display: 'flex',
            }}
          >
            {entry.pinyin}
          </div>

          {/* Red divider */}
          <div
            style={{
              width: '64px',
              height: '3px',
              background: 'linear-gradient(90deg, #C8473A, transparent)',
              borderRadius: '2px',
              margin: '28px 0',
              display: 'flex',
            }}
          />

          {/* English meaning */}
          <div
            style={{
              fontSize: '34px',
              color: '#d4cdc6',
              lineHeight: 1.4,
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 400,
              display: 'flex',
            }}
          >
            {entry.english}
          </div>
        </div>

        {/* Bottom: branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#C8473A',
                fontFamily: '"Noto Serif SC", serif',
                display: 'flex',
              }}
            >
              每日一词
            </span>
            <span
              style={{
                fontSize: '15px',
                color: '#555',
                fontFamily: 'sans-serif',
                display: 'flex',
              }}
            >
              hanzidaily.com
            </span>
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#444',
              letterSpacing: '0.05em',
              fontFamily: 'sans-serif',
              display: 'flex',
            }}
          >
            LEARN A NEW CHINESE WORD EVERY DAY
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Noto Serif SC', data: notoSerifSC700, weight: 700, style: 'normal' },
        { name: 'Noto Serif SC', data: notoSerifSC400, weight: 400, style: 'normal' },
      ],
    }
  );
}
