import { useEffect, useId } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { WordEntry } from '../types';
import styles from './WordDetailModal.module.css';

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  classical_idiom:  { en: 'Classical Idiom', zh: '成语典故' },
  modern_tech:      { en: 'Modern Tech',      zh: '科技新词' },
  business:         { en: 'Business',          zh: '商业用语' },
  literature:       { en: 'Literature',        zh: '文学典故' },
  internet_culture: { en: 'Internet Culture',  zh: '网络用语' },
};

interface WordDetailModalProps {
  entry: WordEntry;
  dayNumber: number;
  onClose: () => void;
}

export function WordDetailModal({ entry, dayNumber, onClose }: WordDetailModalProps) {
  const { lang, t } = useLanguage();
  const titleId = useId();
  const categoryLabel = CATEGORY_LABELS[entry.category] ?? { en: entry.category, zh: entry.category };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.dayLabel}>
              {t(`第 ${dayNumber} 天`, `Day ${dayNumber}`)}
            </span>
            <span className={`badge badge-${entry.category}`}>
              {lang === 'zh'
                ? categoryLabel.zh
                : lang === 'en'
                ? categoryLabel.en
                : `${categoryLabel.en} · ${categoryLabel.zh}`}
            </span>
          </div>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label={lang === 'zh' ? '关闭' : 'Close'}
          >
            ×
          </button>
        </div>

        {/* Chinese characters */}
        <h2 id={titleId} className={styles.chinese}>{entry.chinese}</h2>

        {/* Pinyin */}
        <p className={styles.pinyin}>{entry.pinyin}</p>

        {/* Meaning */}
        <p className={styles.meaning}>
          {lang === 'zh'
            ? (entry.meaning_zh ?? entry.english)
            : lang === 'bilingual' && entry.meaning_zh
              ? <>{entry.english}{' '}<span style={{ color: 'var(--text-tertiary)', fontSize: '0.85em', fontFamily: 'var(--font-display)' }}>{entry.meaning_zh}</span></>
              : entry.english}
        </p>

        {/* Divider */}
        <div className={styles.divider} aria-hidden="true" />

        {/* Examples */}
        <div className={styles.examples}>
          <h3 className={styles.sectionHeading}>
            {t('例句', 'Example Sentences')}
          </h3>
          {entry.examples.map((ex, i) => (
            <div key={i} className={styles.example}>
              <p className={styles.exampleChinese}>{ex.chinese}</p>
              {lang !== 'zh' && (
                <p className={styles.exampleEnglish}>{ex.english}</p>
              )}
            </div>
          ))}
        </div>

        {/* Backstory */}
        {(lang !== 'zh' || entry.backstory_zh) && (
          <div className={styles.backstorySection}>
            <h3 className={styles.sectionHeading}>
              {t('来历与典故', 'Origin & Cultural Context')}
            </h3>
            <p className={styles.backstoryText}>
              {lang === 'zh' ? entry.backstory_zh : entry.backstory}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
