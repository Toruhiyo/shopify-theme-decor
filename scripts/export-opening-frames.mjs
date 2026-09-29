#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const THEME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = process.env.PROMO_FRAMES_DIR
  || path.join(os.homedir(), 'Projects/Bizmis/videos/promo-1');
const BASE_URL = process.env.PROMO_FRAMES_URL
  || 'https://meridian-consumer-electronics.myshopify.com/';
const VIEWPORT = {
  width: Number(process.env.PROMO_FRAMES_WIDTH || 1440),
  height: Number(process.env.PROMO_FRAMES_HEIGHT || 810),
};

const REST_PAD_MS = 100;

const FRAMES = [
  ['pain-a-grid', 'Pain, unattended. The store is full of products. Clerk corner is empty. Cart is empty.', 0],
  ['pain-a-enter', 'Pain, unattended. Cursor rests on a product image. Add is not under it.', 0],
  ['pain-a-open', 'Pain, unattended. One product card is open. Cursor stays on the image, not Add.', 0],
  ['pain-a-back', 'Pain, unattended. The opened card has closed. Cursor is still on the image.', 0],
  ['pain-a-scroll-1', 'Pain, unattended. The catalog has scrolled one row. New products have entered from below.', 0],
  ['pain-a-scroll-2', 'Pain, unattended. The catalog has scrolled another row. The window is still full of products.', 0],
  ['pain-a-scroll-3', 'Pain, unattended. The catalog has scrolled a third row. New products keep coming in.', 0],
  ['pain-a-scroll-4', 'Pain, unattended. The catalog has scrolled a fourth row. The window is still two rows of products.', 0],
  ['pain-a-leave', 'Pain, unattended. Cursor has left at the stage edge.', 0],
  ['pain-b-launcher', 'Pain, dull chatbot. Grey launcher sits where the clerk will stand.', 0],
  ['pain-b-panel', 'Pain, dull chatbot. Grey panel is open. Title Dull Chatbot. Footer Powered by Every Chatbot Ever.', 0],
  ['pain-b-typed-1', 'Pain, dull chatbot. Input reads: Looking for something light I can take everywhere.', 0],
  ['pain-b-answer-1', 'Pain, dull chatbot. Collection answer with View collection and Size guide. Grid and cart unchanged.', 0],
  ['pain-b-typed-2', 'Pain, dull chatbot. Input reads: Which one would you pick for me?', 0],
  ['pain-b-answer-2', 'Pain, dull chatbot. Ticket answer with Open a ticket and No, thanks. The store is still full size.', 0],
  ['pain-c-lane-1', 'Pain glide. The store window is laying down into a tilted plane of devices. The plane already runs off every edge.', 0],
  ['pain-c-event', 'Pain glide. A window poofs: it shrinks, fades, and throws a grey puff. The gap stays. No stamp and no red.', 0],
  ['pain-c-lanes-3', 'Pain glide. The camera is sliding diagonally. Near windows play, farther ones are stills. Phones and tablets share the row bottom.', 0],
  ['pain-c-lanes-5', 'Pain glide, faster. More windows have poofed and the plane is thinning. Cell size has not changed.', 0],
  ['pain-c-lanes-7', 'Pain glide. The plane is streaking. Windows keep poofing. No edge of the plane is in frame.', 0],
  ['pain-c-texture', 'Pain glide. Directional blur, then the plane starts dissolving into the warm grey surface.', 0],
  ['pain-c-white', 'Pain glide. The plane is gone. The frame is the warm surface, about to fade to white.', 0],
  ['pain-c-resolve', 'Pain end. The surface fades to white and the line rises: It replies. It doesn\'t sell.', 0],
  ['pain-c-end', 'Pain end frame. White field. The line It replies. It doesn\'t sell. No zero.', 0],
  ['01-toggle-rest', 'Store at rest. Small Bizmis toggle, knob off.', 40],
  ['02-toggle-on', 'Knob on. Label goes orange: Agentic sales.', 40],
  ['02b-toggle-gone', 'Typical chatbot and the toggle are gone. Agentic sales is centered at its original size. It has not started scaling.', 40],
  ['02c-agentic-scaled', 'Agentic sales stays centered and has scaled up in Bizmis orange. Burst has not fired.', 40],
  ['03a-flood-warmth-0', 'Flood starts. Warmth is 0: white field, neutral greys, grey objects.', 40],
  ['03b-flood-warmth-05', 'Flood halfway. Warmth is 0.5. The store is warming as the orange arrives.', 40],
  ['03c-flood-warmth-1', 'Flood complete. Warmth is 1. The store is warm.', 40],
  ['03-orange-burst', 'Orange field just after the burst. Agentic sales is still expanding, now white.', 160],
  ['04-logo-docked', 'Orange Bizmis mark has slid into the left seat. Clerk is in on the right.', 1800],
  ['05-logo-gone', 'Mark has left the left seat. Clerk stays on the right.', 1200],
  ['06-your', 'First word: Your.', 40],
  ['07-your-store', 'Your store. Single normal space.', 40],
  ['08-salesperson', 'Your store salesperson. salesperson is one word. Period on this token.', 40],
  ['09-salesperson-struck', 'Orange strike through person only. Period is not struck.', 40],
  ['10-sales-agent', 'person rewritten as agent. The strike is gone. salesagent is the primary colour.', 40],
  ['11-built', 'First line gone. Built at the same type size.', 40],
  ['12-to', 'Only to, same type size.', 40],
  ['13-sell', 'Only sell. in Bizmis orange, same type size.', 40],
  ['14-sell-wave', 'sell. hold. Clerk is already in on the right.', 180],
  ['14b1-beat-1-grid', 'Beat 1, grid. Full 12-tile catalog, settled, before the shortlist.', 0],
  ['14b2-beat-1-shortlist', 'Beat 1, shortlist. Capsule, sphere, and rounded cube are scattered inside the frame, rings on, no scroll.', 0],
  ['14b3-beat-1-collapse', 'Beat 1, collapse. The three chosen tiles are traveling into the row. The other nine are fading.', 0],
  ['14b4-beat-1-row', 'Beat 1, row. Standing capsule, sphere, rounded cube, all stone. The sphere is in the middle.', 0],
  ['14b5-beat-1-speech', 'Beat 1, speech. Same row, mid-line, clerk mouth open.', 0],
  ['14c1-beat-2-hold', 'Beat 2, hold. The three tiles rest while the line has not started the comparison.', 0],
  ['14c2-beat-2-specs', 'Beat 2, specs. Side cards are out and the spec rows are up, before the ticks.', 0],
  ['14c3-beat-2-ticked', 'Beat 2, ticked. Spec rows show ticks and crosses. The center card has not lifted yet.', 0],
  ['14c4-beat-2-lifted', 'Beat 2, lifted. The selected circle has settled in the lifted pose.', 0],
  ['14c5-beat-2-speech', 'Beat 2, speech. Ticked comparison, mid-line, clerk mouth open.', 0],
  ['14d1-beat-3-hold', 'Beat 3, hold. Lifted choice rests before the doubt bubbles.', 0],
  ['14d2-beat-3-doubt', 'Beat 3, doubt. Question bubbles orbit the chosen card.', 0],
  ['14d3-beat-3-vapor', 'Beat 3, vapor. Question marks are still readable inside the orange mist. Cart count has not moved.', 0],
  ['14d4-beat-3-close', 'Beat 3, close. Added sits on the button. No floating check. Cart count is 1.', 0],
  ['14d5-beat-3-speech', 'Beat 3, speech. Doubt bubbles, mid-line, clerk mouth open.', 0],
  ['14e1-beat-4-hold', 'Beat 4, hold. Closed card and cart count 1, before the accessory.', 0],
  ['14e2-beat-4-arriving', 'Beat 4, arriving. Plus is between the sphere and the torus, which has not docked.', 0],
  ['14e3-beat-4-docked', 'Beat 4, docked. Both cards match an opened catalog card, each with Added, and no empty gap under the button. Cart count is 2.', 0],
  ['14e4-beat-4-bundle', 'Beat 4, bundle. Both cards sit together with no line around them. The extra button reads Added. The sphere photo is the sphere alone. Cart count is 2.', 0],
  ['14e5-beat-4-speech', 'Beat 4, speech. Docked accessory, mid-line, clerk mouth open.', 0],
  ['14f1-moments-contract', 'Wrap-up. The store is fading and the dot is forming where the products were.', 0],
  ['14f2-moments-dot', 'Wrap-up. The dot is reaching the clerk.', 0],
  ['14f3-moments-nod', 'Wrap-up, settled. Stage is empty. Clerk nods.', 0],
  ['15-see-yourself', 'sell. is gone. No See for yourself. Every variant is about to play one store at a time.', 0],
  ['16-see-stores', 'The first store is rising. Ambient store-color light and particles are just starting. The photo itself is untouched. No See for yourself line.', 2500],
  ['17-see-roulette', 'One store at the light peak. Card and title are large. Store-color light and particles are spread. The photo has no lighting filter.', 2500],
  ['18-see-meridian', 'Demo: Meridian at full light, no button. Early access and install end on the ask with no card: the line, the drawn button, the URL when the variant has one. Cursor rests on the button.', 2500],
  ['pitch-c-lane-1', 'Pitch glide. The bundle picture is laying down into a tilted plane. The clerk stays in that window. No red.', 0],
  ['pitch-c-event', 'Pitch glide. A window blooms orange from the cart, with a short white burst. No words. The clerk and the cart stay in the picture.', 0],
  ['pitch-c-lanes-3', 'Pitch glide. The camera slides diagonally. Near windows play, farther ones are stills. Blooms are spreading.', 0],
  ['pitch-c-lanes-5', 'Pitch glide, faster. Most windows in the middle have settled into a soft orange wash. Cell size has not changed.', 0],
  ['pitch-c-lanes-7', 'Pitch glide. The plane is streaking and the blooms read as one warm field. No edge of the plane is in frame.', 0],
  ['pitch-c-texture', 'Pitch glide. Directional blur, then the plane starts dissolving into Bizmis orange.', 0],
  ['pitch-c-white', 'Pitch glide. The plane is gone. The orange field is a close-up of the orange logo.', 0],
  ['pitch-c-resolve', 'Pitch end. The orange logo and Built to sell. pull back together from the close-up onto white.', 0],
  ['pitch-c-end-demo', 'Pitch end. Orange mark on white, and Built to sell. No button. The stores are the demo.', 0],
  ['pitch-c-end-install', 'Pitch end. Orange mark on white, and Built to sell. No button. The ask comes after the store wave.', 0],
  ['pitch-c-end-ea', 'Pitch end. Orange mark on white, and Built to sell. No button. The ask comes after the store wave.', 0],
  ['pitch-c-end-none', 'Pitch end. Orange mark on white, and Built to sell. No button.', 0],
];

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
  url.searchParams.set('v', `frames-${Date.now()}`);
  return url.toString();
}

function emptyOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.endsWith('.png') || file === 'CAPTIONS.md') {
      fs.rmSync(path.join(OUT_DIR, file), { recursive: true, force: true });
    }
  }
  const leftover = path.join(OUT_DIR, 'promo-opening-frames');
  if (fs.existsSync(leftover)) fs.rmSync(leftover, { recursive: true, force: true });
}

function writeCaptions() {
  const body = [
    '# Bizmis promo opening storyboard',
    '',
    'Forced keyframes from `?marketing=ad-1&part=pitch`, plus the pain stills. Read the PNGs in filename order.',
    '',
    'Layout: one centered 1100px two-column stage. Copy left, clerk right. Overflow hidden so the columns do not overlap.',
    '',
    'Type size is `clamp(4.4rem, 8.4vw, 7.2rem)`. Built / to / sell. are 2em of that line.',
    '',
    '## Frames',
    '',
    ...FRAMES.map(([id, caption]) => `- \`${id}.png\`: ${caption}`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'CAPTIONS.md'), body);
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

async function waitForOpening(page) {
  await page.waitForFunction(() => {
    const api = window.__promoOpeningFrames;
    return !!(api && typeof api.showExportFrame === 'function');
  }, null, { timeout: 15000 });
}

async function revealForcedFaces(page) {
  await page.evaluate(() => {
    const fromFace = document.querySelector('[data-promo-face-from]');
    const toFace = document.querySelector('[data-promo-face-to]');
    if (fromFace && getComputedStyle(fromFace).visibility === 'visible') fromFace.style.opacity = '1';
    if (toFace && getComputedStyle(toFace).visibility === 'visible') toFace.style.opacity = '1';
  });
}

async function serveExportAssets(page) {
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
  const widgetResponse = await fetch('https://cdn.bizmis.ai/widget/avatar-widget.js');
  if (!widgetResponse.ok) throw new Error(`Widget fetch failed: ${widgetResponse.status}`);
  const widgetSource = await widgetResponse.text();
  const mouthNeedle = 'if(!e||!e.morphTargetDictionary)return;Object.keys(e.morphTargetDictionary).forEach((e=>{if("eyeBlinkLeft"===e||"eyeBlinkRight"===e)return;';
  if (!widgetSource.includes(mouthNeedle)) {
    throw new Error('Widget mouth loop was not found. Speech frames cannot pin the mouth.');
  }
  const widgetPatched = widgetSource.replace(
    mouthNeedle,
    'if(!e||!e.morphTargetDictionary)return;window.__promoMouthMesh=e;Object.keys(e.morphTargetDictionary).forEach((e=>{if("eyeBlinkLeft"===e||"eyeBlinkRight"===e)return;',
  );
  await page.route('**/avatar-widget.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: widgetPatched,
    });
  });
}

async function main() {
  emptyOutDir();

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PROMO_FRAMES_CHANNEL || 'chrome',
  });
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await serveExportAssets(page);
  await page.goto(openingUrl(), { waitUntil: 'domcontentloaded', timeout: 20000 });
  await unlockStorefront(page);
  if (!page.url().includes('marketing=ad-1')) {
    await page.goto(openingUrl(), { waitUntil: 'domcontentloaded', timeout: 20000 });
  }
  await waitForOpening(page);
  await injectLocalOpeningCss(page);
  await page.waitForFunction(
    () => document.documentElement.classList.contains('is-promo-ready'),
    null,
    { timeout: 60000 },
  );

  for (const [id, , waitMs] of FRAMES) {
    const mode = await Promise.race([
      page.evaluate(async (frameId) => {
        const result = window.__promoOpeningFrames.showExportFrame(frameId);
        if (result && typeof result.then === 'function') {
          await result;
          return 'rest';
        }
        if (frameId === '02b-toggle-gone' || frameId === '02c-agentic-scaled') {
          document.querySelectorAll('.promo-opening__choice--left, .promo-opening__switch').forEach((node) => {
            node.style.transition = 'none';
            node.style.opacity = '0';
          });
        }
        if (frameId === '10-sales-agent') {
          const word = document.querySelector('.promo-opening__word--salesperson');
          const from = document.querySelector('.promo-opening__from');
          const to = document.querySelector('.promo-opening__to');
          [word, from, to].forEach((node) => {
            if (node) node.style.transition = 'none';
          });
          if (from) {
            from.style.width = '0px';
            from.style.opacity = '0';
          }
          if (to) {
            to.style.width = 'auto';
            to.style.opacity = '1';
          }
        }
        return 'timer';
      }, id),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Frame ${id} did not settle`)), 8000);
      }),
    ]);
    await revealForcedFaces(page);
    await page.waitForTimeout(mode === 'rest' ? REST_PAD_MS : waitMs);
    if (String(id).endsWith('-speech')) {
      const mouth = await page.evaluate(() => document.documentElement.dataset.promoMouth || 'unset');
      process.stdout.write(`mouth ${id} ${mouth}\n`);
    }
    await page.screenshot({
      path: path.join(OUT_DIR, `${id}.png`),
      type: 'png',
      timeout: 15000,
    });
    process.stdout.write(`wrote ${id}.png\n`);
  }

  writeCaptions();
  await browser.close();
  process.stdout.write(`\n${FRAMES.length} frames + CAPTIONS.md -> ${OUT_DIR}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
