import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [192, 512];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

for (const size of sizes) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`
    <html><body style="margin:0;padding:0;background:#C8473A;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-family:'Noto Serif SC',serif;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');
        body { margin:0; overflow:hidden; }
      </style>
      <span style="color:#FAF8F5;font-size:${Math.floor(size*0.52)}px;font-weight:700;line-height:1;letter-spacing:0.02em;">词</span>
    </body></html>
  `, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 500));
  const outPath = path.join(iconsDir, `${size}.png`);
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(`Generated: ${outPath}`);
}

await browser.close();
