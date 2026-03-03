import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTTS } from '../hooks/useTTS';
import type { WordEntry } from '../types';
import styles from './Hero.module.css';

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  classical_idiom:  { en: 'Classical Idiom', zh: '成语典故' },
  modern_tech:      { en: 'Modern Tech',      zh: '科技新词' },
  business:         { en: 'Business',          zh: '商业用语' },
  literature:       { en: 'Literature',        zh: '文学典故' },
  internet_culture: { en: 'Internet Culture',  zh: '网络用语' },
};

interface HeroProps {
  entry: WordEntry;
  dayNumber: number;
}

export function Hero({ entry, dayNumber }: HeroProps) {
  const { lang, t } = useLanguage();
  const { speak, stop, isPlaying, isSupported } = useTTS();
  const [backstoryOpen, setBackstoryOpen] = useState(false);

  const categoryLabel = CATEGORY_LABELS[entry.category] ?? { en: entry.category, zh: entry.category };

  const handleTTS = () => {
    if (isPlaying) {
      stop();
    } else {
      // Speak character + pinyin + example sentences
      const toSpeak = `${entry.chinese}。${entry.examples[0].chinese}`;
      speak(toSpeak);
    }
  };

  return (
    <section className={styles.hero}>
      {/* Background decoration */}
      <div className={styles.heroBg} aria-hidden="true">
        <div className={styles.heroBgGlow} />
        <div className={styles.heroBgWatermark}>{entry.chinese}</div>
      </div>

      <div className={styles.heroContent}>
        {/* Day number + category */}
        <div className={styles.heroMeta} style={{ animationDelay: '0ms' }}>
          <span className={styles.dayLabel}>
            {t(`第 ${dayNumber} 天`, `Day ${dayNumber}`)}
          </span>
          <span className={`badge badge-${entry.category}`}>
            <span className={styles.catDot} />
            {lang === 'zh'
              ? categoryLabel.zh
              : lang === 'en'
              ? categoryLabel.en
              : `${categoryLabel.en} · ${categoryLabel.zh}`}
          </span>
        </div>

        {/* Main Chinese characters */}
        <div className={styles.chineseWrap} style={{ animationDelay: '60ms' }}>
          <h1 className={styles.chinese}>{entry.chinese}</h1>
          {isSupported && (
            <button
              className={`${styles.ttsBtn} ${isPlaying ? styles.ttsBtnPlaying : ''}`}
              onClick={handleTTS}
              title={isPlaying ? 'Stop' : 'Listen in Chinese'}
              aria-label={isPlaying ? 'Stop pronunciation' : 'Play pronunciation'}
            >
              {isPlaying ? (
                <>
                  <span className={styles.ttsPulse} />
                  <SpeakerOnIcon />
                </>
              ) : (
                <SpeakerIcon />
              )}
            </button>
          )}
          {!isSupported && (
            <button
              className={`${styles.ttsBtn} ${styles.ttsBtnDisabled}`}
              title="Text-to-speech not available in this browser"
              disabled
            >
              <SpeakerOffIcon />
            </button>
          )}
        </div>

        {/* Pinyin */}
        <p className={styles.pinyin} style={{ animationDelay: '120ms' }}>
          {entry.pinyin}
        </p>

        {/* Meaning */}
        <p className={styles.meaning} style={{ animationDelay: '180ms' }}>
          {lang === 'zh'
            ? (entry.meaning_zh ?? entry.english)
            : lang === 'bilingual' && entry.meaning_zh
              ? <>{entry.english}{' '}<span style={{ color: 'var(--text-tertiary)', fontSize: '0.85em', fontFamily: 'var(--font-display)' }}>{entry.meaning_zh}</span></>
              : entry.english}
        </p>

        {/* Divider */}
        <div className={styles.divider} style={{ animationDelay: '220ms' }} />

        {/* Examples */}
        <div className={styles.examples} style={{ animationDelay: '260ms' }}>
          <h2 className={styles.examplesHeading}>
            {t('例句', 'Example Sentences')}
          </h2>
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
          <div className={styles.backstory} style={{ animationDelay: '320ms' }}>
            <button
              className={styles.backstoryToggle}
              onClick={() => setBackstoryOpen(o => !o)}
              aria-expanded={backstoryOpen}
            >
              <span className={styles.backstoryIcon}>
                {backstoryOpen ? '▾' : '▸'}
              </span>
              {t('来历与典故', 'Origin & Cultural Context')}
            </button>
            {backstoryOpen && (
              <p className={styles.backstoryText}>
                {lang === 'zh' ? entry.backstory_zh : entry.backstory}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SpeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" opacity="0.4"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
}
