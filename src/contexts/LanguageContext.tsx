import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type LangMode = 'bilingual' | 'zh';

interface LanguageContextValue {
  lang: LangMode;
  setLang: (l: LangMode) => void;
  /** Renders content based on current language mode.
   *  In bilingual: returns JSX with both (en on top, zh as tertiary caption)
   *  In zh: returns zh string
   *  In en: returns en string
   */
  t: (zh: string, en: string) => React.ReactNode;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'hanzi-lang';

function getInitialLang(): LangMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as LangMode | null;
    if (stored && ['bilingual', 'zh'].includes(stored)) return stored;
  } catch {}
  return 'bilingual';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangMode>(getInitialLang);

  const setLang = useCallback((l: LangMode) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const t = useCallback((zh: string, en: string): React.ReactNode => {
    if (lang === 'zh') return zh;
    // bilingual: en + zh caption
    return (
      <>
        {en}{' '}
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85em', fontFamily: 'var(--font-display)' }}>
          {zh}
        </span>
      </>
    );
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
