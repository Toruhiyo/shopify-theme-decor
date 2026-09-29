#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const THEME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = process.env.LIGHTING_VERIFY_DIR
  || path.join(os.homedir(), 'Projects/Bizmis/videos/lighting-verify');
const BASE_URL = process.env.PROMO_FRAMES_URL
  || 'https://meridian-consumer-electronics.myshopify.com/';

async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return import(process.env.PLAYWRIGHT_MODULE);
  try {
    return await import('playwright');
  } catch {
    const require = createRequire(import.meta.url);
    return import(pathToFileURL(require.resolve('playwright')).href);
  }
}

function storeUrl(params) {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('v', `lighting-${Date.now()}`);
  return url.toString();
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

async function waitForAvatar(page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#bizmis-avatar-embed canvas');
    return !!(canvas && canvas.width > 8 && canvas.height > 8);
  }, null, { timeout: 25000 });
  await page.waitForTimeout(4500);
}

async function shot(page, fileName) {
  const dest = path.join(OUT_DIR, fileName);
  const canvas = page.locator('#bizmis-avatar-embed canvas');
  const box = await canvas.boundingBox().catch(() => null);
  if (box && box.width > 8 && box.height > 8) {
    await page.screenshot({
      path: dest,
      type: 'png',
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: box.width,
        height: box.height,
      },
      animations: 'disabled',
      timeout: 20000,
    });
  } else {
    await page.screenshot({ path: dest, type: 'png', animations: 'disabled', timeout: 20000 });
  }
  process.stdout.write(`wrote ${fileName}\n`);
}

async function captureOpening(page, lighting, fileName) {
  const params = { promo_video: 'opening' };
  if (lighting) params.lighting = lighting;
  await page.goto(storeUrl(params), { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);
  await page.waitForFunction(() => {
    const api = window.__promoOpeningFrames;
    return !!(api && typeof api.showExportFrame === 'function');
  }, null, { timeout: 15000 });
  await page.waitForSelector('#bizmis-avatar-embed', { state: 'attached', timeout: 20000 });
  await page.evaluate(() => window.__promoOpeningFrames.showExportFrame('14-sell-wave'));
  await page.waitForSelector('#bizmis-avatar-embed.is-promo-widget-parked', { timeout: 10000 });
  await waitForAvatar(page);
  await shot(page, fileName);
}

async function captureStore(page, params, fileName) {
  await page.goto(storeUrl(params), { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);
  if (!page.url().includes(Object.keys(params)[0] || 'http')) {
    await page.goto(storeUrl(params), { waitUntil: 'domcontentloaded', timeout: 20000 });
  }
  await waitForAvatar(page);
  await shot(page, fileName);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PROMO_FRAMES_CHANNEL || 'chrome',
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);

  await captureOpening(page, 'default', '01-opening-white-default.png');
  await captureOpening(page, 'studio', '02-opening-white-studio.png');
  await captureStore(page, {}, '03-meridian-hero-default.png');
  await captureStore(page, { promo_video: 'true' }, '04-meridian-hero-studio-red.png');

  await browser.close();
  process.stdout.write(`\nlighting verify -> ${OUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
