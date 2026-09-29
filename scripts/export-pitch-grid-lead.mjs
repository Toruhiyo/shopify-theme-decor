#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const THEME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(THEME_ROOT, 'assets/promo-pitch-grid-lead.jpg');
const BASE_URL = process.env.PROMO_FRAMES_URL
  || 'https://meridian-consumer-electronics.myshopify.com/';
const VIEWPORT = { width: 1440, height: 810 };
const FRAME_ID = '14e4-beat-4-bundle';

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
  url.searchParams.set('part', 'pitch');
  url.searchParams.set('v', `lead-${Date.now()}`);
  return url.toString();
}

async function serveLocalTheme(page) {
  const themeJs = fs.readFileSync(path.join(THEME_ROOT, 'assets/theme.js'));
  await page.route('**/assets/theme.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: themeJs,
    });
  });
}

async function injectLocalOpeningCss(page) {
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/base.css') });
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/promo-ad-tokens.css') });
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/promo-ad.css') });
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

async function main() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PROMO_FRAMES_CHANNEL || 'chrome',
  });
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await serveLocalTheme(page);
  await page.goto(openingUrl(), { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);
  if (!page.url().includes('marketing=ad-1')) {
    await page.goto(openingUrl(), { waitUntil: 'domcontentloaded', timeout: 20000 });
  }
  await injectLocalOpeningCss(page);
  await page.waitForFunction(() => {
    const api = window.__promoOpeningFrames;
    return !!(api && typeof api.showExportFrame === 'function');
  }, null, { timeout: 15000 });
  await page.waitForFunction(
    () => document.documentElement.classList.contains('is-promo-ready'),
    null,
    { timeout: 60000 },
  );
  await page.evaluate(async (frameId) => {
    const prime = window.__promoOpeningFrames.showExportFrame('14b1-beat-1-grid');
    if (prime && typeof prime.then === 'function') await prime;
    const imgs = [...document.querySelectorAll('.promo-moments__glyph img')];
    await Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    }));
    const result = window.__promoOpeningFrames.showExportFrame(frameId);
    if (result && typeof result.then === 'function') await result;
  }, FRAME_ID);
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#bizmis-avatar-embed canvas');
    return !!(canvas && canvas.width > 32);
  }, null, { timeout: 20000 });
  await page.waitForTimeout(900);
  const box = await page.locator('.promo-opening__store').boundingBox();
  if (!box || box.width < 8 || box.height < 8) {
    throw new Error('Store window was not on screen for the bundle frame.');
  }
  await page.screenshot({
    path: OUT_FILE,
    type: 'jpeg',
    quality: 82,
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    },
    timeout: 15000,
  });
  await browser.close();
  process.stdout.write(`wrote ${OUT_FILE}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
