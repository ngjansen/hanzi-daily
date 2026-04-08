import { Link } from 'react-router-dom';
import { useLanguage, type LangMode } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import styles from './Nav.module.css';

const LANG_OPTIONS: { value: LangMode; label: string; title: string }[] = [
  { value: 'bilingual', label: '双',  title: 'Bilingual (English + Chinese)' },
  { value: 'zh',        label: '中',  title: 'Chinese only' },
];

export function Nav() {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.nav} id="main-nav" role="navigation" aria-label="Main navigation">
      {/* Left: app name */}
      <div className={styles.brand}>
        <span className={styles.brandChinese}>每日一词</span>
        <span className={styles.brandSub}>Daily Chinese Word</span>
      </div>

      {/* Middle: nav links */}
      <div className={styles.navLinks}>
        <Link to="/browse" className={styles.navLink}>Browse</Link>
        <Link to="/resources" className={styles.navLink}>Resources</Link>
      </div>

      {/* Right: controls */}
      <div className={styles.controls}>
        {/* Language toggle pill */}
        <div className={styles.langPill} role="group" aria-label="Language mode">
          {LANG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`${styles.langBtn} ${lang === opt.value ? styles.langBtnActive : ''}`}
              onClick={() => setLang(opt.value)}
              title={opt.title}
              aria-pressed={lang === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Dark mode toggle */}
        <button
          className={styles.themeBtn}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
