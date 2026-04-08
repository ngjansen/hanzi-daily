import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  isFav: boolean;
  onToggle: () => void;
  size?: number;
}

export function FavoriteButton({ isFav, onToggle, size = 18 }: FavoriteButtonProps) {
  return (
    <button
      className={`${styles.btn} ${isFav ? styles.btnActive : ''}`}
      onClick={e => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      title={isFav ? 'Remove from saved words' : 'Save word'}
      aria-label={isFav ? 'Remove from saved' : 'Save word'}
      aria-pressed={isFav}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
