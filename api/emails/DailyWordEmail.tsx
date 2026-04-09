import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WordExample {
  chinese: string;
  english: string;
}

interface WordEntry {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  category: string;
  examples: WordExample[];
  backstory: string;
}

interface DailyWordEmailProps {
  entry: WordEntry;
  dayNumber: number;
  siteUrl: string;
  unsubscribeUrl: string;
}

const categoryMeta: Record<string, { label: string; color: string; bg: string }> = {
  classical_idiom: { label: 'Classical Idiom', color: '#8B6914', bg: 'rgba(139,105,20,0.12)' },
  modern_tech:     { label: 'Modern Tech',     color: '#1A6B8A', bg: 'rgba(26,107,138,0.12)' },
  business:        { label: 'Business',         color: '#2D6A4F', bg: 'rgba(45,106,79,0.12)' },
  literature:      { label: 'Literature',       color: '#6B3FA0', bg: 'rgba(107,63,160,0.12)' },
  internet_culture:{ label: 'Internet Culture', color: '#C44B9A', bg: 'rgba(196,75,154,0.12)' },
};

export function DailyWordEmail({ entry, dayNumber, siteUrl, unsubscribeUrl }: DailyWordEmailProps) {
  const cat = categoryMeta[entry.category] ?? { label: entry.category, color: '#6B6B6B', bg: 'rgba(107,107,107,0.12)' };

  return (
    <Html lang="zh-CN" dir="ltr">
      <Head>
        <Font
          fontFamily="Noto Serif SC"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/notoserifsc/v22/H4c8BXePl9DZ0Xe7gG9cyOj7mm62SrUxCiYIKFk.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Noto Serif SC"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/notoserifsc/v22/H4c8BXePl9DZ0Xe7gG9cyOj7mm62SrU-CiYIKFk.woff2',
            format: 'woff2',
          }}
          fontWeight={900}
          fontStyle="normal"
        />
      </Head>
      <Preview>{`每日一词 Day ${dayNumber}: ${entry.chinese} — ${entry.english}`}</Preview>

      <Body style={body}>
        <Container style={container}>

          {/* ── Header bar ── */}
          <Section style={header}>
            <Text style={headerLogo}>每日一词</Text>
            <Text style={headerSub}>Day {dayNumber} · {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </Section>

          {/* ── Main card ── */}
          <Section style={card}>

            {/* Category badge */}
            <Section style={{ textAlign: 'center', paddingTop: '32px', paddingBottom: '8px' }}>
              <Text style={{ ...badge, color: cat.color, backgroundColor: cat.bg }}>
                {cat.label}
              </Text>
            </Section>

            {/* Chinese character(s) */}
            <Section style={{ textAlign: 'center', padding: '16px 32px 4px' }}>
              <Text style={chineseMain}>{entry.chinese}</Text>
            </Section>

            {/* Pinyin */}
            <Section style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <Text style={pinyin}>{entry.pinyin}</Text>
            </Section>

            {/* Divider */}
            <Section style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <Text style={divider}>────</Text>
            </Section>

            {/* English meaning */}
            <Section style={{ textAlign: 'center', padding: '0 32px 24px' }}>
              <Text style={englishMeaning}>{entry.english}</Text>
            </Section>

            {/* Divider line */}
            <Section style={{ padding: '0 32px' }}>
              <div style={{ borderTop: '1px solid rgba(26,26,26,0.08)', margin: '0 0 24px' }} />
            </Section>

            {/* Examples */}
            <Section style={{ padding: '0 32px 8px' }}>
              <Text style={sectionLabel}>例句 · Examples</Text>
              {entry.examples.map((ex, i) => (
                <Section key={i} style={exampleBlock}>
                  <Text style={exampleChinese}>{ex.chinese}</Text>
                  <Text style={exampleEnglish}>{ex.english}</Text>
                </Section>
              ))}
            </Section>

            {/* Backstory */}
            <Section style={{ padding: '8px 32px 32px' }}>
              <Text style={sectionLabel}>背景 · Backstory</Text>
              <Section style={backstoryBlock}>
                <Text style={backstoryText}>{entry.backstory}</Text>
              </Section>
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', padding: '0 32px 40px' }}>
              <Link href={siteUrl} style={ctaButton}>
                今日一词を見る · Visit HanziDaily
              </Link>
            </Section>

          </Section>

          {/* ── Resources section ── */}
          <Section style={resourcesSection}>
            <Text style={resourcesLabel}>RECOMMENDED FOR LEARNERS</Text>
            <Text style={resourcesItem}>
              <Link href={`${siteUrl}/resources?utm_source=email&utm_medium=footer&utm_campaign=italki`} style={resourcesLink}>
                🎓 iTalki — find a Chinese tutor
              </Link>
            </Text>
            <Text style={resourcesItem}>
              <Link href={`${siteUrl}/resources?utm_source=email&utm_medium=footer&utm_campaign=skritter`} style={resourcesLink}>
                ✍️ Skritter — practise writing characters
              </Link>
            </Text>
          </Section>

          {/* ── Footer ── */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you subscribed at{' '}
              <Link href={siteUrl} style={footerLink}>{siteUrl.replace(/^https?:\/\//, '')}</Link>
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
              {' · '}
              <Link href={siteUrl} style={footerLink}>Visit the app</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default DailyWordEmail;

/* ── Styles (all inline — email-safe) ── */

const body: React.CSSProperties = {
  backgroundColor: '#FAF8F5',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
  margin: 0,
  padding: '32px 0',
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
};

const header: React.CSSProperties = {
  backgroundColor: '#C8473A',
  borderRadius: '16px 16px 0 0',
  textAlign: 'center',
  padding: '28px 32px 24px',
};

const headerLogo: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', Georgia, serif",
  fontSize: '28px',
  fontWeight: 900,
  color: '#FFFFFF',
  margin: 0,
  letterSpacing: '0.05em',
};

const headerSub: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '13px',
  color: 'rgba(255,255,255,0.75)',
  margin: '6px 0 0',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '0 0 16px 16px',
  boxShadow: '0 12px 32px rgba(26,26,26,0.10), 0 4px 8px rgba(26,26,26,0.06)',
};

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  margin: 0,
};

const chineseMain: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', Georgia, serif",
  fontSize: '72px',
  fontWeight: 900,
  color: '#1A1A1A',
  margin: 0,
  letterSpacing: '0.05em',
  lineHeight: '1.1',
};

const pinyin: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  fontSize: '16px',
  color: '#6B6B6B',
  margin: '4px 0 0',
  letterSpacing: '0.08em',
};

const divider: React.CSSProperties = {
  color: '#C8473A',
  fontSize: '14px',
  letterSpacing: '0.3em',
  margin: '4px 0',
};

const englishMeaning: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', Georgia, serif",
  fontSize: '22px',
  fontWeight: 400,
  color: '#1A1A1A',
  margin: 0,
  lineHeight: '1.5',
  fontStyle: 'italic',
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '11px',
  fontWeight: 700,
  color: '#A0A0A0',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: '0 0 12px',
};

const exampleBlock: React.CSSProperties = {
  borderLeft: '3px solid #C8473A',
  backgroundColor: '#FAF8F5',
  borderRadius: '0 8px 8px 0',
  padding: '10px 14px',
  marginBottom: '10px',
};

const exampleChinese: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', Georgia, serif",
  fontSize: '15px',
  color: '#1A1A1A',
  margin: '0 0 4px',
  lineHeight: '1.6',
};

const exampleEnglish: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '13px',
  color: '#6B6B6B',
  margin: 0,
  lineHeight: '1.6',
  fontStyle: 'italic',
};

const backstoryBlock: React.CSSProperties = {
  backgroundColor: '#F5F2EE',
  border: '1px solid rgba(26,26,26,0.08)',
  borderRadius: '10px',
  padding: '16px',
};

const backstoryText: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '14px',
  color: '#6B6B6B',
  margin: 0,
  lineHeight: '1.7',
};

const ctaButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#C8473A',
  color: '#FFFFFF',
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  boxShadow: '0 4px 20px rgba(200,71,58,0.25), 0 2px 8px rgba(200,71,58,0.15)',
};

const resourcesSection: React.CSSProperties = {
  borderTop: '1px solid rgba(26,26,26,0.08)',
  padding: '20px 32px',
  textAlign: 'center',
};

const resourcesLabel: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '10px',
  fontWeight: 700,
  color: '#A0A0A0',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const resourcesItem: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '13px',
  color: '#6B6B6B',
  margin: '0 0 6px',
  lineHeight: '1.5',
};

const resourcesLink: React.CSSProperties = {
  color: '#C8473A',
  textDecoration: 'none',
};

const footer: React.CSSProperties = {
  textAlign: 'center',
  padding: '24px 32px',
};

const footerText: React.CSSProperties = {
  fontFamily: "'Inter', Arial, sans-serif",
  fontSize: '12px',
  color: '#A0A0A0',
  margin: '0 0 4px',
  lineHeight: '1.6',
};

const footerLink: React.CSSProperties = {
  color: '#A0A0A0',
  textDecoration: 'underline',
};
