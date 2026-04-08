// src/components/BrowsePage.tsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Nav } from './Nav';
import { WordCard } from './WordCard';
import wordsData from '../data/words.json';
import type { WordsData, WordEntry, WordCategory } from '../types';
import styles from './BrowsePage.module.css';

const data = wordsData as WordsData;
const PAGE_SIZE = 30;

const CATEGORY_FILTERS: { value: WordCategory | 'all'; label: string }[] = [
  { value: 'all',              label: 'All' },
  { value: 'classical_idiom',  label: 'Classical Idiom' },
  { value: 'business',         label: 'Business' },
  { value: 'modern_tech',      label: 'Modern Tech' },
  { value: 'literature',       label: 'Literature' },
  { value: 'internet_culture', label: 'Internet Culture' },
];

export function BrowsePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<WordCategory | 'all'>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim();
    const ql = q.toLowerCase();
    return data.entries.filter((entry: WordEntry) => {
      const categoryMatch = activeCategory === 'all' || entry.category === activeCategory;
      if (!categoryMatch) return false;
      if (!q) return true;
      return (
        entry.chinese.includes(q) ||
        entry.pinyin.toLowerCase().includes(ql) ||
        entry.english.toLowerCase().includes(ql)
      );
    });
  }, [query, activeCategory]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  function handleCategoryChange(cat: WordCategory | 'all') {
    setActiveCategory(cat);
    setPage(1);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  return (
    <>
      <Helmet>
        <title>Browse Words — HanziDaily 每日一词</title>
        <meta name="description" content={`Browse all ${data.entries.length} Chinese words in the HanziDaily library. Filter by category and search by character, pinyin, or meaning.`} />
        <link rel="canonical" href="https://www.hanzidaily.com/browse" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <div className={styles.container}>
            <Link to="/" className={styles.backLink}>← Today's word</Link>

            <header className={styles.header}>
              <span className={styles.headerGlyph}>词库</span>
              <h1 className={styles.title}>Word Library</h1>
              <p className={styles.subtitle}>
                {data.entries.length} words across 5 categories. Search by character, pinyin, or meaning.
              </p>
            </header>

            <div className={styles.controls}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Search: 运筹, yùn chóu, or strategy…"
                value={query}
                onChange={handleSearch}
                aria-label="Search words"
              />
              <div className={styles.filterRow} role="group" aria-label="Filter by category">
                {CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.value}
                    className={`${styles.filterChip} ${activeCategory === f.value ? styles.filterChipActive : ''}`}
                    onClick={() => handleCategoryChange(f.value as WordCategory | 'all')}
                    aria-pressed={activeCategory === f.value}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.resultsMeta}>
              {filtered.length === data.entries.length
                ? `${data.entries.length} words`
                : `${filtered.length} of ${data.entries.length} words`}
            </p>

            <div className={styles.grid}>
              {visible.length === 0 && (
                <p className={styles.empty}>No words match your search.</p>
              )}
              {visible.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/word/${entry.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <WordCard entry={entry} dayNumber={entry.id} onClick={() => {}} />
                </Link>
              ))}
            </div>

            {hasMore && (
              <button className={styles.loadMore} onClick={() => setPage(p => p + 1)}>
                Load more · {filtered.length - visible.length} remaining
              </button>
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
