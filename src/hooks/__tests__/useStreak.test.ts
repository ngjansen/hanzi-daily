import { describe, it, expect } from 'vitest';
import { computeStreak } from '../useStreak';

describe('computeStreak', () => {
  const today = '2026-04-08';
  const yesterday = '2026-04-07';
  const twoDaysAgo = '2026-04-06';

  it('starts streak at 1 on first ever visit (no stored data)', () => {
    const result = computeStreak(today, null, null);
    expect(result.count).toBe(1);
    expect(result.isNew).toBe(true);
  });

  it('continues streak when last visit was yesterday', () => {
    const result = computeStreak(today, yesterday, '5');
    expect(result.count).toBe(6);
    expect(result.isNew).toBe(true);
  });

  it('does not increment streak when visiting again today', () => {
    const result = computeStreak(today, today, '3');
    expect(result.count).toBe(3);
    expect(result.isNew).toBe(false);
  });

  it('resets streak to 1 when more than 1 day has passed', () => {
    const result = computeStreak(today, twoDaysAgo, '10');
    expect(result.count).toBe(1);
    expect(result.isNew).toBe(true);
  });
});
