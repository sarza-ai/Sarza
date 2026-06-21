/* ============================================================
   Sarza AI — futuristic desert scene generator
   Produces synthwave-desert SVGs (retro sun/moon + perspective
   tech grid + starfield + dune horizon) in the brand palette.
   Run:  node assets/generate-art.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const W = 1600, H = 1000, HORIZON = 560;

// Deterministic RNG so scenes are stable between runs
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stars(rng, n, sunX, sunY, sunR) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(rng() * W);
    const y = Math.round(30 + rng() * (HORIZON - 90));
    // thin out stars right around the sun/moon
    if (Math.hypot(x - sunX, y - sunY) < sunR + 70) continue;
    const r = (0.6 + rng() * 1.7).toFixed(2);
    const o = (0.25 + rng() * 0.7).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#F5E6C8" opacity="${o}"/>`;
  }
  return out;
}

function constellation(rng, cx, cy, color) {
  // a small connected star cluster (circuit/constellation motif)
  const pts = [];
  const n = 5 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    pts.push([cx + (rng() - 0.5) * 320, cy + (rng() - 0.5) * 180]);
  }
  let lines = '', nodes = '';
  for (let i = 0; i < pts.length - 1; i++) {
    lines += `<line x1="${pts[i][0].toFixed(0)}" y1="${pts[i][1].toFixed(0)}" x2="${pts[i + 1][0].toFixed(0)}" y2="${pts[i + 1][1].toFixed(0)}"/>`;
  }
  for (const p of pts) {
    nodes += `<circle cx="${p[0].toFixed(0)}" cy="${p[1].toFixed(0)}" r="2.4" fill="${color}"/>`;
  }
  return `<g stroke="${color}" stroke-width="1" opacity="0.5">${lines}</g><g opacity="0.9">${nodes}</g>`;
}

function duneRidge(rng, yBase) {
  let d = `M0 ${yBase + 20}`;
  const seg = 8;
  for (let i = 0; i <= seg; i++) {
    const x = (W / seg) * i;
    const y = yBase - 14 + Math.sin(i * 1.3 + rng() * 6) * 16;
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  d += ` L${W} ${yBase + 60} L0 ${yBase + 60} Z`;
  return d;
}

function grid(sunX) {
  const vpX = sunX, vpY = HORIZON;
  let lines = '';
  for (let xb = sunX - 1600; xb <= sunX + 1600; xb += 150) {
    lines += `<line x1="${vpX}" y1="${vpY}" x2="${xb}" y2="${H}"/>`;
  }
  const ys = [566, 576, 590, 610, 638, 676, 726, 792, 878, 985];
  for (const y of ys) lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  return lines;
}

function sunSlats(sunX, r) {
  let bars = '';
  const slats = [[560, 6], [580, 7], [602, 9], [628, 11], [658, 13], [692, 16], [730, 20]];
  for (const [y, h] of slats) {
    bars += `<rect x="${sunX - r - 10}" y="${y}" width="${2 * r + 20}" height="${h}" fill="#000"/>`;
  }
  return bars;
}

function monolith(name, x, accent, glow) {
  // a tall glowing obelisk on the horizon + faint light beam
  const baseY = HORIZON + 6, topY = 250;
  const bw = 30, tw = 12;
  const body = `M${x - bw} ${baseY} L${x - tw} ${topY} L${x + tw} ${topY} L${x + bw} ${baseY} Z`;
  const beam = `M${x - tw} ${topY} L${x - tw * 2.4} 40 L${x + tw * 2.4} 40 L${x + tw} ${topY} Z`;
  return `
    <path d="${beam}" fill="${glow}" opacity="0.12" filter="url(#blur-${name})"/>
    <path d="${body}" fill="#0d0805"/>
    <path d="${body}" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.85"/>
    <circle cx="${x}" cy="${topY}" r="4" fill="${accent}"/>
    <circle cx="${x}" cy="${topY}" r="14" fill="${glow}" opacity="0.5" filter="url(#blur-${name})"/>`;
}

function scene(o) {
  const name = o.name;
  const rng = mulberry32([...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 7 + 13);
  const sunX = o.sunX, sunY = o.sunY ?? 520, r = o.sunR ?? 178;
  const accent = o.accent, glow = o.glow;
  const orb = o.orbColors || ['#FFE3A6', accent, glow];

  const sunSvg = o.sunStyle === 'orb'
    ? `<circle cx="${sunX}" cy="${sunY}" r="${r}" fill="url(#sun-${name})"/>`
    : `<circle cx="${sunX}" cy="${sunY}" r="${r}" fill="url(#sun-${name})" mask="url(#sunmask-${name})"/>`;

  const moon2 = o.moon2
    ? `<circle cx="${o.moon2[0]}" cy="${o.moon2[1]}" r="${o.moon2[2]}" fill="${orb[0]}" opacity="0.85"/>
       <circle cx="${o.moon2[0]}" cy="${o.moon2[1]}" r="${o.moon2[2] * 2.4}" fill="${glow}" opacity="0.25" filter="url(#blur-${name})"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Futuristic desert landscape with a retro sun and tech grid">
<defs>
  <linearGradient id="sky-${name}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${o.skyTop}"/>
    <stop offset="0.55" stop-color="${o.skyMid}"/>
    <stop offset="0.78" stop-color="${o.skyLow || '#3a2410'}"/>
    <stop offset="1" stop-color="#1A1008"/>
  </linearGradient>
  <linearGradient id="sun-${name}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${orb[0]}"/>
    <stop offset="0.5" stop-color="${orb[1]}"/>
    <stop offset="1" stop-color="${orb[2]}"/>
  </linearGradient>
  <radialGradient id="glow-${name}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${glow}" stop-opacity="0.55"/>
    <stop offset="0.45" stop-color="${glow}" stop-opacity="0.20"/>
    <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig-${name}" cx="50%" cy="46%" r="75%">
    <stop offset="0.55" stop-color="#1A1008" stop-opacity="0"/>
    <stop offset="1" stop-color="#1A1008" stop-opacity="0.7"/>
  </radialGradient>
  <linearGradient id="floorfade-${name}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1A1008" stop-opacity="0"/>
    <stop offset="1" stop-color="#1A1008" stop-opacity="0.85"/>
  </linearGradient>
  <filter id="blur-${name}" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <mask id="sunmask-${name}">
    <circle cx="${sunX}" cy="${sunY}" r="${r}" fill="#fff"/>
    ${sunSlats(sunX, r)}
  </mask>
</defs>

<rect width="${W}" height="${H}" fill="url(#sky-${name})"/>
${stars(rng, o.starCount || 46, sunX, sunY, r)}
${o.constellation ? constellation(rng, o.constellation[0], o.constellation[1], o.gridAccent || accent) : ''}
${moon2}

<!-- glow -->
<circle cx="${sunX}" cy="${sunY}" r="430" fill="url(#glow-${name})"/>

<!-- perspective tech grid -->
<g stroke="${o.gridAccent || accent}" stroke-width="1.4" opacity="0.5">${grid(sunX)}</g>
<g stroke="#7fd4d4" stroke-width="1.2" opacity="0.18"><line x1="0" y1="566" x2="${W}" y2="566"/></g>
<rect x="0" y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#floorfade-${name})"/>

<!-- horizon glow line -->
<rect x="0" y="${HORIZON - 3}" width="${W}" height="6" fill="${o.gridAccent || accent}" opacity="0.6" filter="url(#blur-${name})"/>

<!-- dune horizon -->
<path d="${duneRidge(rng, HORIZON)}" fill="#140c05"/>

<!-- sun / moon -->
${sunSvg}
${o.monolith != null ? monolith(name, o.monolith, accent, glow) : ''}

<rect width="${W}" height="${H}" fill="url(#vig-${name})"/>
</svg>
`;
}

// Wide continuous night panorama (used as a single full-bleed band).
// Short/wide aspect with the moons + horizon grouped near the vertical
// centre so it survives the band's heavy top/bottom crop at any width.
function panorama() {
  const PW = 3000, PH = 520, HZ = 322;
  const rng = mulberry32(99173);
  const accent = '#7fd4d4', glow = '#5b7fb0';
  // [cx, cy, r] — kept above the horizon; big moon near centre so it
  // stays visible even when narrow viewports crop the sides.
  const moons = [[1680, 228, 74], [840, 214, 36]];

  // stars (culled around the moons)
  let starsSvg = '';
  for (let i = 0; i < 200; i++) {
    const x = Math.round(rng() * PW), y = Math.round(16 + rng() * (HZ - 46));
    let near = false;
    for (const m of moons) if (Math.hypot(x - m[0], y - m[1]) < m[2] + 55) near = true;
    if (near) continue;
    starsSvg += `<circle cx="${x}" cy="${y}" r="${(0.6 + rng() * 1.7).toFixed(2)}" fill="#F5E6C8" opacity="${(0.25 + rng() * 0.7).toFixed(2)}"/>`;
  }

  // continuous dune horizon
  let dune = `M0 ${HZ + 16}`;
  const seg = 20;
  for (let i = 0; i <= seg; i++) {
    dune += ` L${((PW / seg) * i).toFixed(0)} ${(HZ - 10 + Math.sin(i * 1.1 + rng() * 6) * 13).toFixed(0)}`;
  }
  dune += ` L${PW} ${PH} L0 ${PH} Z`;

  // perspective grid (vanishing point centred)
  const vpX = 1500;
  let g = '';
  for (let xb = vpX - 3000; xb <= vpX + 3000; xb += 140) g += `<line x1="${vpX}" y1="${HZ}" x2="${xb}" y2="${PH}"/>`;
  for (const y of [326, 333, 343, 357, 376, 402, 437, 484, 520]) g += `<line x1="0" y1="${y}" x2="${PW}" y2="${y}"/>`;

  const moonSvg = moons.map((m, i) =>
    `<circle cx="${m[0]}" cy="${m[1]}" r="${m[2] * 3}" fill="url(#mglow-n)" opacity="${i ? 0.7 : 1}"/>
     <circle cx="${m[0]}" cy="${m[1]}" r="${m[2]}" fill="url(#moon-n)"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Panoramic futuristic desert night with twin moons, a constellation and a glowing tech grid">
<defs>
  <linearGradient id="sky-n" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0d0a16"/><stop offset="0.5" stop-color="#1b1326"/>
    <stop offset="0.74" stop-color="#2a1a1e"/><stop offset="1" stop-color="#1A1008"/>
  </linearGradient>
  <linearGradient id="moon-n" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F3EAFE"/><stop offset="0.5" stop-color="#C9CFE8"/><stop offset="1" stop-color="#8a93c4"/>
  </linearGradient>
  <radialGradient id="mglow-n" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${glow}" stop-opacity="0.5"/><stop offset="0.5" stop-color="${glow}" stop-opacity="0.16"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="floorfade-n" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1A1008" stop-opacity="0"/><stop offset="1" stop-color="#1A1008" stop-opacity="0.85"/>
  </linearGradient>
  <radialGradient id="vig-n" cx="50%" cy="48%" r="72%">
    <stop offset="0.6" stop-color="#1A1008" stop-opacity="0"/><stop offset="1" stop-color="#1A1008" stop-opacity="0.6"/>
  </radialGradient>
  <filter id="blur-n" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="${PW}" height="${PH}" fill="url(#sky-n)"/>
${starsSvg}
${constellation(rng, 660, 214, accent)}
${moonSvg}
<g stroke="${accent}" stroke-width="1.4" opacity="0.45">${g}</g>
<rect x="0" y="${HZ}" width="${PW}" height="${PH - HZ}" fill="url(#floorfade-n)"/>
<rect x="0" y="${HZ - 3}" width="${PW}" height="6" fill="${accent}" opacity="0.5" filter="url(#blur-n)"/>
<path d="${dune}" fill="#120c14"/>
<rect width="${PW}" height="${PH}" fill="url(#vig-n)"/>
</svg>
`;
}

const scenes = [
  // a — classic centered slatted sun, warm amber
  { name: 'a', sunX: 800, skyTop: '#160d06', skyMid: '#2a1a0b', glow: '#C1440E', accent: '#E8A85A' },
  // b — sun left, terracotta
  { name: 'b', sunX: 480, skyTop: '#1a0f10', skyMid: '#2c1a12', glow: '#A0522D', accent: '#D4822A' },
  // c — sun right, dusk
  { name: 'c', sunX: 1140, skyTop: '#120c12', skyMid: '#281a1c', glow: '#C1440E', accent: '#E8A85A' },
  // d — deep night: small high moon, dense stars, constellation, cyan grid
  {
    name: 'd', sunX: 1080, sunY: 330, sunR: 92, sunStyle: 'orb',
    skyTop: '#0d0a16', skyMid: '#1d1426', skyLow: '#2a1a1e',
    glow: '#5b7fb0', accent: '#7fd4d4', gridAccent: '#7fd4d4',
    orbColors: ['#F3EAFE', '#C9CFE8', '#8a93c4'],
    moon2: [320, 250, 30], constellation: [430, 250], starCount: 90,
  },
  // e — monolith: smaller warm sun right + glowing futuristic obelisk
  {
    name: 'e', sunX: 1230, sunY: 470, sunR: 120,
    skyTop: '#160d08', skyMid: '#2b1a0e', glow: '#C1440E', accent: '#E8A85A',
    monolith: 560, starCount: 52,
  },
];

const dir = __dirname;
for (const s of scenes) {
  const file = path.join(dir, `scene-${s.name}.svg`);
  fs.writeFileSync(file, scene(s));
  console.log('wrote', path.relative(path.join(dir, '..'), file), fs.statSync(file).size + ' bytes');
}

const nightFile = path.join(dir, 'scene-night.svg');
fs.writeFileSync(nightFile, panorama());
console.log('wrote', path.relative(path.join(dir, '..'), nightFile), fs.statSync(nightFile).size + ' bytes');
