import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THEME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIDGET = path.resolve(THEME, '../../trujilloai-bizmis-widget');
const OUT = path.join(THEME, 'assets');
const SIZE = 512;
const KINDS = ['sphere', 'cube', 'rounded-cube', 'cylinder', 'low-cylinder', 'tall-box', 'cone', 'capsule', 'torus', 'dome'];
const TURNS = [-20, 0, 20];
const FINISHES = ['matte', 'satin'];

function turnKey(turn) {
  if (turn < 0) return `m${Math.abs(turn)}`;
  if (turn > 0) return `p${turn}`;
  return '0';
}

const playwright = await import('/Users/toruhiyo/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs');
const threeSrc = fs.readFileSync(path.join(WIDGET, 'node_modules/three/build/three.module.js'));
const roundedSrc = fs.readFileSync(
  path.join(WIDGET, 'node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js'),
  'utf8',
).replace("from 'three'", "from 'https://clay.local/three.module.js'");

const browser = await playwright.chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
await page.exposeFunction('saveClay', (name, dataUrl) => {
  const file = path.join(OUT, `promo-clay-${name}.png`);
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(name, fs.statSync(file).size);
});
await page.route('https://clay.local/three.module.js', (route) => route.fulfill({
  status: 200,
  contentType: 'text/javascript',
  body: threeSrc,
}));
await page.route('https://clay.local/RoundedBoxGeometry.js', (route) => route.fulfill({
  status: 200,
  contentType: 'text/javascript',
  body: roundedSrc,
}));

const jobs = [];
for (const kind of KINDS) {
  for (const turn of TURNS) {
    for (const finish of FINISHES) {
      jobs.push({ kind, turn, finish, name: `${kind}-${turnKey(turn)}-${finish}` });
    }
  }
}

await page.setContent(`<!doctype html><canvas id="c" width="${SIZE}" height="${SIZE}"></canvas><script type="module">
import * as THREE from 'https://clay.local/three.module.js';
import { RoundedBoxGeometry } from 'https://clay.local/RoundedBoxGeometry.js';

const SIZE = ${SIZE};
const JOBS = ${JSON.stringify(jobs)};
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SIZE, SIZE, false);
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.58));
scene.add(new THREE.HemisphereLight(0xffffff, 0xf9a353, 0.24));

const key = new THREE.DirectionalLight(0xffffff, 1.32);
key.position.set(-4.5, 6, 5.5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.12);
fill.position.set(5.5, 2, 4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xc5d2f4, 0.18);
rim.position.set(1.4, 3.2, -6);
scene.add(rim);

const clay = new THREE.MeshPhysicalMaterial({
  color: 0xE4E0DA,
  roughness: 0.94,
  metalness: 0,
  clearcoat: 0,
  clearcoatRoughness: 0.6,
});

function applyFinish(finish) {
  if (finish === 'satin') {
    clay.roughness = 0.46;
    clay.metalness = 0;
    clay.clearcoat = 0.28;
    clay.clearcoatRoughness = 0.42;
    return;
  }
  clay.roughness = 0.94;
  clay.metalness = 0;
  clay.clearcoat = 0;
  clay.clearcoatRoughness = 0.6;
}

function geometry(kind) {
  if (kind === 'sphere') return new THREE.SphereGeometry(1, 64, 48);
  if (kind === 'cube') return new THREE.BoxGeometry(1, 1, 1);
  if (kind === 'rounded-cube') return new RoundedBoxGeometry(1, 1, 1, 2, 0.18);
  if (kind === 'cylinder') return new THREE.CylinderGeometry(0.72, 0.72, 1.35, 64);
  if (kind === 'low-cylinder') return new THREE.CylinderGeometry(1.2, 1.2, 0.36, 64);
  if (kind === 'tall-box') return new THREE.BoxGeometry(0.68, 1.62, 0.68);
  if (kind === 'cone') return new THREE.ConeGeometry(0.86, 1.55, 64);
  if (kind === 'capsule') return new THREE.CapsuleGeometry(0.46, 0.9, 16, 32);
  if (kind === 'torus') {
    const ring = new THREE.TorusGeometry(0.72, 0.26, 28, 72);
    ring.rotateX(Math.PI / 2);
    return ring;
  }
  return new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
}

function makeObject(kind) {
  if (kind !== 'dome') return new THREE.Mesh(geometry(kind), clay);
  const group = new THREE.Group();
  const shell = new THREE.Mesh(geometry(kind), clay);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 48), clay);
  cap.rotation.x = Math.PI / 2;
  cap.position.y = -0.004;
  group.add(shell, cap);
  return group;
}

function sit(object, turn) {
  object.rotation.y = THREE.MathUtils.degToRad(turn);
  object.scale.setScalar(1);
  object.position.set(0, 0, 0);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const span = Math.max(size.x, size.y, size.z);
  object.scale.setScalar(1.72 / span);
  object.updateMatrixWorld(true);
  const seated = new THREE.Box3().setFromObject(object);
  object.position.y -= seated.min.y;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });
}

const camera = new THREE.PerspectiveCamera(18, 1, 0.1, 40);
const elevation = THREE.MathUtils.degToRad(15);
const azimuth = THREE.MathUtils.degToRad(38);
const distance = 9.5;
const look = new THREE.Vector3(0, 0.78, 0);
camera.position.set(
  look.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
  look.y + Math.sin(elevation) * distance,
  look.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
);
camera.lookAt(look);

async function bakeContact(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const src = document.createElement('canvas');
  src.width = SIZE;
  src.height = SIZE;
  const read = src.getContext('2d', { willReadFrequently: true });
  read.drawImage(img, 0, 0);
  const pixels = read.getImageData(0, 0, SIZE, SIZE).data;
  let minX = SIZE;
  let maxX = 0;
  let minY = SIZE;
  let maxY = 0;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (pixels[(y * SIZE + x) * 4 + 3] < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (minX < 8 || maxX > SIZE - 9 || minY < 8 || maxY > SIZE - 9) {
    throw new Error('clay clipped ' + [minX, minY, maxX, maxY].join(','));
  }
  const blob = document.createElement('canvas');
  blob.width = 128;
  blob.height = 64;
  const blobDraw = blob.getContext('2d');
  const blobShade = blobDraw.createRadialGradient(64, 32, 0, 64, 32, 60);
  blobShade.addColorStop(0, 'rgba(28,25,23,0.34)');
  blobShade.addColorStop(0.5, 'rgba(28,25,23,0.1)');
  blobShade.addColorStop(1, 'rgba(28,25,23,0)');
  blobDraw.fillStyle = blobShade;
  blobDraw.fillRect(0, 0, 128, 64);
  const out = document.createElement('canvas');
  out.width = SIZE;
  out.height = SIZE;
  const ctx = out.getContext('2d');
  const radiusX = (maxX - minX) * 0.42;
  const radiusY = Math.max(14, radiusX * 0.18);
  const centerX = (minX + maxX) / 2;
  if (maxY + radiusY > SIZE - 6) {
    throw new Error('shadow clipped ' + [minX, minY, maxX, maxY, Math.round(radiusY)].join(','));
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(blob, centerX - radiusX, maxY - radiusY, radiusX * 2, radiusY * 2);
  ctx.drawImage(img, 0, 0);
  return out.toDataURL('image/png');
}

const previews = {};
try {
  for (const job of JOBS) {
    applyFinish(job.finish);
    const object = makeObject(job.kind);
    sit(object, job.turn);
    scene.add(object);
    renderer.render(scene, camera);
    const baked = await bakeContact(canvas.toDataURL('image/png'));
    await saveClay(job.name, baked);
    if (job.turn === 0 || job.kind === 'cube' || job.kind === 'tall-box') previews[job.name] = baked;
    scene.remove(object);
    disposeObject(object);
  }
  window.__clayDone = true;
  window.__previews = previews;
} catch (error) {
  window.__clayError = String(error && error.stack || error);
}
</script>`, { waitUntil: 'load' });

await page.waitForFunction(() => window.__clayDone || window.__clayError, null, { timeout: 180000 });
const failed = await page.evaluate(() => window.__clayError || '');
if (failed) {
  await browser.close();
  throw new Error(failed);
}

const sheet = await page.evaluate(async () => {
  const names = Object.keys(window.__previews);
  const cell = 160;
  const columns = 6;
  const canvas = document.createElement('canvas');
  canvas.width = cell * columns;
  canvas.height = cell * Math.ceil(names.length / columns);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F4EFE7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < names.length; index += 1) {
    const img = new Image();
    img.src = window.__previews[names[index]];
    await img.decode();
    const x = (index % columns) * cell;
    const y = Math.floor(index / columns) * cell;
    const size = cell * 0.78;
    ctx.drawImage(img, x + (cell - size) / 2, y + (cell - size) / 2, size, size);
  }
  return canvas.toDataURL('image/png');
});
fs.writeFileSync('/tmp/clay-sheet.png', Buffer.from(sheet.split(',')[1], 'base64'));

for (const stale of ['sphere', 'cube', 'cylinder', 'cone', 'capsule']) {
  const file = path.join(OUT, `promo-clay-${stale}.png`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
console.log('renders', jobs.length);
await browser.close();
