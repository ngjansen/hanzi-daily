import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Archive } from './components/Archive';
import { SubscribeForm } from './components/SubscribeForm';
import { UnsubscribePage } from './components/UnsubscribePage';
import wordsData from './data/words.json';
import type { WordsData, WordEntry } from './types';

const data = wordsData as WordsData;

const LAUNCH_DATE = new Date('2026-02-22');

function getDaysSinceStart(date: Date): number {
  const start = new Date(LAUNCH_DATE);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function App() {
  // Unsubscribe route guard — render standalone page at /unsubscribe
  if (window.location.pathname === '/unsubscribe') {
    return (
      <ThemeProvider>
        <UnsubscribePage />
      </ThemeProvider>
    );
  }

  const today = new Date();
  const daysSinceStart = getDaysSinceStart(today);
  const totalEntries = data.entries.length; // 90

  // Today's index — deterministic, date-based rotation
  const todayIndex = daysSinceStart % totalEntries;
  const todayEntry: WordEntry = data.entries[todayIndex];

  // Past entries: all indices before today's (in rotation order)
  const pastEntries: { entry: WordEntry; dayNumber: number }[] = [];
  for (let i = 0; i < todayIndex; i++) {
    pastEntries.push({
      entry: data.entries[i],
      dayNumber: i + 1,
    });
  }
  // Reverse so most recent past is first
  pastEntries.reverse();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Nav />
          <main style={{ flex: 1 }}>
            <Hero entry={todayEntry} dayNumber={daysSinceStart + 1} />
            <SubscribeForm />
            <Archive entries={pastEntries} />
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
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
