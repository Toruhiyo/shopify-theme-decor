import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const THEME = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FRAMES = '/tmp/pain-wall-frames';
const FFMPEG = '/tmp/ffmpeg-bin/ffmpeg';
const playwrightPath = '/Users/toruhiyo/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(playwrightPath).href);

fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
await page.emulateMedia({ reducedMotion: 'no-preference' });
const themeJs = fs.readFileSync(path.join(THEME, 'assets/theme.js'));
await page.route('**/assets/theme.js*', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: themeJs });
});
await page.route('**/promo-product-*.png*', async (route) => {
  const name = decodeURIComponent(route.request().url().split('/').pop().split('?')[0]);
  const file = path.join(THEME, 'assets', name);
  if (!fs.existsSync(file)) {
    await route.continue();
    return;
  }
  await route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(file) });
});

const url = new URL('https://meridian-consumer-electronics.myshopify.com/');
url.searchParams.set('marketing', 'ad-1');
url.searchParams.set('part', 'pitch');
url.searchParams.set('v', `wall-${Date.now()}`);
await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 25000 });
if (page.url().includes('/password')) {
  const input = page.locator('input[name="password"]');
  await input.fill('bizmis');
  await Promise.all([
    page.waitForURL((next) => !next.pathname.includes('/password'), { timeout: 15000, waitUntil: 'domcontentloaded' }),
    input.press('Enter'),
  ]);
}
if (!page.url().includes('marketing=ad-1')) {
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 25000 });
}
await page.addStyleTag({ path: path.join(THEME, 'assets/base.css') });
await page.addStyleTag({ path: path.join(THEME, 'assets/promo-ad-tokens.css') });
await page.addStyleTag({ path: path.join(THEME, 'assets/promo-ad.css') });
await page.waitForFunction(() => document.documentElement.classList.contains('is-promo-ready'), null, { timeout: 60000 });

const fps = 60;
const frames = fps * 3;
await page.evaluate(() => {
  window.__promoOpeningFrames.seekPainLoop(0);
});
const clip = await page.locator('.promo-opening__store').boundingBox();
if (!clip) throw new Error('store box missing');
for (let frame = 0; frame < frames; frame += 1) {
  await page.evaluate((ms) => {
    window.__promoOpeningFrames.seekPainLoop(ms);
  }, (frame / fps) * 1000);
  const file = path.join(FRAMES, `frame-${String(frame).padStart(4, '0')}.png`);
  await page.screenshot({ path: file, type: 'png', clip });
  if (frame === 0 || frame % 30 === 0) console.log(`frame ${frame}`);
}

const dot = await page.evaluate(() => {
  window.__promoOpeningFrames.seekPainLoop(2700);
  const storeNode = document.querySelector('.promo-opening__store');
  const close = storeNode?.querySelector('[data-promo-window-close]');
  if (!storeNode || !close) return null;
  const storeBox = storeNode.getBoundingClientRect();
  const closeBox = close.getBoundingClientRect();
  return {
    x: (closeBox.left + closeBox.width / 2 - storeBox.left) / storeBox.width,
    y: (closeBox.top + closeBox.height / 2 - storeBox.top) / storeBox.height,
    d: closeBox.width / storeBox.width,
    store: { w: storeBox.width, h: storeBox.height },
  };
});
console.log('dot', JSON.stringify(dot));
await browser.close();

const encode = (args) => {
  const result = spawnSync(FFMPEG, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
};
const input = path.join(FRAMES, 'frame-%04d.png');
encode(['-y', '-framerate', String(fps), '-i', input, '-vf', 'scale=480:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(THEME, 'assets/promo-pain-wall.mp4')]);
encode(['-y', '-framerate', String(fps), '-i', input, '-vf', 'scale=480:-2', '-c:v', 'libvpx', '-b:v', '1400k', '-an', path.join(THEME, 'assets/promo-pain-wall.webm')]);
console.log('encoded');
