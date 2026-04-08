// src/components/DailyQuiz.tsx
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
        <p className={styles.heading}>Daily Quiz</p>
        <p className={styles.question}>
          What does <span className={styles.questionWord}>{todayEntry.chinese}</span> mean?
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
              {opt.english}
            </button>
          ))}
        </div>

        {answered && (
          <div className={`${styles.result} ${correct ? styles.resultCorrect : styles.resultWrong}`}>
            <p className={styles.resultHeading}>{correct ? 'Correct!' : 'Not quite —'}</p>
            <p>
              {todayEntry.chinese} ({todayEntry.pinyin}) means &ldquo;{todayEntry.english}&rdquo;.{' '}
              {todayEntry.meaning_zh && <span>{todayEntry.meaning_zh}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
