import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { WordCard } from './WordCard';
import type { WordEntry } from '../types';
import styles from './Archive.module.css';

const VISIBLE_LIMIT = 30;

interface ArchiveProps {
  entries: { entry: WordEntry; dayNumber: number }[];
}

export function Archive({ entries }: ArchiveProps) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  if (entries.length === 0) return null;

  const visibleEntries = showAll ? entries : entries.slice(0, VISIBLE_LIMIT);

  return (
    <section className={styles.archive} aria-label="Past words archive">
      <div className={styles.archiveInner}>
        <div className={styles.archiveHeader}>
          <div className={styles.archiveHeadingRow}>
            <h2 className={styles.archiveHeading}>
              {t('往期词汇', 'Past Words')}
            </h2>
            <span className={styles.archiveCount}>
              {t(`${entries.length} 词`, `${entries.length} words`)}
            </span>
          </div>
        </div>

        <div className={styles.grid}>
          {visibleEntries.map(({ entry, dayNumber }) => (
            <Link
              key={entry.id}
              to={`/word/${entry.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <WordCard
                entry={entry}
                dayNumber={dayNumber}
                onClick={() => {}}
              />
            </Link>
          ))}
        </div>

        {entries.length > VISIBLE_LIMIT && !showAll && (
          <button
            className={styles.showMore}
            onClick={() => setShowAll(true)}
          >
            {t('展开更多', 'Show more')}
            <span className={styles.showMoreCount}>
              {t(`· 还有 ${entries.length - VISIBLE_LIMIT} 个`, `· ${entries.length - VISIBLE_LIMIT} more`)}
            </span>
          </button>
        )}
      </div>

    </section>
  );
}
