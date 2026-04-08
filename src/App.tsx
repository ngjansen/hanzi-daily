import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Archive } from './components/Archive';
import { SubscribeForm } from './components/SubscribeForm';
import { UnsubscribePage } from './components/UnsubscribePage';
import { WordPage } from './components/WordPage';
import { ResourcesPage } from './components/ResourcesPage';
import wordsData from './data/words.json';
import type { WordsData, WordEntry } from './types';
import { getDaysSinceStart } from './lib/constants';

const data = wordsData as WordsData;

function HomePage() {
  const today = new Date();
  const daysSinceStart = getDaysSinceStart(today);
  const totalEntries = data.entries.length; // 90

  // Today's index — deterministic, date-based rotation
  const todayIndex = daysSinceStart % totalEntries;
  const todayEntry: WordEntry = data.entries[todayIndex];

  // All past entries in reverse order (most recent first)
  const allPastEntries: { entry: WordEntry; dayNumber: number }[] = [];
  for (let i = 0; i < todayIndex; i++) {
    allPastEntries.push({ entry: data.entries[i], dayNumber: i + 1 });
  }
  allPastEntries.reverse();

  // Homepage shows last 7 only
  const recentEntries = allPastEntries.slice(0, 7);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Hero entry={todayEntry} dayNumber={daysSinceStart + 1} isToday />
        <SubscribeForm />
        <Archive entries={recentEntries} totalPast={allPastEntries.length} />
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: 'var(--space-6) var(--space-6)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-body)',
      }}>
        每日一词 · {data.entries.length} words · since 2026-02-22
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/word/:id" element={<WordPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
