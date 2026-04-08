import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Nav } from './Nav';
import styles from './ResourcesPage.module.css';

const SITE_URL = 'https://www.hanzidaily.com';

interface Tool {
  name: string;
  tagline: string;
  description: string;
  category: string;
  ctaLabel: string;
  emoji: string;
  // TODO: Replace each url with your affiliate link after signing up
  url: string;
}

const tools: Tool[] = [
  {
    name: 'iTalki',
    tagline: 'Learn with a real human tutor',
    description:
      'The best way to accelerate your Chinese — one-on-one lessons with native teachers and community tutors. Flexible scheduling, every budget.',
    category: 'Tutoring',
    ctaLabel: 'Find a tutor',
    url: 'https://www.italki.com/affshare?ref=af18606142',
    emoji: '🎓',
  },
  {
    name: 'Skritter',
    tagline: 'Master writing Chinese characters',
    description:
      'Spaced-repetition app built specifically for Chinese writing. Teaches stroke order and makes characters stick with adaptive reviews.',
    category: 'Flashcards & Writing',
    ctaLabel: 'Try Skritter',
    // TODO: Replace with your Skritter affiliate link from skritter.com/affiliate
    url: 'https://skritter.com/',
    emoji: '✍️',
  },
  {
    name: 'HelloChinese',
    tagline: 'Structured curriculum for beginners',
    description:
      'A beautifully designed app covering HSK 1–4 with grammar explanations, listening practice, and a clear learning path. Great starting point.',
    category: 'Language App',
    ctaLabel: 'Start learning',
    // TODO: Replace with HelloChinese affiliate link if they have a program
    url: 'https://www.hellochinese.cc/',
    emoji: '📱',
  },
  {
    name: 'Pleco',
    tagline: 'The gold-standard Chinese dictionary',
    description:
      'Look up any character instantly, hear it pronounced, see it in context sentences. Free base app with optional premium add-ons. Every learner needs this.',
    category: 'Dictionary',
    ctaLabel: 'Get Pleco (free)',
    url: 'https://www.pleco.com/',
    emoji: '📖',
  },
];

interface Book {
  title: string;
  description: string;
  // TODO: Replace each url with your Amazon Associates affiliate link
  url: string;
}

const books: Book[] = [
  {
    title: 'HSK Standard Course (Levels 1–6)',
    description:
      'The official exam prep series used in classrooms worldwide. Systematic grammar, vocabulary, and listening practice aligned to each HSK level.',
    url: 'https://www.amazon.com/s?k=HSK+Standard+Course&tag=hanzidaily-20',
  },
  {
    title: 'A Chengyu Handbook — Classical Chinese Idioms',
    description:
      'Deep dives into four-character idioms with origins and usage. Perfect alongside HanziDaily\'s Classical Idiom category.',
    url: 'https://www.amazon.com/s?k=chengyu+chinese+idioms+handbook&tag=hanzidaily-20',
  },
  {
    title: 'Integrated Chinese (Level 1 & 2)',
    description:
      'The most widely used university Chinese textbook in North America. Thorough grammar coverage with engaging dialogue.',
    url: 'https://www.amazon.com/s?k=integrated+chinese+textbook&tag=hanzidaily-20',
  },
];

export function ResourcesPage() {
  return (
    <>
      <Helmet>
        <title>Resources — HanziDaily 每日一词</title>
        <meta
          name="description"
          content="The best tools for learning Chinese: tutors, apps, dictionaries, and books recommended by HanziDaily."
        />
        <link rel="canonical" href={`${SITE_URL}/resources`} />
        <meta property="og:title" content="Learning Resources — HanziDaily" />
        <meta
          property="og:description"
          content="Curated tools and resources for Chinese learners."
        />
        <meta property="og:url" content={`${SITE_URL}/resources`} />
      </Helmet>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Nav />

        <main style={{ flex: 1 }}>
          <div className={styles.container}>

            <Link to="/" className={styles.backLink}>← Today's word</Link>

            {/* Page header */}
            <header className={styles.header}>
              <span className={styles.headerGlyph}>工具</span>
              <h1 className={styles.title}>Learning Resources</h1>
              <p className={styles.subtitle}>
                Tools we genuinely recommend for learning Chinese. Some links are affiliate links —
                they cost you nothing extra and help keep HanziDaily free.
              </p>
            </header>

            {/* Apps & platforms */}
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>Apps & Platforms</h2>
              <div className={styles.grid}>
                {tools.map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.card}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.cardEmoji}>{tool.emoji}</span>
                      <span className={styles.cardCategory}>{tool.category}</span>
                    </div>
                    <h3 className={styles.cardName}>{tool.name}</h3>
                    <p className={styles.cardTagline}>{tool.tagline}</p>
                    <p className={styles.cardDesc}>{tool.description}</p>
                    <span className={styles.cardCta}>{tool.ctaLabel} →</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Books */}
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>Books</h2>
              <div className={styles.bookList}>
                {books.map((book) => (
                  <a
                    key={book.title}
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bookItem}
                  >
                    <span className={styles.bookIcon}>📚</span>
                    <div className={styles.bookContent}>
                      <span className={styles.bookTitle}>{book.title}</span>
                      <span className={styles.bookDesc}>{book.description}</span>
                    </div>
                    <span className={styles.bookArrow}>→</span>
                  </a>
                ))}
              </div>
            </section>

            <p className={styles.disclosure}>
              * Affiliate links marked above cost you nothing extra. Commissions help cover HanziDaily's running costs.
            </p>
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
