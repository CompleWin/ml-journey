// Дисперсия вдоль направления, главные оси, спектр, белый шум
function prng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const R = prng(7);
const gauss = (r = R) => {
  const u = Math.max(1e-9, r()), v = r();
  return Math.max(-2.4, Math.min(2.4, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
};

const CX = 620, CY = 470, PHI0 = 25 * Math.PI / 180;
const PTS = [];
for (let i = 0; i < 110; i++) {
  const a = 150 * gauss(), b = 50 * gauss();
  PTS.push([a * Math.cos(PHI0) - b * Math.sin(PHI0), -(a * Math.sin(PHI0) + b * Math.cos(PHI0))]);
}
const DROP = PTS.filter((_, i) => i % 8 === 0);
const dir = deg => [Math.cos(deg * Math.PI / 180), -Math.sin(deg * Math.PI / 180)];
const proj = (p, d) => p[0] * d[0] + p[1] * d[1];
const varAt = deg => { const d = dir(deg); return PTS.reduce((s, p) => s + proj(p, d) ** 2, 0) / PTS.length; };
let VMAX = 0, VMIN = Infinity;
for (let a = 0; a < 180; a += .5) { const v = varAt(a); VMAX = Math.max(VMAX, v); VMIN = Math.min(VMIN, v); }
const BARX = 1130, BARY = 310, BARW = 380;
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);

function cloudDots() {
  PTS.forEach(p => circle(CX + p[0], CY + p[1], 6, { class: 'fill c0', stroke: 'none', opacity: .7 }));
}

function rig() {   // линия направления, стрелка v, тени, разброс и столбик дисперсии
  const o = {};
  o.line = line(0, 0, 0, 0, { class: 'soft', 'stroke-width': 2 });
  o.drops = DROP.map(() => line(0, 0, 0, 0, { class: 'soft', 'stroke-dasharray': '6 6', 'stroke-width': 2 }));
  o.sdg = group(0, 0);
  o.sd = line(0, 0, 0, 0, { class: 'c1', 'stroke-width': 12, opacity: .45, parent: o.sdg });
  o.shadows = PTS.map(() => circle(0, 0, 5, { class: 'fill c1', stroke: 'none' }));
  o.arrow = arrow(CX, CY, CX + 130, CY, { class: 'hl', 'stroke-width': 6 });
  o.v = label(0, 0, 'v', { class: 'hl' });
  o.title = text(BARX + BARW / 2, BARY - 40, 'дисперсия вдоль v', { size: 30 });
  o.frame = rect(BARX, BARY, BARW, 40, { class: 'soft' });
  o.bar = rect(BARX, BARY, 10, 40, { class: 'fill c1', stroke: 'none' });
  o.tex = tex(BARX + BARW / 2, BARY + 100, 'v^T \\hat\\Sigma\\, v', { size: 40 });
  o.at = deg => {
    const d = dir(deg);
    o.line.setAttribute('x1', CX - 430 * d[0]); o.line.setAttribute('y1', CY - 430 * d[1]);
    o.line.setAttribute('x2', CX + 430 * d[0]); o.line.setAttribute('y2', CY + 430 * d[1]);
    PTS.forEach((p, i) => { const t = proj(p, d); o.shadows[i].setAttribute('cx', CX + t * d[0]); o.shadows[i].setAttribute('cy', CY + t * d[1]); });
    DROP.forEach((p, i) => { const t = proj(p, d); const L = o.drops[i]; L.setAttribute('x1', CX + p[0]); L.setAttribute('y1', CY + p[1]); L.setAttribute('x2', CX + t * d[0]); L.setAttribute('y2', CY + t * d[1]); });
    const v = varAt(deg), s = Math.sqrt(v);
    o.sd.setAttribute('x1', CX - s * d[0]); o.sd.setAttribute('y1', CY - s * d[1]);
    o.sd.setAttribute('x2', CX + s * d[0]); o.sd.setAttribute('y2', CY + s * d[1]);
    o.bar.setAttribute('width', Math.max(4, BARW * v / VMAX));
    pose(o.arrow, { r: -deg });
    pose(o.v, { x: CX + 175 * d[0], y: CY + 175 * d[1] });
  };
  return o;
}

function axesArrows() {
  const d1 = dir(25), d2 = dir(115), L1 = 2 * Math.sqrt(VMAX), L2 = 2 * Math.sqrt(VMIN);
  const a1 = arrow(CX, CY, CX + L1 * d1[0], CY + L1 * d1[1], { class: 'c2', 'stroke-width': 7 });
  const a2 = arrow(CX, CY, CX + L2 * d2[0], CY + L2 * d2[1], { class: 'c3', 'stroke-width': 7 });
  const l1 = label(CX + (L1 + 45) * d1[0], CY + (L1 + 45) * d1[1], 'λ₁', { class: 'c2' });
  const l2 = label(CX + (L2 + 45) * d2[0], CY + (L2 + 45) * d2[1], 'λ₂', { class: 'c3' });
  return { a1, a2, l1, l2 };
}

scene('proj', () => {
  cloudDots();
  const o = rig();
  o.at(70);
  [o.line, o.arrow, o.v].forEach(e => show(e, cue(1)));
  [...o.drops, ...o.shadows].forEach((e, i) => show(e, cue(2) + .02 * i, .3));
  [o.sdg, o.title, o.frame, o.bar, o.tex].forEach(e => show(e, cue(3)));
});

function phiRot(t, c1, c2) {
  let f = 70;
  f += 180 * ease((t - .3) / Math.max(.6, c1 - .7));
  f += (205 - 250) * ease((t - c1) / 1.2);
  f += (295 - 205) * ease((t - c2) / 1.2);
  return f;
}

scene('rot', () => {
  cloudDots();
  const o = rig();
  const c1 = cue(1), c2 = cue(2);
  clock(t => o.at(phiRot(t, c1, c2)));
  const ax = axesArrows();
  Object.values(ax).forEach(e => pop(e, cue(3) + .2));
});

scene('pca', () => {
  cloudDots();
  const o = rig();
  o.at(295);
  [o.line, ...o.drops, o.sdg, ...o.shadows, o.arrow, o.v, o.title, o.frame, o.bar, o.tex].forEach(e => hide(e, .2, .5));
  const ax = axesArrows();
  pulse(ax.a1, cue(1)); pulse(ax.a2, cue(1) + .3);
  show(label(CX + 330, CY - 250, 'главная ось 1', { class: 'c2' }), cue(1) + .2);
  show(label(CX - 250, CY - 200, 'главная ось 2', { class: 'c3' }), cue(1) + .5);
  const base = 720, H = 420;
  const b1 = line(1250, base, 1250, base - H, { class: 'c2', 'stroke-width': 70, 'stroke-linecap': 'butt' });
  const b2 = line(1420, base, 1420, base - H * VMIN / VMAX, { class: 'c3', 'stroke-width': 70, 'stroke-linecap': 'butt' });
  show(line(1170, base, 1500, base, { class: 'ink' }), cue(2));
  draw(b1, cue(2), .8); draw(b2, cue(2) + .3, .6);
  show(text(1250, base + 36, 'PC1', { size: 30 }), cue(2) + .2);
  show(text(1420, base + 36, 'PC2', { size: 30 }), cue(2) + .4);
  show(text(1335, 240, 'по убыванию λ', { size: 30 }), cue(2) + .6);
  pulse(ax.a1, cue(3)); pulse(b1, cue(3), .8, 1.1);
  show(label(1335, 820, 'λ = дисперсия вдоль оси', { class: 'hl' }), cue(3) + .3);
});

// 500 собственных чисел первого задания (p = 500, n = 1000): гистограмма из ноутбука
const H500 = [0.71, 0.958, 0.851, 0.745, 0.816, 0.71, 0.674, 0.603, 0.603, 0.568, 0.532, 0.532, 0.461, 0.568, 0.426, 0.39, 0.461, 0.319, 0.426, 0.39, 0.355, 0.319, 0.319, 0.319, 0.319, 0.284, 0.319, 0.248, 0.284, 0.284, 0.248, 0.213, 0.248, 0.213, 0.177, 0.213, 0.177, 0.142, 0.177, 0.142, 0.177, 0.106, 0.142, 0.071, 0.106, 0.142, 0.071, 0.071, 0.0355, 0.071];
const E0 = 0.0859, E1 = 2.9048, BW = (E1 - E0) / 50;
const SX = v => 200 + 400 * v, SB = 640, SK = 400;

scene('spec', () => {
  line(170, SB, 1430, SB, { class: 'ink' });
  for (let v = 0; v <= 3; v++) { line(SX(v), SB, SX(v), SB + 12, { class: 'ink' }); text(SX(v), SB + 44, String(v), { size: 28 }); }
  text(1460, SB + 44, 'λ', { size: 32 });
  const two = group(0, 0);
  line(SX(.35), SB - 60, SX(.35), SB, { class: 'c3', 'stroke-width': 6, parent: two });
  line(SX(2.4), SB - 60, SX(2.4), SB, { class: 'c2', 'stroke-width': 6, parent: two });
  label(SX(.35), SB - 95, 'λ₂', { class: 'c3', parent: two });
  label(SX(2.4), SB - 95, 'λ₁', { class: 'c2', parent: two });
  hide(two, cue(1), .4);
  const r = prng(11);
  H500.forEach((h, i) => {
    const g = group(0, 0);
    const k = Math.round(h * 500 * BW);
    for (let j = 0; j < k; j++) { const x = SX(E0 + (i + r()) * BW); line(x, SB - 26, x, SB, { class: 'c0', 'stroke-width': 2, opacity: .7, parent: g }); }
    show(g, cue(1) + .3 + i * .04, .3);
  });
  show(label(800, 250, '500 собственных чисел', { class: 'c0' }), cue(1) + .5);
  const edges = group(0, 0);
  for (let i = 0; i <= 50; i++) line(SX(E0 + i * BW), SB, SX(E0 + i * BW), SB - 430, { class: 'soft', 'stroke-width': 1, opacity: .5, parent: edges });
  show(edges, cue(2));
  H500.forEach((h, i) => {
    const x = SX(E0 + (i + .5) * BW);
    draw(line(x, SB, x, SB - SK * h, { class: 'c0', 'stroke-width': 400 * BW - 2, 'stroke-linecap': 'butt', opacity: .55 }), cue(2) + .6 + i * .025, .4);
  });
  let d = '';
  H500.forEach((h, i) => { d += (i ? 'L' : 'M') + SX(E0 + i * BW).toFixed(1) + ',' + (SB - SK * h).toFixed(1) + 'H' + SX(E0 + (i + 1) * BW).toFixed(1); });
  draw(path(d, { class: 'hl', 'stroke-width': 4 }), cue(3), 1.5);
  show(label(1100, 400, 'спектральная плотность', { class: 'hl' }), cue(3) + .8);
});

scene('white', () => {
  const r = prng(5);
  const C = [1080, 400];
  for (let i = 0; i < 110; i++) circle(C[0] + 95 * gauss(r), C[1] + 95 * gauss(r), 6, { class: 'fill c0', stroke: 'none', opacity: .7 });
  const M = group(0, 0);
  show(tex(320, 150, '\\Sigma = \\sigma^2 I', { size: 44, parent: M }), 0);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    rect(110 + j * 84, 200 + i * 84, 78, 78, { class: i === j ? 'fill c2' : 'soft', opacity: i === j ? .35 : 1, rx: 6, parent: M });
    text(110 + j * 84 + 39, 200 + i * 84 + 39, i === j ? 'σ²' : '0', { size: i === j ? 30 : 26, class: i === j ? 'ink' : 'soft', parent: M });
  }
  show(M, cue(1));
  const a = arrow(C[0], C[1], C[0] + 150, C[1], { class: 'hl', 'stroke-width': 6 });
  const c2 = cue(2);
  show(a, c2);
  clock(t => pose(a, { r: -50 * Math.max(0, t - c2) }));
  show(rect(880, 690, 400, 36, { class: 'fill c1', stroke: 'none' }), cue(2) + .3);
  show(text(1080, 770, 'дисперсия σ² в любом направлении', { size: 28 }), cue(2) + .5);
  const eq = group(0, 0);
  for (let k = 0; k < 6; k++) line(150 + k * 60, 780, 150 + k * 60, 710, { class: 'c2', 'stroke-width': 30, 'stroke-linecap': 'butt', parent: eq });
  text(320, 830, 'все λ = σ²', { size: 30, parent: eq });
  show(eq, cue(3));
});
