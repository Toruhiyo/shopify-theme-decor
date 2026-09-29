/* ============================================================
   CRIMSON INDEX — Theme JavaScript
   ============================================================ */

(function () {
  'use strict';

  const PROMO_VIDEO_PARAM = 'promo_video';
  const PROMO_MARKETING_PARAM = 'marketing';
  const PROMO_MARKETING_AD = 'ad-1';
  const promoBootParams = new URLSearchParams(location.search);
  const legacyPromoVideo = promoBootParams.get(PROMO_VIDEO_PARAM);
  const marketingValue = promoBootParams.get(PROMO_MARKETING_PARAM);
  const PROMO_END_CTA = {
    demo: { scarcity: '', label: 'See it in action', url: 'bizmis.ai/demo' },
    install: { scarcity: '', label: 'Install on Shopify', url: '' },
    ea: { scarcity: 'First 50 stores. Free to run live.', label: 'Join Early Access', url: 'bizmis.ai/early-access' },
    none: null,
  };
  let promoCtaFallbackLogged = false;
  function readPromoCta() {
    const raw = (promoBootParams.get('cta') || 'demo').trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(PROMO_END_CTA, raw)) return raw;
    if (!promoCtaFallbackLogged) {
      promoCtaFallbackLogged = true;
      const host = location.hostname;
      const dev = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.myshopify.com');
      if (dev) console.warn(`Unknown cta "${raw}". Using demo.`);
    }
    return 'demo';
  }
  const promoVideoConfig = { cta: readPromoCta() };
  const isMarketingAd = marketingValue === PROMO_MARKETING_AD || legacyPromoVideo === 'opening';
  const promoVideo = isMarketingAd ? 'opening' : legacyPromoVideo;
  if (isMarketingAd) {
    const openingPart = (promoBootParams.get('part') || 'full').trim().toLowerCase();
    document.documentElement.style.setProperty('--ad-warmth', openingPart === 'pitch' ? '1' : '0');
    document.documentElement.classList.add('is-promo-opening');
    document.documentElement.classList.remove('is-promo-cover');
  }
  const PROMO_GREYSCALE = promoVideo === 'mock' || promoVideo === 'unattended';
  document.documentElement.classList.toggle('is-promo-greyscale', PROMO_GREYSCALE);
  document.body.classList.toggle('is-promo-greyscale', PROMO_GREYSCALE);

  function propagatePromoVideoParam() {
    const source = new URLSearchParams(location.search);
    const keys = [];
    if (source.get(PROMO_MARKETING_PARAM)) keys.push(PROMO_MARKETING_PARAM);
    if (source.get(PROMO_VIDEO_PARAM)) keys.push(PROMO_VIDEO_PARAM);
    if (!keys.length) return;
    const carry = ['part', 'hold', 'cta', 'store', 'auto', 'nocover', 'lighting', 'moments', 'clip', 'device', 'motion', 'chat', 'tone'];

    const updateLink = (link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      keys.forEach((key) => url.searchParams.set(key, source.get(key)));
      carry.forEach((key) => {
        const value = source.get(key);
        if (value != null && value !== '') url.searchParams.set(key, value);
      });
      link.href = url.toString();
    };

    const updateForm = (form) => {
      const method = (form.getAttribute('method') || 'get').toLowerCase();
      if (method !== 'get') return;
      keys.forEach((key) => {
        if (form.querySelector(`[name="${key}"]`)) return;
      const input = document.createElement('input');
      input.type = 'hidden';
        input.name = key;
        input.value = source.get(key);
      form.appendChild(input);
      });
    };

    const updateNode = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches('a[href]')) updateLink(node);
      if (node.matches('form')) updateForm(node);
      node.querySelectorAll('a[href]').forEach(updateLink);
      node.querySelectorAll('form').forEach(updateForm);
    };

    document.querySelectorAll('a[href]').forEach(updateLink);
    document.querySelectorAll('form').forEach(updateForm);

    new MutationObserver((records) => {
      records.forEach(record => record.addedNodes.forEach(updateNode));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function applyCollectionPromoBlurb(title, cta) {
    const collectionBlurb = document.querySelector('.collection-header .text-muted');
    if (!collectionBlurb) return;
    if (!/clerk|just say what you need|always replies|shoppers browse|came to buy/i.test(collectionBlurb.textContent)) return;

    collectionBlurb.replaceChildren();

    const headline = document.createElement('span');
    headline.textContent = title;
    collectionBlurb.appendChild(headline);

    const line = document.createElement('button');
    line.type = 'button';
    line.className = 'hero__title-cta';
    line.setAttribute('data-open-voice-clerk', '');
    line.textContent = cta;
    collectionBlurb.appendChild(line);
  }

  function applyPlainPromoHero(eyebrow, title, cta) {
    const subtitle = document.querySelector('.hero__subtitle');
    const titleLine = document.querySelector('.hero__title-line');
    const ctaEl = document.querySelector('.hero__title-cta');

    if (subtitle) {
      subtitle.classList.remove('hero__subtitle--mark');
      subtitle.removeAttribute('aria-label');
      subtitle.textContent = eyebrow;
    }
    if (titleLine) {
      titleLine.removeAttribute('data-hero-redefine');
      titleLine.removeAttribute('aria-label');
      titleLine.textContent = title;
    }
    if (ctaEl) ctaEl.textContent = cta;

    applyCollectionPromoBlurb(title, cta);
  }

  function applyUnattendedLandingCopy() {
    const eyebrow = document.querySelector('.hero-voice__eyebrow');
    const heading = document.querySelector('.hero-voice__heading');
    if (eyebrow) eyebrow.textContent = 'NO CLERK. NO CHAT.';
    if (heading) heading.textContent = 'They figure it out alone.';
  }

  function applyPromoVideoHero() {
    if (promoVideo === 'mock') {
      applyPlainPromoHero(
        'YOUR STORE, WITH A TYPICAL CHATBOT.',
        'It always replies.',
        'It never sells.'
      );
      return;
    }

    if (promoVideo === 'unattended') {
      applyPlainPromoHero(
        'YOUR STORE, UNATTENDED.',
        'Shoppers browse.',
        'Nobody sells.'
      );
      applyUnattendedLandingCopy();
    }
  }

  const PROMO_FLIP_KNOB_MS = 200;
  const PROMO_TOGGLE_REST_MS = 1000;
  const PROMO_OPENING_REVEAL_STORE = false;
  const PROMO_OPENING_CLOCK = true;
  const PROMO_AGENTIC_MOVE_MS = 900;
  const PROMO_AGENTIC_GROW_MS = 1800;
  const PROMO_AGENTIC_SCALE = 10;
  const PROMO_AGENTIC_BURST_AT_MS = 680;
  const PROMO_AGENTIC_WHITE_AT_MS = 40;
  const PROMO_AGENTIC_FADE_AT_MS = 170;
  const PROMO_AGENTIC_FADE_MS = 380;
  const PROMO_FLIP_BURST_MS = 600;
  const PROMO_FLOOD_MS = 600;
  const PROMO_FLIP_HOLD_MS = 1350;
  const PROMO_PITCH_LOGO_HOLD_MS = 900;
  const PROMO_LOGO_DOCK_MS = 720;
  const PROMO_PITCH_LOGO_OUT_MS = 420;
  const PROMO_PITCH_WORD_STAGGER_MS = 36;
  const PROMO_PITCH_WORD_IN_MS = 180;
  const PROMO_PITCH_REDEFINE_HOLD_MS = 180;
  const PROMO_PITCH_STRIKE_MS = 420;
  const PROMO_PITCH_STRIKE_HOLD_MS = 200;
  const PROMO_PITCH_MORPH_MS = 720;
  const PROMO_PITCH_REPLACE_PAUSE_MS = 920;
  const PROMO_PITCH_WORD_OUT_MS = 400;
  const PROMO_PITCH_WORD_OUT_STAGGER_MS = [0, 140, 70];
  const PROMO_AVATAR_MAX_SCALE = 2.15;
  const PROMO_AVATAR_BOX_W = 440;
  const PROMO_AVATAR_BOX_H = 340;
  const PROMO_AVATAR_LIFT_PX = -120;
  const PROMO_CLERK_CORNER_MS = 1080;
  const PROMO_CLERK_CORNER_SCALE = 1.65;
  const PROMO_CLERK_CORNER_INSET_X = -110;
  const PROMO_CLERK_CORNER_INSET_Y = 52;
  const PROMO_AVATAR_CANVAS_WIDTH_PX = 720;
  const PROMO_PITCH_REPLACE_GAP_MS = 180;
  const PROMO_PITCH_HERO_IN_MS = 140;
  const PROMO_PITCH_HERO_HOLD_MS = 30;
  const PROMO_PITCH_HERO_OUT_MS = 110;
  const PROMO_PITCH_HERO_OVERLAP_MS = 60;
  const PROMO_PITCH_SELL_HOLD_MS = 240;
  const PROMO_SELL_OUT_MS = 380;
  const PROMO_PAIN_EASE = 'cubic-bezier(0.45, 0.05, 0.2, 1)';
  const PROMO_PAIN_POOL = 48;
  const PROMO_PAIN_CARD_W = 150;
  const PROMO_PAIN_CARD_H = 200;
  const PROMO_STORE_MARK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M3.6 10.2 6.1 4.8h11.8l2.5 5.4"/><path d="M4.4 10.2h15.2V19.6H4.4z"/><path d="M10.1 19.6V14h3.8v5.6"/></svg>';
  const PROMO_PAIN_PAD = 24;
  const PROMO_PAIN_SCROLL_MS = 860;
  const PROMO_PAIN_TYPE_CHAR_MS = 16;
  const PROMO_PAIN_EXIT_MS = 420;
  const PROMO_WINDOW_AIM_MS = 1600;
  const PROMO_WINDOW_LEAVE_MS = 400;
  const PROMO_WINDOW_HOLD_MS = 560;
  const PROMO_WINDOW_CLOSE_MS = 760;
  const PROMO_SCALE_SNAP_CLASS_MS = 50;
  const PROMO_SCALE_WHITE_MS = 200;
  const PROMO_SCALE_HOLD_MS = 1000;
  const PROMO_END_CTA_DELAY_MS = 400;
  const PROMO_END_CTA_HOLD_MS = 3000;
  const PROMO_SCALE_FADE_MS = 250;
  const PROMO_SCALE_LOOP_MS = 3000;
  const PROMO_GRID = {
    cols: 8,
    hero: 0.8,
    inset: 0.92,
    easeMs: 900,
    settleMs: 750,
    fadeMs: 250,
    statusMs: 200,
    introMs: 1500,
    zoomMs: 7400,
    stampDwell: 680,
    stampSpread: 520,
    fieldAt: 0.5,
    holdMs: 1600,
    lostAt: 280,
    gapRatio: 0.012,
    steps: [1, 2, 4, 8],
    devices: [
      { id: 'desktop', ratio: 16 / 10, frame: 800 },
      { id: 'phone', ratio: 9 / 19.5, frame: 800 },
      { id: 'tablet', ratio: 4 / 3, frame: 800 },
    ],
    variants: ['scroll-up', 'scroll-down', 'wander-near', 'wander-far', 'product-read', 'product-scroll', 'compare'],
    burstMin: 4,
    burstMax: 5,
    gapMin: 300,
    gapMax: 380,
    lostShare: 0.9,
    rushMs: 2600,
    rushEase: 1.55,
    wash: 0.72,
    fieldMs: 3700,
    shimmerMs: 600,
    riseMs: 400,
    pitchHoldMs: 800,
    resolveMs: 500,
    texture: 64,
    fieldCount: 20,
    lostField: '#F4F4F6',
    flowGap: 0.06,
    frameMargin: 0.06,
    stampWidth: 0.78,
    stampInk: 0.7,
    stampAngle: -12,
    stampPressMs: 120,
    deviceMix: { desktop: 0.6, tablet: 0.3, phone: 0.1 },
    deviceWidth: { desktop: 1, tablet: 0.55, phone: 0.22 },
    nearWidth: 0.8,
    farWidth: 0.14,
    stagger: 0,
    intervals: [1200, 500],
    aspect: 16 / 10,
    flashMs: 33,
    collapseMs: 120,
    exitMs: 300,
    liveCount: 4,
    stillSec: 1.15,
    travelLine: 0.42,
    ringMs: 200,
  };
  const PROMO_CORRIDOR = PROMO_GRID;
  const PROMO_CONVEYOR = PROMO_CORRIDOR;
  const PROMO_CONVEYOR_INTERVALS = PROMO_CORRIDOR.intervals;
  const PROMO_CONVEYOR_SIZE_START = PROMO_CORRIDOR.nearWidth;
  const PROMO_CONVEYOR_SIZE_END = PROMO_CORRIDOR.farWidth;
  const PROMO_CONVEYOR_GAP = PROMO_CORRIDOR.stagger;
  const PROMO_CONVEYOR_STREAM_MS = 15000;
  const PROMO_CONVEYOR_FLASH_MS = PROMO_CORRIDOR.flashMs;
  const PROMO_CONVEYOR_PUFF_MS = PROMO_CORRIDOR.collapseMs;
  const PROMO_CONVEYOR_BURST_MS = PROMO_CORRIDOR.exitMs;
  const PROMO_CONVEYOR_PUFF_LIFE_MS = PROMO_CORRIDOR.flashMs + PROMO_CORRIDOR.collapseMs;
  const PROMO_CONVEYOR_ASPECT = PROMO_CORRIDOR.aspect;
  const PROMO_CONVEYOR_LIVE = PROMO_CORRIDOR.liveCount;
  const PROMO_CONVEYOR_MID_MS = 4500;
  const PROMO_CONVEYOR_STILL_MS = PROMO_CORRIDOR.stillSec;
  const PROMO_WALL_SEED = 40721;
  const PROMO_GLIDE = {
    tilt: 28,
    yaw: -8,
    perspective: 1600,
    cellScale: 0.3,
    baseH: 100,
    layDownMs: 900,
    rampMs: 5000,
    speedFrom: 60,
    speedTo: 2400,
    liveRows: 2,
    liveMaxSpeed: 600,
    blurStart: 0.72,
    blurMax: 24,
    poofMs: 480,
    dustMs: 360,
    bloomMs: 680,
    burstMs: 520,
    dissolveMs: 800,
    fieldHoldMs: 1000,
    resolveMs: 1100,
    endHoldMs: 1000,
    pool: 140,
    dirX: 0.34,
    dirY: 0.94,
    stepMs: 80,
  };
  const GLIDE_CART = {
    desktop: { x: 0.9, y: 0.16 },
    tablet: { x: 0.88, y: 0.14 },
    phone: { x: 0.82, y: 0.07 },
  };
  const GLIDE_PAIN_LINE = "It replies. It doesn't sell.";
  const glideRows = new Map();
  let glideEventCache = { key: '', list: [] };

  function glidePlayEnd() {
    return PROMO_GLIDE.layDownMs
      + PROMO_GLIDE.rampMs
      + PROMO_GLIDE.dissolveMs
      + PROMO_GLIDE.fieldHoldMs
      + PROMO_GLIDE.resolveMs
      + PROMO_GLIDE.endHoldMs;
  }

  function glidePhase(timeMs) {
    const fieldAt = PROMO_GLIDE.layDownMs + PROMO_GLIDE.rampMs;
    const endAt = fieldAt + PROMO_GLIDE.dissolveMs + PROMO_GLIDE.fieldHoldMs;
    if (timeMs < PROMO_GLIDE.layDownMs) return 'laydown';
    if (timeMs < fieldAt) return 'glide';
    if (timeMs < endAt) return 'field';
    return 'end';
  }

  function glideTilt() {
    return PROMO_GLIDE.tilt * Math.PI / 180;
  }

  function glideYaw() {
    return PROMO_GLIDE.yaw * Math.PI / 180;
  }

  function glideProject(localX, localY) {
    const yaw = glideYaw();
    const tilt = glideTilt();
    const x1 = localX * Math.cos(yaw) - localY * Math.sin(yaw);
    const y1 = localX * Math.sin(yaw) + localY * Math.cos(yaw);
    const y2 = y1 * Math.cos(tilt);
    const z2 = y1 * Math.sin(tilt);
    const depth = Math.max(80, PROMO_GLIDE.perspective - z2);
    const scale = PROMO_GLIDE.perspective / depth;
    return { x: x1 * scale, y: y2 * scale, scale };
  }

  function glideUnproject(screenX, screenY) {
    const yaw = glideYaw();
    const tilt = glideTilt();
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const denom = PROMO_GLIDE.perspective * cosT + screenY * sinT;
    const y1 = denom === 0 ? 0 : (screenY * PROMO_GLIDE.perspective) / denom;
    const z2 = y1 * sinT;
    const scale = PROMO_GLIDE.perspective / Math.max(80, PROMO_GLIDE.perspective - z2);
    const x1 = screenX / scale;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    return {
      x: x1 * cosY + y1 * sinY,
      y: -x1 * sinY + y1 * cosY,
    };
  }

  function glideBlurAngle() {
    const len = Math.hypot(PROMO_GLIDE.dirX, PROMO_GLIDE.dirY) || 1;
    const step = 48;
    const moved = glideProject(
      -PROMO_GLIDE.dirX / len * step,
      -PROMO_GLIDE.dirY / len * step,
    );
    return Math.atan2(moved.y, moved.x) * 180 / Math.PI;
  }

  function glideUnit(frame) {
    const local = glideUnproject(0, frame.height * 0.46);
    const scale = Math.max(0.2, glideProject(local.x, local.y).scale);
    const desktopW = PROMO_GLIDE.baseH * (16 / 10);
    return (frame.width * PROMO_GLIDE.cellScale) / (desktopW * scale);
  }

  function glideSpeed(glideMs) {
    const u = Math.min(1, Math.max(0, glideMs / PROMO_GLIDE.rampMs));
    return PROMO_GLIDE.speedFrom + (PROMO_GLIDE.speedTo - PROMO_GLIDE.speedFrom) * u * u;
  }

  function glideDistance(glideMs) {
    const span = PROMO_GLIDE.rampMs;
    const from = PROMO_GLIDE.speedFrom;
    const to = PROMO_GLIDE.speedTo;
    const elapsed = Math.max(0, glideMs);
    if (elapsed >= span) {
      const ramp = from * span + (to - from) * span / 3;
      return (ramp + to * (elapsed - span)) / 1000;
    }
    const u = elapsed / span;
    return (from * elapsed + (to - from) * elapsed * u * u / 3) / 1000;
  }

  function glideCamera(timeMs) {
    const glideMs = Math.max(0, timeMs - PROMO_GLIDE.layDownMs);
    const dist = glideDistance(glideMs);
    const len = Math.hypot(PROMO_GLIDE.dirX, PROMO_GLIDE.dirY) || 1;
    return {
      x: dist * PROMO_GLIDE.dirX / len,
      y: dist * PROMO_GLIDE.dirY / len,
      speed: timeMs < PROMO_GLIDE.layDownMs ? 0 : glideSpeed(glideMs),
    };
  }

  function glideSpec(id) {
    const devices = PROMO_GRID.devices;
    const desktop = devices[0];
    const device = devices.find((item) => item.id === id) || desktop;
    const desktopW = PROMO_GLIDE.baseH * desktop.ratio;
    const w = desktopW * (PROMO_GRID.deviceWidth[id] || 1);
    return { id, device, w, h: w / device.ratio };
  }

  function glidePitch() {
    return PROMO_GLIDE.baseH * (1 + PROMO_GRID.flowGap);
  }

  function glideDeviceId(row, col, neighborA, neighborB) {
    if (row === 0 && col === 0) return 'desktop';
    const roll = wallSeededUnit(row * 17 + col * 13 + 400, 29);
    const mix = PROMO_GRID.deviceMix;
    let id = 'desktop';
    if (roll < mix.phone) id = 'phone';
    else if (roll < mix.phone + mix.tablet) id = 'tablet';
    if (id === 'phone' && neighborA === 'phone' && neighborB === 'phone') id = 'tablet';
    return id;
  }

  function glideEnsureRow(row, minX, maxX) {
    let line = glideRows.get(row);
    if (!line) {
      line = { cells: [], minCol: 0, maxCol: -1, left: 0, right: 0 };
      glideRows.set(row, line);
    }
    const gap = PROMO_GLIDE.baseH * PROMO_GRID.flowGap;
    let guard = 0;
    while (line.right < maxX && guard < 200) {
      const col = line.maxCol + 1;
      const prev = line.cells[line.cells.length - 1];
      const prev2 = line.cells[line.cells.length - 2];
      const id = glideDeviceId(row, col, prev?.id, prev2?.id);
      const spec = glideSpec(id);
      const cell = {
        id,
        device: spec.device,
        w: spec.w,
        h: spec.h,
        x: line.right,
        y: row * glidePitch() + (PROMO_GLIDE.baseH - spec.h),
        col,
        row,
        key: `${row}:${col}`,
      };
      line.cells.push(cell);
      line.right += spec.w + gap;
      line.maxCol = col;
      guard += 1;
    }
    guard = 0;
    while (line.left > minX && guard < 200) {
      const col = line.minCol - 1;
      const id = glideDeviceId(row, col, line.cells[0]?.id, line.cells[1]?.id);
      const spec = glideSpec(id);
      line.left -= spec.w + gap;
      line.cells.unshift({
        id,
        device: spec.device,
        w: spec.w,
        h: spec.h,
        x: line.left,
        y: row * glidePitch() + (PROMO_GLIDE.baseH - spec.h),
        col,
        row,
        key: `${row}:${col}`,
      });
      line.minCol = col;
      guard += 1;
    }
    return line;
  }

  function glideSpan(timeMs, frame) {
    const cam = glideCamera(timeMs);
    const unit = glideUnit(frame);
    const padX = frame.width * 0.12;
    const padY = frame.height * 0.12;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    [-1, -0.5, 0, 0.5, 1].forEach((sx) => [-1, -0.5, 0, 0.5, 1].forEach((sy) => {
      const local = glideUnproject(sx * (frame.width / 2 + padX), sy * (frame.height / 2 + padY));
      const x = (local.x + cam.x) / unit;
      const y = (local.y + cam.y) / unit;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }));
    const extraX = (maxX - minX) * 0.08;
    const extraY = (maxY - minY) * 0.08;
    return {
      minX: minX - extraX,
      maxX: maxX + extraX,
      minY: minY - extraY,
      maxY: maxY + extraY,
      cam,
      unit,
    };
  }

  function glideCells(timeMs, frame) {
    const span = glideSpan(timeMs, frame);
    const pitch = glidePitch();
    const row0 = Math.floor(span.minY / pitch) - 1;
    const row1 = Math.floor(span.maxY / pitch) + 1;
    const cells = [];
    for (let row = row0; row <= row1; row += 1) {
      const line = glideEnsureRow(row, span.minX - 40, span.maxX + 40);
      line.cells.forEach((cell) => {
        if (cell.x + cell.w < span.minX || cell.x > span.maxX) return;
        if (cell.y + cell.h < span.minY || cell.y > span.maxY) return;
        cells.push(cell);
      });
    }
    return { cells, span, pitch };
  }

  function glideCellScreen(cell, cam, unit, frame) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    [[0, 0], [cell.w, 0], [cell.w, cell.h], [0, cell.h]].forEach(([x, y]) => {
      const point = glideProject((cell.x + x) * unit - cam.x, (cell.y + y) * unit - cam.y);
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    return {
      x: frame.width / 2 + minX,
      y: frame.height / 2 + minY,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY),
      cx: frame.width / 2 + (minX + maxX) / 2,
      cy: frame.height / 2 + (minY + maxY) / 2,
    };
  }

  function glideLeadCell(frame) {
    const view = glideCells(0, frame);
    let best = null;
    let bestDist = Infinity;
    const targetX = frame.width / 2;
    const targetY = frame.height * 0.68;
    view.cells.forEach((cell) => {
      if (cell.id !== 'desktop') return;
      const screen = glideCellScreen(cell, view.span.cam, view.span.unit, frame);
      const dist = Math.hypot(screen.cx - targetX, screen.cy - targetY);
      if (dist < bestDist) {
        best = cell;
        bestDist = dist;
      }
    });
    return best || view.cells[0] || null;
  }

  function glideMotion(cell, mode) {
    const list = mode === 'pitch'
      ? PROMO_PITCH_MOMENTS
      : (PROMO_CLIP_MOTIONS[cell.id] || PROMO_CLIP_MOTIONS.desktop);
    const slot = gridSlot(cell.col, cell.row, mode === 'pitch' ? 7 : 3, list.length, () => false);
    return list[slot];
  }

  function glideStillSrc(tone, device, motion, chat) {
    return clipSrc(tone, device, motion, chat).replace(/promo-clip-([^/?#]+)\.mp4/, 'promo-still-$1.jpg');
  }

  function glideEventStart() {
    return Math.round(PROMO_GLIDE.layDownMs * 0.5);
  }

  function glideRate(mode, timeMs) {
    const span = PROMO_GLIDE.rampMs * 0.4;
    const u = Math.min(1, Math.max(0, (timeMs - glideEventStart()) / span));
    if (mode === 'pitch') return 3.6 + u * 5.2;
    return 4.4 + u * 5;
  }

  function glideMiddle(cell, cam, unit, frame) {
    const screen = glideCellScreen(cell, cam, unit, frame);
    return screen.cx > frame.width * 0.16
      && screen.cx < frame.width * 0.84
      && screen.cy > frame.height * 0.2
      && screen.cy < frame.height * 0.8;
  }

  function glideEvents(mode, frame) {
    const key = `${mode}:${frame.width}x${frame.height}`;
    if (glideEventCache.key === key) return glideEventCache.list;
    const list = [];
    const used = new Set();
    const end = PROMO_GLIDE.layDownMs + PROMO_GLIDE.rampMs;
    let debt = 0;
    for (let time = glideEventStart(); time < end; time += PROMO_GLIDE.stepMs) {
      debt += glideRate(mode, time) * PROMO_GLIDE.stepMs / 1000;
      while (debt >= 1) {
        const view = glideCells(time, frame);
        const leadKey = glideLeadCell(frame)?.key || '';
        const open = view.cells.filter((cell) => {
          if (used.has(cell.key)) return false;
          if (time < PROMO_GLIDE.layDownMs && cell.key === leadKey) return false;
          return glideMiddle(cell, view.span.cam, view.span.unit, frame);
        });
        if (!open.length) break;
        debt -= 1;
        const pick = open[Math.floor(wallSeededUnit(list.length + 1, mode === 'pitch' ? 11 : 5) * open.length)] || open[0];
        used.add(pick.key);
        list.push({ t: time, key: pick.key, row: pick.row, col: pick.col });
      }
    }
    glideEventCache = { key, list };
    return list;
  }

  function glideEventAt(mode, frame, key, timeMs) {
    return glideEvents(mode, frame).find((event) => event.key === key && event.t <= timeMs) || null;
  }

  function glideBlurPx(timeMs) {
    const glideMs = timeMs - PROMO_GLIDE.layDownMs;
    const start = PROMO_GLIDE.rampMs * PROMO_GLIDE.blurStart;
    if (glideMs <= start) return 0;
    const u = Math.min(1, (glideMs - start) / (PROMO_GLIDE.rampMs - start));
    return PROMO_GLIDE.blurMax * u * u;
  }

  function glideFieldOpacity(timeMs) {
    const start = PROMO_GLIDE.layDownMs + PROMO_GLIDE.rampMs;
    const fade = start + PROMO_GLIDE.dissolveMs;
    const hold = fade + PROMO_GLIDE.fieldHoldMs;
    if (timeMs <= start) return 0;
    if (timeMs >= hold) return 1;
    if (timeMs >= fade) return 1;
    return (timeMs - start) / PROMO_GLIDE.dissolveMs;
  }

  function glideCoverage(timeMs, frame) {
    const span = glideSpan(timeMs, frame);
    const pitch = glidePitch();
    return [-1, 0, 1].every((sx) => [-1, 0, 1].every((sy) => {
      const local = glideUnproject(sx * frame.width / 2, sy * frame.height / 2);
      const x = (local.x + span.cam.x) / span.unit;
      const y = (local.y + span.cam.y) / span.unit;
      const row = Math.floor(y / pitch);
      const line = glideRows.get(row) || glideEnsureRow(row, x - 30, x + 30);
      return x >= line.left && x <= line.right;
    }));
  }

  function glideNearWidth(frame) {
    const unit = glideUnit(frame);
    const local = glideUnproject(0, frame.height * 0.46);
    return glideSpec('desktop').w * unit * glideProject(local.x, local.y).scale;
  }
  const PROMO_CLIP_DEVICES = ['desktop', 'phone', 'tablet'];
  const PROMO_CLIP_MOTIONS = {
    desktop: ['scroll-up', 'scroll-down', 'wander-near', 'wander-far', 'product-read', 'product-scroll', 'compare'],
    phone: ['scroll-up', 'scroll-down', 'product-read', 'product-scroll', 'compare'],
    tablet: ['scroll-up', 'scroll-down', 'product-read', 'product-scroll', 'compare'],
  };
  const PROMO_CLIP_MOTION_ALL = ['scroll-up', 'scroll-down', 'wander-near', 'wander-far', 'product-read', 'product-scroll', 'compare'];
  const PROMO_PITCH_MOMENTS = [
    'moment-catalog-a',
    'moment-catalog-b',
    'moment-product-a',
    'moment-product-b',
    'moment-compare-a',
    'moment-compare-b',
    'moment-bundle-a',
    'moment-bundle-b',
  ];
  const PROMO_MOMENT_CLIP_POSE = {
    catalog: 'grid',
    product: 'close',
    compare: 'choice',
    bundle: 'bundle',
  };
  const PROMO_MOMENT_TAKE_HEROES = {
    b: { go: 'cone', pick: 'cylinder', other: 'dome', extra: 'slab' },
  };
  const PROMO_CURSOR_HOT_X = 33 * (5 / 24);
  const PROMO_CURSOR_HOT_Y = 33 * (3.2 / 24);
  const PROMO_PAIN_LINE_1 = 'Looking for something light I can take everywhere.';
  const PROMO_PAIN_LINE_2 = 'Which one would you pick for me?';
  const PROMO_PAIN_ANSWER_1 = [
    'You can browse our full collection.',
    'Use the filters to narrow by size and weight.',
  ];
  const PROMO_PAIN_LINKS = ['View collection', 'Size guide'];
  const PROMO_PAIN_ANSWER_2 = 'Recommendations vary by preference. Check each product page for details, or I can open a support ticket.';
  const PROMO_PAIN_CHIPS = ['Track order', 'Returns', 'Contact us'];
  const PROMO_PAIN_A = [
    ['grid', 280],
    ['enter', 220],
    ['open', 380],
    ['back', 140],
    ['scroll-1', 640],
    ['open-2', 360],
  ];
  const PROMO_PAIN_B = [
    ['launcher', 120],
    ['panel', 200],
    ['typed-1', PROMO_PAIN_LINE_1.length * PROMO_PAIN_TYPE_CHAR_MS],
    ['think-1', 340],
    ['answer-1', 1800],
    ['typed-2', PROMO_PAIN_LINE_2.length * PROMO_PAIN_TYPE_CHAR_MS],
    ['think-2', 300],
    ['answer-2', 2000],
  ];
  const PROMO_PITCH_SETTLE_MS = 700;
  const PROMO_MOMENTS_VO_MS = 280;
  const PROMO_MOMENTS_SALESPERSON_VO_MS = 1200;
  const PROMO_MOMENTS_CATALOG_MS = 3200;
  const PROMO_MOMENTS_CATALOG_LOOK_MS = 2000;
  const PROMO_MOMENTS_CHOICE_MS = 4200;
  const PROMO_MOMENTS_DOUBT_MS = 6200;
  const PROMO_MOMENTS_EXTRA_MS = 5400;
  const PROMO_MOMENTS_SALESPERSON_MS = 800;
  const PROMO_MOMENTS_HOLD_MS = 700;
  const PROMO_MOMENTS_VAPOR_MS = 480;
  const PROMO_MOMENTS_CART_GAP_MS = 420;
  const PROMO_MOMENTS_ACCESSORY_MS = 350;
  const PROMO_MOMENTS_COLLAPSE_MS = 560;
  const PROMO_MOMENT_RING_GAP_MS = 300;
  const PROMO_MOMENT_SEEK_AT_MS = 600;
  const PROMO_MOMENT_SEEK_MS = 680;
  const PROMO_MOMENT_OTHER_RING_MS = 600;
  const PROMO_MOMENTS_SHORTLIST_MS = 1680;
  const PROMO_MOMENTS_DOCK_MS = 820;
  const PROMO_MOMENTS_BUNDLE_CELEBRATE_MS = 120;
  const PROMO_MOMENTS_FLY_MS = 780;
  const PROMO_MOMENTS_ORBIT_MS = 14000;
  const PROMO_MOMENTS_BADGE_TICK_MS = 280;
  const PROMO_MOMENTS_LABEL_RATIO = 0.4;
  const PROMO_MOMENTS_PAYOFF_RATIO = 0.6;
  const PROMO_MOMENTS_CLOSE_AT = 0.3;
  const PROMO_MOMENTS_BUNDLE_AT = 0.44;
  const PROMO_MOMENTS_TAIL_MS = 600;
  const PROMO_SEE_HOLD_MS = 2400;
  const PROMO_SEE_ROW_AT_MS = 3120;
  const PROMO_CLERK_ROW_MS = 1200;
  const PROMO_SEE_LAND_HOLD_MS = 1200;
  const PROMO_SEE_CTA_HOLD_MS = 4000;
  const PROMO_SEE_CURSOR_MS = 800;
  const PROMO_SEE_GLIDE_MS = 9800;
  const PROMO_SEE_WAVE_RISE_MS = 320;
  const PROMO_SEE_WAVE_HOLD_MS = 1040;
  const PROMO_SEE_WAVE_FALL_MS = 520;
  const PROMO_SEE_STAIN_MS = 920;
  const PROMO_SEE_STAIN_COUNT = 9;
  const PROMO_SEE_STAIN_BODY_COUNT = 5;
  const PROMO_WHEEL_YAW_DEG = 42;
  const PROMO_WHEEL_MAX_YAW_DEG = 56;
  const PROMO_WHEEL_DEPTH_PX = 140;
  const PROMO_WHEEL_MAX_DEPTH_PX = 220;
  const PROMO_WHEEL_TUCK_PX = 28;
  const PROMO_WHEEL_NEIGHBOR_SCALE = 0.42;
  const PROMO_WHEEL_NEIGHBOR_PULL = 0.44;
  const PROMO_WHEEL_FAR_SCALE = 0.72;
  const PROMO_WHEEL_SELECT_AT = 0.5;
  const PROMO_WHEEL_SELECT_SPAN = 0.2;
  const PROMO_SEE_REDUCED_HOLD_MS = 1000;
  const PROMO_DEPART_MS = 1100;
  function readAdToken(name) {
    const root = document.querySelector('.promo-opening') || document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    if (value) return value;
    return getComputedStyle(document.documentElement).getPropertyValue('--bizmis-orange').trim();
  }

  const BIZMIS_ORANGE = readAdToken('--bizmis-primary');
  const PROMO_BIZMIS_MESH_COLORS = {
    UPPERBODY_Top: BIZMIS_ORANGE,
    HEAD_Hat: BIZMIS_ORANGE,
  };
  const PROMO_BIZMIS_STAMP_SCALE = 0.9;
  const PROMO_BIZMIS_STAMP_OFFSET_X = -0.022;
  const PROMO_BIZMIS_AVATAR_MODEL_URL = 'https://cdn.bizmis.ai/common/avatars/models/yusuke.glb';
  const PROMO_WIDGET_REMOUNT_MS = 280;
  const PROMO_WIDGET_FADE_MS = 480;
  const PROMO_COVER_HOLD_MS = 600;
  const PROMO_COVER_FADE_MS = 500;
  const PROMO_REDUCED_NAV_MS = 400;
  let promoStoreUnlocked = promoVideo === 'true';
  const PROMO_TYPE_QUERY = 'I want a portable laptop with long battery life for coding.';
  const PROMO_TYPE_AFTER_MS = 8000;
  const PROMO_TYPE_CHAR_MS = 55;
  const PROMO_TYPE_FIND_MS = 15000;

  function createPromoWidgetBridge() {
    let originalInit = null;
    let originalDestroy = null;
    let storeConfig = null;
    let wrapped = false;
    let solidStampUrl = null;
    let stampReady = false;
    const stampWaiters = [];

    function isOpening() {
      const params = promoSearchParams();
      return params.get(PROMO_MARKETING_PARAM) === PROMO_MARKETING_AD
        || params.get(PROMO_VIDEO_PARAM) === 'opening';
    }

    function lookForPromo(config) {
      const next = applyPromoLighting(config);
      if (!isOpening()) return next;
      const stamp = solidStampUrl
        || document.documentElement.getAttribute('data-promo-bizmis-stamp');
      return Object.assign({}, next, {
        avatarModelUrl: PROMO_BIZMIS_AVATAR_MODEL_URL,
        avatarMeshColors: Object.assign({}, next.avatarMeshColors || {}, PROMO_BIZMIS_MESH_COLORS),
        shirtStampUrl: stamp || next.shirtStampUrl,
        shirtStampScale: PROMO_BIZMIS_STAMP_SCALE,
        shirtStampOffsetX: PROMO_BIZMIS_STAMP_OFFSET_X,
        canvasWidth: PROMO_AVATAR_CANVAS_WIDTH_PX,
        themeColor: BIZMIS_ORANGE,
        secondaryColor: BIZMIS_ORANGE,
      });
    }

    function parseLightingQuery(raw) {
      if (raw == null || raw === '') return null;
      if (raw === 'default' || raw === 'studio') return raw;
      if (raw.charAt(0) === '{') {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return null;
    }

    function applyPromoLighting(config) {
      const fromQuery = parseLightingQuery(promoSearchParams().get('lighting'));
      if (fromQuery != null) {
        return Object.assign({}, config, { lighting: fromQuery });
      }
      if (config && config.lighting != null) return config;
      const mode = promoSearchParams().get(PROMO_VIDEO_PARAM);
      if (isOpening() || promoVideo === 'opening' || mode === 'opening' || mode === 'true') {
        return Object.assign({}, config, { lighting: 'studio' });
      }
      return config;
    }

    const whiteStamps = new Map();

    function hardenStamp(url, isGate) {
      if (!url) {
        if (isGate) {
        stampReady = true;
          stampWaiters.splice(0).forEach((run) => run());
        }
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = image.data;
        for (let i = 0; i < px.length; i += 4) {
          if (!px[i + 3]) continue;
          px[i] = 255;
          px[i + 1] = 255;
          px[i + 2] = 255;
          px[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        whiteStamps.set(url, dataUrl);
        if (isGate) {
          solidStampUrl = dataUrl;
        stampReady = true;
        stampWaiters.splice(0).forEach((run) => run());
        }
      };
      img.onerror = () => {
        whiteStamps.set(url, url);
        if (isGate) {
        solidStampUrl = url;
        stampReady = true;
        stampWaiters.splice(0).forEach((run) => run());
        }
      };
      img.src = url;
    }

    function whiteStampFor(url) {
      return whiteStamps.get(url) || url;
    }

    function preloadStoreStamps(stores) {
      const seen = new Set();
      (stores || []).forEach((store) => {
        if (!store || !store.stamp || seen.has(store.stamp)) return;
        seen.add(store.stamp);
        hardenStamp(store.stamp, false);
      });
    }

    function applyStoreLook(look) {
      const api = window.AvatarVoicechat;
      if (!look || !api || typeof api.setAppearance !== 'function') return;
      const scale = typeof look.stampScale === 'number'
        ? look.stampScale
        : PROMO_BIZMIS_STAMP_SCALE;
      api.setAppearance({
        avatarModelUrl: look.model || null,
        avatarMeshColors: look.meshColors || {},
        shirtStampUrl: look.stamp ? (whiteStampFor(look.stamp) || null) : null,
        shirtStampScale: scale,
        shirtStampOffsetX: typeof look.stampOffsetX === 'number' ? look.stampOffsetX : 0,
        shirtStampOffsetY: typeof look.stampOffsetY === 'number' ? look.stampOffsetY : 0,
      });
    }

    if (promoVideo === 'opening') {
      hardenStamp(document.documentElement.getAttribute('data-promo-bizmis-stamp'), true);
    } else {
      stampReady = true;
    }

    function wrap() {
      const api = window.AvatarVoicechat;
      if (!api || wrapped || typeof api.init !== 'function') return false;
      originalInit = api.init.bind(api);
      originalDestroy = typeof api.destroy === 'function' ? api.destroy.bind(api) : null;
      api.init = function (config) {
        storeConfig = config;
        const start = () => originalInit(lookForPromo(config));
        if (!isOpening() || stampReady) return start();
        stampWaiters.push(start);
      };
      wrapped = true;
      return true;
    }

    function hide() {
      document.documentElement.classList.add('is-promo-widget-hidden');
      document.documentElement.classList.remove('is-promo-widget-entering');
    }

    function show() {
      document.documentElement.classList.add('is-promo-widget-entering');
      document.documentElement.classList.remove('is-promo-widget-hidden');
      window.setTimeout(() => {
        document.documentElement.classList.remove('is-promo-widget-entering');
      }, PROMO_WIDGET_FADE_MS);
    }

    function remountForStore() {
      hide();
      if (!originalInit || !storeConfig) {
        window.setTimeout(show, PROMO_WIDGET_REMOUNT_MS);
        return;
      }
      if (originalDestroy) originalDestroy('bizmis-avatar-embed');
      window.setTimeout(() => {
        originalInit(applyPromoLighting(storeConfig));
        show();
      }, PROMO_WIDGET_REMOUNT_MS);
    }

    function arm() {
      if (wrap()) return;
      let tries = 0;
      const tick = () => {
        if (wrap() || tries > 80) return;
        tries += 1;
        window.setTimeout(tick, 80);
      };
      tick();
    }

    return { arm, hide, remountForStore, applyStoreLook, preloadStoreStamps };
  }

  let openingWaveStarted = false;
  let openingWavePlayed = false;

  function setOpeningAvatarAction(name) {
    window.dispatchEvent(new CustomEvent('avatar-animation', {
      detail: {
        name,
        lifecycle: { times: 1, when: null, duration_in_ms: null },
        toolCallId: `promo-${name}-${Date.now()}`,
      },
    }));
  }

  function waveOpeningAvatar() {
    if (openingWavePlayed) return true;
    const embed = document.getElementById('bizmis-avatar-embed');
    if (!embed) return false;
    const target = embed.querySelector('.bizmis-desktop-lite-chat [role="button"]')
      || embed.querySelector('.bizmis-desktop-lite-chat')
      || embed.querySelector('canvas');
    if (!target) return false;
    openingWavePlayed = true;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }

  function armOpeningWave() {
    if (openingWaveStarted) return;
    openingWaveStarted = true;
    let tries = 0;
    const run = () => {
      if (waveOpeningAvatar()) return;
      tries += 1;
      if (tries < 50) window.setTimeout(run, 100);
    };
    run();
  }

  window.addEventListener('avatar-animation', (event) => {
    const detail = event.detail;
    if (!detail || detail.name !== 'waving') return;
    event.stopImmediatePropagation();
  }, true);

  function momentsEnabled() {
    return promoSearchParams().get('moments') !== '0';
  }

  function waitMs(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  let openingAgentEnded = false;

  function muteOpeningAgent() {
    const api = window.AvatarVoicechat;
    if (api && typeof api.muteAgent === 'function') {
      api.muteAgent();
      return;
    }
    window.dispatchEvent(new CustomEvent('bizmis:agent-audio-mute'));
  }

  function endOpeningAgent() {
    if (openingAgentEnded) return;
    openingAgentEnded = true;
    const api = window.AvatarVoicechat;
    if (api && typeof api.endSession === 'function') {
      api.endSession();
      return;
    }
    muteOpeningAgent();
    window.dispatchEvent(new CustomEvent('bizmis:agent-session-end'));
  }

  function sayClerkLine(line) {
    const embed = document.getElementById('bizmis-avatar-embed');
    const input = embed?.querySelector('input[type="text"]:not([disabled])');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (!input || !setter) return false;
    setter.call(input, `Say this: "${line}"`);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const form = input.form || input.closest('form');
    if (!form || typeof form.requestSubmit !== 'function') return false;
    form.requestSubmit();
    return true;
  }

  function playClerkLine(line, speakMs, onStart) {
    sayClerkLine(line);
    onStart();
    return waitMs(speakMs);
  }

  const PROMO_MOMENT_POSES = ['grid', 'row', 'choice', 'doubt', 'close', 'extra', 'bundle', 'fly', 'gone'];
  const PROMO_MOMENT_GRID_COLS = 4;
  const PROMO_MOMENT_CARD_COUNT = 12;
  const PROMO_CATALOG_SEED = 40721;
  const PROMO_CATALOG_COLS = 4;
  const PROMO_CATALOG_GUTTER = 20;
  const PROMO_CATALOG_ROW_GAP = 18;
  const PROMO_CATALOG_VISIBLE_ROWS = 2.2;
  const PROMO_CATALOG_PAD_X = 36;
  const PROMO_CATALOG_PAD_Y = 28;
  const PROMO_ROW_CLERK_LANE = 220;
  const PROMO_COMPARE_RESERVE = 124;
  const PROMO_ROW_GAP = 20;
  // Only product images used in pain and pitch. Files live in assets/ as promo-product-<key>.png.
  const PROMO_CATALOG = {
    capsule: { tint: 'stone' },
    sphere: { tint: 'stone' },
    'rounded-cube': { tint: 'warm-grey' },
    cone: { tint: 'sand' },
    torus: { tint: 'stone' },
    'tall-box': { tint: 'blush' },
    cylinder: { tint: 'sage' },
    dome: { tint: 'warm-grey' },
    slab: { tint: 'sand' },
  };
  const PROMO_CLAY_KINDS = Object.keys(PROMO_CATALOG);
  const PROMO_CLAY_TURNS = ['m20', '0', 'p20'];
  const PROMO_CLAY_FINISHES = ['matte', 'satin'];
  const PROMO_CLAY_SCALES = [0.8, 0.86, 0.92, 0.98, 1.04, 1.1];
  const PROMO_MOMENT_SPEC_KINDS = ['spec-bolt', 'spec-gauge', 'spec-shield'];
  const PROMO_MOMENT_GO_INDEX = 0;
  const PROMO_MOMENT_PICK_INDEX = 5;
  const PROMO_MOMENT_OTHER_INDEX = 3;
  const PROMO_COMPARE_TINT = 'stone';
  const PROMO_COMPARE_SHAPES = { go: 'capsule', pick: 'sphere', other: 'rounded-cube' };
  const PROMO_ACCESSORY_SHAPE = 'torus';
  const PROMO_ACCESSORY_TINT = 'stone';
  const PROMO_ACCESSORY_OBJECT_SCALE = 1.51;
  const PROMO_TINT_FILE = {
    sphere: { stone: 'sphere-b' },
    capsule: { stone: 'capsule' },
    'rounded-cube': { stone: 'rounded-cube' },
    torus: { stone: 'torus-b' },
  };
  const PROMO_MOMENT_GRID_PITCH_X = 168;
  const PROMO_MOMENT_GRID_PITCH_Y = 208;
  const PROMO_MOMENT_TITLE_WIDTHS = [68, 54, 76, 48, 62, 72, 58, 80, 50, 66, 74, 60];
  const PROMO_MOMENT_PRICE_WIDTHS = [36, 28, 42, 24, 32, 38, 26, 44, 30, 34, 40, 28];
  const PROMO_MOMENT_NEW_INDEXES = [0];
  const PROMO_MOMENT_ICONS = {
    'spec-bolt': '<path d="M13.2 2.2 5.4 13.2h5.2l-1.1 8.6 8.6-12.2h-5.4z"/>',
    'spec-gauge': '<path fill-rule="evenodd" d="M3.2 17.6a8.8 8.8 0 0 1 17.6 0h-3.4a5.4 5.4 0 0 0-10.8 0z"/><path d="M11.1 16.8 16.2 7.6 13.4 16.2z"/>',
    'spec-shield': '<path d="M12 2.4 20.2 5.6v6.2c0 4.4-3 7.6-8.2 9.8-5.2-2.2-8.2-5.4-8.2-9.8V5.6z"/>',
  };

  const PROMO_GRID_LIFE_MS = 4000;
  const PROMO_GRID_LIFT_MS = 600;
  const PROMO_PAIN_LIFE_HOLD = ['open', 'back', 'scroll-1', 'open-2', 'back-2', 'scroll-2', 'scroll-3', 'scroll-4', 'leave'];
  let gridLifeTimer = 0;

  function paintShelf(card, index) {
    card.style.setProperty('--shelf', 'var(--ad-surface)');
    card.style.setProperty('--shelf-deep', 'var(--ad-line)');
    card.style.setProperty('--enter', String(index));
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clayVariantKey(look) {
    const kind = typeof look === 'string' ? look : look.kind;
    const turn = typeof look === 'string' ? '0' : look.turn;
    if (turn === 'm20') return `${kind}-b`;
    if (turn === 'p20') return `${kind}-c`;
    return kind;
  }

  function claySrc(look) {
    const key = look.file || clayVariantKey(look);
    return promoClayUrls()[key] || '';
  }

  function clayTintOf(kind) {
    return PROMO_CATALOG[kind]?.tint || 'stone';
  }

  function tintsClash(left, right) {
    if (!left || !right) return false;
    if (left === right) return true;
    return (left === 'blush' && right === 'sage') || (left === 'sage' && right === 'blush');
  }

  function catalogNeighbors(index, cols, count) {
    const neighbors = [];
    if (index % cols) neighbors.push(index - 1);
    if (index % cols < cols - 1 && index + 1 < count) neighbors.push(index + 1);
    if (index >= cols) neighbors.push(index - cols);
    if (index + cols < count) neighbors.push(index + cols);
    return neighbors;
  }

  function makeCatalogLook(kind, rand) {
    return {
      kind,
      turn: PROMO_CLAY_TURNS[Math.floor(rand() * PROMO_CLAY_TURNS.length)],
      finish: PROMO_CLAY_FINISHES[Math.floor(rand() * PROMO_CLAY_FINISHES.length)],
      scale: PROMO_CLAY_SCALES[Math.floor(rand() * PROMO_CLAY_SCALES.length)],
      tint: clayTintOf(kind),
    };
  }

  function catalogLooks(count, cols) {
    const rand = mulberry32(PROMO_CATALOG_SEED);
    const heroes = [PROMO_MOMENT_GO_INDEX, PROMO_MOMENT_OTHER_INDEX, PROMO_MOMENT_PICK_INDEX];
    const kinds = [];
    const looks = [];
    for (let index = 0; index < count; index += 1) {
      const column = index % cols;
      const blockedKinds = new Set();
      const blockedTints = new Set();
      const note = (other) => {
        if (other == null || other < 0) return;
        blockedKinds.add(kinds[other]);
        blockedTints.add(clayTintOf(kinds[other]));
        if (clayTintOf(kinds[other]) === 'blush') blockedTints.add('sage');
        if (clayTintOf(kinds[other]) === 'sage') blockedTints.add('blush');
      };
      if (column > 0) note(index - 1);
      if (index >= cols) note(index - cols);
      if (heroes.includes(index)) {
        heroes.forEach((hero) => {
          if (hero < index) blockedKinds.add(kinds[hero]);
        });
      }
      const tinted = PROMO_CLAY_KINDS.filter((kind) => !blockedKinds.has(kind) && !blockedTints.has(clayTintOf(kind)));
      const pool = tinted.length ? tinted : PROMO_CLAY_KINDS.filter((kind) => !blockedKinds.has(kind));
      const kind = pool[Math.floor(rand() * pool.length)];
      kinds.push(kind);
      looks.push(makeCatalogLook(kind, rand));
    }
    looks[PROMO_MOMENT_GO_INDEX] = lookForTint(PROMO_COMPARE_SHAPES.go, PROMO_COMPARE_TINT);
    looks[PROMO_MOMENT_PICK_INDEX] = lookForTint(PROMO_COMPARE_SHAPES.pick, PROMO_COMPARE_TINT);
    looks[PROMO_MOMENT_OTHER_INDEX] = lookForTint(PROMO_COMPARE_SHAPES.other, PROMO_COMPARE_TINT);
    kinds[PROMO_MOMENT_GO_INDEX] = looks[PROMO_MOMENT_GO_INDEX].kind;
    kinds[PROMO_MOMENT_PICK_INDEX] = looks[PROMO_MOMENT_PICK_INDEX].kind;
    kinds[PROMO_MOMENT_OTHER_INDEX] = looks[PROMO_MOMENT_OTHER_INDEX].kind;
    const locked = new Set(heroes);
    for (let pass = 0; pass < 8; pass += 1) {
      for (let index = 0; index < count; index += 1) {
        if (locked.has(index)) continue;
        const neighbors = catalogNeighbors(index, cols, count);
        const clash = neighbors.some((other) => looks[other].kind === looks[index].kind || tintsClash(looks[other].tint, looks[index].tint));
        if (!clash) continue;
        const options = PROMO_CLAY_KINDS.filter((kind) => neighbors.every((other) => looks[other].kind !== kind && !tintsClash(looks[other].tint, clayTintOf(kind))));
        if (!options.length) continue;
        const kind = options[index % options.length];
        looks[index] = makeCatalogLook(kind, () => 0);
        kinds[index] = kind;
      }
    }
    return looks;
  }

  function lookForTint(shape, tint) {
    return {
      kind: shape,
      turn: '0',
      finish: 'matte',
      scale: 1,
      tint,
      file: PROMO_TINT_FILE[shape][tint],
    };
  }

  function accessoryLook() {
    return lookForTint(PROMO_ACCESSORY_SHAPE, PROMO_ACCESSORY_TINT);
  }

  function applyClayLook(card, look) {
    PROMO_CLAY_KINDS.forEach((kind) => card.classList.remove(`is-${kind}`));
    card.classList.add(`is-${look.kind}`);
    card.dataset.clayKind = look.kind;
    card.dataset.clayTurn = look.turn;
    card.dataset.clayFinish = look.finish;
    card.style.setProperty('--clay-scale', String(look.scale));
    card.style.removeProperty('--tint');
    const img = card.querySelector('.promo-moments__glyph img');
    const src = claySrc(look);
    if (img && img.getAttribute('src') !== src) img.src = src;
  }

  function paintCatalogClay(board) {
    if (!board || board.dataset.clayReady === '1') return;
    const cards = [...board.querySelectorAll('.promo-moments__card:not(.is-extra)')];
    const looks = catalogLooks(cards.length, PROMO_CATALOG_COLS);
    cards.forEach((card, index) => applyClayLook(card, looks[index]));
    const extra = board.querySelector('.promo-moments__card.is-extra');
    const pick = looks[PROMO_MOMENT_PICK_INDEX];
    const accessory = accessoryLook();
    if (extra && pick) applyClayLook(extra, accessory);
    board.style.setProperty('--promo-accessory-object', String(PROMO_ACCESSORY_OBJECT_SCALE));
    board.dataset.clayReady = '1';
  }

  function momentTakeLook(kind) {
    return {
      kind,
      turn: '0',
      finish: 'matte',
      scale: 1,
      tint: clayTintOf(kind),
      file: kind,
    };
  }

  function applyMomentTake(board, take) {
    const heroes = PROMO_MOMENT_TAKE_HEROES[take];
    if (!board || !heroes) return;
    const assign = (selector, kind) => {
      const card = board.querySelector(selector);
      if (card) applyClayLook(card, momentTakeLook(kind));
    };
    assign('.promo-moments__card.is-go', heroes.go);
    assign('.promo-moments__card.is-pick', heroes.pick);
    assign('.promo-moments__card.is-other', heroes.other);
    assign('.promo-moments__card.is-extra', heroes.extra);
    const drops = [...board.querySelectorAll('.promo-moments__card.is-drop .promo-moments__glyph img')];
    const srcs = drops.map((img) => img.getAttribute('src') || '');
    drops.forEach((img, index) => {
      const next = srcs[(index + 3) % srcs.length];
      if (next) img.src = next;
    });
  }

  function promoClayUrls() {
    if (promoClayUrls.cache) return promoClayUrls.cache;
    try {
      promoClayUrls.cache = JSON.parse(document.documentElement.getAttribute('data-promo-clay') || '{}');
    } catch (error) {
      promoClayUrls.cache = {};
    }
    return promoClayUrls.cache;
  }

  function armGridEntrance(board) {
    if (!board || board.dataset.entered || prefersReducedMotion()) return;
    board.dataset.entered = '1';
  }

  function stopGridLife() {
    window.clearInterval(gridLifeTimer);
    gridLifeTimer = 0;
    document.querySelectorAll('.promo-moments__card.is-idle-lift').forEach((card) => {
      card.classList.remove('is-idle-lift');
    });
  }

  function startGridLife(board) {
    if (!board || gridLifeTimer || prefersReducedMotion()) return;
    gridLifeTimer = window.setInterval(() => {
      if (board.dataset.life === 'hold' || !board.classList.contains('is-pose-grid')) return;
      const stage = board.parentElement;
      if (!stage) return;
      const stageBox = stage.getBoundingClientRect();
      const visible = [...board.querySelectorAll('.promo-moments__card:not(.is-extra):not(.is-pain-hover):not(.is-pain-open):not(.is-idle-lift)')].filter((card) => {
        const box = card.getBoundingClientRect();
        return box.top >= stageBox.top - 8
          && box.bottom <= stageBox.bottom + 8
          && box.right > stageBox.left + 8
          && box.left < stageBox.right - 8;
      });
      if (!visible.length) return;
      const card = visible[Math.floor(Math.random() * visible.length)];
      card.classList.add('is-idle-lift');
      window.setTimeout(() => card.classList.remove('is-idle-lift'), PROMO_GRID_LIFT_MS);
    }, PROMO_GRID_LIFE_MS);
  }

  function momentShapeRole(index) {
    if (index === PROMO_MOMENT_PICK_INDEX) return 'pick';
    if (index === PROMO_MOMENT_OTHER_INDEX) return 'other';
    if (index === PROMO_MOMENT_GO_INDEX) return 'go';
    return 'drop';
  }

  function momentGlyph() {
    const glyph = document.createElement('span');
    glyph.className = 'promo-moments__glyph';
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    glyph.appendChild(img);
    return glyph;
  }

  function momentBadge(index) {
    if (!PROMO_MOMENT_NEW_INDEXES.includes(index)) return null;
    const pill = document.createElement('span');
    pill.className = 'promo-moments__new';
    pill.textContent = 'NEW';
    return pill;
  }

  function momentPhoto(index) {
    const photo = document.createElement('span');
    photo.className = 'promo-moments__photo';
    photo.appendChild(momentGlyph());
    const badge = momentBadge(index);
    if (badge) photo.appendChild(badge);
    return photo;
  }

  function momentMeta(index) {
    const meta = document.createElement('span');
    meta.className = 'promo-moments__meta';
    const title = document.createElement('i');
    title.className = 'promo-moments__title';
    title.style.setProperty('--bar', `${PROMO_MOMENT_TITLE_WIDTHS[index] || 64}%`);
    const price = document.createElement('span');
    price.className = 'promo-moments__price';
    const dollar = document.createElement('b');
    dollar.textContent = '$';
    const bar = document.createElement('i');
    bar.style.setProperty('--bar', `${PROMO_MOMENT_PRICE_WIDTHS[index] || 32}%`);
    price.append(dollar, bar);
    meta.append(title, price);
    return meta;
  }

  function momentAdd(copy) {
    const add = document.createElement('span');
    add.className = 'promo-moments__add';
    const label = document.createElement('span');
    label.className = 'promo-moments__add-label';
    label.textContent = copy?.label || 'Add';
    const done = document.createElement('span');
    done.className = 'promo-moments__add-done';
    done.append(momentMark('yes'), document.createTextNode(copy?.done || 'Added'));
    add.append(label, done);
    return add;
  }

  function momentKept() {
    const kept = document.createElement('span');
    kept.className = 'promo-moments__kept';
    kept.appendChild(momentMark('yes'));
    return kept;
  }

  function momentMark(kind) {
    const mark = document.createElement('span');
    mark.className = `promo-moments__mark is-${kind}`;
    const path = kind === 'no'
      ? 'M2.2 2.2 9.8 9.8M9.8 2.2 2.2 9.8'
      : 'M1.8 6.1 4.6 9.1 10.2 2.8';
    mark.innerHTML = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return mark;
  }

  function momentCompare() {
    const panel = document.createElement('div');
    panel.className = 'promo-moments__compare';
    PROMO_MOMENT_SPEC_KINDS.forEach((kind, row) => {
      const line = document.createElement('div');
      line.className = 'promo-moments__compare-row';
      const icon = document.createElement('span');
      icon.className = 'promo-moments__spec-icon';
      icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${PROMO_MOMENT_ICONS[kind]}</svg>`;
      const go = document.createElement('span');
      go.className = 'promo-moments__compare-cell';
      go.appendChild(momentMark(row === 2 ? 'no' : 'yes'));
      const winner = document.createElement('span');
      winner.className = 'promo-moments__compare-cell';
      winner.appendChild(momentMark('yes'));
      const other = document.createElement('span');
      other.className = 'promo-moments__compare-cell';
      other.appendChild(momentMark(row === 1 ? 'no' : 'yes'));
      line.append(icon, go, winner, other);
      panel.appendChild(line);
    });
    return panel;
  }

  function ensureMomentBoard(stage) {
    if (!stage) return null;
    const existing = stage.querySelector('.promo-moments__board');
    if (existing) return existing;
    const board = document.createElement('div');
    board.className = 'promo-moments__board is-pose-grid';
    board.dataset.pose = 'grid';
    if (prefersReducedMotion()) board.classList.add('is-reduced');
    for (let index = 0; index < PROMO_MOMENT_CARD_COUNT; index += 1) {
      const column = index % PROMO_MOMENT_GRID_COLS;
      const row = Math.floor(index / PROMO_MOMENT_GRID_COLS);
      const role = momentShapeRole(index);
      const card = document.createElement('div');
      card.className = `promo-moments__card is-${role}`;
      paintShelf(card, index);
      card.style.setProperty('--gx', `${((column - 1.5) * PROMO_MOMENT_GRID_PITCH_X).toFixed(0)}px`);
      card.style.setProperty('--gy', `${((row - 1) * PROMO_MOMENT_GRID_PITCH_Y).toFixed(0)}px`);
      card.append(momentPhoto(index), momentMeta(index), momentAdd());
      if (role === 'pick') card.appendChild(momentKept());
      board.appendChild(card);
    }
    for (let index = PROMO_MOMENT_CARD_COUNT; index < PROMO_PAIN_POOL; index += 1) {
      const extra = document.createElement('div');
      extra.className = 'promo-moments__card is-drop is-catalog';
      paintShelf(extra, index);
      extra.style.setProperty('--gx', '0px');
      extra.style.setProperty('--gy', '0px');
      extra.append(momentPhoto(index), momentMeta(index), momentAdd());
      board.appendChild(extra);
    }
    const accessory = document.createElement('div');
    accessory.className = 'promo-moments__card is-extra';
    accessory.append(
      momentPhoto(PROMO_MOMENT_CARD_COUNT),
      momentMeta(PROMO_MOMENT_CARD_COUNT),
      momentAdd({ label: 'Add to cart', done: 'Added' }),
    );
    board.appendChild(accessory);
    board.appendChild(momentCompare());
    const orbits = [
      ['1', '14rem', '-0.4s'],
      ['2', '16.5rem', '-4.1s'],
      ['3', '13rem', '-7.6s'],
      ['4', '15.5rem', '-10.8s'],
    ];
    orbits.forEach(([slot, radius, delay]) => {
      const orbit = document.createElement('span');
      orbit.className = `promo-moments__orbit is-bubble-${slot}`;
      orbit.style.setProperty('--orbit', radius);
      orbit.style.setProperty('--orbit-delay', delay);
      const bubble = document.createElement('span');
      bubble.className = 'promo-moments__bubble';
      const ask = document.createElement('span');
      ask.className = 'promo-moments__ask';
      ask.textContent = '?';
      const yes = document.createElement('span');
      yes.className = 'promo-moments__yes';
      yes.appendChild(momentMark('yes'));
      bubble.append(ask, yes);
      orbit.appendChild(bubble);
      for (let bit = 0; bit < 4; bit += 1) {
        const particle = document.createElement('span');
        particle.className = 'promo-moments__vapor-bit';
        const angle = (bit / 4) * Math.PI * 2 + Number(slot) * 0.8;
        const dist = 1.15 + (bit % 2) * 0.45;
        particle.style.setProperty('--dx', `${Math.cos(angle) * dist}rem`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * dist}rem`);
        particle.style.setProperty('--bit-delay', `${bit * 40}ms`);
        orbit.appendChild(particle);
      }
      board.appendChild(orbit);
    });
    const added = document.createElement('span');
    added.className = 'promo-moments__added';
    added.append(momentMark('yes'), document.createTextNode('Added'));
    const plus = document.createElement('span');
    plus.className = 'promo-moments__plus';
    plus.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v13M3.5 10h13"/></svg>';
    const outline = document.createElement('div');
    outline.className = 'promo-moments__outline';
    const celebrate = document.createElement('div');
    celebrate.className = 'promo-moments__celebrate';
    celebrate.setAttribute('aria-hidden', 'true');
    const bloom = document.createElement('span');
    bloom.className = 'promo-moments__bloom';
    const halo = document.createElement('span');
    halo.className = 'promo-moments__halo';
    const burstCheck = document.createElement('span');
    burstCheck.className = 'promo-moments__burst-check';
    burstCheck.appendChild(momentMark('yes'));
    celebrate.append(bloom, halo, burstCheck);
    [[1, -0.15], [0.62, -0.82], [-0.2, -1], [-0.86, -0.42], [0.9, 0.42], [-0.48, 0.78], [0.12, 0.96], [-0.95, 0.22]].forEach(([sx, sy]) => {
      const spark = document.createElement('span');
      spark.className = 'promo-moments__spark';
      spark.style.setProperty('--sx', String(sx));
      spark.style.setProperty('--sy', String(sy));
      celebrate.appendChild(spark);
    });
    board.append(added, plus, outline, celebrate);
    board.querySelector('.promo-moments__cart')?.remove();
    board.querySelector('.promo-moments__fly')?.remove();
    board.classList.add('is-instant');
    stage.replaceChildren(board);
    return board;
  }

  function layoutStoreGrid(board) {
    const stage = board?.parentElement;
    if (!stage || stage.clientWidth < 240 || stage.clientHeight < 160) return false;
    const shiftRaw = getComputedStyle(board).getPropertyValue('--promo-board-x').trim();
    const shift = shiftRaw.endsWith('rem') ? parseFloat(shiftRaw) * 16 : (parseFloat(shiftRaw) || 0);
    const contentWidth = stage.clientWidth;
    const cols = PROMO_CATALOG_COLS;
    const gutter = PROMO_CATALOG_GUTTER;
    const rowGapY = PROMO_CATALOG_ROW_GAP;
    const cardW = (contentWidth - PROMO_CATALOG_PAD_X * 2 - (cols - 1) * gutter) / cols;
    const cardFooter = 52;
    const cardH = cardW + cardFooter;
    const pitchX = cardW + gutter;
    const pitchY = cardH + rowGapY;
    const inset = PROMO_CATALOG_PAD_X;
    const gx0 = inset + cardW / 2 - (contentWidth / 2 + shift);
    const pitchBoard = !board.closest('.promo-opening')?.classList.contains('is-pain');
    const padY = pitchBoard ? 4 : PROMO_CATALOG_PAD_Y;
    const gy0 = -stage.clientHeight / 2 + padY + cardH / 2;
    const rowGap = PROMO_ROW_GAP;
    const rowInset = 28;
    const laneRaw = parseFloat(getComputedStyle(stage).getPropertyValue('--clip-clerk-lane'));
    const clerkLane = Number.isFinite(laneRaw) && laneRaw > 40 ? laneRaw : PROMO_ROW_CLERK_LANE;
    const rowBudget = contentWidth - clerkLane - rowInset;
    const rowCardW = (rowBudget - rowGap * 2) / 3;
    const rowCardH = Math.max(200, stage.clientHeight - 64 - PROMO_COMPARE_RESERVE);
    const rowSeat = rowCardW + rowGap;
    const groupHalf = rowSeat + rowCardW / 2;
    const minShift = rowInset - contentWidth / 2 + groupHalf;
    const rowNudge = Math.max(0, minShift - shift);
    board.style.setProperty('--catalog-w', `${cardW.toFixed(1)}px`);
    board.style.setProperty('--catalog-h', `${cardH.toFixed(1)}px`);
    board.style.setProperty('--row-card-w', `${rowCardW.toFixed(1)}px`);
    board.style.setProperty('--row-card-h', `${rowCardH.toFixed(1)}px`);
    board.style.setProperty('--row-seat', `${rowSeat.toFixed(1)}px`);
    board.style.setProperty('--row-nudge', `${rowNudge.toFixed(1)}px`);
    board.style.setProperty('--row-compare-y', `${(rowCardH / 2 + 40).toFixed(1)}px`);
    board.style.setProperty('--row-lift', `${(PROMO_COMPARE_RESERVE / 2).toFixed(1)}px`);
    stage.closest('.promo-opening__store')?.style.setProperty('--catalog-inset', `${Math.max(inset, 0).toFixed(1)}px`);
    board.querySelectorAll('.promo-moments__card:not(.is-extra)').forEach((card, index) => {
      const column = index % cols;
      const row = Math.floor(index / cols);
      card.style.setProperty('--gx', `${(gx0 + column * pitchX).toFixed(1)}px`);
      card.style.setProperty('--gy', `${(gy0 + row * pitchY).toFixed(1)}px`);
    });
    board.dataset.painCols = String(cols);
    board.dataset.painPitch = String(pitchY);
    stampMomentRoles(board);
    paintCatalogClay(board);
    return true;
  }

  function stampMomentRoles(board) {
    board.querySelectorAll('.promo-moments__card:not(.is-extra)').forEach((card, index) => {
      card.classList.remove('is-go', 'is-pick', 'is-other', 'is-drop');
      card.classList.add(`is-${momentShapeRole(index)}`);
      if (momentShapeRole(index) === 'pick' && !card.querySelector('.promo-moments__kept')) {
        card.appendChild(momentKept());
      }
    });
  }

  function momentCatalogSeek(board) {
    const card = board?.querySelector('.promo-moments__card.is-other');
    const store = board?.closest('.promo-opening__store');
    if (!card || !store) return 0;
    const pitch = Number.parseFloat(board.dataset.painPitch) || 0;
    const gy = Number.parseFloat(card.style.getPropertyValue('--gy')) || 0;
    const cardH = card.getBoundingClientRect().height || pitch || 200;
    const limit = store.clientHeight / 2 - 28;
    const needed = Math.min(0, limit - cardH * 0.45 - gy);
    if (!pitch) return needed;
    return Math.max(needed, -pitch * 0.72);
  }

  function applyMomentPose(stage, pose, options = {}) {
    const board = ensureMomentBoard(stage);
    if (!board || !pose) return;
    const host = stage.closest('[data-promo-moments]');
    const label = host?.querySelector('[data-promo-moments-label]');
    const samePose = board.dataset.pose === pose;
    if (options.instant) board.classList.add('is-instant');
    if (options.instant) board.classList.add('is-settled');
    else if (!samePose) board.classList.remove('is-settled');
    board.classList.remove('is-shortlist', 'is-catalog-seek');
    if (pose !== 'row') board.classList.remove('is-narrowed');
    if (board.dataset.pose !== pose) {
      PROMO_MOMENT_POSES.forEach((name) => {
        board.classList.toggle(`is-pose-${name}`, name === pose);
      });
      board.dataset.pose = pose;
    }
    host?.classList.remove('is-title');
    host?.classList.toggle('is-vignette-gone', pose === 'fly' || pose === 'gone');
    if (host) {
      host.classList.toggle('is-instant', board.classList.contains('is-instant'));
      host.classList.toggle('is-settled', board.classList.contains('is-settled'));
      host.classList.toggle('is-reduced', board.classList.contains('is-reduced'));
      PROMO_MOMENT_POSES.forEach((name) => {
        host.classList.toggle(`is-pose-${name}`, name === pose);
      });
    }
    if (label) label.textContent = '';
    const snapGrid = !board.dataset.gridLaid && (pose === 'grid' || pose === 'row' || pose === 'choice');
    if (snapGrid) board.classList.add('is-instant');
    if (pose === 'grid' || pose === 'row' || pose === 'choice') {
      const laid = layoutStoreGrid(board);
      if (snapGrid && laid) {
        board.dataset.gridLaid = '1';
        void board.offsetWidth;
        if (!options.instant) {
          board.classList.remove('is-instant');
          host?.classList.remove('is-instant');
        }
      }
    }
    if (pose === 'grid') {
      armGridEntrance(board);
      startGridLife(board);
    } else {
      stopGridLife();
    }
    if (options.instant) {
      void board.offsetWidth;
      board.classList.remove('is-instant');
      host?.classList.remove('is-instant');
    }
  }

  function momentHostOf(stage) {
    return stage?.closest('[data-promo-moments]') || stage;
  }

  function momentMotions(stage) {
    const host = momentHostOf(stage);
    if (!host || typeof document.getAnimations !== 'function') return [];
    return document.getAnimations().filter((anim) => {
      const target = anim.effect && anim.effect.target;
      return target && target.nodeType === 1 && host.contains(target);
    });
  }

  function motionSpan(anim) {
    const timing = anim.effect && anim.effect.getTiming ? anim.effect.getTiming() : {};
    const duration = Number(timing.duration) || 0;
    const delay = Number(timing.delay) || 0;
    return { delay, duration, total: delay + duration, iterations: timing.iterations };
  }

  function clearMomentInline(stage) {
    const host = momentHostOf(stage);
    if (!host) return;
    [host, ...host.querySelectorAll('[style]')].forEach((node) => {
      [...node.style].forEach((prop) => {
        if (prop.startsWith('--')) return;
        node.style.removeProperty(prop);
      });
    });
  }

  function restartMomentPose(stage, pose) {
    const board = ensureMomentBoard(stage);
    if (!board) return null;
    const host = momentHostOf(stage);
    momentMotions(stage).forEach((anim) => {
      try {
        anim.cancel();
      } catch (error) {
        return;
      }
    });
    clearMomentInline(stage);
    board.style.removeProperty('--moment-scroll');
    board.classList.remove('is-catalog-seek', 'is-shortlist');
    board.dataset.pose = '';
    const firstGrid = pose === 'grid' && !board.dataset.gridLaid;
    board.classList.remove('is-settled', 'is-reduced');
    host?.classList.remove('is-settled', 'is-reduced', 'is-vignette-gone');
    if (firstGrid) {
      board.classList.add('is-instant');
      host?.classList.add('is-instant');
    } else {
      board.classList.remove('is-instant');
      host?.classList.remove('is-instant');
    }
    PROMO_MOMENT_POSES.forEach((name) => {
      board.classList.remove(`is-pose-${name}`);
      host?.classList.remove(`is-pose-${name}`);
    });
    void board.offsetWidth;
    applyMomentPose(stage, pose);
    void board.offsetWidth;
    return board;
  }

  function whenMomentsRest(stage) {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const pending = momentMotions(stage).filter((anim) => {
            const span = motionSpan(anim);
            if (span.iterations === Infinity) return false;
            return anim.playState === 'running' || anim.playState === 'pending';
          });
          if (!pending.length) {
            resolve();
            return;
          }
          Promise.all(pending.map((anim) => anim.finished.catch(() => {}))).then(() => resolve());
        });
      });
    });
  }

  function scrubMoment(stage, pose, timeOf) {
    restartMomentPose(stage, pose);
    const host = momentHostOf(stage);
    if (host) void host.offsetWidth;
    return new Promise((resolve) => {
      const freeze = (attempt) => {
        const motions = document.getAnimations().filter((anim) => {
          const node = anim.effect && anim.effect.target;
          return node && host && (node === host || host.contains(node));
        });
        const named = motions.some((anim) => anim.animationName);
        if (!named && attempt < 6) {
          window.requestAnimationFrame(() => freeze(attempt + 1));
          return;
        }
        motions.forEach((anim) => {
          const span = motionSpan(anim);
          const time = timeOf(anim, span);
          if (!Number.isFinite(time)) return;
          const cap = span.total > 0 ? span.total : time;
          try {
            anim.currentTime = Math.max(0, Math.min(cap, time));
            if (typeof anim.commitStyles === 'function') anim.commitStyles();
          } catch (error) {
            return;
          }
          anim.cancel();
        });
        resolve();
      };
      window.requestAnimationFrame(() => freeze(0));
    });
  }

  function placeExportFly(stage, progress) {
    const host = momentHostOf(stage);
    const fly = host?.querySelector('.promo-moments__fly');
    const store = host?.querySelector('.promo-opening__store');
    const travel = Math.min(1, Math.max(0, (progress - 0.28) / 0.72));
    const scale = progress < 0.28
      ? 0.2 + 0.8 * (progress / 0.28)
      : 1 + (0.12 - 1) * travel;
    const opacity = progress < 0.28 ? 1 : 1 - travel;
    if (store) store.style.opacity = progress < 0.4 ? String(1 - progress / 0.4) : '0';
    if (!fly) return;
    fly.style.opacity = String(opacity);
    fly.style.transform = `translate3d(calc(-50% + ${22 * travel}rem), calc(-50% + ${1.2 * travel}rem), 0) scale(${scale})`;
  }

  function playMomentPose(stage, pose) {
    restartMomentPose(stage, pose);
    return whenMomentsRest(stage);
  }

  let speechMouthHold = null;
  let speechMouthArmed = false;

  function mouthMeshFrom(object, depth) {
    if (!object || depth > 40) return null;
    const dict = object.morphTargetDictionary;
    if (dict && (dict.A != null || dict.jawOpen != null)) return object;
    const children = object.children || [];
    for (let index = 0; index < children.length; index += 1) {
      const found = mouthMeshFrom(children[index], depth + 1);
      if (found) return found;
    }
    return null;
  }

  function sceneFromFiber(start) {
    const stack = start ? [start] : [];
    const seen = new Set();
    while (stack.length) {
      const node = stack.pop();
      if (!node || seen.has(node)) continue;
      seen.add(node);
      const props = node.memoizedProps || {};
      const mesh = mouthMeshFrom(node.stateNode, 0) || mouthMeshFrom(props.object, 0);
      if (mesh) return mesh;
      let hook = node.memoizedState;
      while (hook) {
        const value = hook.memoizedState;
        const store = value && typeof value.getState === 'function'
          ? value
          : value && value.current && typeof value.current.getState === 'function'
            ? value.current
            : null;
        if (store) {
          try {
            const state = store.getState();
            const found = mouthMeshFrom(state && state.scene, 0);
            if (found) return found;
          } catch (error) {
            hook = hook.next;
            continue;
          }
        }
        const direct = mouthMeshFrom(value && value.scene, 0);
        if (direct) return direct;
        hook = hook.next;
      }
      if (node.child) stack.push(node.child);
      if (node.sibling) stack.push(node.sibling);
    }
    return null;
  }

  function findMouthMesh() {
    if (window.__promoMouthMesh && window.__promoMouthMesh.morphTargetDictionary) {
      return window.__promoMouthMesh;
    }
    const roots = document.querySelectorAll('[data-promo-widget], canvas');
    for (const root of roots) {
      const key = Object.keys(root).find((name) => name.startsWith('__reactFiber'));
      let fiber = key ? root[key] : null;
      for (let step = 0; fiber && step < 16; step += 1) {
        const mesh = sceneFromFiber(fiber);
        if (mesh) return mesh;
        fiber = fiber.return;
      }
    }
    return null;
  }

  function releaseSpeechMouth() {
    if (speechMouthHold) {
      speechMouthHold.mesh.morphTargetInfluences = speechMouthHold.original;
      speechMouthHold = null;
    }
    if (!speechMouthArmed) return;
    speechMouthArmed = false;
    setOpeningAvatarAction('idle_neutral');
  }

  function pinMouth(mesh) {
    const dict = mesh.morphTargetDictionary || {};
    const openNames = ['A', 'smile'];
    const openIndexes = openNames.map((name) => dict[name]).filter((index) => index != null);
    const original = mesh.morphTargetInfluences;
    if (!original || !openIndexes.length) return false;
    const proxy = new Proxy(original, {
      set(target, prop, value) {
        const index = Number(prop);
        if (openIndexes.includes(index)) {
          openIndexes.forEach((openIndex) => {
            target[openIndex] = 1;
          });
          return true;
        }
        target[prop] = value;
        return true;
      },
    });
    openIndexes.forEach((index) => {
      original[index] = 1;
    });
    mesh.morphTargetInfluences = proxy;
    speechMouthHold = { mesh, original, proxy };
    return true;
  }

  function holdSpeechMouth() {
    releaseSpeechMouth();
    speechMouthArmed = true;
    document.documentElement.dataset.promoMouth = 'seeking';
    setOpeningAvatarAction('exaggerated_talking');
    return new Promise((resolve) => {
      const watch = (left) => {
        if (!speechMouthArmed) {
          resolve();
          return;
        }
        const mesh = findMouthMesh();
        const pinned = mesh && (speechMouthHold?.mesh === mesh && mesh.morphTargetInfluences === speechMouthHold.proxy || pinMouth(mesh));
        document.documentElement.dataset.promoMouth = pinned ? 'open' : 'missing';
        if (left <= 0) {
          resolve();
          return;
        }
        window.requestAnimationFrame(() => watch(pinned ? 0 : left - 1));
      };
      watch(30);
    });
  }

  function holdMomentAt(anim, time) {
    const span = motionSpan(anim);
    const cap = span.total > 0 ? span.total : time;
    anim.currentTime = Math.max(0, Math.min(cap, time));
    anim.pause();
  }

  function poseOnTimeline(stage, pose, place) {
    restartMomentPose(stage, pose);
    const host = momentHostOf(stage);
    if (host) void host.offsetWidth;
    return new Promise((resolve) => {
      const freeze = (attempt) => {
        const motions = momentMotions(stage);
        if (!motions.some((anim) => anim.animationName) && attempt < 8) {
          window.requestAnimationFrame(() => freeze(attempt + 1));
          return;
        }
        motions.forEach((anim) => {
          const span = motionSpan(anim);
          const placed = place(anim, span);
          if (!placed || !Number.isFinite(placed.time)) return;
          try {
            holdMomentAt(anim, placed.time);
          } catch (error) {
            return;
          }
        });
        resolve();
      };
      window.requestAnimationFrame(() => freeze(0));
    });
  }

  function playChoiceUntilTicks(stage) {
    restartMomentPose(stage, 'choice');
    return new Promise((resolve) => {
      const watch = (attempt) => {
        const motions = momentMotions(stage);
        const ticks = motions.filter((anim) => (anim.animationName || '') === 'promo-moments-tick');
        const ticksDone = ticks.length >= 9 && ticks.every((anim) => anim.playState === 'finished');
        if (!ticksDone) {
          window.requestAnimationFrame(() => watch(attempt + 1));
          return;
        }
        motions.forEach((anim) => {
          const name = anim.animationName || '';
          if (name === 'promo-moments-pair-lift' || name === 'promo-moments-ring' || name === 'promo-moments-compare-fold' || name === 'promo-moments-add-reveal') {
            holdMomentAt(anim, 0);
          }
        });
        resolve();
      };
      window.requestAnimationFrame(() => watch(0));
    });
  }

  const PROMO_MOMENT_BEATS = [
    {
      line: '[fast pace] [bursting with energy, huge smile, thrilled] I narrow it down to the best few.',
      voMs: PROMO_MOMENTS_VO_MS,
      speakMs: PROMO_MOMENTS_CATALOG_MS,
      lookMs: PROMO_MOMENTS_CATALOG_LOOK_MS,
      holdPose: 'grid',
      playPose: 'row',
      endPose: 'row',
    },
    {
      line: '[fast pace] [fired up, confident, beaming] I recommend the one that fits them best.',
      voMs: PROMO_MOMENTS_VO_MS,
      speakMs: PROMO_MOMENTS_CHOICE_MS,
      holdPose: 'row',
      playPose: 'choice',
      endPose: 'choice',
    },
    {
      line: '[fast pace] [bright, delighted, on a roll] I clear them like an expert. [fast pace] [punchy, grinning, triumphant] And close the deal.',
      voMs: PROMO_MOMENTS_VO_MS,
      speakMs: PROMO_MOMENTS_DOUBT_MS,
      holdPose: 'choice',
      playPose: 'doubt',
      endPose: 'close',
      closeAt: PROMO_MOMENTS_CLOSE_AT,
    },
    {
      line: '[fast pace] [cheerful, quick, excited, cannot wait] I suggest what goes best with it.',
      voMs: PROMO_MOMENTS_VO_MS,
      speakMs: PROMO_MOMENTS_EXTRA_MS,
      holdPose: 'close',
      playPose: 'extra',
      endPose: 'bundle',
      bundleAt: PROMO_MOMENTS_BUNDLE_AT,
    },
  ];

  const promoWidget = createPromoWidgetBridge();
  promoWidget.arm();

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function floodEase(t) {
    const x1 = 0.16;
    const y1 = 1;
    const x2 = 0.3;
    const y2 = 1;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleX = (u) => ((ax * u + bx) * u + cx) * u;
    const sampleY = (u) => ((ay * u + by) * u + cy) * u;
    const sampleDX = (u) => (3 * ax * u + 2 * bx) * u + cx;
    let u = t;
    for (let step = 0; step < 6; step += 1) {
      const slope = sampleDX(u);
      if (Math.abs(slope) < 1e-6) break;
      u = Math.min(1, Math.max(0, u - (sampleX(u) - t) / slope));
    }
    return sampleY(u);
  }

  function tweenAdWarmth() {
    const root = document.documentElement;
    const from = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ad-warmth'));
    const startValue = Number.isFinite(from) ? from : 0;
    if (startValue >= 1) {
      root.style.setProperty('--ad-warmth', '1');
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / PROMO_FLOOD_MS);
      const value = startValue + (1 - startValue) * floodEase(t);
      root.style.setProperty('--ad-warmth', t >= 1 ? '1' : value.toFixed(4));
      if (t < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }

  function promoSearchParams() {
    return new URLSearchParams(window.location.search);
  }

  function marketingPart() {
    if (!isMarketingAd) return 'pitch';
    const part = (promoSearchParams().get('part') || 'full').trim().toLowerCase();
    if (part === 'pain' || part === 'pitch' || part === 'full') return part;
    return 'full';
  }

  function promoHoldMs() {
    const raw = Number(promoSearchParams().get('hold'));
    if (!Number.isFinite(raw) || raw < 0) return 0;
    return raw;
  }

  function wallSeededUnit(index, salt) {
    let seed = (PROMO_WALL_SEED + index * 7919 + salt * 104729) >>> 0;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function readPromoClip() {
    const raw = (promoBootParams.get('clip') || '').trim().toLowerCase();
    if (!raw) return null;
    const deviceRaw = (promoBootParams.get('device') || (PROMO_CLIP_DEVICES.includes(raw) ? raw : 'desktop')).trim().toLowerCase();
    const device = PROMO_CLIP_DEVICES.includes(deviceRaw) ? deviceRaw : 'desktop';
    const motions = PROMO_CLIP_MOTIONS[device];
    const motionRaw = (promoBootParams.get('motion') || motions[0]).trim().toLowerCase();
    const toneRaw = (promoBootParams.get('tone') || 'pain').trim().toLowerCase();
    const moment = PROMO_PITCH_MOMENTS.includes(motionRaw);
    return {
      device,
      motion: moment || motions.includes(motionRaw) ? motionRaw : motions[0],
      chat: promoBootParams.get('chat') === '1',
      tone: moment || toneRaw === 'pitch' ? 'pitch' : 'pain',
    };
  }

  function promoClipUrls() {
    const raw = document.documentElement.getAttribute('data-promo-clips');
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function clipFileKey(tone, device, motion, chat) {
    return `${tone}-${device}-${motion}-${chat ? '1' : '0'}`;
  }

  function clipSrc(tone, device, motion, chat) {
    const key = clipFileKey(tone, device, motion, chat);
    const mapped = promoClipUrls()[key];
    if (mapped) return mapped;
    const sample = Object.values(promoClayUrls())[0] || '';
    if (!sample) return '';
    return sample.replace(/[^/?#]+\.png(\?[^#]*)?/, `promo-clip-${key}.mp4`);
  }

  function gridMix(col, row, salt) {
    let n = (Math.imul(col + 1, 374761393) + Math.imul(row + 1, 668265263) + Math.imul(salt + 1, 1442695041) + PROMO_WALL_SEED) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function gridSlot(col, row, salt, count, blocked) {
    let slot = Math.floor(gridMix(col, row, salt) * count);
    let guard = 0;
    while (guard < count && blocked(slot)) {
      slot = (slot + 1) % count;
      guard += 1;
    }
    return slot;
  }

  function momentClipParts(motion) {
    const bits = String(motion || '').split('-');
    if (bits[0] !== 'moment') return null;
    const scene = bits[1];
    const take = bits[2] || 'a';
    if (!PROMO_MOMENT_CLIP_POSE[scene]) return null;
    return { scene, take, pose: PROMO_MOMENT_CLIP_POSE[scene] };
  }

  function gridCssColor(root, name, fallback) {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    return value || fallback;
  }

  const PROMO_MOCKUP_RADIUS_PX = 32;

  function gridMockupRadius(device, width) {
    return width * (PROMO_MOCKUP_RADIUS_PX / device.frame);
  }

  function loadPromoStores() {
    const node = document.getElementById('promo-opening-stores');
    if (!node) return [];
    try {
      const parsed = JSON.parse(node.textContent || '[]');
      return Array.isArray(parsed) ? parsed.filter((store) => store && store.slug) : [];
    } catch {
      return [];
    }
  }

  function landingStoreIndex(stores) {
    if (!stores.length) return 0;
    const raw = (promoSearchParams().get('store') || 'meridian').trim().toLowerCase();
    const match = stores.findIndex((store) => store.slug === raw);
    if (match >= 0) return match;
    const meridian = stores.findIndex((store) => store.slug === 'meridian');
    return meridian >= 0 ? meridian : 0;
  }

  function loopLandingOrder(stores) {
    const count = stores.length;
    if (count < 2) return { stores, landIndex: 0 };
    const selected = landingStoreIndex(stores);
    const landIndex = count - 2;
    const shift = (selected - landIndex + count) % count;
    return {
      stores: stores.map((_, index) => stores[(index + shift) % count]),
      landIndex,
    };
  }

  function loopDistance(index, active, count) {
    if (count < 2) return index - active;
    let distance = index - active;
    distance = ((distance % count) + count) % count;
    if (distance > count / 2) distance -= count;
    return distance;
  }

  function mixAccent(from, to, amount) {
    const parse = (hex) => {
      const raw = String(hex || '').replace('#', '');
      if (!/^[0-9a-fA-F]{6}$/.test(raw)) return [249, 163, 83];
      return [
        parseInt(raw.slice(0, 2), 16),
        parseInt(raw.slice(2, 4), 16),
        parseInt(raw.slice(4, 6), 16),
      ];
    };
    const start = parse(from);
    const end = parse(to);
    const blend = Math.min(1, Math.max(0, amount));
    const channel = (index) => Math.round(start[index] + (end[index] - start[index]) * blend);
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }

  function storeInk(accent) {
    const hex = String(accent || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      return accent || getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim();
    }
    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    const luma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    if (luma < 0.72) return `#${hex}`;
    const mix = 0.42;
    const channel = (value) => Math.round(value * (1 - mix)).toString(16).padStart(2, '0');
    return `#${channel(red)}${channel(green)}${channel(blue)}`;
  }

  function waveSample(elapsed) {
    const rise = PROMO_SEE_WAVE_RISE_MS;
    const hold = PROMO_SEE_WAVE_HOLD_MS;
    const fall = PROMO_SEE_WAVE_FALL_MS;
    if (elapsed <= rise) {
      const u = elapsed / rise;
      return { amount: Math.sin(u * Math.PI / 2), travel: u * 0.5 };
    }
    if (elapsed <= rise + hold) return { amount: 1, travel: 0.5 };
    const u = Math.min(1, (elapsed - rise - hold) / fall);
    const leave = u * u;
    return { amount: 1 - leave, travel: 0.5 + leave * 0.5 };
  }

  function glideEase(linear) {
    const t = Math.min(1, Math.max(0, linear));
    return t * t * (3 - 2 * t);
  }

  function smoothstep(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  function easeCap(value, max, span) {
    const start = max - span;
    if (value <= start) return value;
    const end = max + span;
    if (value >= end) return max;
    const blend = smoothstep((value - start) / (end - start));
    return value * (1 - blend) + max * blend;
  }

  function wheelYaw(abs) {
    return easeCap(abs * PROMO_WHEEL_YAW_DEG, PROMO_WHEEL_MAX_YAW_DEG, 6);
  }

  function wheelDepth(abs) {
    return easeCap(abs * PROMO_WHEEL_DEPTH_PX, PROMO_WHEEL_MAX_DEPTH_PX, 140);
  }

  function wheelScale(abs) {
    const drop = 1 - PROMO_WHEEL_NEIGHBOR_SCALE;
    if (abs <= 1) return 1 - drop * smoothstep(abs);
    const far = smoothstep(Math.min(1, abs - 1));
    return PROMO_WHEEL_NEIGHBOR_SCALE * (1 - (1 - PROMO_WHEEL_FAR_SCALE) * far);
  }

  function wheelFade(abs) {
    const start = 1;
    const end = 1.4;
    if (abs <= start) return 1;
    if (abs >= end) return 0;
    return 1 - smoothstep((abs - start) / (end - start));
  }

  function wheelFocus(abs) {
    const start = PROMO_WHEEL_SELECT_AT - PROMO_WHEEL_SELECT_SPAN / 2;
    const end = PROMO_WHEEL_SELECT_AT + PROMO_WHEEL_SELECT_SPAN / 2;
    if (abs <= start) return 1;
    if (abs >= end) return 0;
    return 1 - smoothstep((abs - start) / (end - start));
  }

  function storeImageUrls(store) {
    if (!store) return [];
    return [store.hero, store.logo, store.stamp].filter(Boolean);
  }

  function storeModelUrls(stores) {
    const urls = new Set([PROMO_BIZMIS_AVATAR_MODEL_URL]);
    (stores || []).forEach((store) => {
      if (store && store.model) urls.add(store.model);
    });
    return [...urls];
  }

  function preloadAvatarModels(urls) {
    const started = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        const api = window.AvatarVoicechat;
        if (api && typeof api.preloadAvatars === 'function') {
          api.preloadAvatars(urls).then(() => resolve()).catch(() => resolve());
          return;
        }
        if (Date.now() - started > 20000) {
          Promise.all(urls.map((url) => fetch(url, { mode: 'cors', cache: 'force-cache' })
            .then((response) => response.arrayBuffer())
            .catch(() => {}))).then(() => resolve());
          return;
        }
        window.setTimeout(tick, 80);
      };
      tick();
    });
  }

  function preloadPromoImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      const done = () => resolve();
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(done).catch(done);
          return;
        }
        done();
      };
      img.onerror = done;
      img.src = url;
    });
  }

  function preloadPromoOpening(stores) {
    const images = new Set();
    (stores || []).forEach((store) => {
      storeImageUrls(store).forEach((url) => images.add(url));
    });
    return Promise.all([
      ...[...images].map((url) => preloadPromoImage(url)),
      preloadAvatarModels(storeModelUrls(stores)),
    ]);
  }

  function renderStoreCarousel(row, stores) {
    if (row) row.replaceChildren();
    const viewport = document.createElement('div');
    viewport.className = 'promo-opening__carousel';
    const track = document.createElement('div');
    track.className = 'promo-opening__carousel-track';
    track.style.setProperty(
      '--promo-wheel-overlap',
      `calc(${PROMO_WHEEL_NEIGHBOR_PULL} * min(36rem, 62cqw) + ${PROMO_WHEEL_TUCK_PX}px)`,
    );
    (stores || []).forEach((store) => {
      const accent = store.accent || getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim();
      const slide = document.createElement('article');
      slide.className = 'promo-opening__slide';
      slide.dataset.store = store.slug;
      slide.style.setProperty('--promo-store-accent', accent);
      const meta = document.createElement('header');
      meta.className = 'promo-opening__slide-meta';
      const ink = storeInk(accent);
      const sector = document.createElement('p');
      sector.className = 'promo-opening__slide-sector';
      sector.style.color = ink;
      sector.textContent = store.sector || '';
      const name = document.createElement('p');
      name.className = 'promo-opening__slide-name';
      name.textContent = store.name || '';
      meta.append(sector, name);
      const card = document.createElement('div');
      card.className = 'promo-opening__slide-card';
      const glow = document.createElement('span');
      glow.className = 'promo-opening__slide-glow';
      const hero = document.createElement('img');
      hero.className = 'promo-opening__slide-hero';
      hero.alt = '';
      hero.src = store.hero || '';
      card.append(glow, hero);
      slide.append(meta, card);
      track.appendChild(slide);
    });
    if (row) {
      viewport.appendChild(track);
      row.appendChild(viewport);
    }
    mountNakedCta(row);
    mountWaveField(row);
    return track;
  }

  function mountWaveField(row) {
    if (!row || row.querySelector('.promo-opening__wave-field')) return;
    const field = document.createElement('div');
    field.className = 'promo-opening__wave-field';
    field.setAttribute('aria-hidden', 'true');
    const ambient = document.createElement('div');
    ambient.className = 'promo-opening__wave-ambient';
    field.append(ambient);
    for (let index = 0; index < 26; index += 1) {
      const mote = document.createElement('i');
      mote.className = 'promo-opening__wave-mote';
      const angle = (index / 26) * Math.PI * 2 + (index % 3) * 0.15;
      const reach = 0.72 + (index % 5) * 0.1;
      mote.style.setProperty('--mx', (0.5 + Math.cos(angle) * reach).toFixed(3));
      mote.style.setProperty('--my', (0.58 + Math.sin(angle) * reach * 0.72).toFixed(3));
      mote.style.setProperty('--mote', `${7 + (index % 4) * 3}px`);
      field.append(mote);
    }
    row.prepend(field);
  }

  function seeCtaCopy() {
    return PROMO_END_CTA[promoVideoConfig.cta] || null;
  }

  function mountNakedCta(row) {
    const copy = seeCtaCopy();
    if (!row || !copy || promoVideoConfig.cta === 'demo') return;
    if (row.querySelector('.promo-opening__naked-cta')) return;
    const cta = document.createElement('div');
    cta.className = 'promo-opening__naked-cta';
    if (copy.scarcity) {
      const note = document.createElement('p');
      note.className = 'promo-opening__see-note';
      note.textContent = copy.scarcity;
      cta.append(note);
    }
    const button = document.createElement('span');
    button.className = 'promo-opening__see-button';
    button.textContent = copy.label;
    const cursor = document.createElement('span');
    cursor.className = 'promo-opening__see-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.2 19.2 12.1 11.6 13.4 8.8 20.6z"/></svg>';
    cta.append(button, cursor);
    if (copy.url) {
      const url = document.createElement('p');
      url.className = 'promo-opening__see-url';
      url.textContent = copy.url;
      cta.append(url);
    }
    row.append(cta);
  }

  function hasPromoCover() {
    return document.body.classList.contains('template-index')
      && promoVideo !== 'opening'
      && promoSearchParams().get('nocover') !== '1';
  }

  function whenImageReady(img) {
    if (!img) return Promise.resolve();
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }

  class PromoOpening {
    constructor(root, onStoreReady) {
      this.root = root;
      this.onStoreReady = onStoreReady;
      this.toggle = root.querySelector('[data-promo-opening-toggle]');
      this.knob = root.querySelector('.promo-opening__knob');
      this.line = root.querySelector('[data-promo-pitch-line]');
      this.storesRow = root.querySelector('[data-promo-stores]');
      const loop = loopLandingOrder(loadPromoStores());
      this.stores = loop.stores;
      this.carouselTrack = renderStoreCarousel(this.storesRow, this.stores);
      this.landIndex = loop.landIndex;
      this.assetsReady = false;
      this.flipWhenReady = false;
      this.flipping = false;
      this.parkedEmbed = null;
      this.parkedParent = null;
      this.parkedNext = null;
      this.parkedStyle = null;
      this.parkTimer = 0;
      this.glideFrame = 0;
      this.planeFrame = 0;
      this.glideStats = null;
      this.clerkGlow = this.ensureClerkGlow();
      window.__promoGlideProbe = () => this.glideProbe();
      this.boundDock = () => this.fitOpeningLayout();
      this.toggle?.addEventListener('click', () => this.flip());
      promoWidget.preloadStoreStamps(this.stores);
      preloadPromoOpening(this.stores).then(() => this.finishBoot());
      this.armAutoFlip();
    }

    finishBoot() {
      if (this.assetsReady) return;
      this.assetsReady = true;
      document.documentElement.classList.add('is-promo-ready');
      if (this.flipWhenReady) {
        this.flip();
        return;
      }
      if (readPromoClip()) {
        this.showClip();
        return;
      }
      if (marketingPart() !== 'pitch') this.playPain();
    }

    armAutoFlip() {
      if (marketingPart() !== 'pitch') return;
      const raw = promoSearchParams().get('auto');
      if (raw == null || raw === '') return;
      const autoMs = Number(raw);
      if (!Number.isFinite(autoMs) || autoMs < 0) return;
      this.autoTimer = window.setTimeout(() => this.flip(), autoMs);
    }

    canvasFrame() {
      const frame = this.root.querySelector('[data-promo-canvas]');
      if (!frame) return { left: 0, top: 0 };
      return frame.getBoundingClientRect();
    }

    pinKnobOrigin() {
      if (!this.knob) return;
      const rect = this.knob.getBoundingClientRect();
      const frame = this.canvasFrame();
      this.root.style.setProperty('--promo-knob-x', `${rect.left + rect.width / 2 - frame.left}px`);
      this.root.style.setProperty('--promo-knob-y', `${rect.top + rect.height / 2 - frame.top}px`);
    }

    fitOpeningType() {
      if (this.line) this.line.style.fontSize = '';
    }

    fitClerk() {
      if (this.clerkCornerActive) return;
      const embed = this.parkedEmbed || document.getElementById('bizmis-avatar-embed');
      if (!embed || !embed.classList.contains('is-promo-widget-parked')) return;
      embed.style.setProperty('--promo-avatar-scale', String(PROMO_AVATAR_MAX_SCALE));
      embed.style.setProperty('--promo-avatar-lift', `${PROMO_AVATAR_LIFT_PX}px`);
    }

    fitOpeningLayout() {
      this.fitOpeningType();
      this.fitClerk();
      this.dockLogo();
      const board = this.root.querySelector('.promo-moments__board.is-pose-grid');
      if (board && this.root.classList.contains('is-moments')) layoutStoreGrid(board);
    }

    dockLogo() {
      const logo = this.root.querySelector('.promo-opening__logo');
      const target = this.root.querySelector('[data-promo-logo-target]');
      if (!logo || !target) return;

      const to = target.getBoundingClientRect();
      if (to.width < 4 || to.height < 4) return;
      const frame = this.canvasFrame();

      this.root.style.setProperty('--promo-logo-left', `${to.left + to.width / 2 - frame.left}px`);
      this.root.style.setProperty('--promo-logo-top', `${to.top + to.height / 2 - frame.top}px`);
      this.root.style.setProperty('--promo-logo-w', `${to.width}px`);
      this.root.style.setProperty('--promo-logo-h', `${to.height}px`);
      this.root.classList.add('is-logo-docked');
    }

    parkWidget() {
      if (this.parkedEmbed) return;
      const slot = this.root.querySelector('[data-promo-widget]');
      const embed = document.getElementById('bizmis-avatar-embed');
      if (!slot || !embed) return;

      this.parkedEmbed = embed;
      this.parkedParent = embed.parentNode;
      this.parkedNext = embed.nextSibling;
      this.parkedStyle = embed.getAttribute('style');
      embed.removeAttribute('style');
      embed.classList.add('is-promo-widget-parked');
      slot.appendChild(embed);
      this.fitClerk();
    }

    restoreWidget() {
      window.clearTimeout(this.parkTimer);
      const embed = this.parkedEmbed;
      if (embed && this.parkedParent) {
        this.parkedParent.insertBefore(embed, this.parkedNext);
        if (this.parkedStyle != null) embed.setAttribute('style', this.parkedStyle);
        else embed.removeAttribute('style');
        embed.classList.remove('is-promo-widget-parked');
      }
      this.parkedEmbed = null;
      this.parkedParent = null;
      this.parkedNext = null;
      this.parkedStyle = null;
    }

    armPark() {
      let tries = 0;
      const run = () => {
        this.parkWidget();
        tries += 1;
        if (!this.parkedEmbed && tries < 40) this.parkTimer = window.setTimeout(run, 80);
      };
      run();
    }

    startOpeningClock() {
      if (!PROMO_OPENING_CLOCK) return;
      if (this.root.querySelector('[data-promo-clock]')) return;
      const node = document.createElement('div');
      node.className = 'promo-opening__clock';
      node.setAttribute('data-promo-clock', '');
      node.setAttribute('aria-hidden', 'true');
      const frame = this.root.querySelector('[data-promo-canvas]') || this.root;
      frame.appendChild(node);
      const started = performance.now();
      const paint = () => {
        if (!node.isConnected || node.hidden) return;
        const elapsed = performance.now() - started;
        const seconds = Math.floor(elapsed / 1000);
        const millis = Math.floor(elapsed % 1000);
        node.textContent = `${seconds}.${String(millis).padStart(3, '0')}`;
        window.requestAnimationFrame(paint);
      };
      window.requestAnimationFrame(paint);
    }

    flip() {
      if (this.flipping) return;
      if (!this.assetsReady) {
        this.flipWhenReady = true;
        return;
      }
      this.flipping = true;
      window.clearTimeout(this.autoTimer);
      if (this.toggle) {
        this.toggle.setAttribute('aria-pressed', 'true');
        this.toggle.disabled = true;
      }

      if (prefersReducedMotion()) {
        this.showReducedSee();
        return;
      }

      this.pinKnobOrigin();
      this.root.classList.add('is-on');
      this.startOpeningClock();
      window.setTimeout(() => {
        this.root.style.setProperty('--promo-center', `${PROMO_AGENTIC_MOVE_MS}ms`);
        this.root.classList.add('is-cleared');
        this.centerAgenticSales();
        window.setTimeout(() => {
          this.scaleAgenticSales();
          window.setTimeout(() => this.burst(), PROMO_AGENTIC_BURST_AT_MS);
        }, PROMO_AGENTIC_MOVE_MS);
      }, PROMO_FLIP_KNOB_MS);
    }

    centerAgenticSales() {
      const label = this.root.querySelector('.promo-opening__choice--right');
      const stage = this.root.querySelector('.promo-opening__center');
      if (!label || !stage) return;
      label.style.transform = 'none';
      const labelRect = label.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const dx = (stageRect.left + stageRect.width / 2) - (labelRect.left + labelRect.width / 2);
      const dy = (stageRect.top + stageRect.height / 2) - (labelRect.top + labelRect.height / 2);
      this.agenticShift = { dx, dy };
      label.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
    }

    scaleAgenticSales(scale = PROMO_AGENTIC_SCALE) {
      const label = this.root.querySelector('.promo-opening__choice--right');
      if (!label) return;
      if (!this.agenticShift) this.centerAgenticSales();
      const { dx, dy } = this.agenticShift;
      if (label.style.transition !== 'none') {
        label.style.transition = `transform ${PROMO_AGENTIC_GROW_MS}ms linear, opacity ${PROMO_AGENTIC_FADE_MS}ms linear`;
      }
      label.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    }

    pinLabelOrigin() {
      const label = this.root.querySelector('.promo-opening__choice--right');
      if (!label) {
      this.pinKnobOrigin();
        return;
      }
      const rect = label.getBoundingClientRect();
      const frame = this.canvasFrame();
      this.root.style.setProperty('--promo-knob-x', `${rect.left + rect.width / 2 - frame.left}px`);
      this.root.style.setProperty('--promo-knob-y', `${rect.top + rect.height / 2 - frame.top}px`);
    }

    burst() {
      this.pinLabelOrigin();
      this.root.classList.add('is-bursting');
      tweenAdWarmth();
      window.setTimeout(() => {
        this.root.classList.add('is-agentic-white');
      }, PROMO_AGENTIC_WHITE_AT_MS);
      window.setTimeout(() => this.fadeAgenticSales(), PROMO_AGENTIC_FADE_AT_MS);
      window.setTimeout(() => this.hold(), PROMO_FLIP_BURST_MS);
    }

    fadeAgenticSales() {
      const label = this.root.querySelector('.promo-opening__choice--right');
      if (!label) return;
      label.style.opacity = '0';
    }

    hold() {
      this.root.classList.add('is-holding');
      window.setTimeout(() => this.pitch(), PROMO_FLIP_HOLD_MS);
    }

    async pitch() {
      document.documentElement.style.setProperty('--ad-warmth', '1');
      this.releasePainStage();
      document.documentElement.classList.add('is-promo-pitch');
      this.root.classList.add('is-pitch');
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => this.fitOpeningLayout());
      });
      window.addEventListener('resize', this.boundDock);
      this.armPark();
      window.setTimeout(() => {
        document.documentElement.classList.add('is-promo-clerk');
        armOpeningWave();
      }, PROMO_LOGO_DOCK_MS);
      window.setTimeout(() => {
        this.root.classList.add('is-logo-leaving');
      }, PROMO_LOGO_DOCK_MS + PROMO_PITCH_LOGO_HOLD_MS);
      window.setTimeout(() => {
        this.playPitchLine();
      }, PROMO_LOGO_DOCK_MS + PROMO_PITCH_LOGO_HOLD_MS + PROMO_PITCH_LOGO_OUT_MS);
    }

    playHeroWords(toFace, onDone) {
      const words = toFace ? [...toFace.querySelectorAll('[data-promo-to-word]')] : [];
      if (!words.length) {
        onDone();
        return;
      }

      let index = 0;
      const showWord = () => {
        const word = words[index];
        word.classList.add('is-in');
        const isLast = index === words.length - 1;
        if (isLast) {
          window.setTimeout(onDone, PROMO_PITCH_HERO_IN_MS + PROMO_PITCH_SELL_HOLD_MS);
          return;
        }
        window.setTimeout(() => {
          word.classList.remove('is-in');
          word.classList.add('is-out');
          index += 1;
          window.setTimeout(
            showWord,
            Math.max(0, PROMO_PITCH_HERO_OUT_MS - PROMO_PITCH_HERO_OVERLAP_MS)
          );
        }, PROMO_PITCH_HERO_IN_MS + PROMO_PITCH_HERO_HOLD_MS);
      };
      showWord();
    }

    playPitchLine() {
      const line = this.line;
      const fromFace = this.root.querySelector('[data-promo-face-from]');
      const toFace = this.root.querySelector('[data-promo-face-to]');
      if (!line || !fromFace) {
        this.playSeeForYourself();
        return;
      }

      const fromWords = [...fromFace.querySelectorAll('[data-promo-from-word]')];
      fromWords.forEach((word, index) => {
        word.style.animationDelay = `${index * PROMO_PITCH_WORD_STAGGER_MS}ms`;
      });
      line.classList.add('is-revealing');

      const wordsInAt = (fromWords.length - 1) * PROMO_PITCH_WORD_STAGGER_MS + PROMO_PITCH_WORD_IN_MS;
      const strikeAt = wordsInAt + PROMO_PITCH_REDEFINE_HOLD_MS;
      const morphAt = strikeAt + PROMO_PITCH_STRIKE_MS + PROMO_PITCH_STRIKE_HOLD_MS;
      const morphDoneAt = morphAt + PROMO_PITCH_MORPH_MS;
      const replaceAt = morphDoneAt + PROMO_PITCH_REPLACE_PAUSE_MS;
      const from = line.querySelector('.promo-opening__from');
      const to = line.querySelector('.promo-opening__to');
      const outSpan = Math.max(...PROMO_PITCH_WORD_OUT_STAGGER_MS);
      const toInAt = replaceAt + PROMO_PITCH_WORD_OUT_MS + outSpan + PROMO_PITCH_REPLACE_GAP_MS;

      window.setTimeout(() => {
        if (from) from.style.width = `${from.getBoundingClientRect().width}px`;
        if (to) to.style.width = '0px';
        line.classList.add('is-striking');
      }, strikeAt);

      window.setTimeout(() => {
        line.classList.add('is-erasing', 'is-redefined');
        if (from) from.style.width = '0px';
        if (to) to.style.width = 'auto';
      }, morphAt);

      window.setTimeout(() => {
        line.classList.remove('is-striking', 'is-erasing');
        if (from) from.style.width = '0px';
        if (to) to.style.width = '';
      }, morphDoneAt);

      window.setTimeout(() => {
        fromWords.forEach((word, index) => {
          word.style.animationDelay = `${PROMO_PITCH_WORD_OUT_STAGGER_MS[index] || 0}ms`;
        });
        fromFace.classList.add('is-exiting');
      }, replaceAt);

      window.setTimeout(() => {
        line.classList.add('is-replaced');
        this.playHeroWords(toFace, () => {
          if (momentsEnabled()) this.playMoments(() => this.playPitchConveyor());
          else this.playSeeForYourself();
        });
      }, toInAt);
    }

    bizmisLook() {
      return {
        model: PROMO_BIZMIS_AVATAR_MODEL_URL,
        meshColors: PROMO_BIZMIS_MESH_COLORS,
        stamp: document.documentElement.getAttribute('data-promo-bizmis-stamp'),
        stampScale: PROMO_BIZMIS_STAMP_SCALE,
        stampOffsetX: PROMO_BIZMIS_STAMP_OFFSET_X,
      };
    }

    stopGlide() {
      if (!this.glideFrame) return;
      window.cancelAnimationFrame(this.glideFrame);
      this.glideFrame = 0;
    }

    settleClerkRow() {
      const widget = this.root.querySelector('[data-promo-widget]');
      const animation = this.clerkMove;
      this.clerkMove = null;
      if (widget) {
        widget.style.transition = '';
        widget.style.transform = '';
        widget.style.transformOrigin = '';
      }
      if (animation) animation.cancel();
    }

    playClerkScale(fromScale, fromLift, toScale, toLift) {
      const embed = this.parkedEmbed || document.getElementById('bizmis-avatar-embed');
      if (!embed) return;
      window.cancelAnimationFrame(this.clerkScaleFrame);
      if (prefersReducedMotion()) {
        embed.style.setProperty('--promo-avatar-scale', String(toScale));
        embed.style.setProperty('--promo-avatar-lift', `${toLift}px`);
        return;
      }
      const started = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - started) / PROMO_CLERK_CORNER_MS);
        const eased = 1 - (1 - t) ** 3;
        const scale = fromScale + (toScale - fromScale) * eased;
        const lift = fromLift + (toLift - fromLift) * eased;
        embed.style.setProperty('--promo-avatar-scale', scale.toFixed(4));
        embed.style.setProperty('--promo-avatar-lift', `${lift.toFixed(2)}px`);
        if (t < 1) this.clerkScaleFrame = window.requestAnimationFrame(step);
      };
      step(started);
    }

    seatClerkInStore(instant) {
      const embed = this.parkedEmbed || document.getElementById('bizmis-avatar-embed');
      const widget = this.root.querySelector('[data-promo-widget]');
      const canvas = this.root.querySelector('[data-promo-canvas]');
      const store = this.root.querySelector('.promo-opening__store');
      if (store) store.style.visibility = '';
      this.root.classList.add('is-moments');
      const stage = this.momentStage();
      void stage?.offsetWidth;
      const laid = stage?.querySelector('.promo-moments__board');
      if (laid && !this.root.classList.contains('is-clip-moment')) {
        delete laid.dataset.gridLaid;
        applyMomentPose(stage, 'grid', { instant: true });
      }
      if (!embed || !widget || !canvas || !store) return;
      this.settleClerkRow();
      this.clerkCornerActive = true;
      const snap = instant || prefersReducedMotion();
      this.root.classList.toggle('is-clerk-instant', snap);
      if (!snap) this.root.classList.add('is-clerk-moving');
      canvas.getBoundingClientRect();
      const storeBox = store.getBoundingClientRect();
      const canvasBox = canvas.getBoundingClientRect();
      if (storeBox.width < 40 || canvasBox.width < 40) return;
      const clipMoment = this.root.classList.contains('is-clip-moment');
      const scale = clipMoment ? (this.clipClerkScale || 0.72) : PROMO_CLERK_CORNER_SCALE;
      const insetX = clipMoment ? 28 : PROMO_CLERK_CORNER_INSET_X;
      const insetY = clipMoment ? 18 : PROMO_CLERK_CORNER_INSET_Y;
      const height = PROMO_AVATAR_BOX_H * scale;
      const right = canvasBox.right - (storeBox.right - insetX);
      const top = storeBox.bottom - insetY - height - canvasBox.top;
      this.root.style.setProperty('--promo-clerk-top', `${top.toFixed(1)}px`);
      this.root.style.setProperty('--promo-clerk-right', `${right.toFixed(1)}px`);
      if (snap) {
        embed.style.setProperty('--promo-avatar-scale', String(scale));
        embed.style.setProperty('--promo-avatar-lift', '0px');
        this.root.classList.add('is-clerk-corner');
        return;
      }
      embed.style.setProperty('--promo-avatar-scale', String(PROMO_AVATAR_MAX_SCALE));
      embed.style.setProperty('--promo-avatar-lift', `${PROMO_AVATAR_LIFT_PX}px`);
      window.requestAnimationFrame(() => {
        this.root.classList.add('is-clerk-corner');
        this.playClerkScale(PROMO_AVATAR_MAX_SCALE, PROMO_AVATAR_LIFT_PX, PROMO_CLERK_CORNER_SCALE, 0);
      });
    }

    restoreClerkSeat() {
      if (!this.clerkCornerActive && !this.root.classList.contains('is-clerk-corner')) return;
      if (prefersReducedMotion()) {
        this.root.classList.remove('is-clerk-corner', 'is-clerk-instant', 'is-clerk-moving');
        this.clerkCornerActive = false;
        this.fitClerk();
        return;
      }
      this.root.classList.remove('is-clerk-instant');
      this.root.classList.add('is-clerk-moving');
      window.requestAnimationFrame(() => {
        this.root.classList.remove('is-clerk-corner');
        this.playClerkScale(PROMO_CLERK_CORNER_SCALE, 0, PROMO_AVATAR_MAX_SCALE, PROMO_AVATAR_LIFT_PX);
      });
      window.setTimeout(() => {
        this.clerkCornerActive = false;
        this.root.classList.remove('is-clerk-moving');
        this.fitClerk();
      }, PROMO_CLERK_CORNER_MS + 80);
    }

    glideClerkIntoRow(positionClass = 'is-see-row') {
      const embed = this.parkedEmbed || document.getElementById('bizmis-avatar-embed');
      const widget = this.root.querySelector('[data-promo-widget]');
      const park = () => {
        this.root.classList.add(positionClass);
        if (positionClass === 'is-see-row') this.root.classList.remove('is-moments');
      };
      if (!embed || !widget || prefersReducedMotion()) {
        park();
        return;
      }

      const first = embed.getBoundingClientRect();
      park();
      const last = embed.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const still = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
      if (still) return;

      const from = `translate(${dx}px, ${dy}px) translateY(-50%)`;
      const to = 'translate(0px, 0px) translateY(-50%)';
      widget.style.transition = 'none';
      widget.style.transformOrigin = 'center center';
      widget.style.transform = from;
      this.clerkMove?.cancel();
      const animation = widget.animate(
        [
          { transform: from },
          { transform: to },
        ],
        {
          duration: PROMO_CLERK_ROW_MS,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        },
      );
      this.clerkMove = animation;
      animation.finished.then(() => {
        if (this.clerkMove !== animation) return;
        this.settleClerkRow();
      }).catch(() => {});
    }

    resetSee() {
      this.stopGlide();
      this.settleClerkRow();
      this.root.classList.remove(
        'is-see',
        'is-see-in',
        'is-see-docked',
        'is-see-row',
        'is-see-landed',
        'is-moments'
      );
      this.carouselTrack?.querySelectorAll('.promo-opening__slide').forEach((slide) => {
        slide.classList.remove('is-on');
      });
      if (this.carouselTrack) {
        this.carouselTrack.style.transition = '';
        this.carouselTrack.style.transform = '';
        [...this.carouselTrack.children].forEach((slide) => {
          slide.style.transform = '';
          slide.style.transformOrigin = '';
          slide.style.zIndex = '';
          slide.style.removeProperty('--promo-wheel-fade');
          slide.style.removeProperty('--promo-wheel-focus');
        });
      }
    }

    carouselOffset(index) {
      const track = this.carouselTrack;
      const slide = track?.children[index];
      const view = track?.parentElement;
      if (!track || !slide || !view) return 0;
      const targetLeft = (view.clientWidth - slide.offsetWidth) / 2;
      return slide.offsetLeft - targetLeft;
    }

    wheelTransform(distance, shift) {
      const abs = Math.abs(distance);
      const sign = Math.sign(distance) || 1;
      const yaw = sign * wheelYaw(abs);
      const depth = wheelDepth(abs);
      const scale = wheelScale(abs);
      return `translate3d(${shift}px, 0, ${-depth}px) rotateY(${yaw}deg) scale(${scale})`;
    }

    applyWheel(activeIndex) {
      const track = this.carouselTrack;
      if (!track) return;
      const slides = [...track.children];
      const count = slides.length;
      const stride = count > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0;
      slides.forEach((slide, index) => {
        const layout = index - activeIndex;
        const distance = loopDistance(index, activeIndex, count);
        const shift = stride * (distance - layout);
        const abs = Math.abs(distance);
        slide.style.transform = this.wheelTransform(distance, shift);
        slide.style.transformOrigin = 'center center';
        slide.style.zIndex = String(1000 - Math.round(abs * 100));
        slide.style.setProperty('--promo-wheel-fade', String(wheelFade(abs)));
        slide.style.setProperty('--promo-wheel-focus', wheelFocus(abs).toFixed(4));
      });
      this.paintClerkGlow(activeIndex);
    }

    ensureClerkGlow() {
      const widget = this.root.querySelector('[data-promo-widget]');
      const host = widget?.parentElement;
      if (!host) return null;
      let glow = this.root.querySelector('[data-promo-clerk-glow]');
      if (!glow) {
        glow = document.createElement('div');
        glow.className = 'promo-opening__clerk-glow';
        glow.setAttribute('data-promo-clerk-glow', '');
        glow.setAttribute('aria-hidden', 'true');
      }
      if (glow.parentElement !== host) host.appendChild(glow);
      return glow;
    }

    paintClerkGlow(activeIndex) {
      const glow = this.clerkGlow;
      const stores = this.stores || [];
      if (!glow || !stores.length) return;
      const count = stores.length;
      const max = count - 1;
      const base = Math.max(0, Math.min(max, Math.floor(activeIndex)));
      const next = Math.min(max, base + 1);
      const leftFocus = wheelFocus(Math.abs(loopDistance(base, activeIndex, count)));
      const rightFocus = next === base
        ? 0
        : wheelFocus(Math.abs(loopDistance(next, activeIndex, count)));
      const total = leftFocus + rightFocus;
      const amount = total > 0 ? rightFocus / total : 0;
      glow.style.setProperty('--promo-clerk-glow', mixAccent(stores[base].accent, stores[next].accent, amount));
    }

    syncWheelPerspective() {
      const view = this.carouselTrack?.parentElement;
      if (view) view.style.perspectiveOrigin = 'center center';
    }

    placeCarousel(index, snap) {
      const track = this.carouselTrack;
      if (!track) return;
      if (snap) track.style.transition = 'none';
      track.style.transform = `translate3d(${-this.carouselOffset(index)}px, 0, 0)`;
      this.syncWheelPerspective();
      this.applyWheel(index);
      if (snap) {
        track.getBoundingClientRect();
        track.style.transition = '';
      }
    }

    setActiveSlide(index, landed) {
      const slides = this.carouselTrack
        ? [...this.carouselTrack.querySelectorAll('.promo-opening__slide')]
        : [];
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-on', slideIndex === index);
      });
      this.root.classList.toggle('is-see-landed', Boolean(landed));
    }

    highlightStore(index, landed, snap) {
      this.setActiveSlide(index, landed);
      if (index >= 0) this.placeCarousel(index, Boolean(snap));
    }

    snapSeeLanded() {
      const ask = promoVideoConfig.cta !== 'demo' && promoVideoConfig.cta !== 'none';
      this.root.classList.add('is-see', 'is-see-in', 'is-see-docked', 'is-see-row', 'is-see-landed', 'is-see-wave');
      if (ask) {
        this.paintWave(-1, 0, 0);
        this.root.classList.add('is-see-cta', 'is-cta-aim');
      } else {
        this.paintWave(this.landIndex, 1, 0.5);
      }
      const store = this.stores[this.landIndex];
      if (store) promoWidget.applyStoreLook(store);
    }

    showReducedSee() {
      document.documentElement.style.setProperty('--ad-warmth', '1');
      this.releasePainStage();
      document.documentElement.classList.add('is-promo-pitch');
      this.root.classList.add('is-on', 'is-bursting', 'is-holding', 'is-pitch', 'is-logo-leaving');
      window.requestAnimationFrame(() => this.fitOpeningLayout());
      this.armPark();
      document.documentElement.classList.add('is-promo-clerk');
      this.snapSeeLanded();
      window.setTimeout(() => this.revealStore(), PROMO_SEE_REDUCED_HOLD_MS);
    }

    clearMomentTimers() {
      (this.momentTimers || []).forEach((timer) => window.clearTimeout(timer));
      this.momentTimers = [];
    }

    ensureMoments() {
      const copy = this.root.querySelector('.promo-opening__copy');
      if (!copy) return null;
      let host = copy.querySelector('[data-promo-moments]');
      if (!host) {
        host = document.createElement('div');
        host.className = 'promo-opening__moments';
        host.setAttribute('data-promo-moments', '');
        host.setAttribute('aria-hidden', 'true');
        const label = document.createElement('p');
        label.className = 'promo-opening__moments-label';
        label.setAttribute('data-promo-moments-label', '');
        const stage = document.createElement('div');
        stage.className = 'promo-opening__moments-stage';
        stage.setAttribute('data-promo-moments-stage', '');
        host.append(label, stage);
        const stores = copy.querySelector('[data-promo-stores]');
        copy.insertBefore(host, stores);
      }
      if (!host.querySelector('.promo-opening__store')) {
        const store = document.createElement('div');
        store.className = 'promo-opening__store';
        const bar = document.createElement('div');
        bar.className = 'promo-opening__store-bar';
        const brand = document.createElement('span');
        brand.className = 'promo-opening__store-brand';
        const mark = document.createElement('span');
        mark.className = 'promo-opening__store-mark';
        mark.setAttribute('aria-hidden', 'true');
        mark.innerHTML = PROMO_STORE_MARK;
        const name = document.createElement('span');
        name.className = 'promo-opening__store-name';
        name.textContent = 'Your store';
        brand.append(mark, name);
        const cart = document.createElement('div');
        cart.className = 'promo-moments__cart';
        cart.setAttribute('aria-hidden', 'true');
        cart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7h13l-1.4 8.2H8.1L6.5 7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6.5 7 5.2 4H2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="9.2" cy="19.2" r="1.35" fill="currentColor"/><circle cx="16.6" cy="19.2" r="1.35" fill="currentColor"/></svg><span class="promo-moments__count is-one">1</span><span class="promo-moments__count is-two">2</span>';
        bar.append(brand, cart);
        const field = host.querySelector('.promo-opening__moments-field');
        const stage = host.querySelector('[data-promo-moments-stage]');
        if (field) store.appendChild(field);
        store.appendChild(bar);
        if (stage) store.appendChild(stage);
        host.insertBefore(store, host.firstChild);
      }
      if (!host.querySelector('.promo-opening__browser')) {
        const browser = document.createElement('div');
        browser.className = 'promo-opening__browser';
        browser.innerHTML = '<span class="promo-opening__browser-dots" aria-hidden="true"><i data-promo-window-close></i><i></i><i></i></span><span class="promo-opening__browser-pill" aria-hidden="true"></span>';
        host.querySelector('.promo-opening__store')?.prepend(browser);
      }
      host.querySelector('.promo-opening__browser-dots i')?.setAttribute('data-promo-window-close', '');
      host.querySelector('.promo-opening__collection')?.remove();
      host.querySelector('.promo-opening__search')?.remove();
      host.querySelector('.promo-moments__fest')?.remove();
      const storeMark = host.querySelector('.promo-opening__store-mark');
      if (storeMark) {
        storeMark.innerHTML = PROMO_STORE_MARK;
        const bar = storeMark.closest('.promo-opening__store-bar');
        let brand = storeMark.closest('.promo-opening__store-brand');
        if (bar && !brand) {
          brand = document.createElement('span');
          brand.className = 'promo-opening__store-brand';
          bar.insertBefore(brand, storeMark);
          brand.appendChild(storeMark);
        }
        if (brand && !brand.querySelector('.promo-opening__store-name')) {
          const name = document.createElement('span');
          name.className = 'promo-opening__store-name';
          name.textContent = 'Your store';
          brand.appendChild(name);
        }
      }
      host.querySelectorAll('.promo-moments__cart-piece').forEach((piece) => piece.remove());
      host.querySelectorAll('.promo-moments__cart').forEach((cart) => {
        if (cart.querySelector('.promo-moments__cart-burst')) return;
        const burst = document.createElement('span');
        burst.className = 'promo-moments__cart-burst';
        burst.setAttribute('aria-hidden', 'true');
        cart.prepend(burst);
      });
      if (!host.querySelector('.promo-moments__fly')) {
        const fly = document.createElement('span');
        fly.className = 'promo-moments__fly';
        fly.setAttribute('aria-hidden', 'true');
        host.appendChild(fly);
      }
      if (!host.querySelector('.promo-opening__moments-field')) {
        const field = document.createElement('div');
        field.className = 'promo-opening__moments-field';
        field.setAttribute('aria-hidden', 'true');
        ['is-rose', 'is-orange', 'is-blue'].forEach((name) => {
          const blob = document.createElement('span');
          blob.className = `promo-opening__moments-blob ${name}`;
          field.appendChild(blob);
        });
        host.querySelector('.promo-opening__store')?.appendChild(field);
      }
      this.root.style.setProperty('--promo-moments-label', String(PROMO_MOMENTS_LABEL_RATIO));
      this.root.style.setProperty('--promo-moments-payoff', String(PROMO_MOMENTS_PAYOFF_RATIO));
      this.root.style.setProperty('--promo-moments-accessory', `${PROMO_MOMENTS_ACCESSORY_MS}ms`);
      this.root.style.setProperty('--promo-moments-orbit', `${PROMO_MOMENTS_ORBIT_MS}ms`);
      this.root.style.setProperty('--promo-moments-vapor', `${PROMO_MOMENTS_VAPOR_MS}ms`);
      this.root.style.setProperty('--promo-close-cart-at', `${PROMO_MOMENTS_VAPOR_MS + PROMO_MOMENTS_CART_GAP_MS}ms`);
      this.root.style.setProperty('--promo-moments-collapse', `${PROMO_MOMENTS_COLLAPSE_MS}ms`);
      this.root.style.setProperty('--promo-moments-fly', `${PROMO_MOMENTS_FLY_MS}ms`);
      this.root.style.setProperty('--promo-moments-tick', `${PROMO_MOMENTS_BADGE_TICK_MS}ms`);
      this.root.style.setProperty('--promo-moments-choice', `${PROMO_MOMENTS_CHOICE_MS}ms`);
      this.root.style.setProperty('--promo-compare-fold', `${PROMO_MOMENTS_CHOICE_MS - 200}ms`);
      this.root.style.setProperty('--promo-settle-end', `${PROMO_MOMENTS_DOCK_MS}ms`);
      this.root.style.setProperty('--promo-bundle-celebrate', `${PROMO_MOMENTS_BUNDLE_CELEBRATE_MS}ms`);
      this.root.style.setProperty('--promo-ring-gap', `${PROMO_MOMENT_RING_GAP_MS}ms`);
      this.root.style.setProperty('--promo-other-ring', `${PROMO_MOMENT_OTHER_RING_MS}ms`);
      this.root.style.setProperty('--promo-catalog-seek', `${PROMO_MOMENT_SEEK_MS}ms`);
      return host;
    }

    momentStage() {
      return this.ensureMoments()?.querySelector('[data-promo-moments-stage]') || null;
    }

    showMoment(beat, settled) {
      const stage = this.momentStage();
      const host = this.root.querySelector('[data-promo-moments]');
      if (host) host.setAttribute('aria-hidden', 'false');
      if (!stage) return;
      this.clearMomentTimers();
      applyMomentPose(stage, settled ? beat.endPose : beat.holdPose, {
        instant: settled,
      });
    }

    playMoment(beat) {
      const stage = this.momentStage();
      if (!stage) return;
      if (beat.playPose === 'row' && !prefersReducedMotion()) {
        const board = stage.querySelector('.promo-moments__board');
        const seek = momentCatalogSeek(board);
        board?.classList.add('is-shortlist');
        this.momentTimers.push(window.setTimeout(() => {
          board?.style.setProperty('--moment-scroll', `${seek}px`);
          board?.classList.add('is-catalog-seek');
        }, PROMO_MOMENT_SEEK_AT_MS));
        this.momentTimers.push(window.setTimeout(() => {
          board?.classList.remove('is-catalog-seek', 'is-shortlist');
          applyMomentPose(stage, 'row');
        }, PROMO_MOMENTS_SHORTLIST_MS));
      } else {
        applyMomentPose(stage, beat.playPose);
      }
      if (beat.nod) setOpeningAvatarAction('nod');
      else if (beat.wave) setOpeningAvatarAction('waving');
      if (beat.playPose === 'extra' && !prefersReducedMotion()) {
        this.momentTimers.push(window.setTimeout(() => {
          this.emitClick();
        }, PROMO_MOMENTS_DOCK_MS));
      }
      if (typeof beat.closeAt === 'number' || typeof beat.bundleAt === 'number') {
        const at = beat.closeAt ?? beat.bundleAt;
        this.momentTimers.push(window.setTimeout(() => {
          applyMomentPose(stage, beat.endPose);
        }, beat.speakMs * at));
      }
    }

    async playMoments(onDone) {
      const sell = this.root.querySelector('.promo-opening__word--sell');
      const reduced = prefersReducedMotion();
      sell?.classList.remove('is-in');
      sell?.classList.add('is-out');
      if (!reduced) await waitMs(PROMO_SELL_OUT_MS);
      this.seatClerkInStore(reduced);
      if (!reduced) await waitMs(PROMO_CLERK_CORNER_MS);

      for (const beat of PROMO_MOMENT_BEATS) {
      this.showMoment(beat, reduced);
      if (!reduced && beat.lookMs) await waitMs(beat.lookMs);
      await waitMs(beat.voMs);
        if (reduced) {
          await waitMs(beat.speakMs);
        } else {
          await playClerkLine(beat.line, beat.speakMs, () => this.playMoment(beat));
          applyMomentPose(this.momentStage(), beat.endPose, {
            instant: true,
          });
          await waitMs(beat.holdMs || PROMO_MOMENTS_TAIL_MS);
        }
      }
      this.clearMomentTimers();
      endOpeningAgent();
      setOpeningAvatarAction('nod');
      applyMomentPose(this.momentStage(), 'bundle', { instant: true });
      onDone();
    }

    seeEndIndex() {
      const cta = this.carouselTrack?.querySelector('.promo-opening__slide.is-cta');
      if (!cta || !this.carouselTrack) return this.landIndex;
      return [...this.carouselTrack.children].indexOf(cta);
    }

    playSeeForYourself() {
      endOpeningAgent();
      if (!this.stores.length) {
        window.setTimeout(() => this.depart(), PROMO_PITCH_SETTLE_MS);
        return;
      }

      if (prefersReducedMotion()) {
        this.snapSeeLanded();
        window.setTimeout(() => this.depart(), PROMO_SEE_CTA_HOLD_MS);
        return;
      }

      const sell = this.root.querySelector('.promo-opening__word--sell');
      sell?.classList.remove('is-in');
      sell?.classList.add('is-out');

      this.root.classList.add('is-see', 'is-see-wave');
      window.requestAnimationFrame(() => {
        this.root.classList.add('is-see-in', 'is-see-docked', 'is-see-row');
      });

      window.setTimeout(() => {
        this.glideClerkIntoRow();
        this.playStoreWave(() => {
          const cta = promoVideoConfig.cta;
          if (cta === 'none') {
            this.paintWave(Math.max(0, this.stores.length - 1), 1, 0.5);
            window.setTimeout(() => this.depart(), 1200);
            return;
          }
          if (cta === 'demo') {
            window.setTimeout(() => this.depart(), 400);
            return;
          }
          this.root.classList.add('is-see-cta');
          window.setTimeout(() => {
            this.root.classList.add('is-cta-aim');
          }, Math.max(0, PROMO_SEE_CTA_HOLD_MS - PROMO_SEE_CURSOR_MS));
          window.setTimeout(() => this.depart(), PROMO_SEE_CTA_HOLD_MS);
        });
      }, 360);
    }

    playStoreStack(onDone) {
      const slides = this.carouselTrack ? [...this.carouselTrack.children] : [];
      if (!slides.length) {
        onDone();
        return;
      }
      const ask = promoVideoConfig.cta !== 'none';
      const lookMs = 640;
      const liftMs = 560;
      slides.forEach((slide, index) => {
        slide.style.zIndex = String(slides.length - index);
      });
      let index = 0;
      const step = () => {
        const store = this.stores[index];
        if (store) this.arriveStore(store);
        const last = index >= slides.length - 1;
        window.setTimeout(() => {
          if (last && !ask) {
            onDone();
            return;
          }
          slides[index].classList.add('is-lift');
          index += 1;
          if (index >= slides.length) {
            this.root.classList.add('is-see-cta');
            window.setTimeout(onDone, liftMs);
            return;
          }
          window.setTimeout(step, liftMs);
        }, lookMs);
      };
      step();
    }

    playStoreWave(onDone) {
      const slides = this.carouselTrack
        ? [...this.carouselTrack.querySelectorAll('.promo-opening__slide')]
        : [];
      if (!slides.length) {
        onDone();
        return;
      }
      this.stopGlide();
      if (this.carouselTrack) {
        this.carouselTrack.style.transition = 'none';
        this.carouselTrack.style.transform = 'none';
      }
      const cycle = PROMO_SEE_WAVE_RISE_MS + PROMO_SEE_WAVE_HOLD_MS + PROMO_SEE_WAVE_FALL_MS;
      const started = performance.now();
      let shown = -1;
      const frame = (now) => {
        const elapsed = now - started;
        if (elapsed >= cycle * slides.length) {
          this.paintWave(-1, 0, 0);
          this.glideFrame = 0;
          onDone();
          return;
        }
        const index = Math.min(slides.length - 1, Math.floor(elapsed / cycle));
        const sample = waveSample(elapsed - index * cycle);
        this.paintWave(index, sample.amount, sample.travel);
        if (index !== shown) {
          shown = index;
          const store = this.stores[index];
          if (store) this.arriveStore(store);
        }
        this.glideFrame = window.requestAnimationFrame(frame);
      };
      this.glideFrame = window.requestAnimationFrame(frame);
    }

    paintWave(index, amount, travel) {
      const slides = this.carouselTrack
        ? [...this.carouselTrack.querySelectorAll('.promo-opening__slide')]
        : [];
      const wave = Math.min(1, Math.max(0, amount));
      const motion = Math.min(1, Math.max(0, travel));
      this.root.style.setProperty('--see-wave', wave.toFixed(4));
      this.root.style.setProperty('--see-travel', motion.toFixed(4));
      const store = this.stores[index];
      if (store?.accent) this.root.style.setProperty('--promo-store-accent', store.accent);
      slides.forEach((slide, slideIndex) => {
        const on = slideIndex === index && wave > 0.01;
        const present = wave <= 0.08 ? wave / 0.08 : 1;
        slide.classList.toggle('is-wave', on);
        slide.style.opacity = on ? present.toFixed(4) : '0';
        slide.style.setProperty('--wave', on ? wave.toFixed(4) : '0');
        slide.style.setProperty('--wave-x', on ? travel.toFixed(4) : '0.5');
        slide.style.zIndex = on ? '2' : '1';
        slide.style.transform = on ? `scale(${(0.92 + wave * 0.08).toFixed(4)})` : 'scale(0.92)';
      });
      const glow = this.ensureClerkGlow();
      if (!glow) return;
      if (store) glow.style.setProperty('--promo-clerk-glow', store.accent || 'transparent');
      glow.style.opacity = wave.toFixed(4);
    }

    playStoreGlide(onDone) {
      const end = this.seeEndIndex();
      const track = this.carouselTrack;
      if (!track || !track.children.length) {
        onDone();
        return;
      }
      this.stopGlide();
      track.style.transition = 'none';
      track.style.transform = `translate3d(${-this.carouselOffset(0)}px, 0, 0)`;
      this.syncWheelPerspective();
      this.applyWheel(0);
      this.setActiveSlide(0, end <= 0);
      const first = this.stores[0];
      if (first) this.arriveStore(first);
      if (end <= 0) {
        onDone();
        return;
      }

      const started = performance.now();
      let arrived = 0;

      const frame = (now) => {
        const linear = (now - started) / PROMO_SEE_GLIDE_MS;
        if (linear >= 1) {
          this.placeCarousel(end, true);
          this.setActiveSlide(end, true);
          if (arrived < end) {
            const store = this.stores[end];
            if (store) this.arriveStore(store);
          }
          this.glideFrame = 0;
          onDone();
          return;
        }
        const index = end * glideEase(linear);
        const base = Math.min(end - 1, Math.floor(index));
        const next = base + 1;
        const frac = index - base;
        const offset = this.carouselOffset(base)
          + (this.carouselOffset(next) - this.carouselOffset(base)) * frac;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        this.syncWheelPerspective();
        this.applyWheel(index);
        const centered = Math.round(index);
        if (centered > arrived) {
          arrived = centered;
          this.setActiveSlide(arrived, false);
          const store = this.stores[arrived];
          if (store) this.arriveStore(store);
        }
        this.glideFrame = window.requestAnimationFrame(frame);
      };
      this.glideFrame = window.requestAnimationFrame(frame);
    }

    arriveStore(store) {
      this.stainClerk(store.accent);
      promoWidget.applyStoreLook(store);
    }

    stainClerk(accent) {
      const host = this.root.querySelector('[data-promo-stains]');
      if (!host || prefersReducedMotion()) return;
      const burst = document.createElement('div');
      burst.className = 'promo-opening__stain-burst';
      burst.style.setProperty('--promo-stain', accent || 'var(--ad-ink-3)');
      for (let index = 0; index < PROMO_SEE_STAIN_COUNT; index += 1) {
        const stain = document.createElement('span');
        stain.className = index < PROMO_SEE_STAIN_BODY_COUNT
          ? 'promo-opening__stain'
          : 'promo-opening__stain is-head';
        burst.appendChild(stain);
      }
      host.appendChild(burst);
      window.setTimeout(() => burst.remove(), PROMO_SEE_STAIN_MS + 80);
    }

    depart() {
      this.stopGlide();
      this.settleClerkRow();
      window.removeEventListener('resize', this.boundDock);
      promoWidget.hide();
      this.restoreWidget();
      document.documentElement.classList.remove('is-promo-pitch');
      document.documentElement.classList.add('is-promo-depart');
      this.root.classList.add('is-depart');
      window.setTimeout(() => this.revealStore(), PROMO_DEPART_MS);
    }

    revealStore() {
      if (!PROMO_OPENING_REVEAL_STORE) return;
      const url = new URL(window.location.href);
      url.searchParams.set(PROMO_VIDEO_PARAM, 'true');
      url.searchParams.delete('auto');
      window.history.replaceState({}, '', url.toString());
      promoStoreUnlocked = true;

      this.restoreWidget();
      document.documentElement.classList.remove('is-promo-opening', 'is-promo-pitch', 'is-promo-depart');
      this.root.remove();
      promoWidget.remountForStore();
      this.onStoreReady?.();
    }

    clearPainTimers() {
      (this.painTimers || []).forEach((timer) => window.clearTimeout(timer));
      this.painTimers = [];
    }

    painHost() {
      return this.root.querySelector('[data-promo-moments]');
    }

    painStore() {
      return this.root.querySelector('.promo-opening__store');
    }

    painCards() {
      const board = this.painHost()?.querySelector('.promo-moments__board');
      if (!board) return [];
      return [...board.querySelectorAll('.promo-moments__card:not(.is-extra)')];
    }

    releasePainStage() {
      this.clearPainTimers();
      this.resetScaleScene();
      this.root.classList.remove(
        'is-pain',
        'is-pain-loop',
        'is-pain-zoom',
        'is-pain-out',
        'is-moments',
        'is-window-aim',
        'is-window-shut',
        'is-scale-shrink',
      );
      const store = this.painStore();
      if (store) {
        const host = store.parentElement;
        if (host?.classList.contains('promo-puff__host')) host.replaceWith(store);
        store.classList.remove('promo-puff__body');
        store.style.visibility = '';
        store.style.transform = '';
        store.style.transition = '';
        store.style.transformOrigin = '';
      }
      const host = this.painHost();
      host?.querySelector('.promo-moments__board')?.style.removeProperty('--pain-scroll');
      host?.classList.remove('is-pain-dim');
      this.painCards().forEach((card) => {
        card.classList.remove('is-pain-open', 'is-pain-hover', 'is-pain-add');
      });
      host?.querySelector('.promo-moments__board')?.classList.remove('is-instant');
      this.root.querySelector('[data-promo-pain-chat]')?.setAttribute('hidden', '');
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      if (cursor) cursor.hidden = true;
    }

    ensurePainChrome() {
      const store = this.painStore();
      if (!store) return;
      if (!store.querySelector('[data-promo-pain-cursor]')) {
        const cursor = document.createElement('span');
        cursor.className = 'promo-pain__cursor';
        cursor.setAttribute('data-promo-pain-cursor', '');
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.2 19.2 12.1 11.6 13.4 8.8 20.6z"/></svg>';
        store.appendChild(cursor);
      }
      if (store.querySelector('[data-promo-pain-chat]')) return;
      const chat = document.createElement('div');
      chat.className = 'promo-pain__chat';
      chat.setAttribute('data-promo-pain-chat', '');
      chat.setAttribute('hidden', '');
      const launcher = document.createElement('button');
      launcher.type = 'button';
      launcher.className = 'promo-pain__launcher';
      launcher.setAttribute('aria-hidden', 'true');
      launcher.tabIndex = -1;
      launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7.2h12a2 2 0 0 1 2 2v5.2a2 2 0 0 1-2 2H11l-3.6 2.6V16.4H6a2 2 0 0 1-2-2V9.2a2 2 0 0 1 2-2z"/></svg>';
      const panel = document.createElement('div');
      panel.className = 'promo-pain__panel';
      const title = document.createElement('p');
      title.className = 'promo-pain__title';
      title.textContent = 'Dull Chatbot';
      const chips = document.createElement('div');
      chips.className = 'promo-pain__chips';
      PROMO_PAIN_CHIPS.forEach((label) => {
        const chip = document.createElement('span');
        chip.className = 'promo-pain__chip';
        chip.textContent = label;
        chips.appendChild(chip);
      });
      const log = document.createElement('div');
      log.className = 'promo-pain__log';
      log.setAttribute('data-promo-pain-log', '');
      const input = document.createElement('p');
      input.className = 'promo-pain__input';
      input.setAttribute('data-promo-pain-input', '');
      const typing = document.createElement('p');
      typing.className = 'promo-pain__typing';
      typing.setAttribute('data-promo-pain-typing', '');
      typing.innerHTML = '<i></i><i></i><i></i>';
      const footer = document.createElement('p');
      footer.className = 'promo-pain__footer';
      footer.textContent = 'Powered by Every Chatbot Ever';
      panel.append(title, chips, log, typing, input, footer);
      chat.append(panel, launcher);
      store.appendChild(chat);
      this.lockPainChatBox();
    }

    lockPainChatBox() {
      const chat = this.root.querySelector('[data-promo-pain-chat]');
      const panel = chat?.querySelector('.promo-pain__panel');
      if (!panel || panel.dataset.locked === '1') return;
      const wasHidden = chat.hasAttribute('hidden');
      const wasOpen = chat.classList.contains('is-open');
      chat.classList.add('is-measuring', 'is-open');
      chat.removeAttribute('hidden');
      this.paintPainLog('answer-2');
      const height = Math.ceil(panel.getBoundingClientRect().height);
      this.paintPainLog('launcher');
      chat.classList.remove('is-measuring');
      chat.classList.toggle('is-open', wasOpen);
      if (wasHidden) chat.setAttribute('hidden', '');
      if (height < 80) return;
      panel.style.height = `${height}px`;
      panel.dataset.locked = '1';
    }

    openPainStage() {
      this.root.style.setProperty('--promo-pain-ease', PROMO_PAIN_EASE);
      this.root.style.setProperty('--promo-pain-open', `${PROMO_PAIN_SCROLL_MS}ms`);
      this.root.style.setProperty('--promo-pain-card', '720ms');
      this.root.style.setProperty('--promo-pain-exit', `${PROMO_PAIN_EXIT_MS}ms`);
      this.ensureMoments();
      const openingStore = this.painStore();
      if (openingStore) openingStore.style.visibility = '';
      this.root.classList.add('is-pain', 'is-moments');
      document.documentElement.style.setProperty('--ad-warmth', '0');
      const stage = this.momentStage();
      void stage?.offsetWidth;
      applyMomentPose(stage, 'grid', { instant: true });
      this.ensurePainChrome();
      this.root.classList.remove('is-pain-zoom');
      const host = this.painHost();
      host?.setAttribute('data-promo-pain', '');
      host?.setAttribute('data-promo-pain-scene', 'unattended');
      host?.setAttribute('data-promo-pain-beat', 'grid');
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      if (cursor) {
        cursor.hidden = false;
        cursor.style.opacity = '0';
      }
      this.root.querySelector('[data-promo-pain-chat]')?.setAttribute('hidden', '');
      this.lockPainChatBox();
    }

    painCols() {
      const board = this.painHost()?.querySelector('.promo-moments__board');
      return Number(board?.dataset.painCols) || PROMO_MOMENT_GRID_COLS;
    }

    painBrowseCard(slot) {
      const cols = this.painCols();
      const row = 1 + Math.max(0, slot);
      const column = slot === 0 ? 1 : 2;
      const index = row * cols + column;
      return this.painCards()[index] || null;
    }

    painBrowseScroll(slot) {
      const card = this.painBrowseCard(slot);
      const gy = Number.parseFloat(card?.style.getPropertyValue('--gy')) || 0;
      return -gy;
    }

    setPainScroll(px) {
      const board = this.painHost()?.querySelector('.promo-moments__board');
      if (!board) return 0;
      const previous = Number.parseFloat(board.style.getPropertyValue('--pain-scroll')) || 0;
      board.style.setProperty('--pain-scroll', `${px}px`);
      return px - previous;
    }

    placePainCursor(target, visible, scrollDelta = 0) {
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const store = this.painStore();
      if (!cursor || !store) return;
      cursor.hidden = false;
      if (!target) {
        cursor.style.opacity = '0';
        return;
      }
      const storeBox = store.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      const x = box.left + box.width * 0.55 - storeBox.left;
      const y = box.top + box.height * 0.34 - storeBox.top + scrollDelta;
      cursor.style.setProperty('--pain-x', `${Math.round(x)}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(y)}px`);
      cursor.style.opacity = visible ? '1' : '0';
    }

    placePainCursorEdge() {
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const store = this.painStore();
      if (!cursor || !store) return;
      cursor.hidden = false;
      cursor.style.setProperty('--pain-x', `${store.clientWidth - 18}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(store.clientHeight * 0.62)}px`);
      cursor.style.opacity = '0';
    }

    paintPainLog(through) {
      const log = this.root.querySelector('[data-promo-pain-log]');
      const input = this.root.querySelector('[data-promo-pain-input]');
      const typing = this.root.querySelector('[data-promo-pain-typing]');
      if (!log || !input || !typing) return;
      log.replaceChildren();
      input.textContent = '';
      typing.hidden = true;
      const addUser = (text) => {
        const line = document.createElement('p');
        line.className = 'promo-pain__msg is-user';
        line.textContent = text;
        log.appendChild(line);
      };
      const addBot = (lines, links, actions) => {
        const block = document.createElement('div');
        block.className = 'promo-pain__msg is-bot';
        lines.forEach((text) => {
          const line = document.createElement('p');
          line.textContent = text;
          block.appendChild(line);
        });
        if (links) {
          const list = document.createElement('div');
          list.className = 'promo-pain__links';
          links.forEach((label) => {
            const link = document.createElement('span');
            link.textContent = label;
            list.appendChild(link);
          });
          block.appendChild(list);
        }
        if (actions) {
          const row = document.createElement('div');
          row.className = 'promo-pain__actions';
          actions.forEach((label) => {
            const button = document.createElement('span');
            button.textContent = label;
            row.appendChild(button);
          });
          block.appendChild(row);
        }
        log.appendChild(block);
      };
      if (through === 'typed-1') input.textContent = PROMO_PAIN_LINE_1;
      if (through === 'think-1' || through === 'answer-1' || through === 'typed-2' || through === 'think-2' || through === 'answer-2') {
        addUser(PROMO_PAIN_LINE_1);
      }
      if (through === 'think-1') typing.hidden = false;
      if (through === 'answer-1' || through === 'typed-2' || through === 'think-2' || through === 'answer-2') {
        addBot(PROMO_PAIN_ANSWER_1, PROMO_PAIN_LINKS);
      }
      if (through === 'typed-2') input.textContent = PROMO_PAIN_LINE_2;
      if (through === 'think-2' || through === 'answer-2') {
        addUser(PROMO_PAIN_LINE_2);
      }
      if (through === 'think-2') typing.hidden = false;
      if (through === 'answer-2') {
        addBot([PROMO_PAIN_ANSWER_2], null, ['Open a ticket', 'No, thanks']);
      }
    }

    applyPainBeat(beat, instant) {
      const host = this.painHost();
      const board = host?.querySelector('.promo-moments__board');
      if (!host || !board) return;
      const scene = PROMO_PAIN_B.some(([name]) => name === beat) ? 'chat' : 'unattended';
      host.setAttribute('data-promo-pain-scene', scene);
      host.setAttribute('data-promo-pain-beat', beat);
      board.classList.toggle('is-instant', !!instant);
      if (PROMO_PAIN_LIFE_HOLD.includes(beat)) board.dataset.life = 'hold';
      else delete board.dataset.life;
      const browseSlot = beat === 'enter' || beat === 'open' || beat === 'back' ? 0
        : beat === 'scroll-1' || beat === 'open-2' || beat === 'back-2' ? 1
          : beat === 'scroll-2' ? 2
            : beat === 'scroll-3' ? 3
              : beat === 'scroll-4' ? 4
                : -1;
      const scrollSlot = browseSlot >= 0 ? browseSlot : beat === 'leave' ? 2 : -1;
      const scrollTarget = scrollSlot < 0 ? 0 : this.painBrowseScroll(scrollSlot);
      const scrollDelta = scene === 'unattended' ? this.setPainScroll(scrollTarget) : 0;
      if (instant && scene === 'unattended') board.offsetWidth;
      host.classList.remove('is-pain-dim');
      const opened = beat === 'open' ? this.painBrowseCard(0)
        : beat === 'open-2' ? this.painBrowseCard(1)
          : null;
      this.painCards().forEach((card) => {
        card.classList.remove('is-pain-add');
        card.classList.toggle('is-pain-open', card === opened);
        card.classList.toggle('is-pain-hover', browseSlot >= 0 && card === this.painBrowseCard(browseSlot));
      });
      const chat = this.root.querySelector('[data-promo-pain-chat]');
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const chatBeats = ['launcher', 'panel', 'typed-1', 'think-1', 'answer-1', 'typed-2', 'think-2', 'answer-2'];
      const chatOn = chatBeats.includes(beat);
      if (chat) {
        if (chatOn) chat.removeAttribute('hidden');
        else chat.setAttribute('hidden', '');
        chat.classList.toggle('is-open', chatOn && beat !== 'launcher');
      }
      if (cursor) {
        cursor.style.transitionDuration = instant ? '0ms' : '';
        if (scene === 'chat' || beat === 'grid') {
          cursor.style.opacity = '0';
        }
      }
      this.root.classList.remove('is-pain-zoom');
      if (chatOn) this.lockPainChatBox();
      if (scene === 'unattended' && beat !== 'grid') {
        if (beat === 'leave') this.placePainCursorEdge();
        else if (browseSlot >= 0) this.placePainCursor(this.painBrowseCard(browseSlot), true, instant ? 0 : scrollDelta);
      }
      this.paintPainLog(beat);
    }

    whenPainRest(host) {
      return new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const stage = host?.closest('.promo-opening__stage') || host;
            const pending = (stage?.getAnimations({ subtree: true }) || []).filter((anim) => {
              if (anim.playState !== 'running' && anim.playState !== 'pending') return false;
              const timing = anim.effect?.getComputedTiming?.();
              if (!timing || timing.iterations === Infinity) return false;
              return timing.duration !== Infinity;
            });
            if (!pending.length) {
              resolve();
              return;
            }
            Promise.all(pending.map((anim) => anim.finished.catch(() => {}))).then(() => resolve());
          });
        });
      });
    }

    async playPainSteps(steps, scene) {
      const host = this.painHost();
      host?.setAttribute('data-promo-pain-scene', scene);
      for (const [beat, ms] of steps) {
        this.applyPainBeat(beat, prefersReducedMotion());
        if (prefersReducedMotion()) continue;
        if (beat === 'typed-1' || beat === 'typed-2') {
          const input = this.root.querySelector('[data-promo-pain-input]');
          const text = beat === 'typed-1' ? PROMO_PAIN_LINE_1 : PROMO_PAIN_LINE_2;
          if (input) input.textContent = '';
          for (let index = 1; index <= text.length; index += 1) {
            if (input) input.textContent = text.slice(0, index);
            await waitMs(PROMO_PAIN_TYPE_CHAR_MS);
          }
          continue;
        }
        await Promise.all([
          this.whenPainRest(host),
          ms > 0 ? waitMs(ms) : Promise.resolve(),
        ]);
      }
      const hold = promoHoldMs();
      if (hold > 0 && !prefersReducedMotion()) await waitMs(hold);
    }

    seekPainLoop(ms) {
      const span = PROMO_SCALE_LOOP_MS;
      const t = ((ms % span) + span) % span;
      this.openPainStage();
      this.root.classList.add('is-pain-loop');
      const store = this.painStore();
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      if (!store || !cursor) return;
      cursor.hidden = false;
      cursor.style.transition = 'none';
      store.style.transition = 'none';
      const point = (target) => this.painCursorPoint(target);
      const place = (x, y) => {
        cursor.style.setProperty('--pain-x', `${Math.round(x)}px`);
        cursor.style.setProperty('--pain-y', `${Math.round(y)}px`);
        cursor.style.opacity = '1';
      };
      const cards = this.painCards();
      const wander = [cards[0], cards[1], cards[2]].map(point).filter(Boolean);
      this.root.classList.remove('is-window-aim');
      if (t < 700 && wander.length) {
        this.applyPainBeat('grid', true);
        this.setPainScroll(0);
        const u = t / 700;
        const slot = u * (wander.length - 1);
        const from = wander[Math.floor(slot)];
        const to = wander[Math.min(wander.length - 1, Math.floor(slot) + 1)];
        const mix = slot - Math.floor(slot);
        place(from.x + (to.x - from.x) * mix, from.y + (to.y - from.y) * mix);
      } else if (t < 1100) {
        this.applyPainBeat('panel', true);
        const chat = this.root.querySelector('[data-promo-pain-chat]');
        const at = point(chat) || { x: store.clientWidth * 0.72, y: store.clientHeight * 0.7 };
        place(at.x, at.y);
      } else if (t < 1900) {
        this.applyPainBeat(t < 1500 ? 'answer-1' : 'answer-2', true);
        const chat = this.root.querySelector('[data-promo-pain-chat]');
        const at = point(chat) || { x: store.clientWidth * 0.72, y: store.clientHeight * 0.62 };
        place(at.x, at.y);
      } else {
        this.applyPainBeat('answer-2', true);
        const dot = store.querySelector('[data-promo-window-close]');
        const aim = point(dot) || { x: 32, y: 32 };
        const from = { x: store.clientWidth * 0.62, y: store.clientHeight * 0.7 };
        const u = Math.min(1, (t - 1900) / 500);
        place(from.x + (aim.x - from.x) * u, from.y + (aim.y - from.y) * u);
        if (t >= 2500) this.root.classList.add('is-window-aim');
      }
      const shaking = t >= 2500 && t < 2560;
      const kick = shaking ? Math.sin(((t - 2500) / 60) * Math.PI * 2) * 3 : 0;
      store.style.transform = `translate3d(${kick.toFixed(2)}px, calc(-0.4rem + ${(-kick * 0.35).toFixed(2)}px), 0)`;
    }

    async playPain() {
      if (this.painPlayed) return;
      this.painPlayed = true;
      this.startOpeningClock();
      this.openPainStage();
      if (prefersReducedMotion()) {
        this.applyPainBeat('answer-2', true);
        await this.playScaleScene();
        return;
      }
      await this.playPainSteps(PROMO_PAIN_A, 'unattended');
      await this.playPainSteps(PROMO_PAIN_B, 'chat');
      await this.playScaleScene();
    }

    painCursorPoint(target) {
      const store = this.painStore();
      if (!store || !target) return null;
      const storeBox = store.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      return {
        x: box.left + box.width / 2 - storeBox.left - PROMO_CURSOR_HOT_X,
        y: box.top + box.height / 2 - storeBox.top - PROMO_CURSOR_HOT_Y,
      };
    }

    pinWindowCloseOrigin() {
      const store = this.painStore();
      const dot = store?.querySelector('[data-promo-window-close]');
      if (!store || !dot) return;
      const storeBox = store.getBoundingClientRect();
      const box = dot.getBoundingClientRect();
      store.style.setProperty('--window-close-x', `${box.left + box.width / 2 - storeBox.left}px`);
      store.style.setProperty('--window-close-y', `${box.top + box.height / 2 - storeBox.top}px`);
    }

    parkPainCursor() {
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const host = this.painHost();
      const store = this.painStore();
      if (!cursor || !host || !store || cursor.parentElement === host) return;
      const hostBox = host.getBoundingClientRect();
      const box = cursor.getBoundingClientRect();
      host.appendChild(cursor);
      cursor.style.transitionDuration = '0ms';
      cursor.style.setProperty('--pain-x', `${Math.round(box.left - hostBox.left - host.clientLeft)}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(box.top - hostBox.top - host.clientTop)}px`);
      cursor.getBoundingClientRect();
      cursor.style.transitionDuration = '';
    }

    async dismissPainStage() {
      if (!this.root.classList.contains('is-pain')) return;
      const store = this.painStore();
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const dot = store?.querySelector('[data-promo-window-close]');
      if (!store || !cursor || !dot || prefersReducedMotion()) {
        this.root.classList.add('is-pain-out');
        if (!prefersReducedMotion()) await waitMs(PROMO_PAIN_EXIT_MS);
        this.releasePainStage();
        return;
      }
      cursor.hidden = false;
      cursor.style.transitionDuration = '0ms';
      cursor.style.setProperty('--pain-x', `${Math.round(store.clientWidth * 0.46)}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(store.clientHeight * 0.62)}px`);
      cursor.style.opacity = '0';
      cursor.getBoundingClientRect();
      this.root.style.setProperty('--promo-pain-open', `${PROMO_WINDOW_AIM_MS}ms`);
      this.root.style.setProperty('--promo-window-leave', `${PROMO_WINDOW_LEAVE_MS}ms`);
      this.root.style.setProperty('--promo-window-close', `${PROMO_WINDOW_CLOSE_MS}ms`);
      cursor.style.transitionDuration = '';
      const aim = this.painCursorPoint(dot);
      cursor.style.setProperty('--pain-x', `${Math.round(aim.x)}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(aim.y)}px`);
      cursor.style.opacity = '1';
      this.pinWindowCloseOrigin();
      this.root.classList.add('is-window-aim');
      await waitMs(PROMO_WINDOW_AIM_MS);
      this.pinWindowCloseOrigin();
      await waitMs(PROMO_WINDOW_HOLD_MS);
      this.root.classList.add('is-window-shut');
      window.setTimeout(() => {
        cursor.style.opacity = '0';
      }, Math.round(PROMO_WINDOW_CLOSE_MS * 0.62));
      await waitMs(PROMO_WINDOW_CLOSE_MS);
      store.style.visibility = 'hidden';
      this.releasePainStage();
    }

    prepareScaleScene() {
      this.scaleGeneration = (this.scaleGeneration || 0) + 1;
      this.root.style.setProperty('--promo-scale-fade', `${PROMO_SCALE_FADE_MS}ms`);
      this.root.style.setProperty('--promo-puff-flash', `${PROMO_CONVEYOR_FLASH_MS}ms`);
      this.root.style.setProperty('--promo-puff-ms', `${PROMO_CONVEYOR_PUFF_MS}ms`);
      this.root.style.setProperty('--promo-puff-burst', `${PROMO_CONVEYOR_BURST_MS}ms`);
      this.root.style.setProperty('--promo-travel-line', String(PROMO_CORRIDOR.travelLine));
      this.root.style.setProperty('--promo-ring', `${PROMO_CORRIDOR.ringMs}ms`);
      this.root.style.setProperty('--promo-perspective', `${PROMO_CORRIDOR.perspective}px`);
      this.root.style.setProperty('--promo-origin-y', `${PROMO_CORRIDOR.originY * 100}%`);
      this.ensureWall();
      this.captureConveyorStill();
    }

    resetScaleScene() {
      this.scaleGeneration = (this.scaleGeneration || 0) + 1;
      this.wallClock = 0;
      window.cancelAnimationFrame(this.conveyorFrame);
      window.clearTimeout(this.snapTimer);
      window.clearTimeout(this.thudTimer);
      window.clearTimeout(this.puffTimer);
      this.root.classList.remove(
        'is-scale',
        'is-scale-shrink',
        'is-scale-white',
        'is-scale-zero',
        'is-scale-still',
        'is-scale-out',
        'is-end-pain',
        'is-end-pitch',
        'is-pitch-belt',
        'is-corridor',
        'is-grid',
        'is-grid-locked',
        'snap',
        'thud',
        'puff',
        'click',
      );
      this.residue?.reset();
      this.residue = null;
      this.openingResidueAt = 0;
      this.gridPaletteCache = null;
      this.gridThudSent = false;
      const caption = this.root.querySelector('[data-promo-end-caption]');
      if (caption) caption.textContent = GLIDE_PAIN_LINE;
      const scale = this.root.querySelector('[data-promo-scale]');
      if (scale) scale.hidden = true;
      const wall = this.root.querySelector('[data-promo-scale-wall]');
      if (wall) {
        wall.classList.remove('is-one');
        wall.style.transition = '';
        wall.style.removeProperty('--wall-n');
        wall.style.removeProperty('--wall-scale');
        delete wall.dataset.cameraLocked;
        wall.replaceChildren();
      }
      const center = this.root.querySelector('.promo-opening__center');
      if (center) {
        center.style.transition = '';
        center.style.opacity = '';
      }
    }

    revealScaleLayer() {
      const scale = this.root.querySelector('[data-promo-scale]');
      if (scale) scale.hidden = false;
      this.root.classList.add('is-scale', 'is-grid');
    }

    ensureWall() {
      const scale = this.root.querySelector('[data-promo-scale]');
      if (!scale) return null;
      let wall = scale.querySelector('[data-promo-scale-wall]');
      if (!wall) {
        wall = document.createElement('div');
        wall.className = 'promo-scale__wall';
        wall.setAttribute('data-promo-scale-wall', '');
        scale.prepend(wall);
      }
      let verdict = scale.querySelector('[data-promo-scale-verdict]');
      if (!verdict) {
        verdict = document.createElement('div');
        verdict.className = 'promo-scale__verdict';
        verdict.setAttribute('data-promo-scale-verdict', '');
        scale.append(verdict);
      }
      if (!verdict.querySelector('.promo-scale__end-hero')) {
        const hero = document.createElement('div');
        hero.className = 'promo-scale__end-hero';
        const zero = verdict.querySelector('.promo-scale__zero') || document.createElement('p');
        zero.className = 'promo-scale__zero';
        if (!zero.textContent) zero.textContent = '0';
        const mark = document.createElement('span');
        mark.className = 'promo-scale__mark';
        mark.setAttribute('data-promo-end-mark', '');
        const stamp = document.documentElement.getAttribute('data-promo-bizmis-stamp');
        if (stamp) {
          mark.style.webkitMaskImage = `url('${stamp}')`;
          mark.style.maskImage = `url('${stamp}')`;
        }
        hero.append(zero, mark);
        const caption = verdict.querySelector('.promo-scale__sold') || document.createElement('p');
        caption.className = 'promo-scale__sold';
        caption.setAttribute('data-promo-end-caption', '');
        if (!caption.textContent) caption.textContent = GLIDE_PAIN_LINE;
        verdict.replaceChildren(hero, caption);
      }
      scale.querySelector('[data-promo-residue]')?.remove();
      scale.querySelector('.promo-scale__world')?.setAttribute('hidden', '');
      scale.querySelector('.promo-scale__readout')?.setAttribute('hidden', '');
      return wall;
    }

    conveyorFrameWidth() {
      const canvas = this.root.querySelector('[data-promo-canvas]');
      return canvas?.clientWidth || this.root.querySelector('[data-promo-scale]')?.clientWidth || 1440;
    }

    conveyorSources() {
      const scale = this.root.querySelector('[data-promo-scale]');
      return {
        webm: scale?.getAttribute('data-promo-wall-webm') || '',
        mp4: scale?.getAttribute('data-promo-wall-mp4') || '',
      };
    }

    captureConveyorStill() {
      if (this.conveyorStill) return Promise.resolve(this.conveyorStill);
      if (this.conveyorStillTask) return this.conveyorStillTask;
      const { mp4 } = this.conveyorSources();
      if (!mp4) return Promise.resolve('');
      this.conveyorStillTask = new Promise((resolve) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.src = mp4;
        const finish = (still) => {
          this.conveyorStill = still || '';
          resolve(this.conveyorStill);
        };
        video.addEventListener('error', () => finish(''), { once: true });
        video.addEventListener('loadeddata', () => {
          const paint = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth || 480;
              canvas.height = video.videoHeight || 300;
              canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
              finish(canvas.toDataURL('image/jpeg', 0.72));
            } catch {
              finish('');
            }
          };
          video.addEventListener('seeked', paint, { once: true });
          try {
            video.currentTime = Math.min(PROMO_CONVEYOR_STILL_MS, (video.duration || 3) * 0.4);
          } catch {
            paint();
          }
        }, { once: true });
      });
      return this.conveyorStillTask;
    }

    conveyorPicture(live) {
      if (!live && this.conveyorStill) {
        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.src = this.conveyorStill;
        return img;
      }
      const { webm, mp4 } = this.conveyorSources();
      const video = document.createElement('video');
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      video.loop = live;
      if (webm) {
        const source = document.createElement('source');
        source.src = webm;
        source.type = 'video/webm';
        video.append(source);
      }
      if (mp4) {
        const source = document.createElement('source');
        source.src = mp4;
        source.type = 'video/mp4';
        video.append(source);
      }
      if (live) {
        video.autoplay = true;
        video.play().catch(() => {});
      } else {
        video.addEventListener('loadeddata', () => {
          try { video.currentTime = PROMO_CONVEYOR_STILL_MS; } catch { /* first frame */ }
          video.pause();
        }, { once: true });
      }
      return video;
    }

    mountPuff(host, index, basisWidth) {
      if (host.querySelector('.promo-scale__burst')) return;
      const width = host.getBoundingClientRect().width || parseFloat(host.style.width) || basisWidth;
      const fit = Math.max(1, width / Math.max(1, basisWidth));
      host.style.setProperty('--puff-fit', fit.toFixed(3));
      const burst = document.createElement('span');
      burst.className = 'promo-scale__burst';
      const specks = 20 + Math.floor(wallSeededUnit(index, 5) * 11);
      for (let bit = 0; bit < specks; bit += 1) {
        const speck = document.createElement('i');
        speck.className = 'promo-scale__speck';
        const angle = wallSeededUnit(index, 20 + bit) * Math.PI * 2;
        const dist = (18 + wallSeededUnit(index, 80 + bit) * 56) * fit;
        speck.style.setProperty('--dx', `${(Math.cos(angle) * dist).toFixed(1)}px`);
        speck.style.setProperty('--dy', `${(Math.sin(angle) * dist).toFixed(1)}px`);
        burst.appendChild(speck);
      }
      host.append(burst);
    }

    mountPitchChrome(frame) {
      const cart = document.createElement('span');
      cart.className = 'promo-scale__cart';
      cart.textContent = '1';
      frame.append(cart);
    }

    captureNeutralStage() {
      const store = this.painStore();
      if (!store) return;
      const rect = store.getBoundingClientRect();
      const wide = Math.round(rect.width) || store.offsetWidth;
      const tall = Math.round(rect.height) || store.offsetHeight;
      if (wide < 40 || tall < 40) return;
      if (this.neutralStage && this.neutralStageWidth >= 40) return;
      const clone = store.cloneNode(true);
      clone.querySelectorAll('[data-promo-pain-chat], [data-promo-pain-cursor]').forEach((node) => node.remove());
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      clone.classList.remove('is-belt-stage');
      clone.removeAttribute('style');
      this.neutralStage = clone;
      this.neutralStageWidth = wide;
      this.neutralStageHeight = tall;
    }

    mountPitchStage(frame, width) {
      frame.classList.add('is-neutral');
      if (!this.neutralStage || !this.neutralStageWidth) return;
      const height = Math.round(width / PROMO_CONVEYOR.aspect);
      const naturalW = this.neutralStageWidth;
      const naturalH = this.neutralStageHeight || Math.round(naturalW / PROMO_CONVEYOR.aspect);
      const scale = Math.min(width / naturalW, height / naturalH);
      const clone = this.neutralStage.cloneNode(true);
      clone.classList.add('is-belt-stage');
      clone.style.position = 'absolute';
      clone.style.width = `${naturalW}px`;
      clone.style.height = `${naturalH}px`;
      clone.style.maxWidth = 'none';
      clone.style.maxHeight = 'none';
      clone.style.transformOrigin = 'top left';
      clone.style.left = `${((width - naturalW * scale) / 2).toFixed(1)}px`;
      clone.style.top = `${((height - naturalH * scale) / 2).toFixed(1)}px`;
      clone.style.transform = `scale(${scale.toFixed(4)})`;
      frame.appendChild(clone);
    }

    showClip(overrides) {
      const fromUrl = readPromoClip();
      const clip = {
        device: 'desktop',
        motion: 'scroll-up',
        chat: false,
        tone: 'pain',
        ...(fromUrl || {}),
        ...(overrides || {}),
      };
      const motions = PROMO_CLIP_MOTIONS[clip.device] || PROMO_CLIP_MOTIONS.desktop;
      const moment = momentClipParts(clip.motion);
      if (!PROMO_CLIP_DEVICES.includes(clip.device)) clip.device = 'desktop';
      if (!moment && !motions.includes(clip.motion)) clip.motion = motions[0];
      clip.tone = moment || clip.tone === 'pitch' ? 'pitch' : 'pain';
      clip.chat = !!clip.chat && !moment;

      document.documentElement.classList.add('is-promo-clip');
      document.getElementById('page-loader')?.setAttribute('hidden', '');
      this.root.classList.add('is-clip');
      PROMO_CLIP_DEVICES.forEach((id) => this.root.classList.toggle(`is-clip-${id}`, id === clip.device));
      PROMO_CLIP_MOTION_ALL.forEach((id) => this.root.classList.toggle(`is-motion-${id}`, id === clip.motion));
      this.root.classList.toggle('is-tone-pain', clip.tone === 'pain');
      this.root.classList.toggle('is-tone-pitch', clip.tone === 'pitch');
      this.root.classList.toggle('is-pain-loop', clip.tone === 'pain');
      this.root.classList.toggle('is-chat', clip.chat);
      document.documentElement.style.setProperty('--ad-warmth', clip.tone === 'pitch' ? '1' : '0');

      this.openPainStage();
      this.applyPainBeat(clip.chat && clip.tone === 'pain' ? 'answer-2' : 'grid', true);
      this.root.querySelectorAll('.promo-clip__product, .promo-clip__clerk, [data-promo-clip]').forEach((node) => node.remove());
      this.painHost()?.querySelector('.promo-moments__board')?.removeAttribute('hidden');

      const chat = this.root.querySelector('[data-promo-pain-chat]');
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const wander = clip.device === 'desktop' && (clip.motion === 'wander-near' || clip.motion === 'wander-far');
      if (chat && !(clip.chat && clip.tone === 'pain')) {
        chat.setAttribute('hidden', '');
        chat.classList.remove('is-open');
      }
      if (cursor) {
        cursor.hidden = !wander;
        cursor.style.opacity = wander ? '1' : '0';
        cursor.style.transitionDuration = '0ms';
      }

      const store = this.painStore();
      if (moment) {
        this.showMomentClip(clip, moment);
        return;
      }
      if (clip.device === 'desktop') {
        if (store) store.style.visibility = '';
        if (clip.motion === 'product-read' || clip.motion === 'product-scroll' || clip.motion === 'compare') {
          this.mountClipProduct(store?.querySelector('.promo-opening__moments-stage'), clip);
        }
      } else if (store) {
        store.style.visibility = 'hidden';
        this.mountHandheldClip(clip);
      }

      this.root.dataset.clipDevice = clip.device;
      this.root.dataset.clipMotion = clip.motion;
      this.root.dataset.clipTone = clip.tone;
      this.root.dataset.clipChat = clip.chat ? '1' : '0';
      this.root.setAttribute('data-promo-clip-ready', '1');
    }

    showMomentClip(clip, moment) {
      document.documentElement.classList.add('is-promo-pitch', 'is-clip-moment', 'is-promo-clerk');
      document.documentElement.style.setProperty('--ad-warmth', '1');
      this.root.classList.add('is-pitch', 'is-moments', 'is-clip-moment');
      this.root.classList.remove('is-pain-loop', 'is-tone-pain');
      this.root.querySelector('[data-promo-clip]')?.remove();
      this.root.querySelectorAll('.promo-clip__clerk, .promo-grid__clerk').forEach((node) => node.remove());
      const store = this.painStore();
      if (store) store.style.visibility = '';
      const stage = this.momentStage();
      const board = stage?.querySelector('.promo-moments__board');
      if (board) {
        delete board.dataset.clayReady;
        delete board.dataset.gridLaid;
      }
      promoWidget.applyStoreLook(this.bizmisLook());
      this.parkWidget();
      this.clipClerkScale = clip.device === 'phone' ? 0.62 : clip.device === 'tablet' ? 0.55 : 0.72;
      if (stage) {
        applyMomentPose(stage, moment.pose, { instant: false });
        applyMomentTake(stage.querySelector('.promo-moments__board'), moment.take);
      }
      this.seatClerkInStore(true);
      const gesture = moment.scene === 'catalog' ? 'waving' : 'nod';
      window.setTimeout(() => setOpeningAvatarAction(gesture), 400);
      this.root.dataset.clipDevice = clip.device;
      this.root.dataset.clipMotion = clip.motion;
      this.root.dataset.clipTone = 'pitch';
      this.root.dataset.clipChat = '0';
      this.root.setAttribute('data-promo-clip-ready', '1');
    }

    mountClipProduct(host, clip) {
      if (!host) return;
      const stage = document.createElement('div');
      stage.className = `promo-clip__product is-${clip.motion}`;
      const looks = gridAllLooks();
      const scroller = document.createElement('div');
      scroller.className = 'promo-clip__scroll';
      const count = clip.motion === 'compare' ? 2 : 1;
      for (let index = 0; index < count; index += 1) {
        scroller.appendChild(this.clipHero(looks[index], clip.motion !== 'compare'));
      }
      if (clip.motion === 'product-scroll') {
        const blurb = document.createElement('div');
        blurb.className = 'promo-clip__blurb';
        blurb.innerHTML = '<i></i><i></i><i></i><i class="is-short"></i>';
        scroller.appendChild(blurb);
      }
      stage.appendChild(scroller);
      host.appendChild(stage);
    }

    clipHero(look, withCopy) {
      const card = document.createElement('div');
      card.className = 'promo-clip__hero';
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      const src = claySrc(look);
      if (src) img.src = src;
      card.appendChild(img);
      if (withCopy) {
        const copy = document.createElement('div');
        copy.className = 'promo-clip__copy';
        copy.innerHTML = '<i></i><i class="is-short"></i><i></i><i class="is-mid"></i>';
        card.appendChild(copy);
      }
      return card;
    }

    clipCard(look) {
      const card = document.createElement('article');
      card.className = 'promo-clip__card';
      const img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      const src = claySrc(look);
      if (src) img.src = src;
      const price = document.createElement('p');
      price.className = 'promo-clip__price';
      price.innerHTML = '<span>$</span><i></i>';
      card.append(img, price);
      return card;
    }

    clipStatus(device) {
      const status = document.createElement('div');
      status.className = 'promo-clip__status';
      const time = document.createElement('span');
      time.className = 'promo-clip__time';
      time.textContent = '9:41';
      const island = document.createElement('span');
      island.className = 'promo-clip__island';
      const icons = document.createElement('span');
      icons.className = 'promo-clip__status-icons';
      icons.innerHTML = '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.6"/><rect x="5" y="5" width="3" height="7" rx="0.6"/><rect x="10" y="2" width="3" height="10" rx="0.6"/><rect x="15" y="0" width="3" height="12" rx="0.6" opacity="0.35"/></svg><svg viewBox="0 0 26 12" aria-hidden="true"><rect x="0.6" y="0.6" width="22" height="10.8" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="23.6" y="3.6" width="1.5" height="4.8" rx="0.4"/><rect x="2.4" y="2.4" width="15.2" height="7.2" rx="1"/></svg>';
      status.append(time, island, icons);
      status.dataset.device = device;
      return status;
    }

    clipStoreBar() {
      const bar = this.painStore()?.querySelector('.promo-opening__store-bar');
      if (!bar) return document.createElement('div');
      const clone = bar.cloneNode(true);
      clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      return clone;
    }

    mountClipClerk(host) {
      const clerk = document.createElement('span');
      clerk.className = 'promo-clip__clerk';
      clerk.setAttribute('aria-hidden', 'true');
      host.appendChild(clerk);
    }

    mountHandheldClip(clip) {
      const frame = document.createElement('div');
      frame.className = `promo-clip is-${clip.device}`;
      frame.setAttribute('data-promo-clip', '');
      const bezel = document.createElement('div');
      bezel.className = 'promo-clip__bezel';
      const screen = document.createElement('div');
      screen.className = 'promo-clip__screen';
      const cols = clip.device === 'tablet' ? 3 : 2;
      const looks = gridAllLooks().slice(0, cols * 4);
      const track = document.createElement('div');
      track.className = 'promo-clip__track';
      for (let copy = 0; copy < 2; copy += 1) {
        const sheet = document.createElement('div');
        sheet.className = 'promo-clip__sheet';
        sheet.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        looks.forEach((look) => sheet.appendChild(this.clipCard(look)));
        track.appendChild(sheet);
      }
      screen.appendChild(track);
      if (clip.motion === 'product-read' || clip.motion === 'product-scroll' || clip.motion === 'compare') {
        this.mountClipProduct(screen, clip);
      }
      if (clip.chat && clip.tone === 'pain') {
        const chat = this.root.querySelector('[data-promo-pain-chat]');
        if (chat) {
          const clone = chat.cloneNode(true);
          clone.removeAttribute('id');
          clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
          clone.removeAttribute('hidden');
          clone.classList.add('is-open');
          screen.appendChild(clone);
        }
      }
      const home = document.createElement('span');
      home.className = 'promo-clip__home';
      bezel.append(this.clipStatus(clip.device), this.clipStoreBar(), screen, home);
      frame.appendChild(bezel);
      this.root.appendChild(frame);
    }

    gridFrame() {
      const scale = this.root.querySelector('[data-promo-scale]');
      const rect = scale?.getBoundingClientRect();
      const width = Math.round(rect?.width || 0);
      const height = Math.round(rect?.height || 0);
      if (width >= 40 && height >= 40) return { width, height };
      return { width: 1440, height: 810 };
    }

    gridLeadNode(mode) {
      if (mode === 'pitch' && this.neutralStage) {
        const clone = this.neutralStage.cloneNode(true);
        clone.dataset.naturalW = String(this.neutralStageWidth || 0);
        clone.dataset.naturalH = String(this.neutralStageHeight || 0);
        return clone;
      }
      const store = this.painStore();
      if (!store) return null;
      const clone = store.cloneNode(true);
      if (mode === 'pitch') {
        clone.querySelectorAll('[data-promo-pain-chat], [data-promo-pain-cursor]').forEach((node) => node.remove());
      }
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      clone.classList.remove('is-belt-stage');
      clone.removeAttribute('style');
      const rect = store.getBoundingClientRect();
      clone.dataset.naturalW = String(Math.round(rect.width) || store.offsetWidth || 0);
      clone.dataset.naturalH = String(Math.round(rect.height) || store.offsetHeight || 0);
      return clone;
    }

    gridPalette() {
      if (this.gridPaletteCache) return this.gridPaletteCache;
      const fontProbe = document.createElement('span');
      fontProbe.style.fontFamily = 'var(--font-heading)';
      this.root.appendChild(fontProbe);
      const font = getComputedStyle(fontProbe).fontFamily || 'sans-serif';
      fontProbe.remove();
      this.gridPaletteCache = {
        primary: gridCssColor(this.root, '--bizmis-primary', '#f9a353'),
        red: gridCssColor(this.root, '--ad-red', '#E5533D'),
        ink: gridCssColor(this.root, '--ad-ink', '#171717'),
        ink3: gridCssColor(this.root, '--ad-ink-3', '#969696'),
        surface: gridCssColor(this.root, '--ad-surface', '#F6F4F1'),
        font,
      };
      return this.gridPaletteCache;
    }

    glideProbe() {
      return this.glideStats || {
        coverage: false,
        nearCellWidth: 0,
        activeEvents: 0,
        phase: '',
        mode: '',
      };
    }

    ensureGlideFilter() {
      if (document.getElementById('promo-glide-blur')) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.id = 'promo-glide-blur';
      filter.setAttribute('x', '-30%');
      filter.setAttribute('y', '-30%');
      filter.setAttribute('width', '160%');
      filter.setAttribute('height', '160%');
      const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.id = 'promo-glide-blur-node';
      blur.setAttribute('stdDeviation', '0 0');
      filter.append(blur);
      svg.append(filter);
      document.body.append(svg);
    }

    mountGlide(mode) {
      const wall = this.ensureWall();
      if (!wall) return null;
      this.ensureGlideFilter();
      const frame = this.gridFrame();
      const existing = wall.querySelector('[data-promo-glide]');
      if (existing && existing.dataset.mode === mode && existing.dataset.frameW === String(frame.width)) return existing;
      const store = this.painStore();
      const wallBox = wall.getBoundingClientRect();
      const storeBox = store?.getBoundingClientRect();
      wall.replaceChildren();
      const root = document.createElement('div');
      root.className = `promo-glide${mode === 'pitch' ? ' is-pitch' : ' is-pain'}`;
      root.setAttribute('data-promo-glide', '');
      root.dataset.mode = mode;
      root.dataset.frameW = String(frame.width);
      const streak = document.createElement('div');
      streak.className = 'promo-glide__streak';
      const level = document.createElement('div');
      level.className = 'promo-glide__level';
      const world = document.createElement('div');
      world.className = 'promo-glide__world';
      world.style.perspective = `${PROMO_GLIDE.perspective}px`;
      const tilt = document.createElement('div');
      tilt.className = 'promo-glide__tilt';
      tilt.style.transform = `rotateX(${PROMO_GLIDE.tilt}deg) rotateZ(${PROMO_GLIDE.yaw}deg)`;
      const sheet = document.createElement('div');
      sheet.className = 'promo-glide__sheet';
      const pool = [];
      for (let index = 0; index < PROMO_GLIDE.pool; index += 1) {
        const cell = document.createElement('div');
        cell.className = 'promo-glide__cell promo-device';
        const still = document.createElement('img');
        still.className = 'promo-glide__still';
        still.alt = '';
        const video = document.createElement('video');
        video.className = 'promo-glide__video';
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        const bloom = document.createElement('div');
        bloom.className = 'promo-glide__bloom';
        const rays = document.createElement('div');
        rays.className = 'promo-glide__rays';
        for (let ray = 0; ray < 8; ray += 1) {
          const spoke = document.createElement('i');
          spoke.style.setProperty('--ray', String(ray));
          rays.append(spoke);
        }
        const poof = document.createElement('div');
        poof.className = 'promo-glide__poof';
        const dust = document.createElement('i');
        dust.className = 'promo-glide__dust';
        poof.append(dust);
        const speckTones = ['#e4dfd8', '#cfc8bf', '#b7b1aa', '#9c968f'];
        for (let bit = 0; bit < 28; bit += 1) {
          const speck = document.createElement('i');
          speck.className = bit % 4 === 0 ? 'promo-glide__speck is-mote' : 'promo-glide__speck';
          speck.style.setProperty('--speck', `${3 + (bit % 5) * 2.2}px`);
          speck.style.background = speckTones[bit % speckTones.length];
          poof.append(speck);
        }
        cell.append(still, video, bloom, rays, poof);
        sheet.append(cell);
        pool.push(cell);
      }
      tilt.append(sheet);
      world.append(tilt);
      level.append(world);
      streak.append(level);
      const light = document.createElement('div');
      light.className = 'promo-glide__light';
      const dofMid = document.createElement('div');
      dofMid.className = 'promo-glide__dof promo-glide__dof-mid';
      const dofFar = document.createElement('div');
      dofFar.className = 'promo-glide__dof promo-glide__dof-far';
      const field = document.createElement('div');
      field.className = 'promo-glide__field';
      field.setAttribute('data-promo-grid-field', '');
      const lead = document.createElement('div');
      lead.className = 'promo-glide__lead';
      if (mode === 'pitch') {
        const image = document.createElement('img');
        image.alt = '';
        image.src = document.documentElement.getAttribute('data-promo-pitch-lead') || '';
        lead.append(image);
      } else {
        const clone = this.gridLeadNode('pain');
        if (clone) lead.append(clone);
      }
      root.append(streak, light, dofMid, dofFar, field, lead);
      wall.append(root);
      if (store) store.style.visibility = 'hidden';
      const start = storeBox && storeBox.width > 40
        ? {
          x: storeBox.left - wallBox.left,
          y: storeBox.top - wallBox.top,
          w: storeBox.width,
          h: storeBox.height,
        }
        : null;
      this.glideLeadStart = start;
      this.glideLeadKey = glideLeadCell(frame)?.key || '';
      return root;
    }

    paintGlideCell(node, cell, mode, timeMs, view, live) {
      const frame = this.gridFrame();
      const event = glideEventAt(mode, frame, cell.key, timeMs);
      const dustLife = PROMO_GLIDE.poofMs + PROMO_GLIDE.dustMs;
      if (mode !== 'pitch' && event && timeMs - event.t >= dustLife) {
        node.classList.remove('is-dusting');
        node.dataset.key = cell.key;
        return false;
      }
      const blooming = mode === 'pitch' && event && timeMs - event.t < PROMO_GLIDE.bloomMs + PROMO_GLIDE.burstMs;
      const poofing = mode !== 'pitch' && event && timeMs - event.t < dustLife;
      const stamp = `${cell.key}|${live ? 1 : 0}|${event ? event.t : ''}`;
      if (node.dataset.stamp === stamp && !blooming && !poofing) {
        node.hidden = false;
        return true;
      }
      node.dataset.stamp = stamp;
      node.classList.remove('is-dusting');
      const unit = view.span.unit;
      const tone = mode === 'pitch' ? 'pitch' : 'pain';
      const chat = mode !== 'pitch';
      const motion = glideMotion(cell, mode);
      const clipKey = `${tone}-${cell.id}-${motion}-${chat ? '1' : '0'}`;
      node.dataset.key = cell.key;
      node.classList.toggle('is-desktop', cell.id === 'desktop');
      node.classList.toggle('is-tablet', cell.id === 'tablet');
      node.classList.toggle('is-phone', cell.id === 'phone');
      const width = cell.w * unit;
      const height = cell.h * unit;
      node.hidden = false;
      node.style.width = `${width.toFixed(2)}px`;
      node.style.height = `${height.toFixed(2)}px`;
      node.style.transform = `translate3d(${(cell.x * unit).toFixed(2)}px, ${(cell.y * unit).toFixed(2)}px, 0)`;
      node.style.borderRadius = `${gridMockupRadius(cell.device, width).toFixed(2)}px`;
      const still = node.querySelector('.promo-glide__still');
      const video = node.querySelector('.promo-glide__video');
      if (video) video.style.transform = '';
      if (still) still.style.transform = '';
      const leadStill = mode === 'pitch' && cell.key === this.glideLeadKey;
      const stillSrc = leadStill
        ? (document.documentElement.getAttribute('data-promo-pitch-lead') || '')
        : glideStillSrc(tone, cell.id, motion, chat);
      if (still && still.dataset.src !== stillSrc) {
        still.dataset.src = stillSrc;
        still.src = stillSrc;
      }
      const wantVideo = live && !leadStill && timeMs >= PROMO_GLIDE.layDownMs;
      if (video) {
        if (wantVideo && video.dataset.clip !== clipKey) {
          video.dataset.clip = clipKey;
          video.src = clipSrc(tone, cell.id, motion, chat);
          const offset = wallSeededUnit(cell.row * 3 + cell.col, 19) * 1.4;
          const seek = () => {
            if (video.duration && offset < video.duration) video.currentTime = offset;
          };
          video.addEventListener('loadeddata', seek, { once: true });
          video.play().catch(() => {});
        }
        if (!wantVideo && video.dataset.clip) {
          video.pause();
          video.removeAttribute('src');
          video.dataset.clip = '';
          video.load();
        }
        video.hidden = !wantVideo;
      }
      if (still) still.hidden = wantVideo;
      const bloom = node.querySelector('.promo-glide__bloom');
      const rays = node.querySelector('.promo-glide__rays');
      const poof = node.querySelector('.promo-glide__poof');
      node.style.opacity = '';
      if (still) still.style.opacity = '';
      if (video) video.style.opacity = '';
      if (bloom) bloom.style.opacity = '0';
      if (rays) rays.style.opacity = '0';
      if (poof) poof.style.opacity = '0';
      if (!event) return true;
      if (mode === 'pitch') {
        const cart = GLIDE_CART[cell.id] || GLIDE_CART.desktop;
        const age = timeMs - event.t;
        const grow = Math.min(1, age / PROMO_GLIDE.bloomMs);
        const burst = Math.min(1, age / PROMO_GLIDE.burstMs);
        if (bloom) {
          bloom.style.opacity = '1';
          bloom.style.setProperty('--bloom-x', `${(cart.x * 100).toFixed(1)}%`);
          bloom.style.setProperty('--bloom-y', `${(cart.y * 100).toFixed(1)}%`);
          bloom.style.setProperty('--bloom', grow.toFixed(3));
          bloom.classList.toggle('is-settled', grow >= 1);
        }
        if (rays) {
          const flash = burst < 1 ? Math.sin(burst * Math.PI) : 0;
          rays.style.opacity = flash.toFixed(3);
          rays.style.setProperty('--burst', burst.toFixed(3));
          rays.style.setProperty('--bloom-x', `${(cart.x * 100).toFixed(1)}%`);
          rays.style.setProperty('--bloom-y', `${(cart.y * 100).toFixed(1)}%`);
        }
        return true;
      }
      const age = timeMs - event.t;
      const cardU = Math.min(1, age / PROMO_GLIDE.poofMs);
      const dustU = Math.min(1, age / dustLife);
      const fade = cardU >= 1 ? '0' : (1 - cardU).toFixed(3);
      const shrink = `scale(${(1 - 0.22 * cardU).toFixed(3)})`;
      node.classList.add('is-dusting');
      node.style.setProperty('--card-left', fade);
      if (still) {
        still.style.opacity = fade;
        still.style.transform = shrink;
      }
      if (video) {
        video.style.opacity = fade;
        video.style.transform = shrink;
      }
      if (poof) {
        const puff = Math.sin(dustU * Math.PI);
        poof.style.opacity = String(Math.min(1, puff * 1.2).toFixed(3));
        const fly = dustU ** 0.55;
        poof.querySelectorAll('.promo-glide__speck').forEach((speck, index) => {
          const angle = wallSeededUnit(cell.row + cell.col, 20 + index) * Math.PI * 2;
          const dist = (48 + wallSeededUnit(cell.col, 40 + index) * 130) * fly;
          speck.style.transform = `translate(${(Math.cos(angle) * dist).toFixed(1)}px, ${(Math.sin(angle) * dist).toFixed(1)}px)`;
        });
        const cloud = poof.querySelector('.promo-glide__dust');
        if (cloud) {
          cloud.style.opacity = (puff * 0.9).toFixed(3);
          cloud.style.transform = `scale(${(0.35 + dustU * 1.85).toFixed(3)})`;
        }
      }
      return true;
    }

    paintGlideEnd(timeMs, mode) {
      const verdict = this.root.querySelector('[data-promo-scale-verdict]');
      const hero = verdict?.querySelector('.promo-scale__end-hero');
      const caption = verdict?.querySelector('.promo-scale__sold');
      const field = this.root.querySelector('[data-promo-grid-field]');
      if (!verdict || !hero) return;
      const endAt = PROMO_GLIDE.layDownMs + PROMO_GLIDE.rampMs + PROMO_GLIDE.dissolveMs + PROMO_GLIDE.fieldHoldMs;
      this.root.classList.toggle('is-end-pitch', mode === 'pitch');
      this.root.classList.toggle('is-end-pain', mode !== 'pitch');
      const streak = this.root.querySelector('.promo-glide__streak');
      if (timeMs < endAt) {
        verdict.style.opacity = '0';
        verdict.style.transform = '';
        if (caption) caption.style.opacity = '0';
        if (streak) streak.style.opacity = '1';
        if (field && glidePhase(timeMs) === 'field') field.style.opacity = glideFieldOpacity(timeMs).toFixed(3);
        return;
      }
      const elapsed = timeMs - endAt;
      const settle = Math.min(1, elapsed / PROMO_GLIDE.resolveMs);
      const ease = 1 - (1 - settle) ** 3;
      const colors = this.gridPalette();
      const mark = verdict.querySelector('.promo-scale__mark');
      verdict.style.opacity = '1';
      if (streak) streak.style.opacity = (1 - ease).toFixed(3);
      if (mode === 'pitch') {
        const scale = 11 + (1 - 11) * ease;
        verdict.style.transformOrigin = 'center calc(50% - 24px)';
        verdict.style.transform = `scale(${scale.toFixed(3)})`;
        if (mark) {
          mark.style.background = colors.primary;
          mark.style.transform = 'none';
        }
        if (caption) {
          caption.textContent = 'Built to sell.';
          caption.style.opacity = '1';
          caption.style.transform = 'none';
        }
        if (field) field.style.opacity = (1 - ease).toFixed(3);
        if (ease >= 1 && !this.gridThudSent) {
          this.gridThudSent = true;
          this.emitThud();
        }
        return;
      }
      verdict.style.transform = 'none';
      if (caption) {
        caption.textContent = GLIDE_PAIN_LINE;
        caption.style.opacity = ease.toFixed(3);
        caption.style.transform = `translateY(${((1 - ease) * 28).toFixed(1)}px)`;
      }
      if (field) field.style.opacity = (1 - ease).toFixed(3);
    }

    paintGlideAt(timeMs, mode, options = {}) {
      const root = this.mountGlide(mode);
      if (!root) return;
      const frame = this.gridFrame();
      const time = options.reduced ? PROMO_GLIDE.layDownMs + 1500 : timeMs;
      const view = glideCells(time, frame);
      const sheet = root.querySelector('.promo-glide__sheet');
      const streak = root.querySelector('.promo-glide__streak');
      const level = root.querySelector('.promo-glide__level');
      const lead = root.querySelector('.promo-glide__lead');
      const field = root.querySelector('.promo-glide__field');
      const cam = view.span.cam;
      if (sheet) {
        sheet.style.transform = `translate3d(${(frame.width / 2 - cam.x).toFixed(2)}px, ${(frame.height / 2 - cam.y).toFixed(2)}px, 0)`;
        const lay = Math.min(1, time / PROMO_GLIDE.layDownMs);
        sheet.style.opacity = options.reduced ? '1' : lay.toFixed(3);
      }
      const blur = options.reduced ? 0 : glideBlurPx(time);
      if (streak && level) {
        if (blur > 0.4) {
          const angle = glideBlurAngle();
          streak.style.transform = `rotate(${angle.toFixed(2)}deg) scale(1.14)`;
          level.style.transform = `rotate(${(-angle).toFixed(2)}deg) scale(${(1 / 1.14).toFixed(4)})`;
          streak.style.filter = 'url(#promo-glide-blur)';
          document.getElementById('promo-glide-blur-node')?.setAttribute('stdDeviation', `${blur.toFixed(2)} 0`);
        } else {
          streak.style.transform = '';
          level.style.transform = '';
          streak.style.filter = '';
        }
      }
      root.querySelectorAll('.promo-glide__dof').forEach((layer) => {
        layer.style.visibility = blur > 8 ? 'hidden' : '';
      });
      const nearRow = Math.floor(view.span.maxY / view.pitch);
      const speed = cam.speed;
      const liveOk = speed <= PROMO_GLIDE.liveMaxSpeed && glidePhase(time) === 'glide';
      const pool = [...root.querySelectorAll('.promo-glide__cell')];
      const used = new Set();
      let shown = 0;
      view.cells.forEach((cell) => {
        if (cell.key === this.glideLeadKey && time < PROMO_GLIDE.layDownMs) return;
        const node = pool.find((item) => item.dataset.key === cell.key && !used.has(item))
          || pool.find((item) => !used.has(item));
        if (!node) return;
        const live = liveOk && cell.row >= nearRow - (PROMO_GLIDE.liveRows - 1) && cell.row <= nearRow;
        const keep = this.paintGlideCell(node, cell, mode, time, view, live);
        used.add(node);
        if (!keep) {
          node.hidden = true;
          return;
        }
        shown += 1;
      });
      pool.forEach((node) => {
        if (!used.has(node)) node.hidden = true;
      });
      if (lead) {
        const leadCell = view.cells.find((cell) => cell.key === this.glideLeadKey) || glideLeadCell(frame);
        const end = leadCell ? glideCellScreen(leadCell, cam, view.span.unit, frame) : null;
        const start = this.glideLeadStart || end;
        const lay = options.reduced ? 1 : Math.min(1, time / PROMO_GLIDE.layDownMs);
        const ease = 1 - (1 - lay) ** 3;
        if (start && end && lay < 1) {
          lead.hidden = false;
          lead.style.opacity = lay > 0.84 ? ((1 - lay) / 0.16).toFixed(3) : '1';
          lead.style.left = `${(start.x + (end.x - start.x) * ease).toFixed(1)}px`;
          lead.style.top = `${(start.y + (end.y - start.y) * ease).toFixed(1)}px`;
          lead.style.width = `${(start.w + (end.w - start.w) * ease).toFixed(1)}px`;
          lead.style.height = `${(start.h + (end.h - start.h) * ease).toFixed(1)}px`;
        } else {
          lead.hidden = true;
        }
      }
      if (field && glidePhase(time) !== 'end') field.style.opacity = glideFieldOpacity(time).toFixed(3);
      if (!options.reduced) this.paintGlideEnd(time, mode);
      const activeEvents = glideEvents(mode, frame).filter((event) => event.t <= time).length;
      this.glideStats = {
        coverage: glideCoverage(time, frame),
        nearCellWidth: Math.round(glideNearWidth(frame) * 10) / 10,
        activeEvents,
        shown,
        phase: options.reduced ? 'glide' : glidePhase(time),
        mode,
      };
    }

    runGlide(mode) {
      window.cancelAnimationFrame(this.planeFrame);
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        this.paintGlideAt(elapsed, mode);
        if (elapsed < glidePlayEnd()) this.planeFrame = window.requestAnimationFrame(step);
      };
      this.planeFrame = window.requestAnimationFrame(step);
    }

    whenGlideMediaReady() {
      const videos = [...this.root.querySelectorAll('.promo-glide__cell:not([hidden]) video.promo-glide__video')];
      const pending = videos.filter((video) => video.getAttribute('src') && video.readyState < 2);
      if (!pending.length) return Promise.resolve();
      return Promise.race([
        Promise.all(pending.map((video) => new Promise((resolve) => {
          const done = () => resolve();
          video.addEventListener('loadeddata', done, { once: true });
          video.addEventListener('error', done, { once: true });
        }))),
        waitMs(2500),
      ]);
    }

    clearGridResolve() {
      const verdict = this.root.querySelector('[data-promo-scale-verdict]');
      const hero = verdict?.querySelector('.promo-scale__end-hero');
      const zero = verdict?.querySelector('.promo-scale__zero');
      const mark = verdict?.querySelector('.promo-scale__mark');
      const caption = verdict?.querySelector('.promo-scale__sold');
      [verdict, hero, zero, mark, caption].forEach((node) => {
        if (!node) return;
        node.style.opacity = '';
        node.style.transform = '';
        node.style.color = '';
        node.style.background = '';
      });
    }

    puffPainStore() {
      const store = this.painStore();
      if (!store) return;
      store.style.transform = '';
      store.style.transition = 'none';
      let host = store.parentElement;
      if (!host?.classList.contains('promo-puff__host')) {
        host = document.createElement('div');
        host.className = 'promo-puff__host';
        store.parentElement.insertBefore(host, store);
        host.appendChild(store);
      }
      store.classList.add('promo-puff__body');
      this.openingResidueAt = performance.now();
      this.mountPuff(host, 0, this.conveyorFrameWidth() * PROMO_CONVEYOR_SIZE_START);
      host.classList.remove('is-puff');
      void host.offsetWidth;
      host.classList.add('is-puff');
      this.emitPuff();
    }

    emitSnap() {
      const root = this.root;
      window.clearTimeout(this.snapTimer);
      root.classList.remove('snap');
      void root.offsetWidth;
      root.classList.add('snap');
      this.snapTimer = window.setTimeout(() => {
        root.classList.remove('snap');
      }, PROMO_SCALE_SNAP_CLASS_MS);
      this.painTimers = this.painTimers || [];
      this.painTimers.push(this.snapTimer);
    }

    emitClick() {
      const root = this.root;
      window.clearTimeout(this.clickTimer);
      root.classList.remove('click');
      void root.offsetWidth;
      root.classList.add('click');
      this.clickTimer = window.setTimeout(() => {
        root.classList.remove('click');
      }, PROMO_SCALE_SNAP_CLASS_MS);
      this.momentTimers = this.momentTimers || [];
      this.momentTimers.push(this.clickTimer);
    }

    emitPuff() {
      const root = this.root;
      window.clearTimeout(this.puffTimer);
      root.classList.remove('puff');
      void root.offsetWidth;
      root.classList.add('puff');
      this.puffTimer = window.setTimeout(() => {
        root.classList.remove('puff');
      }, PROMO_SCALE_SNAP_CLASS_MS);
      this.painTimers = this.painTimers || [];
      this.painTimers.push(this.puffTimer);
    }

    emitThud() {
      const root = this.root;
      window.clearTimeout(this.thudTimer);
      root.classList.remove('thud');
      void root.offsetWidth;
      root.classList.add('thud');
      this.thudTimer = window.setTimeout(() => {
        root.classList.remove('thud');
      }, PROMO_SCALE_SNAP_CLASS_MS);
      this.painTimers = this.painTimers || [];
      this.painTimers.push(this.thudTimer);
    }

    armScaleTimer(fn, ms) {
      const timer = window.setTimeout(fn, ms);
      this.painTimers = this.painTimers || [];
      this.painTimers.push(timer);
      return timer;
    }

    hideScaleStore() {
      const store = this.painStore();
      const host = store?.parentElement?.classList.contains('promo-puff__host') ? store.parentElement : store;
      if (host) host.style.visibility = 'hidden';
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      if (cursor) cursor.style.opacity = '0';
    }

    async fadeScaleToSwitch() {
      const center = this.root.querySelector('.promo-opening__center');
      this.root.classList.add('is-scale-out');
      if (center) {
        center.style.transition = 'none';
        center.style.opacity = '0';
        center.getBoundingClientRect();
        center.style.transition = `opacity ${PROMO_SCALE_FADE_MS}ms linear`;
        center.style.opacity = '1';
      }
      await waitMs(PROMO_SCALE_FADE_MS);
      this.releasePainStage();
    }

    async playScaleScene() {
      if (!this.root.classList.contains('is-pain')) return;
      if (!this.root.querySelector('[data-promo-scale]')) return;
      this.prepareScaleScene();
      if (prefersReducedMotion()) {
        this.hideScaleStore();
        this.revealScaleLayer();
        this.root.classList.add('is-scale-still');
        await this.captureConveyorStill();
        this.paintGlideAt(0, 'pain', { reduced: true });
        await waitMs(400);
        await this.playConveyorEnd('pain');
        if (marketingPart() === 'full') {
          await this.fadeScaleToSwitch();
          await waitMs(PROMO_TOGGLE_REST_MS);
          this.flip();
        }
        return;
      }
      await this.playScaleTimeline();
      if (marketingPart() === 'full') {
        await this.fadeScaleToSwitch();
        await waitMs(PROMO_TOGGLE_REST_MS);
        this.flip();
      }
    }

    async aimCursorAtWindowClose() {
      const store = this.painStore();
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const dot = store?.querySelector('[data-promo-window-close]');
      if (!store || !cursor || !dot) return;
      cursor.hidden = false;
      cursor.style.transitionDuration = '0ms';
      cursor.style.opacity = '0';
      cursor.style.setProperty('--pain-x', `${Math.round(store.clientWidth * 0.42)}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(store.clientHeight * 0.58)}px`);
      cursor.getBoundingClientRect();
      cursor.style.transitionDuration = '';
      cursor.style.opacity = '1';
      await waitMs(320);
      this.root.style.setProperty('--promo-pain-ease', 'cubic-bezier(0.45, 0, 0.2, 1)');
      this.root.style.setProperty('--promo-pain-open', `${PROMO_WINDOW_AIM_MS}ms`);
      const aim = this.painCursorPoint(dot);
      if (!aim) return;
      cursor.style.setProperty('--pain-x', `${Math.round(aim.x)}px`);
      cursor.style.setProperty('--pain-y', `${Math.round(aim.y)}px`);
      this.pinWindowCloseOrigin();
      this.root.classList.add('is-window-aim');
      await waitMs(PROMO_WINDOW_AIM_MS + PROMO_WINDOW_HOLD_MS);
      this.emitClick();
    }

    async playScaleTimeline() {
      const generation = this.scaleGeneration;
      this.revealScaleLayer();
      this.mountGlide('pain');
      if (generation !== this.scaleGeneration) return;
      this.runGlide('pain');
      await waitMs(glidePlayEnd());
      if (generation !== this.scaleGeneration) return;
      await this.playConveyorEnd('pain', { settled: true });
    }

    leaveCorridor() {
      window.cancelAnimationFrame(this.conveyorFrame);
      window.cancelAnimationFrame(this.planeFrame);
      this.scaleGeneration = (this.scaleGeneration || 0) + 1;
      this.root.classList.remove(
        'is-scale',
        'is-scale-white',
        'is-scale-zero',
        'is-scale-still',
        'is-corridor',
        'is-grid',
        'is-end-pain',
        'is-end-pitch',
        'is-pitch-belt',
      );
      const scale = this.root.querySelector('[data-promo-scale]');
      if (scale) scale.hidden = true;
      const store = this.painStore();
      if (store) store.style.visibility = '';
      const stage = this.momentStage();
      if (stage) applyMomentPose(stage, 'gone', { instant: true });
      this.residue?.reset();
      this.residue = null;
    }

    mountEndCta(value) {
      const verdict = this.root.querySelector('[data-promo-scale-verdict]');
      if (!verdict) return;
      const key = Object.prototype.hasOwnProperty.call(PROMO_END_CTA, value) ? value : promoVideoConfig.cta;
      const copy = PROMO_END_CTA[key];
      this.root.classList.toggle('is-cta-none', !copy);
      this.root.dataset.promoCta = key;
      let slot = verdict.querySelector('[data-promo-end-cta]');
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'promo-scale__cta';
        slot.setAttribute('data-promo-end-cta', '');
        verdict.append(slot);
      }
      slot.replaceChildren();
      if (!copy) return;
      if (copy.scarcity) {
        const scarcity = document.createElement('p');
        scarcity.className = 'promo-scale__cta-note';
        scarcity.textContent = copy.scarcity;
        slot.append(scarcity);
      }
      const button = document.createElement('span');
      button.className = 'promo-scale__cta-button';
      button.textContent = copy.label;
      slot.append(button);
      if (copy.url) {
        const url = document.createElement('p');
        url.className = 'promo-scale__cta-url';
        url.textContent = copy.url;
        slot.append(url);
      }
    }

    setConveyorEnd(mode, ctaKey) {
      const caption = this.root.querySelector('[data-promo-end-caption]');
      if (caption) caption.textContent = mode === 'pitch' ? 'Built to sell.' : GLIDE_PAIN_LINE;
      this.root.classList.toggle('is-end-pitch', mode === 'pitch');
      this.root.classList.toggle('is-end-pain', mode !== 'pitch');
      this.mountEndCta('none');
    }

    async playConveyorEnd(mode, options = {}) {
      window.cancelAnimationFrame(this.conveyorFrame);
      this.setConveyorEnd(mode);
      if (options.settled) {
        this.root.classList.add('is-scale-white', 'is-scale-zero', 'is-grid-locked');
        this.clearGridResolve();
      } else {
        this.root.classList.add('is-scale-white');
        await waitMs(PROMO_SCALE_WHITE_MS);
        this.root.classList.add('is-scale-zero');
        this.emitThud();
      }
      await waitMs(PROMO_SCALE_HOLD_MS + promoHoldMs());
    }

    seatClerkOnBelt(instant) {
      const embed = this.parkedEmbed || document.getElementById('bizmis-avatar-embed');
      const canvas = this.root.querySelector('[data-promo-canvas]');
      const scale = this.root.querySelector('[data-promo-scale]');
      if (!embed || !canvas || !scale) return;
      this.clerkCornerActive = true;
      this.root.classList.add('is-pitch-belt', 'is-clerk-corner');
      this.root.classList.toggle('is-clerk-instant', instant || prefersReducedMotion());
      const scaleBox = scale.getBoundingClientRect();
      const canvasBox = canvas.getBoundingClientRect();
      if (scaleBox.width < 40 || canvasBox.width < 40) return;
      const height = PROMO_AVATAR_BOX_H * PROMO_CLERK_CORNER_SCALE;
      const right = canvasBox.right - (scaleBox.right - 36);
      const top = scaleBox.bottom - 20 - height - canvasBox.top;
      this.root.style.setProperty('--promo-clerk-top', `${top.toFixed(1)}px`);
      this.root.style.setProperty('--promo-clerk-right', `${right.toFixed(1)}px`);
      embed.style.setProperty('--promo-avatar-scale', String(PROMO_CLERK_CORNER_SCALE));
      embed.style.setProperty('--promo-avatar-lift', '0px');
    }

    async playPitchConveyor() {
      if (this.pitchBeltStarted) return;
      this.pitchBeltStarted = true;
      this.prepareScaleScene();
      promoWidget.applyStoreLook(this.bizmisLook());
      const generation = this.scaleGeneration;
      const stage = this.momentStage();
      if (stage) applyMomentPose(stage, 'bundle', { instant: true });
      this.captureNeutralStage();
      this.root.classList.add('is-pitch-belt');
      if (prefersReducedMotion()) {
        this.root.classList.add('is-scale-still');
        this.revealScaleLayer();
        this.paintGlideAt(0, 'pitch', { reduced: true });
        await waitMs(400);
        await this.playConveyorEnd('pitch');
        this.restoreClerkSeat();
        this.leaveCorridor();
        this.playSeeForYourself();
        return;
      }
      this.revealScaleLayer();
      this.mountGlide('pitch');
      if (generation !== this.scaleGeneration) return;
      this.runGlide('pitch');
      await waitMs(glidePlayEnd());
      if (generation !== this.scaleGeneration) return;
      await this.playConveyorEnd('pitch', { settled: true });
      this.restoreClerkSeat();
      this.leaveCorridor();
      this.playSeeForYourself();
    }

    async showScaleExport(kind, mode = 'pain', ctaKey) {
      this.resetScaleScene();
      this.prepareScaleScene();
      if (mode === 'pitch') {
        document.documentElement.classList.remove('is-promo-depart', 'is-promo-pitch');
        this.resetSee();
        this.root.classList.remove('is-pitch');
        this.openPainStage();
        this.applyPainBeat('answer-2', true);
        this.neutralStage = null;
        this.neutralStageWidth = 0;
        this.captureNeutralStage();
        this.root.classList.add('is-pitch', 'is-pitch-belt', 'is-moments');
        const stage = this.momentStage();
        if (stage) applyMomentPose(stage, 'bundle', { instant: true });
        promoWidget.applyStoreLook(this.bizmisLook());
      } else {
        this.root.classList.remove('is-pitch');
        this.openPainStage();
        this.applyPainBeat('answer-2', true);
        this.hideScaleStore();
      }
      this.revealScaleLayer();
      this.root.classList.add('is-scale-still');
      if (mode !== 'pitch') await Promise.race([this.captureConveyorStill(), waitMs(1200)]);
      const shot = kind === 'puff' ? 'event' : (kind === 'stream' ? 'lanes-7' : (kind === 'zero' ? 'end' : kind));
      const fieldAt = PROMO_GLIDE.layDownMs + PROMO_GLIDE.rampMs + PROMO_GLIDE.dissolveMs;
      const gridAt = {
        travel: 280,
        'lane-1': 280,
        event: 1900,
        mid: 3400,
        'lanes-3': 2600,
        'lanes-5': 4200,
        'lanes-7': 5400,
        'residue-10': 2600,
        'residue-20': 3400,
        'residue-100': 4800,
        'residue-full': 5600,
        texture: 5400,
        field: fieldAt + 200,
        resolve: fieldAt + PROMO_GLIDE.fieldHoldMs + 280,
        white: fieldAt + 200,
      };
      if (gridAt[shot] != null) {
        this.paintGlideAt(gridAt[shot], mode);
        await this.whenGlideMediaReady();
      }
      if (shot === 'end') {
        this.setConveyorEnd(mode, ctaKey);
        this.root.classList.add('is-scale-white', 'is-scale-zero', 'is-grid-locked');
        this.clearGridResolve();
      }
      return this.whenPainRest(this.painHost());
    }

    paintFloodStill(warmth) {
      const root = this.root;
      document.documentElement.classList.add('is-promo-opening');
      document.documentElement.classList.remove('is-promo-pitch', 'is-promo-depart');
      root.classList.add('is-on', 'is-cleared', 'is-bursting');
      this.openPainStage();
      document.documentElement.style.setProperty('--ad-warmth', String(warmth));
      const label = root.querySelector('.promo-opening__choice--right');
      if (label) label.style.transition = 'none';
      root.querySelectorAll('.promo-opening__choice--left, .promo-opening__switch').forEach((node) => {
        node.style.transition = 'none';
        node.style.opacity = '0';
      });
      this.centerAgenticSales();
      this.scaleAgenticSales(2.25 + warmth * 2.35);
      this.pinLabelOrigin();
      const fill = root.querySelector('.promo-opening__fill--orange');
      if (fill) {
        fill.style.transition = 'none';
        fill.style.transform = `scale(${(warmth * 0.42).toFixed(3)})`;
      }
      return 160;
    }

    showPainExport(beat) {
      this.openPainStage();
      this.applyPainBeat(beat, false);
      const host = this.painHost();
      return this.whenPainRest(host);
    }

    showPainCloseAim() {
      this.openPainStage();
      this.applyPainBeat('answer-2', true);
      const store = this.painStore();
      const cursor = this.root.querySelector('[data-promo-pain-cursor]');
      const dot = store?.querySelector('[data-promo-window-close]');
      const aim = this.painCursorPoint(dot);
      if (cursor && aim) {
        cursor.hidden = false;
        cursor.style.transitionDuration = '0ms';
        cursor.style.setProperty('--pain-x', `${Math.round(aim.x)}px`);
        cursor.style.setProperty('--pain-y', `${Math.round(aim.y)}px`);
        cursor.style.opacity = '1';
      }
      this.pinWindowCloseOrigin();
      this.root.classList.add('is-window-aim');
      return this.whenPainRest(this.painHost());
    }

    showExportFrame(name) {
      this.clearPainTimers();
      if (!String(name).startsWith('pain-')) this.releasePainStage();
      releaseSpeechMouth();
      const root = this.root;
      const clock = root.querySelector('[data-promo-clock]');
      if (clock) clock.hidden = true;
      const html = document.documentElement;
      const center = root.querySelector('.promo-opening__center');
      const logo = root.querySelector('.promo-opening__logo');
      const line = this.line;
      const fromFace = root.querySelector('[data-promo-face-from]');
      const toFace = root.querySelector('[data-promo-face-to]');
      const fromWords = fromFace ? [...fromFace.querySelectorAll('[data-promo-from-word]')] : [];
      const toWords = toFace ? [...toFace.querySelectorAll('[data-promo-to-word]')] : [];
      const from = line?.querySelector('.promo-opening__from');
      const to = line?.querySelector('.promo-opening__to');

      const resetText = () => {
        this.resetSee();
        line?.classList.remove('is-revealing', 'is-striking', 'is-erasing', 'is-redefined', 'is-replaced');
        fromFace?.classList.remove('is-exiting');
        if (fromFace) {
          fromFace.style.visibility = '';
          fromFace.style.opacity = '';
        }
        if (toFace) {
          toFace.style.visibility = '';
          toFace.style.opacity = '';
        }
        fromWords.forEach((word) => {
          word.style.opacity = '';
          word.style.animation = 'none';
          word.style.transform = 'none';
        });
        toWords.forEach((word) => {
          word.classList.remove('is-in', 'is-out');
          word.style.opacity = '';
          word.style.animation = 'none';
          word.style.transform = '';
        });
        if (from) {
          from.style.width = '';
          from.style.opacity = '';
        }
        if (to) {
          to.style.width = '';
          to.style.opacity = '';
        }
      };

      const hideToggle = () => {
        if (!center) return;
        center.style.visibility = 'hidden';
        center.style.opacity = '0';
      };

      const showToggle = () => {
        if (!center) return;
        center.style.visibility = '';
        center.style.opacity = '';
      };

      const enterPitch = () => {
        document.documentElement.style.setProperty('--ad-warmth', '1');
        html.classList.add('is-promo-opening', 'is-promo-pitch', 'is-promo-clerk');
        root.classList.add('is-on', 'is-bursting', 'is-holding', 'is-pitch');
        root.classList.remove('is-logo-leaving', 'is-depart', 'is-moments');
        hideToggle();
        this.parkWidget();
        this.fitOpeningLayout();
        promoWidget.applyStoreLook(this.bizmisLook());
      };

      const hideCopy = () => {
        resetText();
        if (fromFace) fromFace.style.visibility = 'hidden';
        if (toFace) toFace.style.visibility = 'hidden';
        fromWords.forEach((word) => {
          word.style.opacity = '0';
        });
      };

      const showFromCount = (count) => {
        enterPitch();
        root.classList.add('is-logo-leaving');
        if (logo) {
          logo.style.opacity = '0';
          logo.style.visibility = 'hidden';
        }
        resetText();
        line?.classList.add('is-revealing');
        if (fromFace) {
          fromFace.style.visibility = 'visible';
          fromFace.style.opacity = '1';
        }
        if (toFace) {
          toFace.style.visibility = 'hidden';
          toFace.style.opacity = '0';
        }
        fromWords.forEach((word, index) => {
          word.style.opacity = index < count ? '1' : '0';
        });
      };

      const showHero = (index) => {
        enterPitch();
        root.classList.add('is-logo-leaving');
        if (logo) {
          logo.style.opacity = '0';
          logo.style.visibility = 'hidden';
        }
        resetText();
        line?.classList.add('is-replaced');
        if (fromFace) {
          fromFace.style.visibility = 'hidden';
          fromFace.style.opacity = '0';
        }
        if (toFace) {
          toFace.style.visibility = 'visible';
          toFace.style.opacity = '1';
        }
        toWords.forEach((word, wordIndex) => {
          word.classList.toggle('is-in', wordIndex === index);
          word.classList.toggle('is-out', wordIndex < index);
          word.style.opacity = wordIndex === index ? '1' : '0';
          word.style.transform = 'none';
          word.style.animation = 'none';
        });
      };

      const showSee = (phase) => {
        showHero(2);
        toWords.forEach((word) => {
          word.classList.remove('is-in');
          word.classList.add('is-out');
          word.style.opacity = '0';
        });
        root.classList.add('is-see', 'is-see-in');
        root.querySelectorAll('.promo-opening__see-word').forEach((word) => {
          word.style.animation = 'none';
          word.style.opacity = '1';
          word.style.filter = 'none';
          word.style.transform = 'none';
        });
        if (phase !== 'hero') root.classList.add('is-see-docked', 'is-see-row');
        if (phase === 'landed') root.classList.add('is-see-landed');
        if (phase !== 'hero') root.classList.add('is-see-wave');

        const midIndex = Math.min(2, Math.max(0, this.stores.length - 1));
        const highlight = phase === 'hero'
          ? -1
          : phase === 'row'
            ? 0
            : phase === 'roulette'
              ? midIndex
              : this.landIndex;
        const ask = promoVideoConfig.cta !== 'demo' && promoVideoConfig.cta !== 'none';
        if (phase === 'landed' && ask) {
          this.paintWave(-1, 0, 0);
          root.classList.add('is-see-cta', 'is-cta-aim');
        } else if (highlight >= 0) {
          const rising = phase === 'row';
          this.paintWave(highlight, rising ? 0.35 : 1, rising ? 0.18 : 0.5);
        }

        if (phase === 'hero') {
          root.classList.add('is-moments');
          promoWidget.applyStoreLook(this.bizmisLook());
        } else {
          root.classList.remove('is-moments');
          const store = this.stores[Math.min(highlight, this.stores.length - 1)];
          if (store) promoWidget.applyStoreLook(store);
        }
      };

      const rest = () => {
        html.classList.add('is-promo-opening');
        html.classList.remove('is-promo-pitch', 'is-promo-depart');
        root.classList.remove(
          'is-on',
          'is-cleared',
          'is-bursting',
          'is-holding',
          'is-pitch',
          'is-logo-docked',
          'is-logo-leaving',
          'is-depart',
          'is-moments'
        );
        showToggle();
        const toggle = root.querySelector('.promo-opening__toggle');
        if (toggle) {
          toggle.style.transition = '';
          toggle.style.opacity = '';
        }
        const label = root.querySelector('.promo-opening__choice--right');
        if (label) {
          label.style.transition = '';
          label.style.transform = '';
        }
        root.querySelectorAll('.promo-opening__choice--left, .promo-opening__switch').forEach((node) => {
          node.style.transition = '';
          node.style.opacity = '';
        });
        if (logo) {
          logo.style.opacity = '';
          logo.style.visibility = '';
        }
        resetText();
        document.documentElement.style.setProperty('--ad-warmth', '0');
      };

      const openMoments = () => {
        showHero(2);
        root.classList.add('is-moments');
        this.seatClerkInStore(true);
        setOpeningAvatarAction('idle_neutral');
        return this.momentStage();
      };

      const frames = {
        '01-toggle-rest': () => {
          rest();
          return 120;
        },
        '02-toggle-on': () => {
          rest();
          root.classList.add('is-on');
          return 120;
        },
        '02b-toggle-gone': () => {
          rest();
          root.classList.add('is-on', 'is-cleared');
          const label = root.querySelector('.promo-opening__choice--right');
          if (label) label.style.transition = 'none';
          root.querySelectorAll('.promo-opening__choice--left, .promo-opening__switch').forEach((node) => {
            node.style.transition = 'none';
            node.style.opacity = '0';
          });
          this.centerAgenticSales();
          return 80;
        },
        '02c-agentic-scaled': () => {
          rest();
          root.classList.add('is-on', 'is-cleared');
          const label = root.querySelector('.promo-opening__choice--right');
          if (label) label.style.transition = 'none';
          root.querySelectorAll('.promo-opening__choice--left, .promo-opening__switch').forEach((node) => {
            node.style.transition = 'none';
            node.style.opacity = '0';
          });
          this.centerAgenticSales();
          this.scaleAgenticSales(2.25);
          return 80;
        },
        '03a-flood-warmth-0': () => this.paintFloodStill(0),
        '03b-flood-warmth-05': () => this.paintFloodStill(0.5),
        '03c-flood-warmth-1': () => this.paintFloodStill(1),
        '03-orange-burst': () => {
          rest();
          root.classList.add('is-on', 'is-cleared', 'is-bursting', 'is-agentic-white');
          const label = root.querySelector('.promo-opening__choice--right');
          if (label) label.style.transition = 'none';
          root.querySelectorAll('.promo-opening__choice-layer--hot').forEach((node) => {
            node.style.transition = 'none';
          });
          root.querySelectorAll('.promo-opening__choice--left, .promo-opening__switch').forEach((node) => {
            node.style.transition = 'none';
            node.style.opacity = '0';
          });
          this.centerAgenticSales();
          this.scaleAgenticSales(4.6);
          this.pinLabelOrigin();
          document.documentElement.style.setProperty('--ad-warmth', '1');
          const fill = root.querySelector('.promo-opening__fill--orange');
          if (fill) {
            fill.style.transition = 'none';
            fill.style.transform = 'scale(1)';
          }
          return 200;
        },
        '04-logo-docked': () => {
          enterPitch();
          root.classList.remove('is-logo-leaving');
          if (logo) {
            logo.style.opacity = '1';
            logo.style.visibility = 'visible';
          }
          hideCopy();
          this.fitOpeningLayout();
          return 240;
        },
        '05-logo-gone': () => {
          enterPitch();
          root.classList.add('is-logo-leaving');
          if (logo) {
            logo.style.opacity = '0';
            logo.style.visibility = 'hidden';
          }
          hideCopy();
          return 180;
        },
        '06-your': () => {
          showFromCount(1);
          return 180;
        },
        '07-your-store': () => {
          showFromCount(2);
          return 180;
        },
        '08-salesperson': () => {
          showFromCount(3);
          return 180;
        },
        '09-salesperson-struck': () => {
          showFromCount(3);
          line?.classList.add('is-striking');
          if (from) from.style.width = `${from.getBoundingClientRect().width}px`;
          if (to) {
            to.style.width = '0px';
            to.style.opacity = '0';
          }
          return 180;
        },
        '10-sales-agent': () => {
          showFromCount(3);
          line?.classList.add('is-redefined');
          const word = line?.querySelector('.promo-opening__word--salesperson');
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
          return 180;
        },
        '11-built': () => {
          showHero(0);
          return 180;
        },
        '12-to': () => {
          showHero(1);
          return 180;
        },
        '13-sell': () => {
          showHero(2);
          return 180;
        },
        '14-sell-wave': () => {
          showHero(2);
          return 180;
        },
        '14b1-beat-1-grid': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'grid');
        },
        '14b2-beat-1-shortlist': () => {
          const stage = openMoments();
          const board = restartMomentPose(stage, 'grid');
          return whenMomentsRest(stage).then(() => {
            board?.style.setProperty('--moment-scroll', `${momentCatalogSeek(board)}px`);
            board?.classList.add('is-catalog-seek', 'is-shortlist');
            return whenMomentsRest(stage);
          });
        },
        '14b3-beat-1-collapse': () => {
          const stage = openMoments();
          return scrubMoment(stage, 'row', (anim, span) => {
            const name = anim.animationName || '';
            if (name === 'promo-moments-select' || name === 'promo-moments-catalog-out') {
              return span.delay + span.duration * 0.45;
            }
            return 0;
          });
        },
        '14b4-beat-1-row': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'row');
        },
        '14b5-beat-1-speech': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'row').then(() => holdSpeechMouth());
        },
        '14c1-beat-2-hold': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'row');
        },
        '14c2-beat-2-specs': () => {
          const stage = openMoments();
          return poseOnTimeline(stage, 'choice', (anim, span) => {
            const name = anim.animationName || '';
            if (name === 'promo-moments-tick' || name === 'promo-moments-ring' || name === 'promo-moments-pair-lift' || name === 'promo-moments-compare-fold' || name === 'promo-moments-add-reveal') return { time: 0 };
            return { time: span.delay + span.duration };
          });
        },
        '14c3-beat-2-ticked': () => {
          const stage = openMoments();
          return playChoiceUntilTicks(stage);
        },
        '14c4-beat-2-lifted': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'choice');
        },
        '14c5-beat-2-speech': () => {
          const stage = openMoments();
          return playChoiceUntilTicks(stage).then(() => holdSpeechMouth());
        },
        '14d1-beat-3-hold': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'choice');
        },
        '14d2-beat-3-doubt': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'doubt');
        },
        '14d3-beat-3-vapor': () => {
          const stage = openMoments();
          return poseOnTimeline(stage, 'close', (anim, span) => {
            const name = anim.animationName || '';
            if (name === 'promo-moments-vapor' || name === 'promo-moments-vapor-bit') {
              return { time: span.delay + span.duration * 0.45 };
            }
            return { time: 0 };
          });
        },
        '14d4-beat-3-close': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'close');
        },
        '14d5-beat-3-speech': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'doubt').then(() => holdSpeechMouth());
        },
        '14e1-beat-4-hold': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'close');
        },
        '14e2-beat-4-arriving': () => {
          const stage = openMoments();
          return poseOnTimeline(stage, 'extra', (anim, span) => {
            const name = anim.animationName || '';
            if (name === 'promo-moments-addon-in') return { time: span.delay + span.duration * 0.15 };
            if (name === 'promo-moments-plus-in') return { time: span.delay + span.duration };
            return { time: 0 };
          });
        },
        '14e3-beat-4-docked': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'extra');
        },
        '14e4-beat-4-bundle': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'bundle');
        },
        '14e5-beat-4-speech': () => {
          const stage = openMoments();
          return playMomentPose(stage, 'extra').then(() => holdSpeechMouth());
        },
        '14f1-moments-contract': () => {
          const stage = openMoments();
          return scrubMoment(stage, 'fly', () => 200).then(() => placeExportFly(stage, 0.2));
        },
        '14f2-moments-dot': () => {
          const stage = openMoments();
          return scrubMoment(stage, 'fly', () => 430).then(() => placeExportFly(stage, 0.62));
        },
        '14f3-moments-nod': () => {
          const stage = openMoments();
          setOpeningAvatarAction('nod');
          return playMomentPose(stage, 'gone');
        },
        '15-see-yourself': () => {
          showSee('hero');
          return Promise.resolve();
        },
        '16-see-stores': () => {
          showSee('row');
          return 180;
        },
        '17-see-roulette': () => {
          showSee('roulette');
          return 120;
        },
        '18-see-meridian': () => {
          showSee('landed');
          return 220;
        },
        'pain-a-grid': () => this.showPainExport('grid'),
        'pain-a-enter': () => this.showPainExport('enter'),
        'pain-a-open': () => this.showPainExport('open'),
        'pain-a-back': () => this.showPainExport('back'),
        'pain-a-scroll-1': () => this.showPainExport('scroll-1'),
        'pain-a-scroll-2': () => this.showPainExport('scroll-2'),
        'pain-a-scroll-3': () => this.showPainExport('scroll-3'),
        'pain-a-scroll-4': () => this.showPainExport('scroll-4'),
        'pain-a-scroll-up': () => this.showPainExport('scroll-4'),
        'pain-a-leave': () => this.showPainExport('leave'),
        'pain-b-launcher': () => this.showPainExport('launcher'),
        'pain-b-panel': () => this.showPainExport('panel'),
        'pain-b-typed-1': () => this.showPainExport('typed-1'),
        'pain-b-answer-1': () => this.showPainExport('answer-1'),
        'pain-b-typed-2': () => this.showPainExport('typed-2'),
        'pain-b-answer-2': () => this.showPainExport('answer-2'),
        'pain-c-travel': () => this.showScaleExport('lane-1', 'pain'),
        'pain-c-lane-1': () => this.showScaleExport('lane-1', 'pain'),
        'pain-c-event': () => this.showScaleExport('event', 'pain'),
        'pain-c-puff': () => this.showScaleExport('event', 'pain'),
        'pain-c-mid': () => this.showScaleExport('lanes-3', 'pain'),
        'pain-c-lanes-3': () => this.showScaleExport('lanes-3', 'pain'),
        'pain-c-lanes-5': () => this.showScaleExport('lanes-5', 'pain'),
        'pain-c-lanes-7': () => this.showScaleExport('lanes-7', 'pain'),
        'pain-c-texture': () => this.showScaleExport('texture', 'pain'),
        'pain-c-field': () => this.showScaleExport('field', 'pain'),
        'pain-c-resolve': () => this.showScaleExport('resolve', 'pain'),
        'pain-c-residue-10': () => this.showScaleExport('lanes-5', 'pain'),
        'pain-c-residue-20': () => this.showScaleExport('lanes-5', 'pain'),
        'pain-c-residue-100': () => this.showScaleExport('lanes-7', 'pain'),
        'pain-c-residue-full': () => this.showScaleExport('lanes-7', 'pain'),
        'pain-c-stream': () => this.showScaleExport('lanes-7', 'pain'),
        'pain-c-white': () => this.showScaleExport('white', 'pain'),
        'pain-c-end': () => this.showScaleExport('end', 'pain'),
        'pain-c-zero': () => this.showScaleExport('end', 'pain'),
        'pitch-c-travel': () => this.showScaleExport('lane-1', 'pitch'),
        'pitch-c-lane-1': () => this.showScaleExport('lane-1', 'pitch'),
        'pitch-c-event': () => this.showScaleExport('event', 'pitch'),
        'pitch-c-mid': () => this.showScaleExport('lanes-3', 'pitch'),
        'pitch-c-lanes-3': () => this.showScaleExport('lanes-3', 'pitch'),
        'pitch-c-lanes-5': () => this.showScaleExport('lanes-5', 'pitch'),
        'pitch-c-lanes-7': () => this.showScaleExport('lanes-7', 'pitch'),
        'pitch-c-texture': () => this.showScaleExport('texture', 'pitch'),
        'pitch-c-field': () => this.showScaleExport('field', 'pitch'),
        'pitch-c-resolve': () => this.showScaleExport('resolve', 'pitch'),
        'pitch-c-residue-10': () => this.showScaleExport('lanes-5', 'pitch'),
        'pitch-c-residue-20': () => this.showScaleExport('lanes-5', 'pitch'),
        'pitch-c-residue-100': () => this.showScaleExport('lanes-7', 'pitch'),
        'pitch-c-residue-full': () => this.showScaleExport('lanes-7', 'pitch'),
        'pitch-c-white': () => this.showScaleExport('white', 'pitch'),
        'pitch-c-end': () => this.showScaleExport('end', 'pitch'),
        'pitch-c-end-demo': () => this.showScaleExport('end', 'pitch', 'demo'),
        'pitch-c-end-install': () => this.showScaleExport('end', 'pitch', 'install'),
        'pitch-c-end-ea': () => this.showScaleExport('end', 'pitch', 'ea'),
        'pitch-c-end-none': () => this.showScaleExport('end', 'pitch', 'none'),
        'pain-c-aim': () => this.showPainCloseAim(),
        'pain-b-zoom': () => this.showPainExport('answer-2'),
      };

      const run = frames[name];
      if (!run) throw new Error(`Unknown promo opening frame: ${name}`);
      return run();
    }
  }

  class PromoCover {
    constructor(node, heroReveal, onReady) {
      this.node = node;
      this.heroReveal = heroReveal;
      this.onReady = onReady;
    }

    async start() {
      const img = document.querySelector('.hero__slide.is-active .hero__media img');
      if (img) img.loading = 'eager';
      await whenImageReady(img);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      if (prefersReducedMotion()) {
        this.finish();
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, PROMO_COVER_HOLD_MS));
      this.revealPage();
      this.node.classList.add('is-fading');
      window.setTimeout(() => this.finish(), PROMO_COVER_FADE_MS);
    }

    revealPage() {
      this.node.classList.add('is-held');
      document.documentElement.classList.remove('is-promo-cover');
      document.documentElement.style.background = '';
      document.body.style.background = '';
    }

    finish() {
      this.dismiss();
      this.heroReveal?.begin();
      this.onReady?.();
    }

    dismiss() {
      this.node.remove();
      document.documentElement.classList.remove('is-promo-cover');
      document.documentElement.style.background = '';
      document.body.style.background = '';
    }
  }

  /* --- Cart Lock (prevents concurrent cart API mutations) --- */
  const cartLock = {
    _locked: false,
    _queue: [],
    async acquire() {
      if (!this._locked) { this._locked = true; return; }
      return new Promise(r => this._queue.push(r));
    },
    release() {
      if (this._queue.length > 0) this._queue.shift()();
      else this._locked = false;
    }
  };

  /* --- Cart Sync Bus (keeps drawer + page + header badge in sync) --- */
  const cartBus = {
    _listeners: [],
    on(fn) { this._listeners.push(fn); },
    emit(cart) {
      const badge = document.querySelector('[data-cart-count]');
      if (badge) {
        badge.textContent = cart.item_count;
        badge.style.display = cart.item_count > 0 ? '' : 'none';
      }
      this._listeners.forEach(fn => fn(cart));
    }
  };

  /* --- Cart Drawer --- */
  class CartDrawer {
    constructor() {
      this.drawer = document.querySelector('.cart-drawer');
      this.backdrop = document.querySelector('.cart-drawer__backdrop');
      if (!this.drawer) return;

      this.modal = this.drawer.querySelector('[data-remove-modal]');
      this.modalBackdrop = this.drawer.querySelector('[data-modal-backdrop]');
      this.pendingRemoveKey = null;
      this.debounceTimers = new Map();
      this.DEBOUNCE_MS = 400;

      this.bindEvents();
      this.bindCartItems();
      this.bindModal();
      cartBus.on(cart => this.refreshDrawer(cart));
    }

    bindEvents() {
      document.querySelectorAll('[data-cart-toggle]').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); this.toggle(); });
      });
      this.bindCloseControls();
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.modal?.style.display !== 'none') { this.hideModal(); return; }
          if (this.isOpen()) this.close();
        }
      });
    }

    bindCloseControls() {
      if (this.backdrop) this.backdrop.addEventListener('click', () => this.close());
      this.drawer.querySelector('[data-cart-close]')?.addEventListener('click', () => this.close());
    }

    _itemId(el) {
      return (el.dataset.itemKey || el.dataset.variantId || '').trim();
    }

    bindCartItems() {
      this.drawer.querySelectorAll('[data-cart-item]').forEach(item => {
        const input = item.querySelector('[data-qty-input]');
        const minus = item.querySelector('[data-qty-minus]');
        const plus = item.querySelector('[data-qty-plus]');
        const remove = item.querySelector('[data-remove-item]');

        minus?.addEventListener('click', () => {
          const id = this._itemId(item);
          const val = parseInt(input.value, 10) - 1;
          if (val <= 0) { this.confirmRemove(id); return; }
          input.value = val;
          this.scheduleUpdate(id, val);
        });

        plus?.addEventListener('click', () => {
          const id = this._itemId(item);
          const val = Math.min(parseInt(input.value, 10) + 1, 99);
          input.value = val;
          this.scheduleUpdate(id, val);
        });

        input?.addEventListener('change', () => {
          const id = this._itemId(item);
          const val = parseInt(input.value, 10);
          if (isNaN(val) || val <= 0) { this.confirmRemove(id); input.value = 1; return; }
          input.value = Math.min(val, 99);
          this.scheduleUpdate(id, Math.min(val, 99));
        });

        remove?.addEventListener('click', () => this.confirmRemove(this._itemId(item)));
      });
    }

    bindModal() {
      this.drawer.querySelector('[data-modal-cancel]')?.addEventListener('click', () => this.hideModal());
      this.drawer.querySelector('[data-modal-confirm]')?.addEventListener('click', () => {
        if (this.pendingRemoveKey) this.removeItem(this.pendingRemoveKey);
        this.hideModal();
      });
      this.modalBackdrop?.addEventListener('click', () => this.hideModal());
    }

    confirmRemove(key) {
      this.pendingRemoveKey = key;
      if (this.modal) this.modal.style.display = '';
      if (this.modalBackdrop) this.modalBackdrop.style.display = '';
    }

    hideModal() {
      this.pendingRemoveKey = null;
      if (this.modal) this.modal.style.display = 'none';
      if (this.modalBackdrop) this.modalBackdrop.style.display = 'none';
    }

    removeItem(id) {
      const el = this.drawer.querySelector(`[data-item-key="${id}"]`)
        || this.drawer.querySelector(`[data-variant-id="${id}"]`);
      if (el) {
        el.style.transition = 'opacity 200ms ease, max-height 300ms ease';
        el.style.opacity = '0';
        el.style.maxHeight = el.offsetHeight + 'px';
        requestAnimationFrame(() => { el.style.maxHeight = '0'; el.style.overflow = 'hidden'; });
        setTimeout(() => el.remove(), 300);
      }

      const remaining = this.drawer.querySelectorAll('[data-cart-item]').length - 1;
      this.updateCartCount(remaining);

      this.updateCart(id, 0);
    }

    updateCartCount(count) {
      const title = this.drawer.querySelector('.cart-drawer__title');
      if (title) title.textContent = `${title.textContent.split('(')[0].trim()} (${count})`;
    }

    scheduleUpdate(key, quantity) {
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.set(key, setTimeout(() => this.updateCart(key, quantity), this.DEBOUNCE_MS));
    }

    async _cartChange(id, quantity) {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id, quantity })
      });
      const data = await res.json();
      if (data.items) return data;
      return null;
    }

    async updateCart(id, quantity) {
      await cartLock.acquire();
      try {
        let cart = await this._cartChange(id, quantity);
        if (!cart) {
          const freshCart = await (await fetch('/cart.js')).json();
          const match = freshCart.items?.find(i =>
            i.key === id || String(i.variant_id) === String(id)
          );
          if (match) cart = await this._cartChange(match.key, quantity);
        }
        if (cart) cartBus.emit(cart);
      } catch { /* network failure */ }
      finally { cartLock.release(); }
    }

    _findLineItem(cart, el) {
      const key = el.dataset.itemKey;
      const vid = el.dataset.variantId;
      return cart.items.find(i => i.key === key)
        || cart.items.find(i => String(i.key) === String(key))
        || cart.items.find(i => String(i.variant_id) === String(vid));
    }

    refreshDrawer(cart) {
      if (!this.drawer) return;
      this.updateCartCount(cart.item_count);

      if (cart.item_count === 0) {
        const items = this.drawer.querySelector('[data-cart-items]');
        const footer = this.drawer.querySelector('.cart-drawer__footer');
        const empty = this.drawer.querySelector('.cart-drawer__empty');
        if (items) items.remove();
        if (footer) footer.remove();
        if (empty) { empty.style.display = ''; }
        else {
          this.drawer.insertAdjacentHTML('beforeend',
            '<div class="cart-drawer__empty"><p>Your cart is empty</p><a href="/" class="btn btn--primary">Continue shopping</a></div>');
        }
        return;
      }

      this.drawer.querySelectorAll('[data-cart-item]').forEach(el => {
        const lineItem = this._findLineItem(cart, el);
        if (!lineItem) { el.remove(); return; }

        if (lineItem.key) el.dataset.itemKey = lineItem.key;

        const input = el.querySelector('[data-qty-input]');
        if (input) input.value = lineItem.quantity;

        const priceEl = el.querySelector('[data-line-price]');
        if (priceEl) {
          let html = formatMoney(lineItem.final_line_price);
          if (lineItem.original_line_price > lineItem.final_line_price) {
            html += ` <s class="cart-drawer__item-compare">${formatMoney(lineItem.original_line_price)}</s>`;
          }
          priceEl.innerHTML = html;
        }
      });

      const subtotalEl = this.drawer.querySelector('.cart-drawer__subtotal span:last-child');
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

      const savingsEl = this.drawer.querySelector('.cart-drawer__savings');
      let totalSavings = 0;
      for (const item of cart.items) {
        if (item.original_line_price > item.final_line_price) {
          totalSavings += item.original_line_price - item.final_line_price;
        }
      }
      if (savingsEl) {
        if (totalSavings > 0) {
          savingsEl.style.display = '';
          const savingsAmt = savingsEl.querySelector('span:last-child');
          if (savingsAmt) savingsAmt.textContent = `-${formatMoney(totalSavings)}`;
        } else {
          savingsEl.style.display = 'none';
        }
      }
    }

    isOpen() { return this.drawer.classList.contains('is-open'); }

    open() {
      this.drawer.classList.add('is-open');
      this.backdrop?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      this.drawer.querySelector('[data-cart-close]')?.focus();
    }

    close() {
      this.drawer.classList.remove('is-open');
      this.backdrop?.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    toggle() { this.isOpen() ? this.close() : this.open(); }

    async reload() {
      if (!this.drawer) return;
      try {
        const res = await fetch(window.location.pathname + window.location.search);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newDrawer = doc.querySelector('.cart-drawer');
        const newBackdrop = doc.querySelector('.cart-drawer__backdrop');
        if (!newDrawer) return;

        const wasOpen = this.isOpen();
        this.drawer.replaceWith(newDrawer);
        this.drawer = newDrawer;
        this.modal = this.drawer.querySelector('[data-remove-modal]');
        this.modalBackdrop = this.drawer.querySelector('[data-modal-backdrop]');
        this.bindCartItems();
        this.bindModal();

        if (newBackdrop) {
          if (this.backdrop) this.backdrop.replaceWith(newBackdrop);
          else document.body.prepend(newBackdrop);
          this.backdrop = newBackdrop;
        }
        this.bindCloseControls();
        if (wasOpen) this.open();
      } catch { /* keep existing drawer markup */ }
    }
  }

  /* --- Add to Cart (AJAX — stay on page, success feedback) --- */
  class AddToCart {
    constructor(cartDrawer) {
      this.cartDrawer = cartDrawer;
      this.SUCCESS_MS = 1800;
      this.PULSE_MS = 900;
      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        const action = form.getAttribute('action') || '';
        if (!action.includes('/cart/add')) return;
        e.preventDefault();
        this.submit(form);
      });
    }

    async submit(form) {
      const submitBtn = form.querySelector('[type="submit"]');
      const stickyBtn = document.querySelector('.pdp-sticky-bar .btn--primary:not([disabled])');
      if (submitBtn) submitBtn.disabled = true;
      if (stickyBtn) stickyBtn.disabled = true;

      try {
        await cartLock.acquire();
        const root = window.Shopify?.routes?.root || '/';
        const res = await fetch(`${root}cart/add.js`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.description || data.message || 'Could not add to cart');
        }

        const cart = await (await fetch(`${root}cart.js`)).json();
        cartBus.emit(cart);
        this.playSuccess(submitBtn);
        if (stickyBtn && stickyBtn !== submitBtn) this.playSuccess(stickyBtn);
        this.pulseCartIcon();
        if (this.cartDrawer?.drawer) this.cartDrawer.reload();
      } catch (err) {
        window.alert(err.message || 'Could not add to cart');
        if (submitBtn) submitBtn.disabled = false;
        if (stickyBtn) stickyBtn.disabled = false;
      } finally {
        cartLock.release();
      }
    }

    playSuccess(btn) {
      if (!btn) return;
      clearTimeout(btn._addedTimer);
      const label = window.themeStrings?.addedToCart || 'Added to cart';
      const isIcon = btn.classList.contains('btn--icon');
      if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
      btn.classList.add('is-added-to-cart');
      btn.disabled = true;
      if (isIcon) {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        btn.textContent = label;
      }
      btn._addedTimer = setTimeout(() => {
        btn.classList.remove('is-added-to-cart');
        btn.innerHTML = btn.dataset.originalHtml;
        delete btn.dataset.originalHtml;
        btn.disabled = false;
      }, this.SUCCESS_MS);
    }

    pulseCartIcon() {
      const toggle = document.querySelector('[data-cart-toggle]');
      const badge = document.querySelector('[data-cart-count]');
      if (!toggle) return;
      toggle.classList.remove('is-cart-pulse');
      badge?.classList.remove('is-cart-count-pop');
      void toggle.offsetWidth;
      toggle.classList.add('is-cart-pulse');
      badge?.classList.add('is-cart-count-pop');
      clearTimeout(this._pulseTimer);
      this._pulseTimer = setTimeout(() => {
        toggle.classList.remove('is-cart-pulse');
        badge?.classList.remove('is-cart-count-pop');
      }, this.PULSE_MS);
    }
  }

  /* --- Cart Page (AJAX qty updates for /cart) --- */
  class CartPage {
    constructor() {
      this.section = document.querySelector('.main-cart-section');
      this.form = this.section?.querySelector('[data-cart-form]');
      if (!this.form) return;

      this.debounceTimers = new Map();
      this.DEBOUNCE_MS = 500;
      this.bindInputs();
      cartBus.on(cart => this.refreshPage(cart));
    }

    _itemId(el) {
      return (el.dataset.itemKey || el.dataset.variantId || '').trim();
    }

    bindInputs() {
      this.form.querySelectorAll('[data-cart-page-item]').forEach(row => {
        const selector = row.querySelector('.qty-selector');
        const input = selector?.querySelector('[data-qty-input]');
        if (!input) return;

        const minus = selector.querySelector('[data-qty-minus]');
        const plus = selector.querySelector('[data-qty-plus]');

        minus?.addEventListener('click', (e) => {
          e.preventDefault();
          const val = Math.max(parseInt(input.value, 10) - 1, 0);
          input.value = val;
          this.scheduleUpdate(this._itemId(row), val);
        });

        plus?.addEventListener('click', (e) => {
          e.preventDefault();
          const val = Math.min(parseInt(input.value, 10) + 1, 99);
          input.value = val;
          this.scheduleUpdate(this._itemId(row), val);
        });

        input.addEventListener('change', () => {
          const val = Math.max(0, Math.min(parseInt(input.value, 10) || 0, 99));
          input.value = val;
          this.scheduleUpdate(this._itemId(row), val);
        });
      });
    }

    scheduleUpdate(id, quantity) {
      clearTimeout(this.debounceTimers.get(id));
      this.debounceTimers.set(id, setTimeout(() => this.updateItem(id, quantity), this.DEBOUNCE_MS));
    }

    async _cartChange(id, quantity) {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id, quantity })
      });
      const data = await res.json();
      if (data.items) return data;
      return null;
    }

    async updateItem(id, quantity) {
      await cartLock.acquire();
      try {
        let cart = await this._cartChange(id, quantity);
        if (!cart) {
          const freshCart = await (await fetch('/cart.js')).json();
          const match = freshCart.items?.find(i =>
            i.key === id || String(i.variant_id) === String(id)
          );
          if (match) cart = await this._cartChange(match.key, quantity);
        }
        if (cart) cartBus.emit(cart);
      } catch { /* network failure */ }
      finally { cartLock.release(); }
    }

    _findItem(cart, el) {
      const key = (el.dataset.itemKey || '').trim();
      const vid = (el.dataset.variantId || '').trim();
      return cart.items.find(i => i.key === key)
        || cart.items.find(i => String(i.key) === String(key))
        || cart.items.find(i => String(i.variant_id) === String(vid));
    }

    refreshPage(cart) {
      if (!this.form) return;
      if (cart.item_count === 0) {
        window.location.reload();
        return;
      }

      this.form.querySelectorAll('[data-cart-page-item]').forEach(row => {
        const lineItem = this._findItem(cart, row);
        if (!lineItem) { row.remove(); return; }

        if (lineItem.key) row.dataset.itemKey = lineItem.key;

        const input = row.querySelector('[data-qty-input]');
        if (input) input.value = lineItem.quantity;

        const totalEl = row.querySelector('[data-line-total]');
        if (totalEl) {
          let html = `<span style="font-weight: 700;">${formatMoney(lineItem.final_line_price)}</span>`;
          if (lineItem.original_line_price > lineItem.final_line_price) {
            html += `<br><s class="text-muted" style="font-size: 0.8125rem;">${formatMoney(lineItem.original_line_price)}</s>`;
          }
          totalEl.innerHTML = html;
        }
      });

      const subtotalEl = this.form.querySelector('[data-cart-page-subtotal]');
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

      const savingsRow = this.form.querySelector('[data-cart-page-savings]');
      let totalSavings = 0;
      for (const item of cart.items) {
        if (item.original_line_price > item.final_line_price) {
          totalSavings += item.original_line_price - item.final_line_price;
        }
      }
      if (savingsRow) {
        if (totalSavings > 0) {
          savingsRow.style.display = '';
          const amt = savingsRow.querySelector('[data-savings-amount]');
          if (amt) amt.textContent = `-${formatMoney(totalSavings)}`;
        } else {
          savingsRow.style.display = 'none';
        }
      }
    }
  }

  /* --- Desktop Navigation (mega menus driven by menu links) --- */
  class DesktopNav {
    constructor() {
      this.header = document.querySelector('[data-header]');
      if (!this.header) return;

      this.megaItems = this.header.querySelectorAll('[data-nav-mega]');
      this.activeMega = null;
      this.hoverTimeout = null;
      this.leaveTimeout = null;

      this.bindMegaItems();
      this.bindHeaderLeave();
      this.bindKeyboard();
    }

    bindMegaItems() {
      this.megaItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          clearTimeout(this.leaveTimeout);
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = setTimeout(() => this.showMega(item), 80);
        });

        item.addEventListener('mouseleave', () => {
          clearTimeout(this.hoverTimeout);
          this.leaveTimeout = setTimeout(() => this.hideMega(), 150);
        });

        const trigger = item.querySelector('.header__nav-link');
        trigger?.addEventListener('click', (e) => {
          if (window.innerWidth < 990) return;
          const isActive = item.classList.contains('is-mega-active');
          if (isActive) {
            this.hideMega();
          } else {
            e.preventDefault();
            this.showMega(item);
          }
        });
      });
    }

    bindHeaderLeave() {
      this.header.addEventListener('mouseleave', () => {
        clearTimeout(this.hoverTimeout);
        this.leaveTimeout = setTimeout(() => this.hideMega(), 200);
      });

      this.header.addEventListener('mouseenter', () => {
        clearTimeout(this.leaveTimeout);
      });
    }

    bindKeyboard() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeMega) {
          const trigger = this.activeMega.querySelector('.header__nav-link');
          this.hideMega();
          trigger?.focus();
        }
      });
    }

    showMega(item) {
      if (this.activeMega && this.activeMega !== item) {
        this.setExpanded(this.activeMega, false);
      }
      this.setExpanded(item, true);
      this.activeMega = item;
    }

    hideMega() {
      if (this.activeMega) {
        this.setExpanded(this.activeMega, false);
        this.activeMega = null;
      }
    }

    setExpanded(item, expanded) {
      item.classList.toggle('is-mega-active', expanded);
      const trigger = item.querySelector('[aria-expanded]');
      if (trigger) trigger.setAttribute('aria-expanded', String(expanded));
    }
  }

  /* --- Nav overflow: move items that don't fit into "More" dropdown --- */
  class NavOverflow {
    constructor() {
      this.nav = document.querySelector('[data-header] .header__nav');
      this.list = document.querySelector('[data-nav-list]');
      if (!this.nav || !this.list) return;

      this.moreItem = this.list.querySelector('[data-more]');
      this.moreContent = this.list.querySelector('[data-more-content]');
      this.moreTrigger = this.list.querySelector('[data-more-trigger]');
      if (!this.moreItem || !this.moreContent || !this.moreTrigger) return;

      this.items = () => Array.from(this.list.querySelectorAll('[data-nav-item]:not([data-more])'));
      this.overflowClass = 'header__nav-item--overflow';
      this.moreActiveClass = 'header__nav-item--more-active';

      this.moreTrigger.addEventListener('click', (e) => {
        if (window.innerWidth < 990) return;
        e.preventDefault();
        this.toggleMore();
      });
      this.moreItem.addEventListener('mouseenter', () => this.openMore());
      this.moreItem.addEventListener('mouseleave', () => this.closeMore());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeMore();
      });

      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(this.nav);
      this.update();
      // Re-measure once the web font is in: fallback-font widths at
      // DOMContentLoaded are narrower and skip the collapse.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this.update());
      }
      window.addEventListener('load', () => this.update());
    }

    update() {
      if (window.innerWidth < 990) {
        this.moreItem.setAttribute('aria-hidden', 'true');
        this.moreItem.classList.remove(this.moreActiveClass);
        this.items().forEach(el => el.classList.remove(this.overflowClass));
        return;
      }

      // Reveal everything before measuring: hidden items report 0 width.
      const itemEls = this.items();
      itemEls.forEach(el => el.classList.remove(this.overflowClass));
      this.moreItem.removeAttribute('aria-hidden');

      const listWidth = this.list.getBoundingClientRect().width;
      const moreWidth = this.moreItem.getBoundingClientRect().width;
      const available = listWidth - moreWidth - 8;

      let total = 0;
      let overflowStart = itemEls.length;

      for (let i = 0; i < itemEls.length; i++) {
        const w = itemEls[i].getBoundingClientRect().width;
        if (total + w > available) {
          overflowStart = i;
          break;
        }
        total += w;
      }

      if (overflowStart >= itemEls.length) {
        this.moreItem.setAttribute('aria-hidden', 'true');
        this.moreItem.classList.remove(this.moreActiveClass);
        this.moreContent.innerHTML = '';
        itemEls.forEach(el => el.classList.remove(this.overflowClass));
        return;
      }

      itemEls.forEach((el, i) => {
        el.classList.toggle(this.overflowClass, i >= overflowStart);
      });
      this.buildMoreContent(itemEls.slice(overflowStart));
      this.moreItem.removeAttribute('aria-hidden');
    }

    buildMoreContent(overflowItems) {
      const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const parts = [];
      overflowItems.forEach(item => {
        const link = item.querySelector('.header__nav-link');
        const tiles = item.querySelectorAll('.mega-menu__tile');
        const href = escape(link?.getAttribute('href') || '#');
        const title = escape(link?.textContent?.trim() || '');
        if (tiles.length > 0) {
          parts.push(`<div class="header__more-group"><a href="${href}" class="header__more-link header__more-link--parent">${title}</a>`);
          tiles.forEach(tile => {
            const tHref = escape(tile.getAttribute('href') || '#');
            const tTitle = escape(tile.querySelector('.mega-menu__tile-title')?.textContent?.trim() || tile.textContent?.trim() || '');
            parts.push(`<a href="${tHref}" class="header__more-link header__more-link--child" role="menuitem">${tTitle}</a>`);
          });
          parts.push('</div>');
        } else {
          parts.push(`<a href="${href}" class="header__more-link" role="menuitem">${title}</a>`);
        }
      });
      this.moreContent.innerHTML = parts.join('');
    }

    openMore() {
      if (this.moreContent.innerHTML) this.moreItem.classList.add(this.moreActiveClass);
      const trigger = this.moreTrigger;
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    closeMore() {
      this.moreItem.classList.remove(this.moreActiveClass);
      const trigger = this.moreTrigger;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }

    toggleMore() {
      if (this.moreItem.classList.contains(this.moreActiveClass)) this.closeMore();
      else this.openMore();
    }
  }

  /* --- Support Dropdown --- */
  class SupportDropdown {
    constructor() {
      this.el = document.querySelector('[data-support-dropdown]');
      if (!this.el) return;

      this.timeout = null;

      this.el.addEventListener('mouseenter', () => {
        clearTimeout(this.timeout);
        this.el.classList.add('is-open');
      });

      this.el.addEventListener('mouseleave', () => {
        this.timeout = setTimeout(() => this.el.classList.remove('is-open'), 150);
      });

      this.el.querySelector('.header__support-trigger')?.addEventListener('click', () => {
        this.el.classList.toggle('is-open');
      });

      document.addEventListener('click', (e) => {
        if (!this.el.contains(e.target)) {
          this.el.classList.remove('is-open');
        }
      });
    }
  }

  /* --- Locale Selector --- */
  class LocaleSelector {
    constructor() {
      document.querySelectorAll('[data-locale-selector]').forEach(el => {
        const trigger = el.querySelector('.locale-selector__trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('[data-locale-selector].is-open').forEach(other => {
            if (other !== el) other.classList.remove('is-open');
          });
          const open = el.classList.toggle('is-open');
          trigger.setAttribute('aria-expanded', open);
          el.querySelector('.locale-selector__dropdown')?.setAttribute('aria-hidden', !open);
        });
      });

      document.addEventListener('click', () => {
        document.querySelectorAll('[data-locale-selector].is-open').forEach(el => {
          el.classList.remove('is-open');
          el.querySelector('.locale-selector__trigger')?.setAttribute('aria-expanded', 'false');
          el.querySelector('.locale-selector__dropdown')?.setAttribute('aria-hidden', 'true');
        });
      });
    }
  }

  /* --- Mobile Menu --- */
  class MobileMenu {
    constructor() {
      this.menu = document.querySelector('.mobile-menu');
      if (!this.menu) return;

      this.bindEvents();
      this.initAccordions();
    }

    bindEvents() {
      document.querySelectorAll('[data-menu-toggle]').forEach(btn => {
        btn.addEventListener('click', () => this.toggle());
      });

      this.menu.querySelector('[data-menu-close]')?.addEventListener('click', () => this.close());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) this.close();
      });
    }

    initAccordions() {
      this.menu.querySelectorAll('[data-mobile-accordion-trigger]').forEach(trigger => {
        trigger.addEventListener('click', () => {
          const parent = trigger.closest('[data-mobile-accordion]');
          const content = parent?.querySelector('[data-mobile-accordion-content]');
          if (!content) return;

          const isOpen = trigger.getAttribute('aria-expanded') === 'true';
          trigger.setAttribute('aria-expanded', String(!isOpen));
          content.setAttribute('aria-hidden', String(isOpen));

          if (isOpen) {
            content.style.maxHeight = '0';
          } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            this.updateParentHeights(content);
          }
        });
      });
    }

    updateParentHeights(el) {
      let parent = el.parentElement?.closest('[data-mobile-accordion-content]');
      while (parent) {
        parent.style.maxHeight = parent.scrollHeight + el.scrollHeight + 'px';
        parent = parent.parentElement?.closest('[data-mobile-accordion-content]');
      }
    }

    isOpen() {
      return this.menu.classList.contains('is-open');
    }

    open() {
      this.menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.menu.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    toggle() {
      this.isOpen() ? this.close() : this.open();
    }
  }

  /* --- Search Overlay --- */
  class SearchOverlay {
    constructor() {
      this.overlay = document.querySelector('.search-overlay');
      if (!this.overlay) return;

      this.input = this.overlay.querySelector('.search-overlay__input');
      this.bindEvents();
    }

    bindEvents() {
      document.querySelectorAll('[data-search-toggle]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggle();
        });
      });

      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) this.close();
        if (e.key === '/' && !this.isOpen() && !isInputFocused()) {
          e.preventDefault();
          this.open();
        }
      });
    }

    isOpen() {
      return this.overlay.classList.contains('is-open');
    }

    open() {
      this.overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => this.input?.focus(), 100);
    }

    close() {
      this.overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    toggle() {
      this.isOpen() ? this.close() : this.open();
    }
  }

  /* --- Tabs --- */
  class Tabs {
    constructor(container) {
      this.container = container;
      this.tabs = container.querySelectorAll('.tabs__tab');
      this.panels = container.querySelectorAll('.tabs__panel');

      this.tabs.forEach(tab => {
        tab.addEventListener('click', () => this.activate(tab.dataset.tab));
      });
    }

    activate(id) {
      this.tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === id));
      this.panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === id));
    }
  }

  /* --- Accordion --- */
  class Accordion {
    constructor(container) {
      this.items = container.querySelectorAll('.accordion__item');

      this.items.forEach(item => {
        const trigger = item.querySelector('.accordion__trigger');
        const content = item.querySelector('.accordion__content');

        trigger?.addEventListener('click', () => {
          const isOpen = trigger.getAttribute('aria-expanded') === 'true';
          trigger.setAttribute('aria-expanded', !isOpen);
          content.setAttribute('aria-hidden', isOpen);

          if (!isOpen) {
            content.style.maxHeight = content.scrollHeight + 'px';
          } else {
            content.style.maxHeight = '0';
          }
        });
      });
    }
  }

  /* --- Product Gallery --- */
  class ProductGallery {
    constructor(container) {
      this.main = container.querySelector('.pdp__gallery-main img');
      this.thumbs = container.querySelectorAll('.pdp__gallery-thumb');

      this.thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          this.thumbs.forEach(t => t.classList.remove('is-active'));
          thumb.classList.add('is-active');
          if (this.main) {
            this.main.src = thumb.querySelector('img').dataset.fullSrc || thumb.querySelector('img').src;
          }
        });
      });
    }
  }

  /* --- Quantity Selector --- */
  class QuantitySelector {
    constructor(container) {
      this.input = container.querySelector('input');
      const minus = container.querySelector('[data-qty-minus]');
      const plus = container.querySelector('[data-qty-plus]');

      minus?.addEventListener('click', () => this.update(-1));
      plus?.addEventListener('click', () => this.update(1));
    }

    update(delta) {
      const current = parseInt(this.input.value) || 1;
      const min = parseInt(this.input.min) || 1;
      const max = parseInt(this.input.max) || 99;
      this.input.value = Math.min(Math.max(current + delta, min), max);
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* --- Carousel --- */
  class Carousel {
    constructor(container) {
      this.track = container.querySelector('.carousel__track');
      if (!this.track) return;

      this.prevBtn = container.querySelector('[data-carousel-prev]');
      this.nextBtn = container.querySelector('[data-carousel-next]');

      this.prevBtn?.addEventListener('click', () => this.scroll(-1));
      this.nextBtn?.addEventListener('click', () => this.scroll(1));

      this.track.addEventListener('scroll', () => this.updateArrows(), { passive: true });
      this.updateArrows();

      this.initDrag();
    }

    scroll(direction) {
      const slide = this.track.querySelector('.carousel__slide');
      if (!slide) return;
      const gap = parseFloat(getComputedStyle(this.track).gap) || 16;
      this.track.scrollBy({ left: direction * (slide.offsetWidth + gap), behavior: 'smooth' });
    }

    updateArrows() {
      const { scrollLeft, scrollWidth, clientWidth } = this.track;
      const atStart = scrollLeft <= 2;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
      if (this.prevBtn) this.prevBtn.classList.toggle('is-hidden', atStart);
      if (this.nextBtn) this.nextBtn.classList.toggle('is-hidden', atEnd);
    }

    initDrag() {
      const DRAG_THRESHOLD_PX = 8;
      const SNAP_THRESHOLD_PX = 30;
      let isPointerDown = false;
      let hasDragged = false;
      let startX = 0;
      let scrollStart = 0;
      let activePointerId = null;

      const endDrag = (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        this.track.style.scrollSnapType = '';
        this.track.style.cursor = '';

        if (hasDragged && activePointerId != null) {
          try {
            this.track.releasePointerCapture(activePointerId);
          } catch (_) { /* already released */ }

          const dx = e.clientX - startX;
          if (Math.abs(dx) > SNAP_THRESHOLD_PX) {
            this.scroll(dx < 0 ? 1 : -1);
          }
        }

        activePointerId = null;
      };

      this.track.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        isPointerDown = true;
        hasDragged = false;
        startX = e.clientX;
        scrollStart = this.track.scrollLeft;
        activePointerId = e.pointerId;
      });

      this.track.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;

        const dx = e.clientX - startX;
        if (!hasDragged) {
          if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
          hasDragged = true;
          this.track.style.scrollSnapType = 'none';
          this.track.style.cursor = 'grabbing';
          this.track.setPointerCapture(e.pointerId);
        }

        this.track.scrollLeft = scrollStart - dx;
      });

      this.track.addEventListener('pointerup', endDrag);
      this.track.addEventListener('pointercancel', endDrag);

      // Only suppress link/button activation after a real drag, not on a tap/click.
      this.track.addEventListener('click', (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          hasDragged = false;
        }
      }, true);
    }
  }

  /* --- Sticky Header --- */
  /* Transparent over the hero, solid chrome once it scrolls past. On pages
     without a hero the header is just a solid sticky bar. */
  class StickyHeader {
    constructor() {
      this.header = document.querySelector('.header');
      if (!this.header) return;

      this.section = this.header.closest('.header-section');
      this.promo = document.querySelector('.announcement-bar-section');
      this.hero = document.querySelector('.hero-section');
      this.heroExitOffset = 100;
      this.scrollThreshold = 50;

      this.update = this.update.bind(this);
      this.update();
      window.addEventListener('scroll', this.update, { passive: true });
      window.addEventListener('resize', this.update, { passive: true });
    }

    update() {
      const scrollY = window.pageYOffset;

      if (this.hero) {
        const inHero = scrollY < this.hero.offsetHeight - this.heroExitOffset;
        if (this.section) this.section.classList.toggle('is-pinned', !inHero);
        if (this.promo) this.promo.classList.toggle('is-pinned', !inHero);
        this.header.classList.toggle('is-transparent', inHero);
        this.header.classList.toggle('scrolled', !inHero);
      } else {
        this.header.classList.toggle('scrolled', scrollY > this.scrollThreshold);
      }
    }
  }

  /* --- Bizmis voice demo (snippets/bizmis-voice-demo.liquid) ---
     Cycles the shopper "say this" prompts. The benefit pills hold steady across
     same-benefit slides while the sub-benefit + enabling feature fade in with
     each one, mirroring the coachmark. Pauses on hover so a prompt can be read. */
  class VoiceDemo {
    constructor(root) {
      this.root = root;
      this.slides = Array.from(root.querySelectorAll('[data-voice-demo-slide]'));
      if (!this.slides.length) return;

      const sceneScope = root.closest('[data-voice-demo-scope]') || document;
      this.scenes = Array.from(sceneScope.querySelectorAll('[data-voice-demo-scene]'));

      this.benefitPills = Array.from(root.querySelectorAll('[data-benefit-pill]'));
      this.subEl = root.querySelector('[data-voice-demo-sub]');
      this.featureEl = root.querySelector('[data-voice-demo-feature]');
      this.askEl = root.querySelector('[data-voice-demo-ask]');
      this.dotsWrap = root.querySelector('[data-voice-demo-dots]');
      this.index = 0;
      this.timer = null;
      this.paused = false;
      this.showMs = 3600;
      this.fadeMs = 600;
      this.gapMs = 250;
      this.wordMs = 340;
      this.askDelayMs = 550;
      this.wordTimers = [];

      this.show = this.show.bind(this);
      this.hide = this.hide.bind(this);
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.dots = this.buildDots();
      this.bindBenefitPills();

      this.show();

      if (!this.reduceMotion && this.slides.length > 1) {
        root.addEventListener('mouseenter', () => this.pause());
        root.addEventListener('mouseleave', () => this.resume());
      }
    }

    /* Benefit badges act as tabs: jump to the first sub-benefit of that branch. */
    bindBenefitPills() {
      this.benefitPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const type = pill.getAttribute('data-benefit-pill');
          const idx = this.slides.findIndex(s => s.getAttribute('data-benefit-type') === type);
          if (idx >= 0) this.jumpTo(idx);
        });
      });
    }

    buildDots() {
      if (!this.dotsWrap) return [];
      return this.slides.map((slide, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'voice-demo__dot';
        dot.setAttribute('aria-label', `Show example ${i + 1} of ${this.slides.length}`);
        dot.addEventListener('click', () => this.jumpTo(i));
        this.dotsWrap.appendChild(dot);
        return dot;
      });
    }

    setScene(i) {
      if (!this.scenes.length) return;
      this.scenes.forEach((scene, k) => scene.classList.toggle('is-active', k === i));
    }

    updateDots(slide) {
      if (!this.dots.length) return;
      const isSupport = slide.getAttribute('data-benefit-type') === 'support';
      this.dots.forEach((dot, i) => {
        const active = i === this.index;
        dot.classList.toggle('is-active', active);
        dot.classList.toggle('is-support', active && isSupport);
      });
    }

    clearTimer() {
      if (this.timer) {
        window.clearTimeout(this.timer);
        this.timer = null;
      }
    }

    jumpTo(i) {
      if (i === this.index && this.timer) return;
      this.clearWordTimers();
      this.clearTimer();
      const current = this.slides[this.index];
      current.classList.remove('is-active');
      current.querySelectorAll('.voice-demo__word').forEach(w => w.classList.remove('is-current'));
      if (this.askEl) this.askEl.classList.remove('is-shown');
      if (this.subEl) this.subEl.classList.remove('is-shown');
      if (this.featureEl) this.featureEl.classList.remove('is-shown');
      this.index = i;
      this.paused = false;
      this.show();
    }

    showEyebrow(slide) {
      const sub = slide.getAttribute('data-sub') || '';
      const benefitType = slide.getAttribute('data-benefit-type');

      this.benefitPills.forEach(pill => {
        pill.classList.toggle('is-active', pill.getAttribute('data-benefit-pill') === benefitType);
      });

      if (this.subEl) {
        this.subEl.textContent = sub;
        this.subEl.hidden = !sub;
        this.subEl.classList.toggle('is-support', benefitType === 'support');
        this.subEl.classList.add('is-shown');
      }

      if (this.featureEl) {
        const feature = slide.getAttribute('data-feature') || '';
        this.featureEl.textContent = feature;
        this.featureEl.hidden = !feature;
        this.featureEl.classList.toggle('is-support', benefitType === 'support');
        this.featureEl.classList.add('is-shown');
      }
    }

    clearWordTimers() {
      this.wordTimers.forEach(t => window.clearTimeout(t));
      this.wordTimers = [];
    }

    /* Sweep the red highlight chip across the phrase one word at a time. */
    runKaraoke(words) {
      this.clearWordTimers();
      if (!words.length) return;

      const step = (i) => {
        words.forEach(w => w.classList.remove('is-current'));
        if (i >= words.length) return;
        words[i].classList.add('is-current');
        this.wordTimers.push(window.setTimeout(() => step(i + 1), this.wordMs));
      };
      step(0);
    }

    /* Staggered reveal: the outcome (sub-benefit + feature) lands first, then
       the ask ("Just say" + use case phrase) follows and the karaoke starts. */
    show() {
      this.clearTimer();
      const slide = this.slides[this.index];
      this.showEyebrow(slide);
      this.updateDots(slide);
      this.setScene(this.index);
      this.slides.forEach(s => s.classList.remove('is-active'));
      if (this.askEl) this.askEl.classList.remove('is-shown');

      const revealAsk = () => {
        slide.classList.add('is-active');
        if (this.askEl) this.askEl.classList.add('is-shown');
        const words = slide.querySelectorAll('.voice-demo__word');
        this.runKaraoke(words);
        const dwell = Math.max(this.showMs, words.length * this.wordMs + 1400);
        if (!this.reduceMotion && this.slides.length > 1) {
          this.timer = window.setTimeout(this.hide, dwell);
        }
      };

      if (this.reduceMotion) {
        revealAsk();
      } else {
        this.timer = window.setTimeout(revealAsk, this.askDelayMs);
      }
    }

    hide() {
      if (this.paused) return;
      this.clearWordTimers();
      this.clearTimer();
      const current = this.slides[this.index];
      current.querySelectorAll('.voice-demo__word').forEach(w => w.classList.remove('is-current'));
      current.classList.remove('is-active');
      if (this.askEl) this.askEl.classList.remove('is-shown');
      if (this.subEl) this.subEl.classList.remove('is-shown');
      if (this.featureEl) this.featureEl.classList.remove('is-shown');

      this.timer = window.setTimeout(() => {
        this.timer = null;
        if (this.paused) return;
        this.index = (this.index + 1) % this.slides.length;
        this.show();
      }, this.fadeMs + this.gapMs);
    }

    /* Pause/resume always restart the current slide cleanly so the rotation can
       never get stranded mid-fade with no active slide. */
    pause() {
      this.paused = true;
      this.clearWordTimers();
      this.clearTimer();
    }

    resume() {
      if (!this.paused) return;
      this.paused = false;
      this.show();
    }
  }

  /* --- Variant Selector --- */
  class VariantSelector {
    constructor(container) {
      this.form = container;
      this.idInput = container.querySelector('[data-variant-id-input]');
      this.variants = JSON.parse(
        (container.querySelector('[data-product-variants]') || {}).textContent || '[]'
      );
      this.pills = container.querySelectorAll('.variant-pill');
      this.priceEl = document.querySelector('.pdp__price');
      this.compareEl = document.querySelector('.pdp__compare-price');
      this.badgeEl = document.querySelector('.pdp__price-row .badge--sale');
      this.addBtn = container.querySelector('[type="submit"]');
      this.mainImage = document.getElementById('pdp-main-image');
      this.stickyPrice = document.querySelector('[data-sticky-price]');
      this.stickyCompare = document.querySelector('[data-sticky-compare]');
      this.stickyBadge = document.querySelector('[data-sticky-badge]');

      this.initFromUrl();
      this.pills.forEach(pill => pill.addEventListener('click', () => this.onPillClick(pill)));
      this.interceptProductLinkClicks();
    }

    initFromUrl() {
      const params = new URLSearchParams(window.location.search);

      const variantId = parseInt(params.get('variant'), 10);
      if (variantId) {
        const variant = this.variants.find(v => v.id === variantId);
        if (variant) {
          this.selectVariantPills(variant);
          this.updateVariant(variant);
          return;
        }
      }

      const size = params.get('size');
      if (size && this.variants.length > 0) {
        const variant = this.variants.find(v =>
          v.available && v.options.some(o => o === size)
        ) || this.variants.find(v => v.options.some(o => o === size));
        if (variant) {
          this.selectVariantPills(variant);
          this.updateVariant(variant);
        }
      }
    }

    selectVariantPills(variant) {
      const groups = this.form.querySelectorAll('.pdp__variants');
      let optionIdx = 0;
      groups.forEach(group => {
        if (group.querySelector('[data-product-link-group]')) return;
        const targetValue = variant.options[optionIdx];
        if (targetValue) {
          group.querySelectorAll('.variant-pill').forEach(p => {
            p.classList.toggle('is-active', p.dataset.optionValue === targetValue);
          });
        }
        optionIdx++;
      });
    }

    interceptProductLinkClicks() {
      const links = this.form.querySelectorAll('[data-product-link]');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          const activeOption = this.getSelectedNonLinkOption();
          if (!activeOption) return;
          e.preventDefault();
          const url = new URL(link.href, window.location.origin);
          url.searchParams.set('size', activeOption);
          window.location.href = url.toString();
        });
      });
    }

    getSelectedNonLinkOption() {
      const groups = this.form.querySelectorAll('.pdp__variants');
      for (const group of groups) {
        if (group.querySelector('[data-product-link-group]')) continue;
        const active = group.querySelector('.variant-pill.is-active');
        if (active) return active.dataset.optionValue;
      }
      return null;
    }

    onPillClick(pill) {
      const group = pill.closest('.pdp__variants');
      group.querySelectorAll('.variant-pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');

      const selectedOptions = [];
      this.form.querySelectorAll('.pdp__variants').forEach(g => {
        const active = g.querySelector('.variant-pill.is-active');
        if (active) selectedOptions.push(active.dataset.optionValue);
      });

      const variant = this.variants.find(v =>
        v.options.length === selectedOptions.length &&
        v.options.every((opt, i) => opt === selectedOptions[i])
      );

      if (variant) this.updateVariant(variant);
    }

    updateVariant(variant) {
      if (this.idInput) this.idInput.value = variant.id;

      const url = new URL(window.location);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);

      let onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
      let displayPrice = variant.price_formatted;
      let strikePrice = variant.compare_at_price_formatted;
      let salePct = 0;

      if (onSale) {
        salePct = Math.round((variant.compare_at_price - variant.price) / variant.compare_at_price * 100);
      }

      if (this.priceEl) {
        this.priceEl.textContent = displayPrice;
        this.priceEl.classList.toggle('pdp__price--sale', onSale);
      }
      if (this.compareEl) {
        this.compareEl.textContent = onSale ? strikePrice : '';
        this.compareEl.style.display = onSale ? '' : 'none';
      }
      if (this.badgeEl) {
        this.badgeEl.textContent = onSale ? `-${salePct}%` : '';
        this.badgeEl.style.display = onSale ? '' : 'none';
      }

      if (this.addBtn) {
        if (variant.available) {
          this.addBtn.disabled = false;
          this.addBtn.textContent = this.addBtn.dataset.addText || 'Add to Cart';
        } else {
          this.addBtn.disabled = true;
          this.addBtn.textContent = 'Sold Out';
        }
      }

      if (this.stickyPrice) this.stickyPrice.textContent = displayPrice;
      if (this.stickyCompare) {
        this.stickyCompare.textContent = onSale ? strikePrice : '';
        this.stickyCompare.style.display = onSale ? '' : 'none';
      }
      if (this.stickyBadge) {
        this.stickyBadge.textContent = onSale ? `-${salePct}%` : '';
        this.stickyBadge.style.display = onSale ? '' : 'none';
      }

      if (variant.featured_image && this.mainImage) {
        this.mainImage.src = variant.featured_image;
      }
    }
  }

  /* --- Collection Filters --- */
  class CollectionFilters {
    constructor() {
      this.section = document.querySelector('[data-collection-section]');
      if (!this.section) return;

      this.drawer = this.section.querySelector('[data-filter-drawer]');
      this.overlay = this.section.querySelector('[data-filter-overlay]');
      this.form = this.section.querySelector('[data-filter-form]');
      this.productsContainer = this.section.querySelector('[data-collection-products]');
      this.badgesContainer = this.section.querySelector('[data-filter-badges]');
      this.sortSelect = this.section.querySelector('#sort-by');
      this.sectionId = this.section.dataset.sectionId;

      this.debounceTimer = null;
      this.bindEvents();
    }

    bindEvents() {
      this.section.querySelectorAll('[data-filter-toggle]').forEach(btn =>
        btn.addEventListener('click', () => this.openDrawer())
      );
      this.section.querySelector('[data-filter-close]')?.addEventListener('click', () => this.closeDrawer());
      this.overlay?.addEventListener('click', () => this.closeDrawer());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.drawer?.classList.contains('is-open')) this.closeDrawer();
      });

      this.form?.addEventListener('change', () => this.onFilterChange());

      this.section.querySelectorAll('[data-filter-remove]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.applyUrl(link.href);
        });
      });

      this.section.querySelector('[data-filter-clear]')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyUrl(e.currentTarget.href);
        this.closeDrawer();
      });

      this.sortSelect?.addEventListener('change', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort_by', this.sortSelect.value);
        this.applyUrl(url.toString());
      });

      this.section.querySelectorAll('[data-price-min], [data-price-max]').forEach(input => {
        input.addEventListener('change', () => this.onFilterChange());
      });
    }

    openDrawer() {
      this.drawer?.classList.add('is-open');
      this.overlay?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    closeDrawer() {
      this.drawer?.classList.remove('is-open');
      this.overlay?.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    onFilterChange() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const formData = new FormData(this.form);
        const url = new URL(window.location.href);

        const filterParams = Array.from(url.searchParams.entries())
          .filter(([key]) => key.startsWith('filter.') || key === 'page');
        filterParams.forEach(([key]) => url.searchParams.delete(key));

        for (const [key, value] of formData.entries()) {
          if (value !== '') url.searchParams.append(key, value);
        }

        url.searchParams.delete('page');
        this.applyUrl(url.toString());
      }, 300);
    }

    async applyUrl(urlString) {
      const url = new URL(urlString);
      url.searchParams.set('sections', this.sectionId);

      history.replaceState({}, '', urlString);
      this.section.classList.add('is-loading');

      try {
        const res = await fetch(url.toString());
        const data = await res.json();
        const html = data[this.sectionId];
        if (!html) return;

        const doc = new DOMParser().parseFromString(html, 'text/html');

        const newProducts = doc.querySelector('[data-collection-products]');
        if (newProducts && this.productsContainer) {
          this.productsContainer.innerHTML = newProducts.innerHTML;
        }

        const newBadges = doc.querySelector('[data-filter-badges]');
        if (newBadges && this.badgesContainer) {
          this.badgesContainer.innerHTML = newBadges.innerHTML;
          this.badgesContainer.querySelectorAll('[data-filter-remove]').forEach(link => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              this.applyUrl(link.href);
            });
          });
        }

        const newForm = doc.querySelector('[data-filter-form]');
        if (newForm && this.form) {
          this.form.innerHTML = newForm.innerHTML;
          this.section.querySelectorAll('[data-price-min], [data-price-max]').forEach(input => {
            input.addEventListener('change', () => this.onFilterChange());
          });
        }

        const newCount = doc.querySelector('[data-products-count]');
        const currentCount = this.section.querySelector('[data-products-count]');
        if (newCount && currentCount) {
          currentCount.textContent = newCount.textContent;
        }

        const newSort = doc.querySelector('#sort-by');
        if (newSort && this.sortSelect) {
          this.sortSelect.value = newSort.value;
        }
      } catch {
        window.location = urlString;
      } finally {
        this.section.classList.remove('is-loading');
      }
    }
  }

  /* --- Search Infinite Scroll --- */
  class SearchInfiniteScroll {
    constructor() {
      this.section = document.querySelector('[data-search-section]');
      if (!this.section) return;

      this.grid = this.section.querySelector('[data-search-results]');
      this.sentinel = this.section.querySelector('[data-search-load-more]');
      if (!this.grid || !this.sentinel) return;

      this.loading = false;
      this.observer = new IntersectionObserver(
        (entries) => {
          if (this.loading) return;
          if (entries[0].isIntersecting) this.loadNext();
        },
        { rootMargin: '200px', threshold: 0 }
      );
      this.observer.observe(this.sentinel);
    }

    getFetchUrl() {
      const nextUrl = this.sentinel.dataset.nextUrl;
      if (!nextUrl) return null;
      const sectionId = this.section.dataset.sectionId;
      if (!sectionId) return null;
      const sep = nextUrl.includes('?') ? '&' : '?';
      const base = window.Shopify?.routes?.root ?? '/';
      const path = nextUrl.startsWith('/') ? nextUrl : base + nextUrl;
      return `${path}${sep}sections=${encodeURIComponent(sectionId)}`;
    }

    async loadNext() {
      const url = this.getFetchUrl();
      if (!url) return;

      this.loading = true;
      this.sentinel.classList.add('is-loading');

      try {
        const res = await fetch(url);
        const data = await res.json();
        const sectionId = this.section.dataset.sectionId;
        const html = data[sectionId];
        if (!html) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newGrid = doc.querySelector('[data-search-results]');
        const newSentinel = doc.querySelector('[data-search-load-more]');

        if (newGrid) {
          while (newGrid.firstChild) {
            this.grid.appendChild(newGrid.firstChild);
          }
        }

        if (newSentinel?.dataset.nextUrl) {
          this.sentinel.dataset.nextUrl = newSentinel.dataset.nextUrl;
        } else {
          this.sentinel.remove();
          this.observer.disconnect();
        }
      } catch {
        this.sentinel.classList.remove('is-loading');
      } finally {
        this.loading = false;
        this.sentinel.classList.remove('is-loading');
      }
    }
  }

  /* --- Helpers --- */
  function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  /* --- Hero Slideshow --- */
  class HeroSlideshow {
    constructor(el) {
      this.el = el;
      this.slides = el.querySelectorAll('[data-hero-slide]');
      this.dots = el.querySelectorAll('[data-hero-dot]');
      this.current = 0;
      this.total = this.slides.length;
      this.interval = parseInt(el.dataset.autoplayInterval, 10) || 6000;
      this.timer = null;
      this.paused = false;

      if (this.total <= 1) return;

      this.bindControls();
      this.startAutoplay();
    }

    bindControls() {
      this.el.querySelector('[data-hero-prev]')?.addEventListener('click', () => this.prev());
      this.el.querySelector('[data-hero-next]')?.addEventListener('click', () => this.next());
      this.dots.forEach(dot => {
        dot.addEventListener('click', () => this.goTo(parseInt(dot.dataset.heroDot, 10)));
      });

      // No hover pause: the hero is fullscreen, so the cursor is almost always
      // over it and pausing made the slideshow look stuck. Focus pause stays
      // so keyboard users can operate the controls.
      this.el.addEventListener('focusin', () => this.pause());
      this.el.addEventListener('focusout', () => this.resume());

      this.bindSwipe();
    }

    // Touch devices hide the nav pill (base.css), so a horizontal swipe is
    // the way to change slides there.
    bindSwipe() {
      const SWIPE_MIN_PX = 48;
      let startX = null;
      let startY = null;

      this.el.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });

      this.el.addEventListener('touchend', (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        startX = null;
        startY = null;
        // Mostly-horizontal gestures only; let vertical scrolling through.
        if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) this.next(); else this.prev();
      }, { passive: true });
    }

    goTo(index) {
      if (index === this.current) return;
      this.slides[this.current].classList.remove('is-active');
      this.dots[this.current]?.classList.remove('is-active');
      this.current = (index + this.total) % this.total;
      this.slides[this.current].classList.add('is-active');
      this.dots[this.current]?.classList.add('is-active');
      this.resetAutoplay();
    }

    next() { this.goTo(this.current + 1); }
    prev() { this.goTo(this.current - 1); }

    startAutoplay() {
      this.timer = setInterval(() => {
        if (!this.paused) this.next();
      }, this.interval);
    }

    resetAutoplay() {
      clearInterval(this.timer);
      this.startAutoplay();
    }

    pause() { this.paused = true; }
    resume() { this.paused = false; }
  }

  /* --- Hero copy intro ---
     Word-by-word fade on the shared overlay: eyebrow, then headline, then
     the red line. The underline paints after the last red-line word lands.
     Starts once the page loader is out of the way. */
  const HERO_WORD_STAGGER_MS = 150;
  const HERO_LINE_PAUSE_MS = 420;
  const HERO_REDEFINE_HOLD_MS = 640;
  const HERO_REDEFINE_STRIKE_MS = 640;
  const HERO_REDEFINE_STRIKE_HOLD_MS = 260;
  const HERO_REDEFINE_MORPH_MS = 920;
  const HERO_REDEFINE_SETTLE_MS = 280;
  const HERO_REDEFINE_TOTAL_MS =
    HERO_REDEFINE_HOLD_MS
    + HERO_REDEFINE_STRIKE_MS
    + HERO_REDEFINE_STRIKE_HOLD_MS
    + HERO_REDEFINE_MORPH_MS
    + HERO_REDEFINE_SETTLE_MS;
  const HERO_LINE_UNDERLINE_MS = 400;

  class HeroCopyReveal {
    constructor(slideshow) {
      this.root = slideshow.querySelector('.hero__content');
      this.cta = null;
      this.titleLine = null;
      this.underlineAt = 0;
      this.redefineAt = 0;
      this.started = false;
      if (!this.root) return;
      requestAnimationFrame(() => this.prepare());
    }

    prepare() {
      this.cta = this.root.querySelector('.hero__title-cta');
      this.titleLine = this.root.querySelector('.hero__title-line');
      const intro = [
        this.root.querySelector('.hero__subtitle'),
        this.titleLine
      ].filter(Boolean);

      if (!intro.length && !this.cta) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (this.cta) {
          this.ensureCtaInk(this.cta);
          this.wrapWords(this.cta.querySelector('.hero__title-cta-ink') || this.cta);
        }
        this.titleLine?.classList.add('is-redefined');
        this.root.classList.add('is-hero-animated');
        this.root.classList.add('is-revealing');
        this.groupCtaLines();
        this.cta?.classList.add('is-underlined');
        this.cta?.querySelectorAll('.hero__title-cta-line').forEach((line) => {
          line.classList.add('is-underlined');
        });
        return;
      }

      intro.forEach((line) => this.wrapWords(line));
      if (this.cta) {
        this.ensureCtaInk(this.cta);
        this.wrapWords(this.cta.querySelector('.hero__title-cta-ink') || this.cta);
      }

      let delay = 140;
      intro.forEach((line) => {
        const words = line.querySelectorAll('.hero__word');
        words.forEach((word, wordIndex) => {
          word.style.animationDelay = `${delay + wordIndex * HERO_WORD_STAGGER_MS}ms`;
        });
        const lineEnd = delay + Math.max(words.length - 1, 0) * HERO_WORD_STAGGER_MS;
        delay = lineEnd + HERO_WORD_STAGGER_MS + HERO_LINE_PAUSE_MS;
      });

      if (this.titleLine?.hasAttribute('data-hero-redefine')) {
        const titleEnd = delay - HERO_WORD_STAGGER_MS - HERO_LINE_PAUSE_MS;
        this.redefineAt = titleEnd + HERO_REDEFINE_HOLD_MS;
        delay = titleEnd + HERO_REDEFINE_TOTAL_MS + HERO_LINE_PAUSE_MS;
      }

      if (this.cta) {
        const words = this.cta.querySelectorAll('.hero__word');
        words.forEach((word, wordIndex) => {
          word.style.animationDelay = `${delay + wordIndex * HERO_WORD_STAGGER_MS}ms`;
        });
        const lineEnd = delay + Math.max(words.length - 1, 0) * HERO_WORD_STAGGER_MS;
        this.underlineAt = lineEnd + 280;
      }

      this.root.classList.add('is-hero-animated');
      requestAnimationFrame(() => this.groupCtaLines());
      this.armStart();
    }

    wrapWords(el) {
      const existing = el.querySelectorAll('.hero__word');
      if (existing.length) {
        existing.forEach((word) => word.setAttribute('aria-hidden', 'true'));
        return existing.length;
      }

      const text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return 0;

      el.setAttribute('aria-label', text);
      el.textContent = '';

      const words = text.split(' ');
      words.forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'hero__word';
        span.textContent = word;
        span.setAttribute('aria-hidden', 'true');
        el.appendChild(span);
        if (index < words.length - 1) el.appendChild(document.createTextNode(' '));
      });

      return words.length;
    }

    ensureCtaInk(el) {
      if (!el || el.querySelector(':scope > .hero__title-cta-ink')) return;
      const ink = document.createElement('span');
      ink.className = 'hero__title-cta-ink';
      while (el.firstChild) ink.appendChild(el.firstChild);
      el.appendChild(ink);
    }

    groupCtaLines() {
      const ink = this.cta?.querySelector('.hero__title-cta-ink');
      if (!ink || ink.querySelector('.hero__title-cta-line')) return;

      const words = [...ink.querySelectorAll('.hero__word')];
      if (!words.length) return;

      const buckets = [];
      words.forEach((word, index) => {
        const top = Math.round(word.getBoundingClientRect().top);
        let bucket = buckets.find((entry) => Math.abs(entry.top - top) < 6);
        if (!bucket) {
          bucket = { top, nodes: [] };
          buckets.push(bucket);
        }
        bucket.nodes.push(word);
        const nextWord = words[index + 1];
        const space = word.nextSibling;
        if (
          nextWord
          && space
          && space.nodeType === Node.TEXT_NODE
          && Math.abs(Math.round(nextWord.getBoundingClientRect().top) - top) < 6
        ) {
          bucket.nodes.push(space);
        }
      });

      buckets.forEach((bucket) => {
        const line = document.createElement('span');
        line.className = 'hero__title-cta-line';
        bucket.nodes[0].parentNode.insertBefore(line, bucket.nodes[0]);
        bucket.nodes.forEach((node) => line.appendChild(node));
        const rule = document.createElement('span');
        rule.className = 'hero__title-cta-rule';
        rule.setAttribute('aria-hidden', 'true');
        line.appendChild(rule);
      });
    }

    playCtaUnderline() {
      if (!this.cta) return;
      this.groupCtaLines();
      this.cta.classList.add('is-underlined');
      const lines = [...this.cta.querySelectorAll('.hero__title-cta-line')];
      lines.forEach((line, index) => {
        window.setTimeout(() => line.classList.add('is-underlined'), index * HERO_LINE_UNDERLINE_MS);
      });
    }

    playRedefine(line) {
      if (!line || line.classList.contains('is-redefined')) return;

      const from = line.querySelector('.hero__redefine-from');
      const to = line.querySelector('.hero__redefine-to');
      if (!from || !to) {
        line.classList.add('is-redefined');
        return;
      }

      from.style.width = `${from.getBoundingClientRect().width}px`;
      to.style.width = '0px';
      line.classList.add('is-striking');

      const morphAt = HERO_REDEFINE_STRIKE_MS + HERO_REDEFINE_STRIKE_HOLD_MS;
      window.setTimeout(() => {
        const nextWidth = to.scrollWidth;
        line.classList.add('is-erasing', 'is-redefined');
        from.style.width = '0px';
        to.style.width = `${nextWidth}px`;
      }, morphAt);

      window.setTimeout(() => {
        line.classList.remove('is-striking', 'is-erasing');
        from.style.width = '';
        to.style.width = '';
      }, morphAt + HERO_REDEFINE_MORPH_MS);
    }

    begin() {
      if (this.started) return;
      this.started = true;
      this.root.classList.add('is-revealing');
      if (this.cta) {
        window.setTimeout(() => this.playCtaUnderline(), this.underlineAt);
      }
      if (this.redefineAt) {
        window.setTimeout(() => this.playRedefine(this.titleLine), this.redefineAt);
      }
    }

    armStart() {
      if (promoVideo === 'opening' || hasPromoCover()) return;

      const loader = document.getElementById('page-loader');
      if (!loader || loader.classList.contains('is-hidden')) {
        this.begin();
        return;
      }

      loader.addEventListener('transitionend', (event) => {
        if (event.target === loader) this.begin();
      });
      window.addEventListener('load', () => window.setTimeout(() => this.begin(), 520), { once: true });
    }
  }

  /* --- Money Formatter --- */
  function formatMoney(cents) {
    const fmt = window.Shopify?.money_format || '${{amount}}';
    const raw = (cents / 100).toFixed(2);
    const withCommas = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const noDecimals = Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fmt
      .replace('{{amount_with_comma_separator}}', raw.replace('.', ','))
      .replace('{{amount_no_decimals_with_comma_separator}}', Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
      .replace('{{amount_no_decimals}}', noDecimals)
      .replace('{{amount}}', withCommas);
  }

  /* --- Newsletter Confetti --- */
  function fireConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#D1001A';
    const gravity = 0.32;
    const drag = 0.006;
    const duration = 2600;
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.35;

    const particles = Array.from({ length: 150 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 11;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 6,
        color: primary,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
      };
    });

    const start = performance.now();

    const frame = (now) => {
      const elapsed = now - start;
      const life = Math.max(0, 1 - elapsed / duration);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.vy += gravity;
        p.vx *= (1 - drag);
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        window.removeEventListener('resize', resize);
        canvas.remove();
      }
    };

    requestAnimationFrame(frame);
  }

  /* --- Subscription celebration ---
     After a successful subscribe, Shopify reloads with ?customer_posted=true
     and the form id as the fragment (e.g. #footer-newsletter). Auto-scroll to
     that section, then fire confetti once the scroll has settled. */
  function whenScrollSettles(callback) {
    let done = false;
    let idle;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idle);
      clearTimeout(safety);
      callback();
    };
    const onScroll = () => {
      clearTimeout(idle);
      idle = setTimeout(finish, 140);
    };
    const safety = setTimeout(finish, 2000);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initSubscriptionCelebration() {
    const successEl = document.querySelector('[data-newsletter-success]');
    if (!successEl) return;

    const hashId = window.location.hash.length > 1
      ? decodeURIComponent(window.location.hash.slice(1))
      : null;
    const target = (hashId && document.getElementById(hashId))
      || successEl.closest('section, .footer__newsletter-banner')
      || successEl;

    const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
    const centerMargin = Math.max(0, (window.innerHeight - target.offsetHeight) / 2);
    const targetY = Math.max(0, absoluteTop - centerMargin);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || Math.abs(window.scrollY - targetY) < 4) {
      window.scrollTo(0, targetY);
      fireConfetti();
      return;
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    whenScrollSettles(fireConfetti);
    requestAnimationFrame(() => window.scrollTo({ top: targetY, behavior: 'smooth' }));
  }

  /* --- Bizmis voice clerk trigger ---
     "Talk to the clerk" starts a voicechat through the widget's imperative API
     (window.AvatarVoicechat.startVoicechat). Older widget builds without that
     API fall back to surfacing + pulsing the floating widget. */
  const VOICE_WIDGET_SELECTORS = ['#bizmis-avatar-embed', '.bizmis-avatar-widget-root', '#avatar-root', '[data-avatar-widget]'];

  function findVoiceWidget() {
    for (let i = 0; i < VOICE_WIDGET_SELECTORS.length; i++) {
      const el = document.querySelector(VOICE_WIDGET_SELECTORS[i]);
      if (el) return el;
    }
    return document.getElementById('bizmis-shopify-avatar-widget');
  }

  function isPromoTrueHome() {
    return promoStoreUnlocked && document.body.classList.contains('template-index');
  }

  function promoTypeAfterMs() {
    const raw = promoSearchParams().get('type_after');
    if (raw == null || raw === '') return PROMO_TYPE_AFTER_MS;
    const ms = Number(raw);
    return Number.isFinite(ms) && ms >= 0 ? ms : PROMO_TYPE_AFTER_MS;
  }

  class PromoQueryTypewriter {
    constructor() {
      this.input = null;
      this.timer = 0;
      this.aborted = false;
    }

    schedule() {
      if (!isPromoTrueHome()) return;
      window.setTimeout(() => this.begin(), promoTypeAfterMs());
    }

    begin() {
      this.findInput().then((input) => {
        if (!input || this.aborted) return;
        this.input = input;
        this.watchAbort();
        input.focus({ preventScroll: true });
        if (prefersReducedMotion()) {
          this.setValue(PROMO_TYPE_QUERY);
          return;
        }
        this.type(0);
      });
    }

    findInput() {
      const deadline = Date.now() + PROMO_TYPE_FIND_MS;
      return new Promise((resolve) => {
        const tick = () => {
          const input = this.locateInput();
          if (input) {
            resolve(input);
            return;
          }
          if (Date.now() >= deadline) {
            resolve(null);
            return;
          }
          window.setTimeout(tick, 120);
        };
        tick();
      });
    }

    locateInput() {
      const widget = findVoiceWidget();
      if (!widget) return null;
      const candidates = widget.querySelectorAll('textarea, .bizmis-chat-input-bar input');
      for (let i = 0; i < candidates.length; i++) {
        if (this.isUsable(candidates[i])) return candidates[i];
      }
      return null;
    }

    isUsable(el) {
      if (!el || el.disabled || el.value) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 8 && rect.height > 8;
    }

    watchAbort() {
      const abort = (event) => {
        if (!event.isTrusted) return;
        this.aborted = true;
        window.clearTimeout(this.timer);
      };
      this.input.addEventListener('keydown', abort);
      this.input.addEventListener('pointerdown', abort);
    }

    type(index) {
      if (this.aborted) return;
      this.setValue(PROMO_TYPE_QUERY.slice(0, index));
      if (index >= PROMO_TYPE_QUERY.length) return;
      this.timer = window.setTimeout(() => this.type(index + 1), PROMO_TYPE_CHAR_MS);
    }

    followCaret() {
      const input = this.input;
      if (!input) return;
      const len = input.value.length;
      input.focus({ preventScroll: true });
      try {
        input.setSelectionRange(len, len);
      } catch {
        /* some input types reject selection */
      }
      input.scrollLeft = input.scrollWidth;
      input.scrollTop = input.scrollHeight;
    }

    setValue(value) {
      const proto = this.input.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(this.input, value);
      this.input.dispatchEvent(new Event('input', { bubbles: true }));
      this.followCaret();
      requestAnimationFrame(() => {
        this.followCaret();
        requestAnimationFrame(() => this.followCaret());
      });
    }
  }

  function openVoiceClerk() {
    const api = window.AvatarVoicechat;
    if (api && typeof api.startVoicechat === 'function' && api.startVoicechat()) return;

    const widget = findVoiceWidget();
    if (!widget) return;

    widget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    widget.classList.add('bizmis-widget-pulse');
    window.setTimeout(() => widget.classList.remove('bizmis-widget-pulse'), 1800);
  }

  function initVoiceClerkTriggers() {
    document.querySelectorAll('[data-open-voice-clerk]').forEach(btn => {
      btn.addEventListener('click', openVoiceClerk);
    });
  }

  /* Measure the demo promo bar so the index header floats just below it (and the
     hero fills exactly the remaining viewport). Handles wrapping on small screens. */
  function initPromoBar() {
    const bar = document.querySelector('.promo-bar');
    if (!bar) {
      document.documentElement.style.setProperty('--promo-height', '28px');
      document.body.style.setProperty('--promo-height', '28px');
      return;
    }
    const apply = () => document.body.style.setProperty('--promo-height', `${bar.offsetHeight}px`);
    apply();
    window.addEventListener('resize', apply, { passive: true });
    window.addEventListener('load', apply);
  }

  /* --- Initialize --- */
  function init() {
    const cartDrawer = new CartDrawer();
    new AddToCart(cartDrawer);
    new CartPage();
    new CollectionFilters();
    new SearchInfiniteScroll();
    new DesktopNav();
    new NavOverflow();
    new SupportDropdown();
    new LocaleSelector();
    new MobileMenu();
    new SearchOverlay();
    new StickyHeader();

    document.querySelectorAll('[data-tabs]').forEach(el => new Tabs(el));
    document.querySelectorAll('[data-accordion]').forEach(el => new Accordion(el));
    document.querySelectorAll('.pdp__gallery').forEach(el => new ProductGallery(el));
    document.querySelectorAll('.qty-selector:not(.cart-drawer .qty-selector):not(.main-cart-section .qty-selector)').forEach(el => new QuantitySelector(el));
    document.querySelectorAll('.carousel').forEach(el => new Carousel(el));
    applyPromoVideoHero();
    let heroReveal = null;
    document.querySelectorAll('[data-hero-slideshow]').forEach(el => {
      new HeroSlideshow(el);
      heroReveal = new HeroCopyReveal(el);
    });
    const promoTypewriter = new PromoQueryTypewriter();
    const startPromoTypewriter = () => promoTypewriter.schedule();
    if (promoVideo === 'opening') {
      const opening = document.querySelector('[data-promo-opening]');
      if (opening) {
        const openingController = new PromoOpening(opening, () => {
          heroReveal?.begin();
          startPromoTypewriter();
        });
        window.__promoOpeningFrames = openingController;
      }
    } else if (hasPromoCover()) {
      const cover = document.querySelector('[data-promo-cover]');
      if (cover) new PromoCover(cover, heroReveal, startPromoTypewriter).start();
      else startPromoTypewriter();
    } else {
      startPromoTypewriter();
    }
    document.querySelectorAll('[data-voice-demo]').forEach(el => new VoiceDemo(el));
    initVoiceClerkTriggers();
    initPromoBar();
    propagatePromoVideoParam();
    document.querySelectorAll('[data-variant-selector]').forEach(el => {
      new VariantSelector(el);
    });
  }

  function dismissLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    loader.classList.add('is-hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    dismissLoader();
    // Wait out the loader fade so the scroll and confetti are not hidden behind it.
    setTimeout(initSubscriptionCelebration, 600);
  });
})();
