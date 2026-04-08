import { describe, it, expect } from 'vitest';
import { buildQuizOptions, scoreKey } from '../useQuiz';
import type { WordEntry } from '../../types';

const makeEntry = (id: number, english: string): WordEntry => ({
  id,
  chinese: `字${id}`,
  pinyin: `zì${id}`,
  english,
  category: 'business',
  examples: [{ chinese: '例句', english: 'example' }],
  backstory: 'backstory',
});

describe('scoreKey', () => {
  it('returns hz_quiz_ prefixed date string', () => {
    expect(scoreKey('2026-04-08')).toBe('hz_quiz_2026-04-08');
  });
});

describe('buildQuizOptions', () => {
  const pool: WordEntry[] = [
    makeEntry(1, 'Strategy'),
    makeEntry(2, 'Innovation'),
    makeEntry(3, 'Resilience'),
    makeEntry(4, 'Harmony'),
    makeEntry(5, 'Efficiency'),
  ];

  it('returns exactly 4 options', () => {
    const result = buildQuizOptions(pool[0], pool, 42);
    expect(result.options).toHaveLength(4);
  });

  it('always includes the correct answer', () => {
    const result = buildQuizOptions(pool[0], pool, 42);
    expect(result.options[result.correctIndex].english).toBe('Strategy');
  });

  it('does not duplicate the correct answer as a distractor', () => {
    const result = buildQuizOptions(pool[0], pool, 42);
    const englishValues = result.options.map(o => o.english);
    const unique = new Set(englishValues);
    expect(unique.size).toBe(4);
  });

  it('is deterministic given the same seed', () => {
    const r1 = buildQuizOptions(pool[0], pool, 99);
    const r2 = buildQuizOptions(pool[0], pool, 99);
    expect(r1.options.map(o => o.id)).toEqual(r2.options.map(o => o.id));
  });
});
