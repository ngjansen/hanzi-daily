#!/usr/bin/env node
// Usage: ANTHROPIC_API_KEY=sk-... node scripts/generate-content.js [--count 90]
// Writes to src/data/words.json

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../src/data/words.json');
const PROGRESS_PATH = path.join(__dirname, '../src/data/.words-progress.json');

const args = process.argv.slice(2);
const countArg = args.indexOf('--count');
const TOTAL = countArg !== -1 ? parseInt(args[countArg + 1], 10) : 90;
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;

const CATEGORY_DISTRIBUTION = [
  { name: 'classical_idiom', count: 30, description: 'Four-character idioms (成语) from classical texts: Art of War, Analects, Romance of the Three Kingdoms, Dream of the Red Chamber, Classic of Poetry. Each must have a real historical origin story.' },
  { name: 'modern_tech', count: 20, description: 'Technology, startup, and internet terminology native to modern China (e.g., 内卷, 躺平, 赛道, 出圈, 破局, 996, 数字游民). Include when each term emerged.' },
  { name: 'business', count: 20, description: 'Professional Chinese business idioms and vocabulary used in corporate, negotiation, and management contexts in China today.' },
  { name: 'literature', count: 15, description: 'Words, phrases, or allusions from Journey to the West (西游记), Dream of the Red Chamber (红楼梦), Tang poetry (唐诗), Song ci poetry (宋词).' },
  { name: 'internet_culture', count: 5, description: 'Modern Chinese internet slang with genuine cultural weight beyond surface humor (e.g., 佛系, 打工人, 社恐, 躺平, 人间清醒). Explain the social phenomenon.' },
];

const client = new Anthropic();

function buildPrompt(batchItems, startId) {
  const total = batchItems.reduce((s, b) => s + b.count, 0);
  const categoryInstructions = batchItems.map(({ category, count }) => {
    const cat = CATEGORY_DISTRIBUTION.find(c => c.name === category);
    return `  - ${count} entries of category "${category}": ${cat.description}`;
  }).join('\n');

  return `Generate exactly ${total} Chinese word/phrase entries. IDs start from ${startId}.

Category breakdown:
${categoryInstructions}

Return ONLY a valid JSON array. Each object must have EXACTLY these fields (no extras):
{
  "id": <integer>,
  "chinese": "<word or 4-character idiom in Chinese>",
  "pinyin": "<full pinyin with Unicode tone marks, space-separated syllables>",
  "english": "<concise English meaning, 2-8 words>",
  "category": "<classical_idiom|modern_tech|business|literature|internet_culture>",
  "examples": [
    {"chinese": "<natural example sentence>", "english": "<natural English translation>"},
    {"chinese": "<second example, different context>", "english": "<translation>"}
  ],
  "backstory": "<2-3 sentences of real historical or cultural context, cite specific sources>"
}

CRITICAL JSON RULES:
- Escape all double quotes inside strings with backslash: \"
- Escape all backslashes with double backslash: \\
- No trailing commas
- No comments
- All strings must be properly terminated
- Return ONLY the JSON array, nothing else`;
}

function fixCommonJsonErrors(text) {
  // Extract the array portion
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) return text;
  let json = text.slice(start, end + 1);

  // Fix trailing commas before ] or }
  json = json.replace(/,(\s*[}\]])/g, '$1');

  return json;
}

async function generateBatch(batchItems, startId, batchNum) {
  const total = batchItems.reduce((s, b) => s + b.count, 0);
  console.log(`\nBatch ${batchNum}: generating ${total} entries (ids ${startId}–${startId + total - 1})...`);

  const prompt = buildPrompt(batchItems, startId);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) console.log(`  Retry ${attempt}/${MAX_RETRIES}...`);

    let fullText = '';
    try {
      const stream = await client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });

      process.stdout.write('  ');
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          process.stdout.write('.');
        }
      }
      console.log(' done');
    } catch (err) {
      console.log(` stream error: ${err.message}`);
      if (attempt === MAX_RETRIES) throw err;
      continue;
    }

    try {
      const fixed = fixCommonJsonErrors(fullText);
      const entries = JSON.parse(fixed);

      if (!Array.isArray(entries)) throw new Error('Response is not an array');

      // Validate each entry
      for (const entry of entries) {
        const required = ['id', 'chinese', 'pinyin', 'english', 'category', 'examples', 'backstory'];
        for (const field of required) {
          if (entry[field] === undefined || entry[field] === null) {
            throw new Error(`Entry ${entry.id ?? '?'} missing field: ${field}`);
          }
        }
        if (!Array.isArray(entry.examples) || entry.examples.length < 2) {
          throw new Error(`Entry ${entry.id} needs at least 2 examples`);
        }
      }

      console.log(`  Validated ${entries.length} entries`);
      return entries;
    } catch (parseErr) {
      console.log(`  JSON parse error: ${parseErr.message}`);
      if (attempt === MAX_RETRIES) {
        // Save raw response for debugging
        const debugPath = path.join(__dirname, `../src/data/.debug-batch-${batchNum}.txt`);
        fs.writeFileSync(debugPath, fullText, 'utf-8');
        console.log(`  Saved raw response to ${debugPath}`);
        throw parseErr;
      }
    }
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log(`Generating ${TOTAL} Chinese word entries in batches of ${BATCH_SIZE}...`);
  console.log(`Output: ${OUTPUT_PATH}`);

  // Load existing progress
  let allEntries = [];
  let completedBatches = new Set();
  if (fs.existsSync(PROGRESS_PATH)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    allEntries = progress.entries || [];
    completedBatches = new Set(progress.completedBatches || []);
    console.log(`Resuming from progress: ${allEntries.length} entries already generated`);
  }

  // Build batch plan
  const batches = [];
  let remaining = [...CATEGORY_DISTRIBUTION.map(c => ({ ...c }))];
  let idCounter = 1;

  while (remaining.some(c => c.count > 0)) {
    const batchItems = [];
    let batchCount = 0;

    for (const cat of remaining) {
      if (cat.count <= 0) continue;
      const perBatch = Math.ceil(cat.count / Math.max(1, Math.ceil(cat.count / (BATCH_SIZE / CATEGORY_DISTRIBUTION.filter(c => c.count > 0).length))));
      const actual = Math.min(perBatch, BATCH_SIZE - batchCount, cat.count);
      if (actual > 0) {
        batchItems.push({ category: cat.name, count: actual });
        cat.count -= actual;
        batchCount += actual;
      }
      if (batchCount >= BATCH_SIZE) break;
    }

    if (batchCount === 0) break;
    batches.push({ items: batchItems, startId: idCounter });
    idCounter += batchCount;
  }

  console.log(`\nPlanned ${batches.length} batches:`);
  batches.forEach((b, i) => {
    const status = completedBatches.has(i) ? ' [done]' : '';
    const summary = b.items.map(x => `${x.count}×${x.category}`).join(', ');
    console.log(`  Batch ${i + 1}: ${summary}${status}`);
  });

  for (let i = 0; i < batches.length; i++) {
    if (completedBatches.has(i)) {
      console.log(`\nBatch ${i + 1}: skipping (already done)`);
      continue;
    }

    const { items, startId } = batches[i];
    const entries = await generateBatch(items, startId, i + 1);
    allEntries.push(...entries);
    completedBatches.add(i);

    // Save progress after each batch
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
      entries: allEntries,
      completedBatches: [...completedBatches],
    }, null, 2), 'utf-8');
    console.log(`  Progress saved (${allEntries.length} total entries so far)`);
  }

  const output = {
    generated_at: new Date().toISOString().split('T')[0],
    entries: allEntries,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSuccess! Wrote ${allEntries.length} entries to ${OUTPUT_PATH}`);

  // Clean up progress file
  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
