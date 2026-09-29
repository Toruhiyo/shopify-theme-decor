import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const THEME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = process.env.PROMO_FPS_DIR
  || path.join(os.homedir(), 'Projects/Bizmis/videos/promo-1-fps');
const BASE_URL = process.env.PROMO_FRAMES_URL
  || 'https://meridian-consumer-electronics.myshopify.com/';
const INTERVAL_MS = 1000;
const MAX_SECONDS = Number(process.env.PROMO_FPS_MAX || 180);
const VIEWPORT = { width: 1440, height: 810 };

async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return import(process.env.PLAYWRIGHT_MODULE);
  try {
    return await import('playwright');
  } catch {
    const require = createRequire(import.meta.url);
    return import(pathToFileURL(require.resolve('playwright')).href);
  }
}

function openingUrl() {
  const url = new URL(BASE_URL);
  url.searchParams.set('marketing', 'ad-1');
  url.searchParams.set('part', 'full');
  url.searchParams.set('v', `fps-${Date.now()}`);
  return url.toString();
}

function emptyOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith('.png') || file === 'FRAMES.md') {
      fs.rmSync(path.join(OUT_DIR, file), { force: true });
    }
  }
}

async function injectLocalOpeningCss(page) {
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/base.css') });
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/promo-ad-tokens.css') });
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/promo-ad.css') });
}

async function serveLocalTheme(page) {
  const themeJs = fs.readFileSync(path.join(THEME_ROOT, 'assets/theme.js'));
  await page.route('**/promo-clip-*.mp4*', async (route) => {
    const name = route.request().url().split('/').pop().split('?')[0];
    const file = path.join(THEME_ROOT, 'assets', name);
    if (!fs.existsSync(file)) {
      await route.continue();
      return;
    }
    await route.fulfill({ path: file, contentType: 'video/mp4' });
  });
  await page.route('**/promo-still-*.jpg*', async (route) => {
    const name = route.request().url().split('/').pop().split('?')[0];
    const file = path.join(THEME_ROOT, 'assets', name);
    if (!fs.existsSync(file)) {
      await route.continue();
      return;
    }
    await route.fulfill({ path: file, contentType: 'image/jpeg' });
  });
  await page.route('**/promo-pitch-grid-lead.jpg*', async (route) => {
    const file = path.join(THEME_ROOT, 'assets/promo-pitch-grid-lead.jpg');
    if (!fs.existsSync(file)) {
      await route.continue();
      return;
    }
    await route.fulfill({ path: file, contentType: 'image/jpeg' });
  });
  await page.route('**/assets/theme.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: themeJs,
    });
  });
}

async function unlockStorefront(page) {
  if (!page.url().includes('/password')) return;
  const password = process.env.PROMO_STORE_PASSWORD || 'bizmis';
  const input = page.locator('input[name="password"]');
  await input.waitFor({ timeout: 5000 });
  await input.fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/password'), {
      timeout: 10000,
      waitUntil: 'domcontentloaded',
    }),
    input.press('Enter'),
  ]);
}

function filmState() {
  const root = document.querySelector('.promo-opening');
  const clock = document.querySelector('[data-promo-clock]');
  const probe = typeof window.__promoGlideProbe === 'function' ? window.__promoGlideProbe() : null;
  return {
    ready: document.documentElement.classList.contains('is-promo-ready'),
    departed: document.documentElement.classList.contains('is-promo-depart') || !root,
    clock: clock?.textContent || '',
    probe,
  };
}

async function main() {
  emptyOutDir();
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PROMO_FRAMES_CHANNEL || 'chrome',
  });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await serveLocalTheme(page);
  await page.goto(openingUrl(), { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);
  if (!page.url().includes('marketing=ad-1')) {
    await page.goto(openingUrl(), { waitUntil: 'domcontentloaded', timeout: 20000 });
  }
  await injectLocalOpeningCss(page);
  await page.waitForFunction(
    () => document.documentElement.classList.contains('is-promo-ready'),
    null,
    { timeout: 60000 },
  );
  await page.waitForFunction(
    () => !!document.querySelector('[data-promo-clock]'),
    null,
    { timeout: 20000 },
  );

  const rows = [];
  const started = Date.now();
  for (let second = 0; second <= MAX_SECONDS; second += 1) {
    const target = started + second * INTERVAL_MS;
    const wait = target - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    const state = await page.evaluate(filmState);
    if (state.departed && second > 0) break;
    const name = `t-${String(second).padStart(3, '0')}.png`;
    await page.screenshot({ path: path.join(OUT_DIR, name), type: 'png', timeout: 15000 });
    const probe = state.probe;
    const probeText = probe && probe.mode
      ? ` | glide ${probe.mode} ${probe.phase} coverage=${probe.coverage} near=${probe.nearCellWidth} events=${probe.activeEvents}`
      : '';
    rows.push(`- \`${name}\`: ${state.clock || `${second}.000`}${probeText}`);
    process.stdout.write(`wrote ${name} ${state.clock}\n`);
    if (state.departed) break;
  }

  const body = [
    '# Promo ad-1, one frame per second',
    '',
    'Full film from `?marketing=ad-1&part=full`. The clock in the corner is the film clock.',
    '',
    ...rows,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'FRAMES.md'), body);
  await browser.close();
  process.stdout.write(`\n${rows.length} frames -> ${OUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
