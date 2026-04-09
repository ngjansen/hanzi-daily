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

const CHUNK_SIZE = 25; // max entries per API call to avoid JSON corruption

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
    max_tokens: 16384,
    messages: [{ role: 'user', content: prompt }],
  });

  let raw = message.content[0].text.trim();

  // Strip markdown code fences if model wrapped the output
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array, got ${typeof parsed}`);
  }
  // Truncate if model returned too many; warn if too few
  if (parsed.length > count) {
    console.warn(`  ⚠ Model returned ${parsed.length}, truncating to ${count}`);
    return parsed.slice(0, count);
  }
  if (parsed.length < count) {
    console.warn(`  ⚠ Model returned only ${parsed.length} of ${count} requested`);
  }
  return parsed;
}

async function main() {
  const wordsData = JSON.parse(readFileSync(wordsPath, 'utf8'));
  const existing = wordsData.entries;
  let nextId = existing.length > 0 ? Math.max(...existing.map(e => e.id)) + 1 : 1;

  console.log(`Starting with ${existing.length} entries. Target: ${existing.length + Object.values(TARGETS).reduce((a, b) => a + b, 0)}`);

  const newEntries = [];

  for (const [category, total] of Object.entries(TARGETS)) {
    console.log(`\nGenerating ${total} entries for ${category}...`);
    let categoryCount = 0;

    // Split into chunks to avoid large JSON corruption
    for (let remaining = total; remaining > 0; remaining -= CHUNK_SIZE) {
      const chunkSize = Math.min(remaining, CHUNK_SIZE);
      const allExisting = [...existing, ...newEntries];

      try {
        const batch = await generateBatch(category, chunkSize, allExisting);

        for (const entry of batch) {
          entry.id = nextId++;
          entry.category = category;
          newEntries.push(entry);
        }

        categoryCount += batch.length;
        console.log(`  ✓ Chunk done (${batch.length}) — ${categoryCount}/${total} total`);
      } catch (err) {
        console.error(`  ✗ Chunk failed:`, err.message);
        console.error('  Skipping chunk, continuing...');
      }
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
