# HanziDaily Phase 2 — Content Expansion, Browse & Engagement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the word bank from 90 to 365 words, replace the homepage archive wall with a clean 7-day preview + `/browse` page with filters and search, then add streak tracking, a daily quiz, and word favorites — all via localStorage with no accounts required.

**Architecture:** Pure data expansion first (words.json), then UI changes in order of impact: Archive trim → Browse page → Streak (Nav) → Quiz (below Hero) → Favorites (Hero + WordCard + page). All new hooks are pure logic extracted into `src/hooks/`, all new pages follow the existing pattern (component + CSS module + route in App.tsx). No accounts, no backend changes for engagement features.

**Tech Stack:** Vite + React 19, TypeScript, CSS Modules, react-router-dom v7, vitest (added for hook tests), @anthropic-ai/sdk (already installed), localStorage for all engagement state.

**Do NOT change:** Existing UI of Hero, WordCard, Nav visual layout, Archive card appearance, or any existing CSS. Only additive changes to existing files.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/types.ts` | Add `hsk_level` field to `WordEntry` |
| Create | `scripts/generate-words.mjs` | Claude API word generation script |
| Modify | `src/data/words.json` | Expand from 90 → 365 entries |
| Modify | `src/App.tsx` | Add `/browse` and `/favorites` routes |
| Modify | `src/components/Archive.tsx` | Cap at 7, add "Browse all →" link |
| Create | `src/components/BrowsePage.tsx` | Full word library with filters + search |
| Create | `src/components/BrowsePage.module.css` | Browse page styles |
| Modify | `src/components/Nav.tsx` | Add Browse + Favorites links, streak badge |
| Modify | `src/components/Nav.module.css` | Streak badge styles |
| Create | `src/hooks/useStreak.ts` | Streak logic (localStorage) |
| Create | `src/hooks/useQuiz.ts` | Daily quiz logic (localStorage) |
| Create | `src/hooks/useFavorites.ts` | Favorites logic (localStorage) |
| Create | `src/components/DailyQuiz.tsx` | Quiz UI component |
| Create | `src/components/DailyQuiz.module.css` | Quiz styles |
| Modify | `src/App.tsx` | Wire DailyQuiz below Hero in HomePage |
| Create | `src/components/FavoriteButton.tsx` | Star toggle button |
| Create | `src/components/FavoriteButton.module.css` | Favorite button styles |
| Modify | `src/components/Hero.tsx` | Add FavoriteButton to actions row |
| Modify | `src/components/WordCard.tsx` | Add FavoriteButton to card |
| Create | `src/components/FavoritesPage.tsx` | Saved words page |
| Create | `src/components/FavoritesPage.module.css` | Favorites page styles |
| Create | `vite.config.test.ts` | Vitest config |
| Create | `src/hooks/__tests__/useStreak.test.ts` | Streak hook tests |
| Create | `src/hooks/__tests__/useQuiz.test.ts` | Quiz hook tests |
| Create | `src/hooks/__tests__/useFavorites.test.ts` | Favorites hook tests |

---

## Phase 1 — Content Expansion

### Task 1: Add `hsk_level` to WordEntry type

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Update the WordEntry interface**

```typescript
// src/types.ts — full file replacement
export interface WordExample {
  chinese: string;
  english: string;
}

export type WordCategory =
  | 'classical_idiom'
  | 'modern_tech'
  | 'business'
  | 'literature'
  | 'internet_culture';

export interface WordEntry {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  meaning_zh?: string;
  category: WordCategory;
  hsk_level?: number | null;
  examples: WordExample[];
  backstory: string;
  backstory_zh?: string;
}

export interface WordsData {
  generated_at: string;
  entries: WordEntry[];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (existing entries without `hsk_level` are valid because it's optional)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add optional hsk_level field to WordEntry type"
```

---

### Task 2: Write word generation script

**Files:**
- Create: `scripts/generate-words.mjs`

- [ ] **Step 1: Create the generation script**

```javascript
// scripts/generate-words.mjs
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wordsPath = join(__dirname, '../src/data/words.json');

const client = new Anthropic();

const TARGETS = {
  classical_idiom:  70,
  business:         60,
  modern_tech:      50,
  literature:       45,
  internet_culture: 50,
};

async function generateBatch(category, count, existing) {
  const existingList = existing.map(e => e.chinese).join('、');

  const prompt = `Generate exactly ${count} Chinese vocabulary entries for the category "${category}" for a word-a-day learning app targeting intermediate-to-advanced learners.

Category descriptions:
- classical_idiom: Four-character idioms (成语) and classical expressions with historical origins
- business: Modern business, finance, and professional Chinese vocabulary
- modern_tech: Technology, internet, and contemporary Chinese terms
- literature: Literary expressions, poetic language, classical references
- internet_culture: Slang, memes, trending phrases used by Chinese internet users

Do NOT include any of these already-existing words: ${existingList}

Return a JSON array of exactly ${count} objects. Each object must have these exact fields:
{
  "chinese": "四字成语或词汇",
  "pinyin": "sì zì chéng yǔ huò cí huì",
  "english": "English meaning (concise, 3-8 words)",
  "meaning_zh": "中文解释（简明扼要）",
  "category": "${category}",
  "hsk_level": null,
  "examples": [
    { "chinese": "包含该词的例句。", "english": "English translation of example sentence." },
    { "chinese": "第二个例句。", "english": "Second example sentence translation." }
  ],
  "backstory": "2-3 sentences in English explaining the origin, cultural context, or how this word is used.",
  "backstory_zh": "2-3句中文，解释该词的来源、文化背景或使用场景。"
}

Return ONLY the raw JSON array, no markdown fences, no explanation.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();
  return JSON.parse(raw);
}

async function main() {
  const wordsData = JSON.parse(readFileSync(wordsPath, 'utf8'));
  const existing = wordsData.entries;
  let nextId = Math.max(...existing.map(e => e.id)) + 1;

  console.log(`Starting with ${existing.length} entries. Target: ${existing.length + Object.values(TARGETS).reduce((a, b) => a + b, 0)}`);

  const newEntries = [];

  for (const [category, count] of Object.entries(TARGETS)) {
    console.log(`\nGenerating ${count} entries for ${category}...`);
    const allExisting = [...existing, ...newEntries];

    try {
      const batch = await generateBatch(category, count, allExisting);

      for (const entry of batch) {
        entry.id = nextId++;
        entry.category = category; // ensure correct category
        newEntries.push(entry);
      }

      console.log(`  ✓ Generated ${batch.length} entries`);
    } catch (err) {
      console.error(`  ✗ Failed for ${category}:`, err.message);
      console.error('  Continuing with next category...');
    }
  }

  const updated = {
    generated_at: new Date().toISOString(),
    entries: [...existing, ...newEntries],
  };

  writeFileSync(wordsPath, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`\n✅ Done. words.json now has ${updated.entries.length} entries.`);
}

main().catch(console.error);
```

- [ ] **Step 2: Commit the script**

```bash
git add scripts/generate-words.mjs
git commit -m "feat: add word generation script using Claude API"
```

---

### Task 3: Generate 275 new words and validate

**Files:**
- Modify: `src/data/words.json`

- [ ] **Step 1: Run the generation script**

```bash
ANTHROPIC_API_KEY=<your-key> node scripts/generate-words.mjs
```

Expected output:
```
Starting with 90 entries. Target: 365
Generating 70 entries for classical_idiom...
  ✓ Generated 70 entries
Generating 60 entries for business...
  ✓ Generated 60 entries
...
✅ Done. words.json now has 365 entries.
```

Note: This will take 2-3 minutes and cost ~$0.50 in API credits.

- [ ] **Step 2: Validate the output**

```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('./src/data/words.json', 'utf8'));
const e = d.entries;
console.log('Total:', e.length);
const cats = {};
e.forEach(x => cats[x.category] = (cats[x.category]||0)+1);
console.log('Categories:', cats);
const ids = e.map(x => x.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log('Duplicate IDs:', dupes.length === 0 ? 'none' : dupes);
const chinese = e.map(x => x.chinese);
const dupeChinese = chinese.filter((c, i) => chinese.indexOf(c) !== i);
console.log('Duplicate words:', dupeChinese.length === 0 ? 'none' : dupeChinese);
const missing = e.filter(x => !x.chinese || !x.pinyin || !x.english || !x.examples || x.examples.length < 2 || !x.backstory);
console.log('Entries with missing fields:', missing.length);
"
```

Expected:
```
Total: 365
Categories: { classical_idiom: 100, business: 80, modern_tech: 70, literature: 60, internet_culture: 55 }
Duplicate IDs: none
Duplicate words: none
Entries with missing fields: 0
```

If duplicate Chinese words appear, remove the duplicates manually and re-run validation.

- [ ] **Step 3: Build to confirm no TypeScript errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/data/words.json
git commit -m "feat: expand word bank from 90 to 365 entries"
```

---

## Phase 2 — Archive Trim + Browse Page

### Task 4: Set up Vitest for hook testing

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest and jsdom**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/jest-dom
```

- [ ] **Step 2: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest works**

```bash
npm test
```

Expected: `No test files found, exiting with code 1` (or 0 depending on vitest version — either is fine, we just need it to run)

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest for hook unit tests"
```

---

### Task 5: Trim Archive to last 7 days

**Files:**
- Modify: `src/components/Archive.tsx`
- Modify: `src/App.tsx`

The Archive currently gets all `pastEntries`. We'll pass only the 7 most recent from HomePage, and update Archive to show a "Browse all" link instead of a "Show more" button.

- [ ] **Step 1: Update Archive to cap at 7 and show Browse link**

Replace `src/components/Archive.tsx` with:

```tsx
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { WordCard } from './WordCard';
import type { WordEntry } from '../types';
import styles from './Archive.module.css';

interface ArchiveProps {
  entries: { entry: WordEntry; dayNumber: number }[];
  totalPast: number;
}

export function Archive({ entries, totalPast }: ArchiveProps) {
  const { t } = useLanguage();

  if (entries.length === 0) return null;

  return (
    <section className={styles.archive} aria-label="Past words archive">
      <div className={styles.archiveInner}>
        <div className={styles.archiveHeader}>
          <div className={styles.archiveHeadingRow}>
            <h2 className={styles.archiveHeading}>
              {t('往期词汇', 'Past Words')}
            </h2>
            <Link to="/browse" className={styles.archiveCount}>
              {t(`查看全部 ${totalPast} 词 →`, `Browse all ${totalPast} words →`)}
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {entries.map(({ entry, dayNumber }) => (
            <Link
              key={entry.id}
              to={`/word/${entry.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <WordCard
                entry={entry}
                dayNumber={dayNumber}
                onClick={() => {}}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update HomePage in App.tsx to pass only last 7 past entries**

In `src/App.tsx`, update the `HomePage` function:

```tsx
function HomePage() {
  const today = new Date();
  const daysSinceStart = getDaysSinceStart(today);
  const totalEntries = data.entries.length;

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
```

- [ ] **Step 3: Update Archive.module.css — make `archiveCount` a link style**

In `src/components/Archive.module.css`, add:

```css
.archiveCount {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--brand);
  text-decoration: none;
  font-weight: 500;
  transition: opacity var(--t-fast);
}

.archiveCount:hover {
  opacity: 0.75;
}
```

(If `.archiveCount` already exists in Archive.module.css, replace its definition with the above.)

- [ ] **Step 4: Verify the app compiles and runs**

```bash
npm run dev
```

Open `http://localhost:5173`. The homepage should show at most 7 past word cards and a "Browse all N words →" link.

- [ ] **Step 5: Commit**

```bash
git add src/components/Archive.tsx src/components/Archive.module.css src/App.tsx
git commit -m "feat: trim homepage archive to 7 days, add browse all link"
```

---

### Task 6: Build BrowsePage with category filters

**Files:**
- Create: `src/components/BrowsePage.tsx`
- Create: `src/components/BrowsePage.module.css`

- [ ] **Step 1: Create BrowsePage styles**

```css
/* src/components/BrowsePage.module.css */
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.backLink {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: var(--text-tertiary);
  text-decoration: none;
  margin-bottom: var(--space-6);
  transition: color var(--t-fast);
}

.backLink:hover {
  color: var(--text-primary);
}

.header {
  margin-bottom: var(--space-8);
}

.headerGlyph {
  display: block;
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--brand);
  opacity: 0.25;
  line-height: 1;
  margin-bottom: var(--space-2);
}

.title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-2);
}

.subtitle {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Controls row */
.controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.searchInput {
  width: 100%;
  padding: 10px 16px;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
  box-sizing: border-box;
}

.searchInput::placeholder {
  color: var(--text-tertiary);
}

.searchInput:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(var(--brand-rgb, 180, 130, 80), 0.15);
}

.filterRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filterChip {
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  white-space: nowrap;
}

.filterChip:hover {
  color: var(--text-primary);
  background: var(--surface-floating);
}

.filterChipActive {
  background: var(--brand);
  color: #fff;
  border-color: var(--brand);
}

.filterChipActive:hover {
  background: var(--brand);
  color: #fff;
}

/* Results */
.resultsMeta {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-bottom: var(--space-4);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-12) 0;
  color: var(--text-tertiary);
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.loadMore {
  display: block;
  margin: 0 auto var(--space-8);
  padding: 10px 28px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}

.loadMore:hover {
  background: var(--surface-floating);
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .container {
    padding: var(--space-6) var(--space-4);
  }
  .title {
    font-size: 1.4rem;
  }
}
```

- [ ] **Step 2: Create BrowsePage component**

```tsx
// src/components/BrowsePage.tsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Nav } from './Nav';
import { WordCard } from './WordCard';
import wordsData from '../data/words.json';
import type { WordsData, WordEntry, WordCategory } from '../types';
import styles from './BrowsePage.module.css';

const data = wordsData as WordsData;
const PAGE_SIZE = 30;

const CATEGORY_FILTERS: { value: WordCategory | 'all'; label: string }[] = [
  { value: 'all',            label: 'All' },
  { value: 'classical_idiom', label: 'Classical Idiom' },
  { value: 'business',       label: 'Business' },
  { value: 'modern_tech',    label: 'Modern Tech' },
  { value: 'literature',     label: 'Literature' },
  { value: 'internet_culture', label: 'Internet Culture' },
];

export function BrowsePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<WordCategory | 'all'>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.entries.filter((entry: WordEntry) => {
      const categoryMatch = activeCategory === 'all' || entry.category === activeCategory;
      if (!categoryMatch) return false;
      if (!q) return true;
      return (
        entry.chinese.includes(query.trim()) ||
        entry.pinyin.toLowerCase().includes(q) ||
        entry.english.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  function handleCategoryChange(cat: WordCategory | 'all') {
    setActiveCategory(cat);
    setPage(1);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  return (
    <>
      <Helmet>
        <title>Browse Words — HanziDaily 每日一词</title>
        <meta name="description" content={`Browse all ${data.entries.length} Chinese words in the HanziDaily library. Filter by category and search by character, pinyin, or meaning.`} />
        <link rel="canonical" href="https://www.hanzidaily.com/browse" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <div className={styles.container}>
            <Link to="/" className={styles.backLink}>← Today's word</Link>

            <header className={styles.header}>
              <span className={styles.headerGlyph}>词库</span>
              <h1 className={styles.title}>Word Library</h1>
              <p className={styles.subtitle}>
                {data.entries.length} words across 5 categories. Search by character, pinyin, or meaning.
              </p>
            </header>

            <div className={styles.controls}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Search: 运筹, yùn chóu, or strategy…"
                value={query}
                onChange={handleSearch}
                aria-label="Search words"
              />
              <div className={styles.filterRow} role="group" aria-label="Filter by category">
                {CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.value}
                    className={`${styles.filterChip} ${activeCategory === f.value ? styles.filterChipActive : ''}`}
                    onClick={() => handleCategoryChange(f.value as WordCategory | 'all')}
                    aria-pressed={activeCategory === f.value}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.resultsMeta}>
              {filtered.length === data.entries.length
                ? `${data.entries.length} words`
                : `${filtered.length} of ${data.entries.length} words`}
            </p>

            <div className={styles.grid}>
              {visible.length === 0 && (
                <p className={styles.empty}>No words match your search.</p>
              )}
              {visible.map((entry, i) => (
                <Link
                  key={entry.id}
                  to={`/word/${entry.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <WordCard entry={entry} dayNumber={i + 1} onClick={() => {}} />
                </Link>
              ))}
            </div>

            {hasMore && (
              <button className={styles.loadMore} onClick={() => setPage(p => p + 1)}>
                Load more · {filtered.length - visible.length} remaining
              </button>
            )}
          </div>
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-body)',
        }}>
          每日一词 · since 2026-02-22
        </footer>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire /browse route in App.tsx**

In `src/App.tsx`, add the import and route:

```tsx
// Add import at top with other page imports:
import { BrowsePage } from './components/BrowsePage';

// Add route inside <Routes>:
<Route path="/browse" element={<BrowsePage />} />
```

- [ ] **Step 4: Add Browse link to Nav**

In `src/components/Nav.tsx`, update the `navLinks` div:

```tsx
<div className={styles.navLinks}>
  <Link to="/browse" className={styles.navLink}>Browse</Link>
  <Link to="/resources" className={styles.navLink}>Resources</Link>
</div>
```

- [ ] **Step 5: Test manually**

```bash
npm run dev
```

- Navigate to `http://localhost:5173/browse`
- Verify all 365 words appear in a grid
- Click a category chip — only that category's words show
- Type a character in the search box — results filter in real time
- Scroll to bottom — "Load more" button appears and loads the next page

- [ ] **Step 6: Commit**

```bash
git add src/components/BrowsePage.tsx src/components/BrowsePage.module.css src/App.tsx src/components/Nav.tsx
git commit -m "feat: add /browse page with category filters and search"
```

---

## Phase 3 — Streak Counter

### Task 7: Build useStreak hook with tests

**Files:**
- Create: `src/hooks/useStreak.ts`
- Create: `src/hooks/__tests__/useStreak.test.ts`

localStorage keys:
- `hz_streak_date` — `"YYYY-MM-DD"` string, the last date the user visited
- `hz_streak_count` — `"N"` string, current streak length

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/__tests__/useStreak.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: `computeStreak is not a function` or `Cannot find module`

- [ ] **Step 3: Implement the hook**

```typescript
// src/hooks/useStreak.ts
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
  if (!storedDate || !storedCount) {
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

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all 4 useStreak tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useStreak.ts src/hooks/__tests__/useStreak.test.ts
git commit -m "feat: add useStreak hook with unit tests"
```

---

### Task 8: Add StreakBadge to Nav

**Files:**
- Modify: `src/components/Nav.tsx`
- Modify: `src/components/Nav.module.css`

- [ ] **Step 1: Add streak badge styles to Nav.module.css**

Append to `src/components/Nav.module.css`:

```css
/* Streak badge */
.streakBadge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  white-space: nowrap;
  transition: background var(--t-fast);
}

.streakBadge:hover {
  background: var(--surface-floating);
}

.streakFlame {
  font-size: 0.9rem;
  line-height: 1;
}
```

- [ ] **Step 2: Update Nav.tsx to show streak badge**

```tsx
// src/components/Nav.tsx — updated imports and component
import { Link } from 'react-router-dom';
import { useLanguage, type LangMode } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStreak } from '../hooks/useStreak';
import styles from './Nav.module.css';

const LANG_OPTIONS: { value: LangMode; label: string; title: string }[] = [
  { value: 'bilingual', label: '双',  title: 'Bilingual (English + Chinese)' },
  { value: 'zh',        label: '中',  title: 'Chinese only' },
];

export function Nav() {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const streak = useStreak();

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
        {/* Streak badge */}
        {streak > 0 && (
          <span className={styles.streakBadge} title={`${streak}-day streak`}>
            <span className={styles.streakFlame}>🔥</span>
            {streak}
          </span>
        )}

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
```

- [ ] **Step 3: Test manually**

```bash
npm run dev
```

Visit `http://localhost:5173`. The streak badge `🔥 1` should appear in the Nav after the first load. On day 2 it shows `🔥 2`, etc.

To test streak increment: open DevTools → Application → Local Storage → set `hz_streak_date` to yesterday's date (e.g. `2026-04-07`) and `hz_streak_count` to `5` → refresh → badge should show `🔥 6`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.tsx src/components/Nav.module.css
git commit -m "feat: add streak badge to Nav"
```

---

## Phase 4 — Daily Quiz

### Task 9: Build useQuiz hook with tests

**Files:**
- Create: `src/hooks/useQuiz.ts`
- Create: `src/hooks/__tests__/useQuiz.test.ts`

localStorage key: `hz_quiz_YYYY-MM-DD` → JSON `{ answered: boolean, correct: boolean, selectedIndex: number }`

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/__tests__/useQuiz.test.ts
import { describe, it, expect } from 'vitest';
import { buildQuizOptions, scoreKey } from '../useQuiz';
import type { WordEntry } from '../../types';

const makeEntry = (id: number, english: string): WordEntry => ({
  id,
  chinese: `字${id}`,
  pinyin: `zì${id}`,
  english,
  category: 'business',
  examples: [{ chinese: '例句', english: 'example' }],
  backstory: 'backstory',
});

describe('scoreKey', () => {
  it('returns hz_quiz_ prefixed date string', () => {
    expect(scoreKey('2026-04-08')).toBe('hz_quiz_2026-04-08');
  });
});

describe('buildQuizOptions', () => {
  const pool: WordEntry[] = [
    makeEntry(1, 'Strategy'),
    makeEntry(2, 'Innovation'),
    makeEntry(3, 'Resilience'),
    makeEntry(4, 'Harmony'),
    makeEntry(5, 'Efficiency'),
  ];

  it('returns exactly 4 options', () => {
    const result = buildQuizOptions(pool[0], pool, 42);
    expect(result.options).toHaveLength(4);
  });

  it('always includes the correct answer', () => {
    const result = buildQuizOptions(pool[0], pool, 42);
    expect(result.options[result.correctIndex].english).toBe('Strategy');
  });

  it('does not duplicate the correct answer as a distractor', () => {
    const result = buildQuizOptions(pool[0], pool, 42);
    const englishValues = result.options.map(o => o.english);
    const unique = new Set(englishValues);
    expect(unique.size).toBe(4);
  });

  it('is deterministic given the same seed', () => {
    const r1 = buildQuizOptions(pool[0], pool, 99);
    const r2 = buildQuizOptions(pool[0], pool, 99);
    expect(r1.options.map(o => o.id)).toEqual(r2.options.map(o => o.id));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: `Cannot find module '../useQuiz'`

- [ ] **Step 3: Implement useQuiz**

```typescript
// src/hooks/useQuiz.ts
import { useState, useEffect } from 'react';
import type { WordEntry } from '../types';

export function scoreKey(dateStr: string): string {
  return `hz_quiz_${dateStr}`;
}

interface QuizOption {
  id: number;
  english: string;
}

export interface QuizState {
  options: QuizOption[];
  correctIndex: number;
}

// Seeded pseudo-random (mulberry32) for deterministic shuffling
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildQuizOptions(
  correct: WordEntry,
  pool: WordEntry[],
  seed: number,
): QuizState {
  const rand = mulberry32(seed);
  const distractors = pool
    .filter(e => e.id !== correct.id)
    .sort(() => rand() - 0.5)
    .slice(0, 3);

  const allOptions: QuizOption[] = [
    { id: correct.id, english: correct.english },
    ...distractors.map(e => ({ id: e.id, english: e.english })),
  ];

  // Shuffle with same seed
  const rand2 = mulberry32(seed + 1);
  const shuffled = allOptions.sort(() => rand2() - 0.5);
  const correctIndex = shuffled.findIndex(o => o.id === correct.id);

  return { options: shuffled, correctIndex };
}

export interface QuizResult {
  answered: boolean;
  correct: boolean;
  selectedIndex: number;
}

export interface UseQuizReturn {
  options: QuizOption[];
  correctIndex: number;
  answered: boolean;
  correct: boolean;
  selectedIndex: number;
  answer: (index: number) => void;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function useQuiz(todayEntry: WordEntry, allEntries: WordEntry[]): UseQuizReturn {
  const todayStr = toDateStr(new Date());
  const key = scoreKey(todayStr);

  const { options, correctIndex } = buildQuizOptions(
    todayEntry,
    allEntries,
    todayEntry.id + new Date(todayStr).getTime() % 10000,
  );

  const stored = localStorage.getItem(key);
  const initial: QuizResult = stored
    ? JSON.parse(stored)
    : { answered: false, correct: false, selectedIndex: -1 };

  const [state, setState] = useState<QuizResult>(initial);

  useEffect(() => {
    const fresh = localStorage.getItem(key);
    if (fresh) {
      setState(JSON.parse(fresh));
    }
  }, [key]);

  function answer(index: number) {
    if (state.answered) return;
    const isCorrect = index === correctIndex;
    const result: QuizResult = { answered: true, correct: isCorrect, selectedIndex: index };
    localStorage.setItem(key, JSON.stringify(result));
    setState(result);
  }

  return {
    options,
    correctIndex,
    answered: state.answered,
    correct: state.correct,
    selectedIndex: state.selectedIndex,
    answer,
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all useQuiz tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useQuiz.ts src/hooks/__tests__/useQuiz.test.ts
git commit -m "feat: add useQuiz hook with deterministic distractor selection"
```

---

### Task 10: Build DailyQuiz component

**Files:**
- Create: `src/components/DailyQuiz.tsx`
- Create: `src/components/DailyQuiz.module.css`

- [ ] **Step 1: Create DailyQuiz styles**

```css
/* src/components/DailyQuiz.module.css */
.quiz {
  max-width: 680px;
  margin: 0 auto var(--space-10);
  padding: 0 var(--space-6);
}

.card {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: background var(--t-slow), border-color var(--t-slow);
}

.heading {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-4);
}

.question {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 var(--space-5);
  line-height: 1.5;
}

.questionWord {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: background var(--t-fast), border-color var(--t-fast), transform var(--t-spring);
}

.option:hover:not(:disabled) {
  background: var(--surface-elevated);
  border-color: var(--brand);
  transform: translateY(-1px);
}

.option:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.option:disabled {
  cursor: default;
}

.optionCorrect {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgb(34, 197, 94);
  color: var(--text-primary);
}

.optionWrong {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgb(239, 68, 68);
  color: var(--text-tertiary);
}

.optionIndicator {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.result {
  margin-top: var(--space-5);
  padding: var(--space-4);
  background: var(--surface);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.resultCorrect {
  border-left: 3px solid rgb(34, 197, 94);
}

.resultWrong {
  border-left: 3px solid rgb(239, 68, 68);
}

.resultHeading {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

@media (max-width: 640px) {
  .quiz {
    padding: 0 var(--space-4);
  }
}
```

- [ ] **Step 2: Create DailyQuiz component**

```tsx
// src/components/DailyQuiz.tsx
import { useQuiz } from '../hooks/useQuiz';
import type { WordEntry } from '../types';
import styles from './DailyQuiz.module.css';

interface DailyQuizProps {
  todayEntry: WordEntry;
  allEntries: WordEntry[];
}

export function DailyQuiz({ todayEntry, allEntries }: DailyQuizProps) {
  const { options, correctIndex, answered, correct, selectedIndex, answer } = useQuiz(
    todayEntry,
    allEntries,
  );

  function getOptionClass(i: number): string {
    if (!answered) return styles.option;
    if (i === correctIndex) return `${styles.option} ${styles.optionCorrect}`;
    if (i === selectedIndex && !correct) return `${styles.option} ${styles.optionWrong}`;
    return styles.option;
  }

  function getIndicator(i: number): string {
    if (!answered) return '';
    if (i === correctIndex) return '✓';
    if (i === selectedIndex && !correct) return '✗';
    return '';
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.card}>
        <p className={styles.heading}>Daily Quiz</p>
        <p className={styles.question}>
          What does <span className={styles.questionWord}>{todayEntry.chinese}</span> mean?
        </p>

        <div className={styles.options}>
          {options.map((opt, i) => (
            <button
              key={opt.id}
              className={getOptionClass(i)}
              onClick={() => answer(i)}
              disabled={answered}
            >
              {answered && (
                <span className={styles.optionIndicator}>{getIndicator(i)}</span>
              )}
              {opt.english}
            </button>
          ))}
        </div>

        {answered && (
          <div className={`${styles.result} ${correct ? styles.resultCorrect : styles.resultWrong}`}>
            <p className={styles.resultHeading}>{correct ? 'Correct!' : 'Not quite —'}</p>
            <p>
              {todayEntry.chinese} ({todayEntry.pinyin}) means &ldquo;{todayEntry.english}&rdquo;.{' '}
              {todayEntry.meaning_zh && <span>{todayEntry.meaning_zh}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add DailyQuiz to HomePage in App.tsx**

In `src/App.tsx`, add the import and wire it below `<Hero>`:

```tsx
// Add import:
import { DailyQuiz } from './components/DailyQuiz';

// In HomePage JSX, after <Hero ... />, before <SubscribeForm />:
<DailyQuiz todayEntry={todayEntry} allEntries={data.entries} />
```

The full `<main>` block in `HomePage` should be:

```tsx
<main style={{ flex: 1 }}>
  <Hero entry={todayEntry} dayNumber={daysSinceStart + 1} isToday />
  <DailyQuiz todayEntry={todayEntry} allEntries={data.entries} />
  <SubscribeForm />
  <Archive entries={recentEntries} totalPast={allPastEntries.length} />
</main>
```

- [ ] **Step 4: Test manually**

```bash
npm run dev
```

Open `http://localhost:5173`. Below the Hero, the quiz card should appear with 4 answer options. Click one — correct shows green, wrong shows red with the correct option highlighted. Refresh — answer is remembered for today.

To reset: DevTools → Application → Local Storage → delete `hz_quiz_YYYY-MM-DD`.

- [ ] **Step 5: Commit**

```bash
git add src/components/DailyQuiz.tsx src/components/DailyQuiz.module.css src/App.tsx
git commit -m "feat: add daily quiz with 4-choice question below Hero"
```

---

## Phase 5 — Favorites

### Task 11: Build useFavorites hook with tests

**Files:**
- Create: `src/hooks/useFavorites.ts`
- Create: `src/hooks/__tests__/useFavorites.test.ts`

localStorage key: `hz_favorites` → JSON `number[]` (array of WordEntry ids)

- [ ] **Step 1: Write failing tests**

```typescript
// src/hooks/__tests__/useFavorites.test.ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: `Cannot find module '../useFavorites'`

- [ ] **Step 3: Implement useFavorites**

```typescript
// src/hooks/useFavorites.ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all useFavorites tests pass (and all prior hook tests still pass)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFavorites.ts src/hooks/__tests__/useFavorites.test.ts
git commit -m "feat: add useFavorites hook with unit tests"
```

---

### Task 12: Build FavoriteButton component

**Files:**
- Create: `src/components/FavoriteButton.tsx`
- Create: `src/components/FavoriteButton.module.css`

- [ ] **Step 1: Create FavoriteButton styles**

```css
/* src/components/FavoriteButton.module.css */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-tertiary);
  transition: color var(--t-fast), background var(--t-fast), border-color var(--t-fast), transform var(--t-spring);
  flex-shrink: 0;
}

.btn:hover {
  color: var(--text-primary);
  background: var(--surface-floating);
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0) scale(0.92);
}

.btnActive {
  color: #e85c3a;
  border-color: rgba(232, 92, 58, 0.35);
  background: rgba(232, 92, 58, 0.08);
}

.btnActive:hover {
  color: #e85c3a;
  background: rgba(232, 92, 58, 0.14);
}
```

- [ ] **Step 2: Create FavoriteButton component**

```tsx
// src/components/FavoriteButton.tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FavoriteButton.tsx src/components/FavoriteButton.module.css
git commit -m "feat: add FavoriteButton component"
```

---

### Task 13: Add FavoriteButton to Hero and WordCard

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/Hero.module.css`
- Modify: `src/components/WordCard.tsx`
- Modify: `src/components/WordCard.module.css`

The `useFavorites` hook must live at a higher level so Hero and WordCard share state. We'll lift it to `App.tsx` HomePage and pass `isFav` + `onToggle` as props.

- [ ] **Step 1: Add favorites props to Hero**

In `src/components/Hero.tsx`, update the interface and actions row:

```tsx
// Add import at top:
import { FavoriteButton } from './FavoriteButton';

// Update HeroProps:
interface HeroProps {
  entry: WordEntry;
  dayNumber: number;
  isToday?: boolean;
  isFav?: boolean;
  onToggleFav?: () => void;
}

// Update function signature:
export function Hero({ entry, dayNumber, isToday = false, isFav = false, onToggleFav }: HeroProps) {
```

In the actions row (the `<div className={styles.actions}>` block), add the FavoriteButton:

```tsx
<div className={styles.actions} style={{ animationDelay: '380ms' }}>
  <ShareButton entry={entry} />
  {onToggleFav && (
    <FavoriteButton isFav={isFav} onToggle={onToggleFav} />
  )}
  {isToday && <ReactionBar wordId={entry.id} />}
</div>
```

- [ ] **Step 2: Add favorites props to WordCard**

In `src/components/WordCard.tsx`, update the interface and return:

```tsx
// Add import at top:
import { FavoriteButton } from './FavoriteButton';

// Update WordCardProps:
interface WordCardProps {
  entry: WordEntry;
  dayNumber: number;
  onClick?: () => void;
  isFav?: boolean;
  onToggleFav?: () => void;
}

// Update function signature:
export function WordCard({ entry, dayNumber, onClick, isFav, onToggleFav }: WordCardProps) {
```

Add a position: relative to the card article and overlay the FavoriteButton at top-right. Append this inside the `<article>` just before the closing tag:

```tsx
  {onToggleFav && (
    <div className={styles.favWrap}>
      <FavoriteButton isFav={isFav ?? false} onToggle={onToggleFav} size={15} />
    </div>
  )}
```

Append to `src/components/WordCard.module.css`:

```css
.favWrap {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}
```

Also ensure the card has `position: relative`. In `WordCard.module.css`, add `position: relative;` to the `.card` rule.

- [ ] **Step 3: Lift useFavorites to HomePage and wire props**

In `src/App.tsx`, update `HomePage`:

```tsx
// Add imports:
import { useFavorites } from './hooks/useFavorites';

// Inside HomePage function, after existing const declarations:
const { isFav, toggle } = useFavorites();

// Update Hero usage:
<Hero
  entry={todayEntry}
  dayNumber={daysSinceStart + 1}
  isToday
  isFav={isFav(todayEntry.id)}
  onToggleFav={() => toggle(todayEntry.id)}
/>

// Update Archive word cards — Archive doesn't need favorites, skip
```

Note: WordCard favorites only appear on the `/browse` and `/favorites` pages (Tasks 14–15 will wire those). On the homepage Archive the FavoriteButton is not shown (no `onToggleFav` prop passed).

- [ ] **Step 4: Test manually**

```bash
npm run dev
```

Open `http://localhost:5173`. A heart icon should appear in the Hero actions row. Clicking it fills/unfills the heart. Refresh — state is remembered.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.tsx src/components/WordCard.tsx src/components/WordCard.module.css src/App.tsx
git commit -m "feat: add favorite button to Hero and WordCard"
```

---

### Task 14: Build FavoritesPage, wire route, add Nav link

**Files:**
- Create: `src/components/FavoritesPage.tsx`
- Create: `src/components/FavoritesPage.module.css`
- Modify: `src/App.tsx`
- Modify: `src/components/Nav.tsx`

- [ ] **Step 1: Create FavoritesPage styles**

```css
/* src/components/FavoritesPage.module.css */
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.backLink {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: var(--text-tertiary);
  text-decoration: none;
  margin-bottom: var(--space-6);
  transition: color var(--t-fast);
}

.backLink:hover {
  color: var(--text-primary);
}

.headerGlyph {
  display: block;
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--brand);
  opacity: 0.25;
  line-height: 1;
  margin-bottom: var(--space-2);
}

.title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-2);
}

.subtitle {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 var(--space-8);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.empty {
  padding: var(--space-16) 0;
  text-align: center;
  font-family: var(--font-body);
  color: var(--text-tertiary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.emptyGlyph {
  display: block;
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
}

@media (max-width: 640px) {
  .container {
    padding: var(--space-6) var(--space-4);
  }
}
```

- [ ] **Step 2: Create FavoritesPage component**

```tsx
// src/components/FavoritesPage.tsx
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Nav } from './Nav';
import { WordCard } from './WordCard';
import { useFavorites } from '../hooks/useFavorites';
import wordsData from '../data/words.json';
import type { WordsData, WordEntry } from '../types';
import styles from './FavoritesPage.module.css';

const data = wordsData as WordsData;

export function FavoritesPage() {
  const { favorites, isFav, toggle } = useFavorites();

  const savedEntries: WordEntry[] = data.entries.filter(e => favorites.includes(e.id));

  return (
    <>
      <Helmet>
        <title>Saved Words — HanziDaily 每日一词</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <div className={styles.container}>
            <Link to="/" className={styles.backLink}>← Today's word</Link>

            <span className={styles.headerGlyph}>收藏</span>
            <h1 className={styles.title}>Saved Words</h1>
            <p className={styles.subtitle}>
              {savedEntries.length === 0
                ? 'No saved words yet.'
                : `${savedEntries.length} saved word${savedEntries.length === 1 ? '' : 's'}`}
            </p>

            {savedEntries.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyGlyph}>♡</span>
                Tap the heart on any word to save it here.
              </div>
            ) : (
              <div className={styles.grid}>
                {savedEntries.map((entry, i) => (
                  <Link
                    key={entry.id}
                    to={`/word/${entry.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative' }}
                  >
                    <WordCard
                      entry={entry}
                      dayNumber={i + 1}
                      isFav={isFav(entry.id)}
                      onToggleFav={() => toggle(entry.id)}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-body)',
        }}>
          每日一词 · since 2026-02-22
        </footer>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire /favorites route in App.tsx**

```tsx
// Add import:
import { FavoritesPage } from './components/FavoritesPage';

// Add route:
<Route path="/favorites" element={<FavoritesPage />} />
```

- [ ] **Step 4: Add Saved link to Nav**

In `src/components/Nav.tsx`, update the navLinks div to include a Saved link:

```tsx
<div className={styles.navLinks}>
  <Link to="/browse" className={styles.navLink}>Browse</Link>
  <Link to="/favorites" className={styles.navLink}>Saved</Link>
  <Link to="/resources" className={styles.navLink}>Resources</Link>
</div>
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all hook tests pass

- [ ] **Step 6: Test favorites end-to-end manually**

```bash
npm run dev
```

1. On homepage, click the heart icon in the Hero actions — it should fill
2. Navigate to `/favorites` — the saved word should appear as a card
3. Click the heart on the card — it unfills and the card disappears from the favorites list
4. Navigate to `/browse`, click a category filter, save a card — navigate to `/favorites` — it appears

- [ ] **Step 7: Final build check**

```bash
npm run build
```

Expected: clean build with no TypeScript errors

- [ ] **Step 8: Commit**

```bash
git add src/components/FavoritesPage.tsx src/components/FavoritesPage.module.css src/App.tsx src/components/Nav.tsx
git commit -m "feat: add /favorites page with saved words grid"
```

---

## Self-Review

**Spec coverage:**
- ✅ Word bank expansion 90 → 365 (Tasks 1–3)
- ✅ `hsk_level` field added (Task 1)
- ✅ Homepage archive trimmed to 7 days (Task 5)
- ✅ `/browse` page with category filters and search (Tasks 6)
- ✅ Streak counter in Nav (Tasks 7–8)
- ✅ Daily quiz below Hero (Tasks 9–10)
- ✅ Favorites on Hero and WordCard (Tasks 12–13)
- ✅ `/favorites` page (Task 14)
- ✅ "Do not change current UI" — all changes are additive; no existing styles or layouts altered
- ✅ vitest infrastructure for pure hook logic (Task 4)

**Type consistency check:**
- `WordEntry.id` is `number` throughout — `useFavorites` stores `number[]`, `FavoriteButton` receives `number` IDs ✅
- `useStreak` exports `computeStreak` (tested) and `useStreak` (React hook) — no naming collision ✅
- `useQuiz` exports `buildQuizOptions`, `scoreKey` (tested), `useQuiz` (hook) ✅
- `Archive` now takes `totalPast: number` — `HomePage` passes `allPastEntries.length` ✅
- `Hero` new optional props `isFav?: boolean`, `onToggleFav?: () => void` — backward compatible ✅
- `WordCard` new optional props `isFav?: boolean`, `onToggleFav?: () => void` — backward compatible ✅
