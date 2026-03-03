import { useLanguage } from '../contexts/LanguageContext';
import type { WordEntry } from '../types';
import styles from './WordCard.module.css';

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  classical_idiom:  { en: 'Classical', zh: '成语' },
  modern_tech:      { en: 'Tech',      zh: '科技' },
  business:         { en: 'Business',  zh: '商业' },
  literature:       { en: 'Literature', zh: '文学' },
  internet_culture: { en: 'Internet',  zh: '网络' },
};

interface WordCardProps {
  entry: WordEntry;
  dayNumber: number;
  onClick?: () => void;
}

export function WordCard({ entry, dayNumber, onClick }: WordCardProps) {
  const { lang, t } = useLanguage();
  const label = CATEGORY_LABELS[entry.category] ?? { en: entry.category, zh: entry.category };

  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }
    : undefined;

  return (
    <article
      className={`${styles.card}${onClick ? ` ${styles.clickable}` : ''}`}
      tabIndex={0}
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {/* Day label */}
      <div className={styles.dayRow}>
        <span className={styles.dayLabel}>
          {t(`第 ${dayNumber} 天`, `Day ${dayNumber}`)}
        </span>
        <span className={`badge badge-${entry.category} ${styles.badge}`}>
          {lang === 'zh' ? label.zh : `${label.en} · ${label.zh}`}
        </span>
      </div>

      {/* Chinese characters */}
      <h3 className={styles.chinese}>{entry.chinese}</h3>

      {/* Pinyin */}
      <p className={styles.pinyin}>{entry.pinyin}</p>

      {/* English meaning */}
      {lang !== 'zh' && (
        <p className={styles.english}>{entry.english}</p>
      )}
    </article>
  );
}
