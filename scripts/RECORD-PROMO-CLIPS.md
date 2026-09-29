# Re-recording the promo grid clips

The grid does not run the 3D clerk live. Each window plays a muted mp4. Re-record when any of these change, or the cells will show the old products, the old avatar, or the old colors:

- Clay products in `assets/promo-product-*.png`, or `PROMO_CATALOG` / `PROMO_COMPARE_SHAPES` / `PROMO_ACCESSORY_SHAPE` in `assets/theme.js`
- Avatar model, mesh colors, or the Bizmis stamp (`PROMO_BIZMIS_AVATAR_MODEL_URL`, `PROMO_BIZMIS_MESH_COLORS`, `data-promo-bizmis-stamp`)
- The moments poses (catalog, product page, compare, bundle) or their timing
- Device aspect ratios in `PROMO_GRID.devices` and in `DEVICES` below

Pain clips and pitch clips are different films. Do not mix them.

## Pain clips (cold store, no avatar)

Grayscale store windows. Chat on or off. Desktop can show a cursor on wander. Phone and tablet never show a cursor. There is no orange ball and no 3D clerk.

Motions, desktop: `scroll-up`, `scroll-down`, `wander-near`, `wander-far`, `product-read`, `product-scroll`, `compare`.

Phone and tablet: the same list without the two wanders. A wander passed on a phone is coerced to `scroll-up`.

File name: `promo-clip-pain-{device}-{motion}-{chat}.mp4` where chat is `0` or `1`.

Record size (exact, even, matches the window aspect so `object-fit: fill` does not crop):

- desktop 800×500 (16:10)
- phone 360×780 (9 / 19.5)
- tablet 960×720 (4:3)

## Pitch clips (the moments, with the real clerk)

These are the sold-grid windows after the first one. They are recordings of the same moments sequence as the pitch film: catalog, product page, compare, and the bundle, with the live Bizmis avatar seated in the window. Do not put a CSS circle or an orange sphere in their place. `mountClipClerk` is the old stand-in and must stay unused. The first window is the saved still described below, not one of these clips.

Two product takes, so neighboring cells are not the same shelf:

- Take `a` is the moments defaults: capsule, sphere, rounded cube, torus accessory.
- Take `b` swaps the heroes to cone, cylinder, dome, and a slab accessory, and rotates the other catalog photos.

Motions (same list on every device): `moment-catalog-a`, `moment-catalog-b`, `moment-product-a`, `moment-product-b`, `moment-compare-a`, `moment-compare-b`, `moment-bundle-a`, `moment-bundle-b`.

File name: `promo-clip-pitch-{device}-{motion}-0.mp4`. The trailing `0` is the chat slot. Pitch moments never use chat `1`.

Pose each motion opens:

- `catalog` opens the catalog grid and the clerk waves
- `product` opens the product page and the clerk nods
- `compare` opens the comparison and the clerk nods
- `bundle` opens the add-on bundle and the clerk nods

The recorder waits until `#bizmis-avatar-embed canvas` has a real bitmap, then holds 1.1s so the pose has started, then grabs 30 frames at 10fps (3.0s). ffmpeg is `/tmp/ffmpeg-bin/ffmpeg` unless `FFMPEG` is set. Playwright is the npx module. Chrome channel, `reducedMotion: no-preference`. Store password is `bizmis` (`PROMO_STORE_PASSWORD`).

## How to record

From the theme root. The script injects local `theme.js`, `base.css`, `promo-ad-tokens.css`, and `promo-ad.css`. The avatar script is the live CDN one, so the model that is deployed is the model you record.

```bash
export PLAYWRIGHT_MODULE="$HOME/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"

# Pitch moments only (the usual re-record after an avatar or product change)
PROMO_CLIP_SET=moments node scripts/record-promo-clips.mjs

# One device, or one motion, while checking a change
PROMO_CLIP_SET=moments PROMO_CLIP_DEVICE=desktop PROMO_CLIP_MOTION=moment-catalog-a node scripts/record-promo-clips.mjs

# Pain store clips only
PROMO_CLIP_SET=pain node scripts/record-promo-clips.mjs
```

`PROMO_CLIP_SET` is `moments`, `pain`, or `all` (default `all`).

After the mp4s land in `assets/`, the keys in `layout/theme.liquid` (`promo_clip_keys`) must include every new file name without the `promo-clip-` prefix and without `.mp4`. `clipSrc` in `theme.js` looks that map up. Pitch grid cells pick a motion from `PROMO_PITCH_MOMENTS` by cell position, and skip a motion that matches the cell to the left or above. Pain cells still use `PROMO_CLIP_MOTIONS`, shuffled the same way. Device shape is shuffled the same way, except the top-left window, which stays desktop.

## First sold window

`assets/promo-pitch-grid-lead.jpg` is the last frame of the pitch moments: the bundle pose, clerk included, cropped to the store. The pitch grid's first window shows that still and does not swap it for a clip, so the cut from the moments has the same picture.

Re-export it whenever a moments change would alter that last frame (products, colors, avatar, bundle pose, clerk seat):

```bash
export PLAYWRIGHT_MODULE="$HOME/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"
node scripts/export-pitch-grid-lead.mjs
```

The file is `data-promo-pitch-lead` in `layout/theme.liquid`. The orange sale wash fades in over 340ms with the burst. It does not replace the still.

Then export both films. The exporters route `promo-clip-*.mp4` from local `assets/`, so you do not wait for the theme to sync:

```bash
./scripts/export-opening-frames.sh
node scripts/export-promo-fps.mjs
```

Hard-reload the store after the theme sync before judging the live page. The exporters are not the live page.

## What to look at in a pitch frame

The clerk is the 3D Bizmis character, inside the window, not a circle. Take `a` and take `b` show different products. Catalog, product, compare, and bundle are four different layouts. Phone and tablet are the same scenes fitted to those viewports (`--clip-clerk-lane`, a smaller clerk scale, and the clerk pinned to the bottom-right of the viewport), not a stretched desktop frame. No orange sphere. Phone clips spoof `window.innerWidth` to 1280 before the page loads. Under 768px the widget swaps the full character for a hidden round bubble, so the phone viewport has to lie about its width or the clerk never appears. Tablet and desktop do not spoof it.
