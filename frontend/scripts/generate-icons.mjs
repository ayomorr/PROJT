// Generates all ScrollGuard app icons as real PNG files with no external dependencies.
//
// Run: npm run icons   (from the frontend folder)
//
// It builds a small RGBA pixel buffer, draws the logo (rounded square with a teal
// gradient + white shield), then encodes PNGs by hand using Node's built-in zlib.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// ------------------------------------------------------------- canvas

function canvas(size) {
  const buf = Buffer.alloc(size * size * 4);
  return {
    size,
    set(x, y, r, g, b, a = 255) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (y * size + x) * 4;
      const alpha = a / 255;
      // Alpha blend onto the current pixel so layers compose naturally.
      buf[i] = Math.round(buf[i] * (1 - alpha) + r * alpha);
      buf[i + 1] = Math.round(buf[i + 1] * (1 - alpha) + g * alpha);
      buf[i + 2] = Math.round(buf[i + 2] * (1 - alpha) + b * alpha);
      buf[i + 3] = Math.max(buf[i + 3], a);
    },
    buffer: buf,
  };
}

// Rounded-rectangle fill test (distance to the rounded border).
function inRoundedRect(x, y, size, pad, radius) {
  const x0 = pad, x1 = size - pad, y0 = pad, y1 = size - pad;
  const rx = Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2);
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const nearX = Math.min(Math.max(x, x0 + rx), x1 - rx);
  const nearY = Math.min(Math.max(y, y0 + rx), y1 - rx);
  const dx = x - nearX;
  const dy = y - nearY;
  return dx * dx + dy * dy <= rx * rx;
}

// Is (x, y) inside the white shield shape?
function inShield(x, y, size) {
  const w = size;
  const h = size;
  const s = w / 512; // scale so the design below is defined on a 512 canvas

  const top = 112 * s;
  const bottom = 428 * s;
  const midY = 292 * s;
  const leftEdge = 120 * s;
  const rightEdge = 392 * s;
  const waistL = 158 * s;
  const waistR = 354 * s;

  // Vertical band check first (fast reject).
  if (y < top || y > bottom) return false;
  if (x < leftEdge || x > rightEdge) return false;

  const t = (y - top) / (bottom - top); // 0 at top, 1 at bottom
  let left = leftEdge + (waistL - leftEdge) * t;
  let right = rightEdge + (waistR - rightEdge) * t;
  // Slight inward curve near the top for the iconic "notch".
  if (t < 0.28) {
    const curve = Math.sin((t / 0.28) * Math.PI) * 26 * s;
    left += curve;
    right -= curve;
  }
  // Pointed-ish bottom tip.
  left = left + (256 * s - left) * Math.pow(t, 1.15);
  right = right - (right - 256 * s) * Math.pow(t, 1.15);
  return x >= left && x <= right;
}

function inStripe(x, y, size) {
  const s = size / 512;
  return y >= 232 * s && y <= 300 * s && Math.abs(x - size / 2) <= 84 * s;
}

// ------------------------------------------------------------- drawing

function drawLogo(size, { padded = false } = {}) {
  const c = canvas(size);
  const pad = padded ? size * 0.1 : 0; // maskable icons keep safe-zone padding

  const gradientSteps = 64;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Background: rounded square with a diagonal teal gradient (mint → deep teal).
      if (inRoundedRect(x, y, size, pad, size * 0.2)) {
        const t = (x + y) / (2 * size);
        const r = Math.round(0x30 + (0x9 - 0x30) * t);
        const g = Math.round(0xb0 + (0x8a - 0xb0) * t);
        const b = Math.round(0x82 + (0x69 - 0x82) * t);
        c.set(x, y, r, g, b, 255);
      }
      // White shield.
      if (inShield(x, y, size)) {
        c.set(x, y, 250, 252, 248, 255);
      }
    }
  }
  // Add a subtle vertical gradient wash over the teal background only.
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const tint = 8 * Math.sin(t * Math.PI);
    for (let x = 0; x < size; x++) {
      if (!inShield(x, y, size) && inRoundedRect(x, y, size, pad, size * 0.2)) {
        c.set(x, y, 12 + tint, 14, 10, Math.round(14 * Math.sin(t * Math.PI)));
      }
    }
  }
  // A crisp white "signal bar / gauge" across the shield = "attention meter".
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inShield(x, y, size) && inStripe(x, y, size)) {
        c.set(x, y, 10, 140, 110, 255);
      }
    }
  }
  // Slight anti-alias: nothing needed, PNG is binary.
  return c.buffer;
}

// ------------------------------------------------------------- PNG encoder

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(buf, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Each scanline is prefixed with filter byte 0.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    buf.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ------------------------------------------------------------- write files

const sizes = [
  { file: 'icon-16.png', size: 16 },
  { file: 'icon-32.png', size: 32 },
  { file: 'icon-48.png', size: 48 },
  { file: 'icon-72.png', size: 72 },
  { file: 'icon-128.png', size: 128 },
  { file: 'icon-144.png', size: 144 },
  { file: 'icon-152.png', size: 152 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-384.png', size: 384 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon.png', size: 64 },
];

const maskable = [
  { file: 'maskable-512.png', size: 512, padded: true },
  { file: 'maskable-192.png', size: 192, padded: true },
];

for (const { file, size, padded } of [...sizes, ...maskable]) {
  const png = encodePNG(drawLogo(size, { padded }), size);
  const target = path.join(outDir, file);
  fs.writeFileSync(target, png);
  console.log(`  wrote ${file} (${size}px, ${png.length} bytes)`);
}
console.log('Icons generated.');