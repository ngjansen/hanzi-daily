import { useState, useCallback } from 'react';

const KEY = 'hz_favorites';

export function readFavorites(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: number, current: number[]): number[] {
  const next = current.includes(id)
    ? current.filter(x => x !== id)
    : [...current, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function isFavorited(id: number, list: number[]): boolean {
  return list.includes(id);
}

export interface UseFavoritesReturn {
  favorites: number[];
  toggle: (id: number) => void;
  isFav: (id: number) => boolean;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<number[]>(() => readFavorites());

  const toggle = useCallback((id: number) => {
    setFavorites(current => toggleFavorite(id, current));
  }, []);

  const isFav = useCallback(
    (id: number) => isFavorited(id, favorites),
    [favorites],
  );

  return { favorites, toggle, isFav };
}
