/* ============================================================
   Sarza AI — futuristic desert scene generator
   Produces synthwave-desert SVGs (retro sun + perspective tech
   grid + starfield + dune horizon) in the brand palette.
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

function stars(rng, n, sunX) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(rng() * W);
    const y = Math.round(30 + rng() * (HORIZON - 90));
    // thin out stars right around the sun
    if (Math.abs(x - sunX) < 150 && y > HORIZON - 260) continue;
    const r = (0.6 + rng() * 1.7).toFixed(2);
    const o = (0.25 + rng() * 0.7).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#F5E6C8" opacity="${o}"/>`;
  }
  return out;
}

function duneRidge(rng, yBase) {
  // gentle wavy silhouette seated on the horizon
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
  // vanishing point sits inside the sun for that pull-into-the-horizon look
  const vpX = sunX, vpY = HORIZON;
  let lines = '';
  // converging lines
  for (let xb = sunX - 1600; xb <= sunX + 1600; xb += 150) {
    lines += `<line x1="${vpX}" y1="${vpY}" x2="${xb}" y2="${H}"/>`;
  }
  // horizontal lines with growing gaps (perspective)
  const ys = [566, 576, 590, 610, 638, 676, 726, 792, 878, 985];
  for (const y of ys) {
    lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  }
  return lines;
}

function sunSlats(sunX, cy, r) {
  // black bars (in a mask) carve retro slats out of the lower half of the sun
  let bars = '';
  const slats = [[560, 6], [580, 7], [602, 9], [628, 11], [658, 13], [692, 16], [730, 20]];
  for (const [y, h] of slats) {
    bars += `<rect x="${sunX - r - 10}" y="${y}" width="${2 * r + 20}" height="${h}" fill="#000"/>`;
  }
  return bars;
}

function scene({ name, sunX, skyTop, skyMid, glow, accent }) {
  const rng = mulberry32([...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 7 + 13);
  const cy = 520, r = 178;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Futuristic desert landscape with a retro sun and tech grid">
<defs>
  <linearGradient id="sky-${name}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${skyTop}"/>
    <stop offset="0.55" stop-color="${skyMid}"/>
    <stop offset="0.78" stop-color="#3a2410"/>
    <stop offset="1" stop-color="#1A1008"/>
  </linearGradient>
  <linearGradient id="sun-${name}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFE3A6"/>
    <stop offset="0.5" stop-color="${accent}"/>
    <stop offset="1" stop-color="${glow}"/>
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
  <filter id="blur-${name}" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <mask id="sunmask-${name}">
    <circle cx="${sunX}" cy="${cy}" r="${r}" fill="#fff"/>
    ${sunSlats(sunX, cy, r)}
  </mask>
</defs>

<rect width="${W}" height="${H}" fill="url(#sky-${name})"/>
${stars(rng, 46, sunX)}

<!-- sun glow -->
<circle cx="${sunX}" cy="${cy}" r="430" fill="url(#glow-${name})"/>

<!-- perspective tech grid -->
<g stroke="${accent}" stroke-width="1.4" opacity="0.5">${grid(sunX)}</g>
<g stroke="#7fd4d4" stroke-width="1.2" opacity="0.18"><line x1="0" y1="566" x2="${W}" y2="566"/></g>
<rect x="0" y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#floorfade-${name})"/>

<!-- horizon glow line -->
<rect x="0" y="${HORIZON - 3}" width="${W}" height="6" fill="${accent}" opacity="0.65" filter="url(#blur-${name})"/>

<!-- dune horizon -->
<path d="${duneRidge(rng, HORIZON)}" fill="#140c05"/>

<!-- retro sun -->
<circle cx="${sunX}" cy="${cy}" r="${r}" fill="url(#sun-${name})" mask="url(#sunmask-${name})"/>

<rect width="${W}" height="${H}" fill="url(#vig-${name})"/>
</svg>
`;
}

const scenes = [
  { name: 'a', sunX: 800,  skyTop: '#160d06', skyMid: '#2a1a0b', glow: '#C1440E', accent: '#E8A85A' },
  { name: 'b', sunX: 480,  skyTop: '#1a0f10', skyMid: '#2c1a12', glow: '#A0522D', accent: '#D4822A' },
  { name: 'c', sunX: 1140, skyTop: '#120c12', skyMid: '#281a1c', glow: '#C1440E', accent: '#E8A85A' },
];

const dir = __dirname;
for (const s of scenes) {
  const file = path.join(dir, `scene-${s.name}.svg`);
  fs.writeFileSync(file, scene(s));
  console.log('wrote', path.relative(path.join(dir, '..'), file), fs.statSync(file).size + ' bytes');
}
