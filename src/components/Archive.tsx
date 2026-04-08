import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { WordCard } from './WordCard';
import type { WordEntry } from '../types';
import styles from './Archive.module.css';

interface ArchiveProps {
  entries: { entry: WordEntry; dayNumber: number }[];
  totalPast: number;
}

export function Archive({ entries, totalPast }: ArchiveProps) {
  const { t } = useLanguage();

  if (entries.length === 0) return null;

  return (
    <section className={styles.archive} aria-label="Past words archive">
      <div className={styles.archiveInner}>
        <div className={styles.archiveHeader}>
          <div className={styles.archiveHeadingRow}>
            <h2 className={styles.archiveHeading}>
              {t('往期词汇', 'Past Words')}
            </h2>
            <Link to="/browse" className={styles.archiveCount}>
              {t(`查看全部 ${totalPast} 词 →`, `Browse all ${totalPast} words →`)}
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {entries.map(({ entry, dayNumber }) => (
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
      </div>
    </section>
  );
}
