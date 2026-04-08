import { describe, it, expect, beforeEach } from 'vitest';
import { readFavorites, toggleFavorite, isFavorited } from '../useFavorites';

const KEY = 'hz_favorites';

describe('readFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty array when nothing stored', () => {
    expect(readFavorites()).toEqual([]);
  });

  it('returns stored ids', () => {
    localStorage.setItem(KEY, JSON.stringify([1, 2, 3]));
    expect(readFavorites()).toEqual([1, 2, 3]);
  });
});

describe('toggleFavorite', () => {
  beforeEach(() => localStorage.clear());

  it('adds an id that is not yet favorited', () => {
    const result = toggleFavorite(5, [1, 2]);
    expect(result).toContain(5);
    expect(result).toContain(1);
  });

  it('removes an id that is already favorited', () => {
    const result = toggleFavorite(2, [1, 2, 3]);
    expect(result).not.toContain(2);
    expect(result).toContain(1);
    expect(result).toContain(3);
  });
});

describe('isFavorited', () => {
  it('returns true when id is in list', () => {
    expect(isFavorited(3, [1, 2, 3])).toBe(true);
  });

  it('returns false when id is not in list', () => {
    expect(isFavorited(9, [1, 2, 3])).toBe(false);
  });
});
