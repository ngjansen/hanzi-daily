// src/components/DailyQuiz.tsx
import { useState } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import type { WordEntry } from '../types';
import styles from './DailyQuiz.module.css';

interface DailyQuizProps {
  todayEntry: WordEntry;
  allEntries: WordEntry[];
}

export function DailyQuiz({ todayEntry, allEntries }: DailyQuizProps) {
  const { options, correctIndex, answered, correct, selectedIndex, answer } = useQuiz(
    todayEntry,
    allEntries,
  );
  const [lang, setLang] = useState<'en' | 'zh'>('en');

  function getOptionClass(i: number): string {
    if (!answered) return styles.option;
    if (i === correctIndex) return `${styles.option} ${styles.optionCorrect}`;
    if (i === selectedIndex && !correct) return `${styles.option} ${styles.optionWrong}`;
    return styles.option;
  }

  function getIndicator(i: number): string {
    if (!answered) return '';
    if (i === correctIndex) return '✓';
    if (i === selectedIndex && !correct) return '✗';
    return '';
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.card}>
        <div className={styles.headingRow}>
          <p className={styles.heading}>Daily Quiz</p>
          <button
            className={`${styles.langToggle} ${lang === 'zh' ? styles.langToggleActive : ''}`}
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            aria-label="Toggle quiz language"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        <p className={styles.question}>
          {lang === 'en' ? (
            <>What does <span className={styles.questionWord}>{todayEntry.chinese}</span> mean?</>
          ) : (
            <>「<span className={styles.questionWord}>{todayEntry.chinese}</span>」是什么意思？</>
          )}
        </p>

        <div className={styles.options}>
          {options.map((opt, i) => (
            <button
              key={opt.id}
              className={getOptionClass(i)}
              onClick={() => answer(i)}
              disabled={answered}
            >
              {answered && (
                <span className={styles.optionIndicator}>{getIndicator(i)}</span>
              )}
              {lang === 'en' ? opt.english : opt.meaning_zh}
            </button>
          ))}
        </div>

        {answered && (
          <div className={`${styles.result} ${correct ? styles.resultCorrect : styles.resultWrong}`}>
            <p className={styles.resultHeading}>{correct ? (lang === 'en' ? 'Correct!' : '答对了！') : (lang === 'en' ? 'Not quite —' : '答错了 —')}</p>
            <p>
              {lang === 'en' ? (
                <>{todayEntry.chinese} ({todayEntry.pinyin}) means &ldquo;{todayEntry.english}&rdquo;.{' '}
                {todayEntry.meaning_zh && <span>{todayEntry.meaning_zh}</span>}</>
              ) : (
                <>{todayEntry.chinese}（{todayEntry.pinyin}）的意思是"{todayEntry.meaning_zh}"。{' '}
                <span>{todayEntry.english}</span></>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
