import { useState, useEffect } from 'react';
import type { WordEntry } from '../types';

export function scoreKey(dateStr: string): string {
  return `hz_quiz_${dateStr}`;
}

interface QuizOption {
  id: number;
  english: string;
}

export interface QuizState {
  options: QuizOption[];
  correctIndex: number;
}

// Seeded pseudo-random (mulberry32) for deterministic shuffling
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildQuizOptions(
  correct: WordEntry,
  pool: WordEntry[],
  seed: number,
): QuizState {
  const rand = mulberry32(seed);
  const distractors = pool
    .filter(e => e.id !== correct.id)
    .sort(() => rand() - 0.5)
    .slice(0, 3);

  const allOptions: QuizOption[] = [
    { id: correct.id, english: correct.english },
    ...distractors.map(e => ({ id: e.id, english: e.english })),
  ];

  // Shuffle with same seed offset
  const rand2 = mulberry32(seed + 1);
  const shuffled = allOptions.sort(() => rand2() - 0.5);
  const correctIndex = shuffled.findIndex(o => o.id === correct.id);

  return { options: shuffled, correctIndex };
}

export interface QuizResult {
  answered: boolean;
  correct: boolean;
  selectedIndex: number;
}

export interface UseQuizReturn {
  options: QuizOption[];
  correctIndex: number;
  answered: boolean;
  correct: boolean;
  selectedIndex: number;
  answer: (index: number) => void;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useQuiz(todayEntry: WordEntry, allEntries: WordEntry[]): UseQuizReturn {
  const todayStr = toDateStr(new Date());
  const key = scoreKey(todayStr);

  const { options, correctIndex } = buildQuizOptions(
    todayEntry,
    allEntries,
    todayEntry.id + (new Date(todayStr).getTime() % 10000),
  );

  const stored = localStorage.getItem(key);
  const initial: QuizResult = stored
    ? JSON.parse(stored)
    : { answered: false, correct: false, selectedIndex: -1 };

  const [state, setState] = useState<QuizResult>(initial);

  useEffect(() => {
    const fresh = localStorage.getItem(key);
    if (fresh) {
      setState(JSON.parse(fresh));
    }
  }, [key]);

  function answer(index: number) {
    if (state.answered) return;
    const isCorrect = index === correctIndex;
    const result: QuizResult = { answered: true, correct: isCorrect, selectedIndex: index };
    localStorage.setItem(key, JSON.stringify(result));
    setState(result);
  }

  return {
    options,
    correctIndex,
    answered: state.answered,
    correct: state.correct,
    selectedIndex: state.selectedIndex,
    answer,
  };
}
