#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const THEME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(THEME_ROOT, 'assets');
const FRAME_DIR = path.join(os.tmpdir(), 'promo-clip-rec');
const BASE_URL = process.env.PROMO_FRAMES_URL
  || 'https://meridian-consumer-electronics.myshopify.com/';
const FFMPEG = process.env.FFMPEG || '/tmp/ffmpeg-bin/ffmpeg';
const FPS = 10;
const FRAME_COUNT = 30;
const MOMENTS = [
  'moment-catalog-a',
  'moment-catalog-b',
  'moment-product-a',
  'moment-product-b',
  'moment-compare-a',
  'moment-compare-b',
  'moment-bundle-a',
  'moment-bundle-b',
];

const DEVICES = {
  desktop: {
    width: 800,
    height: 500,
    motions: ['scroll-up', 'scroll-down', 'wander-near', 'wander-far', 'product-read', 'product-scroll', 'compare'],
  },
  phone: {
    width: 360,
    height: 780,
    motions: ['scroll-up', 'scroll-down', 'product-read', 'product-scroll', 'compare'],
  },
  tablet: {
    width: 960,
    height: 720,
    motions: ['scroll-up', 'scroll-down', 'product-read', 'product-scroll', 'compare'],
  },
};

function clipsFor(device) {
  const spec = DEVICES[device];
  const set = (process.env.PROMO_CLIP_SET || 'all').trim();
  const onlyMotion = (process.env.PROMO_CLIP_MOTION || '').trim();
  const clips = [];
  if (set !== 'moments') {
    for (const motion of spec.motions) {
      for (const chat of [false, true]) {
        clips.push({
          key: `pain-${device}-${motion}-${chat ? '1' : '0'}`,
          device,
          motion,
          chat,
          tone: 'pain',
          moment: false,
        });
      }
    }
  }
  if (set !== 'pain') {
    for (const motion of MOMENTS) {
      clips.push({
        key: `pitch-${device}-${motion}-0`,
        device,
        motion,
        chat: false,
        tone: 'pitch',
        moment: true,
      });
    }
  }
  return onlyMotion ? clips.filter((clip) => clip.motion === onlyMotion) : clips;
}

async function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return import(process.env.PLAYWRIGHT_MODULE);
  const require = createRequire(import.meta.url);
  try {
    return await import('playwright');
  } catch {
    return import(pathToFileURL(require.resolve('playwright')).href);
  }
}

function encodeClip(frames, dest) {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, [
      '-y',
      '-framerate', String(FPS),
      '-i', path.join(frames, 'frame-%02d.jpg'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '28',
      '-an',
      '-movflags', '+faststart',
      dest,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (chunk) => { err += chunk.toString(); });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.split('\n').slice(-8).join('\n')));
    });
  });
}

async function unlock(page) {
  if (!page.url().includes('/password')) return;
  const input = page.locator('input[name="password"]');
  await input.waitFor({ timeout: 8000 });
  await input.fill(process.env.PROMO_STORE_PASSWORD || 'bizmis');
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/password'), { timeout: 15000, waitUntil: 'domcontentloaded' }),
    input.press('Enter'),
  ]);
}

async function recordDevice(browser, device, themeJs) {
  const spec = DEVICES[device];
  const page = await browser.newPage({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: 1,
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (device === 'phone') {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => 1280 });
    });
  }
  await page.route('**/assets/theme.js*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript; charset=utf-8',
    body: themeJs,
  }));
  const url = new URL(BASE_URL);
  url.searchParams.set('marketing', 'ad-1');
  url.searchParams.set('part', 'pain');
  url.searchParams.set('clip', '1');
  url.searchParams.set('device', device);
  url.searchParams.set('v', `clips-${Date.now()}`);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 25000 });
  await unlock(page);
  if (!page.url().includes('clip=1')) {
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 25000 });
  }
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/base.css') });
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/promo-ad-tokens.css') });
  await page.addStyleTag({ path: path.join(THEME_ROOT, 'assets/promo-ad.css') });
  await page.waitForFunction(
    () => document.documentElement.classList.contains('is-promo-ready') && document.querySelector('[data-promo-clip-ready]'),
    null,
    { timeout: 60000 },
  );

  const clips = clipsFor(device);
  for (const clip of clips) {
    const frames = path.join(FRAME_DIR, clip.key);
    fs.rmSync(frames, { recursive: true, force: true });
    fs.mkdirSync(frames, { recursive: true });
    await page.evaluate((next) => {
      window.__promoOpeningFrames.showClip(next);
      document.getAnimations().forEach((anim) => {
        try { anim.currentTime = 0; } catch { /* progress-based animations reject a time seek */ }
        try { anim.play(); } catch { /* already running */ }
      });
    }, clip);
    if (clip.moment) {
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#bizmis-avatar-embed canvas');
        return !!(canvas && canvas.width > 32);
      }, null, { timeout: 25000 }).catch(() => {});
      await page.evaluate((next) => {
        window.__promoOpeningFrames.showClip(next);
      }, clip);
      await page.waitForTimeout(1100);
    } else {
      await page.waitForTimeout(40);
    }
    const frameMs = 1000 / FPS;
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const started = Date.now();
      await page.screenshot({
        path: path.join(frames, `frame-${String(index).padStart(2, '0')}.jpg`),
        type: 'jpeg',
        quality: 72,
        timeout: 15000,
      });
      const remain = frameMs - (Date.now() - started);
      if (remain > 0) await page.waitForTimeout(remain);
    }
    const dest = path.join(OUT_DIR, `promo-clip-${clip.key}.mp4`);
    await encodeClip(frames, dest);
    fs.rmSync(frames, { recursive: true, force: true });
    process.stdout.write(`wrote promo-clip-${clip.key}.mp4\n`);
  }
  await page.close();
}

async function main() {
  if (!fs.existsSync(FFMPEG)) throw new Error(`ffmpeg not found at ${FFMPEG}`);
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  const themeJs = fs.readFileSync(path.join(THEME_ROOT, 'assets/theme.js'));
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PROMO_FRAMES_CHANNEL || 'chrome',
  });
  const only = (process.env.PROMO_CLIP_DEVICE || '').trim();
  const devices = only ? [only] : Object.keys(DEVICES);
  for (const device of devices) await recordDevice(browser, device, themeJs);
  await browser.close();
  process.stdout.write('clip recording done\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
