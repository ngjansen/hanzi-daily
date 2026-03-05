import { useState, useEffect } from 'react';
import styles from './ReactionBar.module.css';

interface Counts {
  knew: number;
  new: number;
  knewFormatted: string;
  newFormatted: string;
}

interface ReactionBarProps {
  wordId: number;
}

type Reaction = 'knew' | 'new' | null;

const STORAGE_KEY = (id: number) => `hanzi-reaction-${id}`;

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export function ReactionBar({ wordId }: ReactionBarProps) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [voted, setVoted] = useState<Reaction>(null);
  const [animating, setAnimating] = useState<Reaction>(null);

  // Load voted state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(wordId)) as Reaction;
    if (stored) setVoted(stored);
  }, [wordId]);

  // Fetch counts from API
  useEffect(() => {
    fetch(`/api/react?wordId=${wordId}`)
      .then((r) => r.json())
      .then((data: Counts) => setCounts(data))
      .catch(() => setCounts({ knew: 0, new: 0, knewFormatted: '0', newFormatted: '0' }));
  }, [wordId]);

  async function handleReact(reaction: 'knew' | 'new') {
    if (voted) return; // already voted

    // Optimistic update
    setCounts((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (reaction === 'knew') {
        updated.knew += 1;
        updated.knewFormatted = formatCount(updated.knew);
      } else {
        updated.new += 1;
        updated.newFormatted = formatCount(updated.new);
      }
      return updated;
    });

    setVoted(reaction);
    setAnimating(reaction);
    localStorage.setItem(STORAGE_KEY(wordId), reaction);
    setTimeout(() => setAnimating(null), 400);

    // Confirm with server
    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: String(wordId), reaction }),
      });
      const data: Counts = await res.json();
      setCounts(data);
    } catch {
      // keep optimistic count
    }
  }

  return (
    <div className={styles.bar}>
      <button
        className={`${styles.reactionBtn} ${voted === 'knew' ? styles.active : ''} ${animating === 'knew' ? styles.pop : ''} ${voted && voted !== 'knew' ? styles.muted : ''}`}
        onClick={() => handleReact('knew')}
        disabled={!!voted}
        aria-label="I knew this word"
        aria-pressed={voted === 'knew'}
      >
        <span className={styles.emoji}>🎯</span>
        <span className={styles.label}>知道了 · I knew this</span>
        {counts !== null && (
          <span className={styles.count}>{counts.knewFormatted}</span>
        )}
      </button>

      <button
        className={`${styles.reactionBtn} ${voted === 'new' ? styles.active : ''} ${animating === 'new' ? styles.pop : ''} ${voted && voted !== 'new' ? styles.muted : ''}`}
        onClick={() => handleReact('new')}
        disabled={!!voted}
        aria-label="New word for me"
        aria-pressed={voted === 'new'}
      >
        <span className={styles.emoji}>✨</span>
        <span className={styles.label}>新词 · New to me</span>
        {counts !== null && (
          <span className={styles.count}>{counts.newFormatted}</span>
        )}
      </button>
    </div>
  );
}
