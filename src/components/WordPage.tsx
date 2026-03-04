import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Nav } from './Nav';
import { Hero } from './Hero';
import wordsData from '../data/words.json';
import type { WordsData, WordEntry } from '../types';

const data = wordsData as WordsData;

const SITE_URL = 'https://www.hanzidaily.com';

function wordSchema(entry: WordEntry, id: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.chinese,
    description: `${entry.chinese} (${entry.pinyin}): ${entry.english}. ${entry.backstory}`,
    inDefinedTermSet: SITE_URL + '/',
    url: `${SITE_URL}/word/${id}`,
    sameAs: `${SITE_URL}/word/${id}`,
  };
}

export function WordPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);

  const entry = data.entries.find((e) => e.id === numId);
  if (!entry) return <Navigate to="/" replace />;

  const dayNumber = data.entries.findIndex((e) => e.id === numId) + 1;
  const pageUrl = `${SITE_URL}/word/${numId}`;
  const title = `${entry.chinese} (${entry.pinyin}) — ${entry.english} | HanziDaily 每日一词`;
  const description = `${entry.chinese} (${entry.pinyin}): ${entry.english}. ${entry.backstory.slice(0, 130)}…`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${entry.chinese} — ${entry.english} | HanziDaily`} />
        <meta property="og:description" content={entry.backstory.slice(0, 200)} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${entry.chinese} — ${entry.english} | HanziDaily`} />
        <meta name="twitter:description" content={entry.backstory.slice(0, 200)} />
        <script type="application/ld+json">
          {JSON.stringify(wordSchema(entry, numId))}
        </script>
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <div style={{
            maxWidth: 'var(--content-max)',
            margin: '0 auto',
            padding: 'var(--space-4) var(--space-6) 0',
          }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35em',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.01em',
              }}
            >
              ← Today's word
            </Link>
          </div>
          <Hero entry={entry} dayNumber={dayNumber} />
        </main>
      </div>
    </>
  );
}
