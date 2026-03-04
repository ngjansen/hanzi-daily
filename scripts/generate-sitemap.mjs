import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const wordsData = JSON.parse(readFileSync(join(root, 'src/data/words.json'), 'utf-8'));
const SITE_URL = 'https://www.hanzidaily.com';
const today = new Date().toISOString().slice(0, 10);

const urls = [
  `  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
  ...wordsData.entries.map((entry) => `  <url>
    <loc>${SITE_URL}/word/${entry.id}</loc>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

writeFileSync(join(root, 'public/sitemap.xml'), sitemap, 'utf-8');
console.log(`Sitemap generated: 1 homepage + ${wordsData.entries.length} word pages = ${wordsData.entries.length + 1} URLs`);
