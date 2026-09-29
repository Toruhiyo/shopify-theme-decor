#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT_DIR = process.env.LIGHTING_LINEUP_DIR
  || path.join(os.homedir(), 'Projects/Bizmis/videos/lighting-lineup');
const BASE_URL = process.env.PROMO_FRAMES_URL
  || 'https://meridian-consumer-electronics.myshopify.com/';

const KEY_POS = [-4.5, 6, 5.5];
const FILL_POS = [5.5, 2, 4];
const RIM_POS = [1.4, 3.2, -6];

const ROUND1 = [
  {
    id: '01-default',
    label: 'Default: live merchant look. White key from upper-right, no fill/rim.',
    lighting: 'default',
  },
  {
    id: '02-brighter',
    label: 'Brighter default: same lights, exposure 1.23 (+0.3 EV).',
    lighting: { exposure: 1.23 },
  },
  {
    id: '03-three-point',
    label: 'Three-point white: key upper-left, soft fill right, cool rim. No warm tint.',
    lighting: {
      exposure: 1,
      ambient: { intensity: 0.72, color: '#ffffff' },
      hemi: { intensity: 0.14, sky: '#ffffff', ground: '#e4d0bc' },
      key: { intensity: 1.15, color: '#ffffff', position: KEY_POS, castShadow: false },
      fill: { intensity: 0.32, color: '#ffffff', position: FILL_POS },
      rim: { intensity: 0.2, color: '#c5d2f4', position: RIM_POS },
      env: { intensity: 0 },
      material: { shirtRoughness: 1.2, hairSpecular: 1.3 },
    },
  },
  {
    id: '04-held-orange',
    label: 'Held orange: studio idea with a dimmer key so #F9A353 does not wash out.',
    lighting: {
      exposure: 1.08,
      ambient: { intensity: 0.95, color: '#ffffff' },
      hemi: { intensity: 0.16, sky: '#fffaf4', ground: '#e8c4a0' },
      key: { intensity: 0.92, color: '#fff2e4', position: [-4.2, 5.8, 6.5], castShadow: false },
      fill: { intensity: 0.24, color: '#ffffff', position: [5.5, 1.8, 3.2] },
      rim: { intensity: 0.16, color: '#a8baf0', position: [1.2, 3.4, -5.5] },
      env: { intensity: 0.08 },
      material: { shirtRoughness: 1.2, hairSpecular: 1.25 },
    },
  },
  {
    id: '05-studio',
    label: 'Current studio preset: warmer, brighter, the one promo opening uses today.',
    lighting: 'studio',
  },
  {
    id: '06-warm-sculpt',
    label: 'Warm sculpt: more contrast, warmer key, less ambient fill.',
    lighting: {
      exposure: 1.12,
      ambient: { intensity: 0.78, color: '#fff6ee' },
      hemi: { intensity: 0.18, sky: '#fff8f0', ground: '#e0b894' },
      key: { intensity: 1.08, color: '#ffdcb8', position: [-4.2, 5.8, 6.5], castShadow: false },
      fill: { intensity: 0.22, color: '#fff8f2', position: [5.5, 1.8, 3.2] },
      rim: { intensity: 0.22, color: '#9eb0e8', position: [1.2, 3.4, -5.5] },
      env: { intensity: 0.05 },
      material: { shirtRoughness: 1.15, hairSpecular: 1.3 },
    },
  },
];

const ROUND2 = [
  {
    id: '07-lift',
    label: 'Lift: 03 plus a bit more key and exposure, less fill. White lights only.',
    lighting: {
      exposure: 1.1,
      ambient: { intensity: 0.68, color: '#ffffff' },
      hemi: { intensity: 0.12, sky: '#ffffff', ground: '#e4d0bc' },
      key: { intensity: 1.28, color: '#ffffff', position: KEY_POS, castShadow: false },
      fill: { intensity: 0.22, color: '#ffffff', position: FILL_POS },
      rim: { intensity: 0.18, color: '#c5d2f4', position: RIM_POS },
      env: { intensity: 0 },
      material: { shirtRoughness: 1.15, hairSpecular: 1.3 },
    },
  },
  {
    id: '08-punchy',
    label: 'Punchy: brighter key, darker ambient, so the orange stays chromatic.',
    lighting: {
      exposure: 1.08,
      ambient: { intensity: 0.55, color: '#ffffff' },
      hemi: { intensity: 0.1, sky: '#ffffff', ground: '#f0a24e' },
      key: { intensity: 1.38, color: '#ffffff', position: KEY_POS, castShadow: false },
      fill: { intensity: 0.14, color: '#ffffff', position: FILL_POS },
      rim: { intensity: 0.16, color: '#c5d2f4', position: RIM_POS },
      env: { intensity: 0 },
      material: { shirtRoughness: 1.2, hairSpecular: 1.3 },
    },
  },
  {
    id: '09-bounce',
    label: 'Bounce: white key plus a #F9A353 ground bounce to saturate the shadow side.',
    lighting: {
      exposure: 1.08,
      ambient: { intensity: 0.64, color: '#ffffff' },
      hemi: { intensity: 0.32, sky: '#fff6ea', ground: '#f9a353' },
      key: { intensity: 1.24, color: '#ffffff', position: KEY_POS, castShadow: false },
      fill: { intensity: 0.16, color: '#ffffff', position: FILL_POS },
      rim: { intensity: 0.14, color: '#c5d2f4', position: RIM_POS },
      env: { intensity: 0 },
      material: { shirtRoughness: 1.2, hairSpecular: 1.3 },
    },
  },
  {
    id: '10-chroma-key',
    label: 'Chroma key: moderate orange key (#ffb45c) instead of a pale warm wash.',
    lighting: {
      exposure: 1.06,
      ambient: { intensity: 0.66, color: '#ffffff' },
      hemi: { intensity: 0.12, sky: '#ffffff', ground: '#f0b060' },
      key: { intensity: 1.05, color: '#ffb45c', position: KEY_POS, castShadow: false },
      fill: { intensity: 0.18, color: '#ffffff', position: FILL_POS },
      rim: { intensity: 0.14, color: '#c5d2f4', position: RIM_POS },
      env: { intensity: 0 },
      material: { shirtRoughness: 1.25, hairSpecular: 1.3 },
    },
  },
  {
    id: '11-combo',
    label: 'Combo: punchy white key plus brand-orange bounce. No warm key tint.',
    lighting: {
      exposure: 1.1,
      ambient: { intensity: 0.58, color: '#ffffff' },
      hemi: { intensity: 0.24, sky: '#ffffff', ground: '#f9a353' },
      key: { intensity: 1.32, color: '#ffffff', position: KEY_POS, castShadow: false },
      fill: { intensity: 0.12, color: '#ffffff', position: FILL_POS },
      rim: { intensity: 0.18, color: '#c5d2f4', position: RIM_POS },
      env: { intensity: 0 },
      material: { shirtRoughness: 1.2, hairSpecular: 1.3 },
    },
  },
];

const ROUNDS = { 1: ROUND1, 2: ROUND2 };
const RED_IDS = {
  1: ['01-default', '04-held-orange', '05-studio'],
  2: ['08-punchy', '09-bounce', '11-combo'],
};
const ROUND = Number(process.env.LIGHTING_ROUND || '2');
const VARIANTS = ROUNDS[ROUND] || ROUND2;

async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return import(process.env.PLAYWRIGHT_MODULE);
  try {
    return await import('playwright');
  } catch {
    const require = createRequire(import.meta.url);
    return import(pathToFileURL(require.resolve('playwright')).href);
  }
}

function lightingParam(lighting) {
  if (typeof lighting === 'string') return lighting;
  return JSON.stringify(lighting);
}

function storeUrl(params) {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('v', `lineup-${Date.now()}`);
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
  await page.waitForTimeout(3500);
}

async function shot(page, fileName) {
  const dest = path.join(OUT_DIR, fileName);
  const canvas = page.locator('#bizmis-avatar-embed canvas');
  if (await canvas.count()) {
    const box = await canvas.boundingBox();
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
      process.stdout.write(`wrote ${fileName}\n`);
      return;
    }
  }
  await page.screenshot({
    path: dest,
    type: 'png',
    animations: 'disabled',
    timeout: 20000,
  });
  process.stdout.write(`wrote ${fileName} (full page fallback)\n`);
}

async function captureOpening(page, lighting, fileName) {
  await page.goto(storeUrl({
    promo_video: 'opening',
    lighting: lightingParam(lighting),
  }), { waitUntil: 'domcontentloaded', timeout: 20000 });
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

async function captureStore(page, lighting, fileName) {
  await page.goto(storeUrl({
    promo_video: 'true',
    lighting: lightingParam(lighting),
  }), { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);
  await waitForAvatar(page);
  await shot(page, fileName);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, `variants-round-${ROUND}.json`),
    `${JSON.stringify(VARIANTS, null, 2)}\n`,
  );

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

  for (const variant of VARIANTS) {
    process.stdout.write(`\n${variant.id}: ${variant.label}\n`);
    await captureOpening(page, variant.lighting, `${variant.id}-opening.png`);
  }

  const redIds = RED_IDS[ROUND] || [];
  for (const variant of VARIANTS.filter((item) => redIds.includes(item.id))) {
    process.stdout.write(`\n${variant.id} red: ${variant.label}\n`);
    await captureStore(page, variant.lighting, `${variant.id}-meridian-red.png`);
  }

  await browser.close();
  process.stdout.write(`\nlighting lineup -> ${OUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
