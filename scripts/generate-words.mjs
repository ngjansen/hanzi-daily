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

function loadWords() {
  return JSON.parse(readFileSync(wordsPath, 'utf8'));
}

function saveWords(entries) {
  const data = {
    generated_at: new Date().toISOString(),
    entries,
  };
  writeFileSync(wordsPath, JSON.stringify(data, null, 2), 'utf8');
}

async function generateBatch(category, count, existingChinese) {
  const existingList = existingChinese.join('、');

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
    model: 'claude-haiku-4-5-20251001',
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
  const wordsData = loadWords();
  const entries = wordsData.entries; // mutated in place, saved after every chunk
  let nextId = entries.reduce((max, e) => Math.max(max, e.id), 0) + 1;

  // Count how many we already have per category (resume support)
  const countByCategory = {};
  for (const entry of entries) {
    countByCategory[entry.category] = (countByCategory[entry.category] || 0) + 1;
  }

  console.log(`\nResume status:`);
  let totalRemaining = 0;
  for (const [category, target] of Object.entries(TARGETS)) {
    const have = countByCategory[category] || 0;
    const need = Math.max(0, target - have);
    totalRemaining += need;
    console.log(`  ${category}: ${have}/${target} — need ${need} more`);
  }
  console.log(`Total to generate: ${totalRemaining}\n`);

  if (totalRemaining === 0) {
    console.log('✅ All categories complete. Nothing to do.');
    return;
  }

  for (const [category, target] of Object.entries(TARGETS)) {
    const have = countByCategory[category] || 0;
    const need = Math.max(0, target - have);

    if (need === 0) {
      console.log(`\nSkipping ${category} — already complete (${have}/${target})`);
      continue;
    }

    console.log(`\nGenerating ${need} entries for ${category} (have ${have}/${target})...`);
    let categoryCount = 0;

    for (let remaining = need; remaining > 0; remaining -= CHUNK_SIZE) {
      const chunkSize = Math.min(remaining, CHUNK_SIZE);
      // Only pass same-category words to keep prompt size small
      const existingChinese = entries.filter(e => e.category === category).map(e => e.chinese);

      let batch = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          batch = await generateBatch(category, chunkSize, existingChinese);
          break;
        } catch (err) {
          console.error(`  ✗ Attempt ${attempt}/3 failed: ${err.message}`);
          if (attempt < 3) {
            const wait = attempt * 3000;
            console.error(`  Retrying in ${wait / 1000}s...`);
            await new Promise(r => setTimeout(r, wait));
          } else {
            console.error('  All retries exhausted, skipping chunk.');
          }
        }
      }

      if (batch) {
        for (const entry of batch) {
          entry.id = nextId++;
          entry.category = category;
          entries.push(entry);
        }

        categoryCount += batch.length;

        // Save after every chunk so progress is never lost on crash/interrupt
        saveWords(entries);
        console.log(`  ✓ Chunk saved (${batch.length}) — ${have + categoryCount}/${target} for ${category} | total: ${entries.length}`);
      }
    }
  }

  console.log(`\n✅ Done. words.json now has ${entries.length} entries.`);
}

main().catch(console.error);
