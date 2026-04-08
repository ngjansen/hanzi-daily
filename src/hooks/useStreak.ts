import { useEffect, useState } from 'react';

const KEY_DATE = 'hz_streak_date';
const KEY_COUNT = 'hz_streak_count';

export interface StreakResult {
  count: number;
  isNew: boolean;
}

export function computeStreak(
  todayStr: string,
  storedDate: string | null,
  storedCount: string | null,
): StreakResult {
  if (storedDate === null || storedCount === null) {
    return { count: 1, isNew: true };
  }

  if (storedDate === todayStr) {
    return { count: parseInt(storedCount, 10), isNew: false };
  }

  const todayMs = new Date(todayStr).getTime();
  const lastMs = new Date(storedDate).getTime();
  const daysDiff = Math.round((todayMs - lastMs) / 86_400_000);

  if (daysDiff === 1) {
    return { count: parseInt(storedCount, 10) + 1, isNew: true };
  }

  return { count: 1, isNew: true };
}

// Use local date components so "day" matches the user's timezone, not UTC.
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useStreak(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const todayStr = toDateStr(new Date());
    const storedDate = localStorage.getItem(KEY_DATE);
    const storedCount = localStorage.getItem(KEY_COUNT);

    const { count: newCount, isNew } = computeStreak(todayStr, storedDate, storedCount);

    if (isNew) {
      localStorage.setItem(KEY_DATE, todayStr);
      localStorage.setItem(KEY_COUNT, String(newCount));
    }

    setCount(newCount);
  }, []);

  return count;
}
