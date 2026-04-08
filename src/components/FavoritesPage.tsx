// src/components/FavoritesPage.tsx
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Nav } from './Nav';
import { WordCard } from './WordCard';
import { useFavorites } from '../hooks/useFavorites';
import wordsData from '../data/words.json';
import type { WordsData, WordEntry } from '../types';
import styles from './FavoritesPage.module.css';

const data = wordsData as WordsData;

export function FavoritesPage() {
  const { favorites, isFav, toggle } = useFavorites();

  const savedEntries: WordEntry[] = data.entries.filter(e => favorites.includes(e.id));

  return (
    <>
      <Helmet>
        <title>Saved Words — HanziDaily 每日一词</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <div className={styles.container}>
            <Link to="/" className={styles.backLink}>← Today's word</Link>

            <span className={styles.headerGlyph}>收藏</span>
            <h1 className={styles.title}>Saved Words</h1>
            <p className={styles.subtitle}>
              {savedEntries.length === 0
                ? 'No saved words yet.'
                : `${savedEntries.length} saved word${savedEntries.length === 1 ? '' : 's'}`}
            </p>

            {savedEntries.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyGlyph}>♡</span>
                Tap the heart on any word to save it here.
              </div>
            ) : (
              <div className={styles.grid}>
                {savedEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/word/${entry.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative' }}
                  >
                    <WordCard
                      entry={entry}
                      dayNumber={entry.id}
                      isFav={isFav(entry.id)}
                      onToggleFav={() => toggle(entry.id)}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-body)',
        }}>
          每日一词 · since 2026-02-22
        </footer>
      </div>
    </>
  );
}
