import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Inter:wght@400;500&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: #C8473A;
      font-family: 'Inter', sans-serif;
      position: relative;
    }

    /* Grain texture overlay */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
      background-size: 256px 256px;
      pointer-events: none;
      z-index: 10;
    }

    /* Radial gradient depth */
    .bg-glow {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 800px 500px at 30% 50%, rgba(220, 80, 60, 0.6) 0%, transparent 70%),
        radial-gradient(ellipse 600px 400px at 80% 80%, rgba(160, 30, 20, 0.5) 0%, transparent 70%);
      z-index: 1;
    }

    /* Large watermark character */
    .watermark {
      position: absolute;
      right: -20px;
      top: -60px;
      font-family: 'Noto Serif SC', serif;
      font-weight: 900;
      font-size: 520px;
      line-height: 1;
      color: rgba(255,255,255,0.07);
      letter-spacing: -0.05em;
      z-index: 2;
      user-select: none;
    }

    /* Content layer */
    .content {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 72px 80px;
    }

    .eyebrow {
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      font-size: 18px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.55);
      margin-bottom: 28px;
    }

    .headline {
      font-family: 'Noto Serif SC', serif;
      font-weight: 700;
      font-size: 86px;
      line-height: 1.0;
      color: #fff;
      letter-spacing: -0.02em;
      margin-bottom: 28px;
    }

    .headline span {
      display: block;
      font-size: 52px;
      font-weight: 400;
      letter-spacing: 0.04em;
      color: rgba(255,255,255,0.75);
      margin-top: 8px;
    }

    .tagline {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 22px;
      line-height: 1.6;
      color: rgba(255,255,255,0.65);
      max-width: 560px;
    }

    /* Bottom bar */
    .bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: rgba(255,255,255,0.2);
      z-index: 6;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="watermark">词</div>
  <div class="content">
    <div class="eyebrow">hanzidaily.com</div>
    <div class="headline">
      HanziDaily
      <span>每日一词</span>
    </div>
    <div class="tagline">One Chinese word a day — deep cultural context for the diaspora and Mandarin learners.</div>
  </div>
  <div class="bottom"></div>
</body>
</html>`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'domcontentloaded' });

// Wait for fonts to load
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2000));

const outputPath = join(__dirname, '../public/og-image.png');
const screenshot = await page.screenshot({ type: 'png' });
writeFileSync(outputPath, screenshot);

await browser.close();
console.log(`OG image saved to ${outputPath}`);
