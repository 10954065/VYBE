// Renders VYBE's app icon, splash, favicon, and Android adaptive-icon layers
// from one SVG source, so every size stays in sync with the brand mark.
// Run from apps/mobile: `node scripts/generate-brand-assets.mjs`
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../assets/images");

// Design tokens from src/constants/theme.ts.
const OBSIDIAN = "#090A0F";
const ELEMENT = "#1A1D2B";
const VIOLET = "#8B5CF6";
const PINK = "#EC4899";
const ORANGE = "#F97316";

const SIZE = 1024;

// The mark: a "V" that doubles as a figure with raised arms, with a glowing
// head above it. Drawn on a 1024 canvas, centred on (512, 512).
function mark({ monochrome = false, glow = true } = {}) {
  const stroke = monochrome ? "#FFFFFF" : "url(#vybe-gradient)";
  const dot = monochrome ? "#FFFFFF" : "url(#vybe-dot)";
  const shape = `
    <path d="M300 352 L512 742 L724 352" fill="none" stroke="${stroke}"
      stroke-width="150" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="512" cy="300" r="72" fill="${dot}"/>`;

  return `
    <defs>
      <linearGradient id="vybe-gradient" x1="250" y1="300" x2="780" y2="780" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${VIOLET}"/>
        <stop offset="0.55" stop-color="${PINK}"/>
        <stop offset="1" stop-color="${ORANGE}"/>
      </linearGradient>
      <radialGradient id="vybe-dot" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stop-color="#FDBA74"/>
        <stop offset="1" stop-color="${ORANGE}"/>
      </radialGradient>
      <filter id="vybe-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="42"/>
      </filter>
    </defs>
    ${glow && !monochrome ? `<g filter="url(#vybe-glow)" opacity="0.65">${shape}</g>` : ""}
    ${shape}`;
}

function background() {
  return `
    <defs>
      <radialGradient id="vybe-bg" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stop-color="${ELEMENT}"/>
        <stop offset="1" stop-color="${OBSIDIAN}"/>
      </radialGradient>
      <radialGradient id="vybe-aura" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${VIOLET}" stop-opacity="0.35"/>
        <stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#vybe-bg)"/>
    <circle cx="512" cy="520" r="420" fill="url(#vybe-aura)"/>`;
}

// scale < 1 shrinks the mark toward the centre (Android's adaptive-icon safe
// zone, splash padding).
function svg({ withBackground, scale = 1, monochrome = false, glow = true }) {
  const offset = (SIZE * (1 - scale)) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    ${withBackground ? background() : ""}
    <g transform="translate(${offset} ${offset}) scale(${scale})">${mark({ monochrome, glow })}</g>
  </svg>`);
}

async function render(name, source, size, { flatten = false } = {}) {
  let image = sharp(source).resize(size, size);
  if (flatten) image = image.flatten({ background: OBSIDIAN });
  await image.png().toFile(path.join(out, name));
  console.log(`wrote ${name} (${size}px)`);
}

await mkdir(out, { recursive: true });

// iOS rejects icons with transparency, so the app icon is flattened.
await render("icon.png", svg({ withBackground: true, scale: 0.92 }), 1024, { flatten: true });
await render("splash-icon.png", svg({ withBackground: false, scale: 0.9 }), 512);
await render("brand-mark.png", svg({ withBackground: false, scale: 1 }), 512);
await render("favicon.png", svg({ withBackground: true, scale: 0.95, glow: false }), 48, { flatten: true });
await render("android-icon-foreground.png", svg({ withBackground: false, scale: 0.62 }), 512);
await render("android-icon-background.png", svg({ withBackground: true, scale: 0 }), 512, { flatten: true });
await render("android-icon-monochrome.png", svg({ withBackground: false, scale: 0.62, monochrome: true }), 432);
