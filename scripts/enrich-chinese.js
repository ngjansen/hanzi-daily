#!/usr/bin/env node
// Adds Chinese meaning + backstory to all entries in words.json
// Usage: ANTHROPIC_API_KEY=sk-... node scripts/enrich-chinese.js
// Saves progress to src/data/.enrich-progress.json between batches

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDS_PATH  = path.join(__dirname, '../src/data/words.json');
const PROGRESS_PATH = path.join(__dirname, '../src/data/.enrich-progress.json');
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;

const client = new Anthropic();

function buildPrompt(batch) {
  const items = batch.map(e => ({
    id: e.id,
    chinese: e.chinese,
    pinyin: e.pinyin,
    english: e.english,
    backstory: e.backstory,
  }));

  return `You are enriching a Chinese vocabulary app with Chinese-language content.

For each entry below, write:
1. "meaning_zh": A concise Chinese dictionary-style definition (10–25 Chinese characters). Capture the core meaning naturally — as a native Chinese speaker would explain it to another native speaker.
2. "backstory_zh": 2–3 sentences in natural simplified Chinese explaining the word's historical or cultural origin. Cite specific classical texts, historical events, or cultural phenomena by name (e.g. 《孙子兵法》、2020年疫情期间).

Return ONLY a valid JSON array. Each object must have exactly: id, meaning_zh, backstory_zh.
No extra fields. No markdown. No commentary.
CRITICAL: Do NOT use ASCII double-quote characters (") inside string values. For quotations within Chinese text use 「」 brackets instead (e.g. 「春蚕到死丝方尽」). All double quotes must be JSON structural quotes only.

Entries:
${JSON.stringify(items, null, 2)}`;
}

function fixJson(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) return text;
  let json = text.slice(start, end + 1);

  // Remove trailing commas
  json = json.replace(/,(\s*[}\]])/g, '$1');

  // Remove stray control characters
  json = json.replace(/[\u0000-\u001F\u007F]/g, (c) => {
    if (c === '\n' || c === '\r' || c === '\t') return c;
    return '';
  });

  // Escape unescaped double quotes that appear INSIDE string values.
  // Strategy: walk char-by-char tracking whether we're inside a JSON string.
  let result = '';
  let inString = false;
  let i = 0;
  while (i < json.length) {
    const ch = json[i];
    if (ch === '\\' && inString) {
      // Escaped character — keep both chars as-is
      result += ch + (json[i + 1] ?? '');
      i += 2;
      continue;
    }
    if (ch === '"') {
      if (!inString) {
        inString = true;
        result += ch;
      } else {
        // Peek ahead: if next non-whitespace is : , } ] then this is a closing quote
        let j = i + 1;
        while (j < json.length && (json[j] === ' ' || json[j] === '\t')) j++;
        const next = json[j];
        if (next === ':' || next === ',' || next === '}' || next === ']' || next === '\n' || next === '\r') {
          inString = false;
          result += ch;
        } else {
          // Unescaped quote inside string value — escape it
          result += '\\"';
        }
      }
      i++;
      continue;
    }
    result += ch;
    i++;
  }

  return result;
}

async function enrichBatch(batch, batchNum) {
  console.log(`\nBatch ${batchNum}: enriching ids ${batch[0].id}–${batch[batch.length - 1].id}...`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      const delay = attempt * 5000;
      console.log(`  Waiting ${delay / 1000}s before retry ${attempt}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, delay));
    }

    let fullText = '';
    try {
      const stream = await client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: buildPrompt(batch) }],
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
      const fixed = fixJson(fullText);
      const results = JSON.parse(fixed);

      if (!Array.isArray(results)) throw new Error('Not an array');

      for (const r of results) {
        if (!r.id || !r.meaning_zh || !r.backstory_zh) {
          throw new Error(`Entry ${r.id ?? '?'} missing fields`);
        }
      }

      console.log(`  Validated ${results.length} enriched entries`);
      return results;
    } catch (parseErr) {
      console.log(`  Parse error: ${parseErr.message}`);
      if (attempt === MAX_RETRIES) {
        const debugPath = path.join(__dirname, `../src/data/.debug-enrich-batch-${batchNum}.txt`);
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

  const wordsData = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));
  const entries = wordsData.entries;
  console.log(`Loaded ${entries.length} entries from words.json`);

  // Load progress
  let enriched = {};
  if (fs.existsSync(PROGRESS_PATH)) {
    enriched = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    console.log(`Resuming: ${Object.keys(enriched).length} entries already enriched`);
  }

  // Process in batches
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const unenriched = batch.filter(e => !enriched[e.id]);

    if (unenriched.length === 0) {
      console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: skipping (already done)`);
      continue;
    }

    const results = await enrichBatch(unenriched, Math.floor(i / BATCH_SIZE) + 1);

    for (const r of results) {
      enriched[r.id] = { meaning_zh: r.meaning_zh, backstory_zh: r.backstory_zh };
    }

    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(enriched, null, 2), 'utf-8');
    console.log(`  Progress saved (${Object.keys(enriched).length}/${entries.length} total)`);
  }

  // Merge back into entries
  const updatedEntries = entries.map(e => {
    const extra = enriched[e.id];
    if (!extra) {
      console.warn(`Warning: entry ${e.id} (${e.chinese}) was not enriched`);
      return e;
    }
    return { ...e, meaning_zh: extra.meaning_zh, backstory_zh: extra.backstory_zh };
  });

  const output = { ...wordsData, entries: updatedEntries };
  fs.writeFileSync(WORDS_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSuccess! Updated ${updatedEntries.length} entries in words.json`);

  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
