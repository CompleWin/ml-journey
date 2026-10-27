// Part 3: sample and histogram, the normal bell, mean and variance, three sigmas, kurtosis, N(0, I).

function gauss() {   // a standard normal number from the scene's fixed random sequence
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const pdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

scene('hist', () => {
  const ax = axes(200, 120, 1200, 560, { x: [-4, 4], y: [0, 0.5], xlabel: 'значение', ylabel: 'плотность' });
  const N = 600, w = 0.5, counts = new Array(16).fill(0);
  const xs = [];
  for (let i = 0; i < N; i++) {
    const g = gauss(); xs.push(g);
    const k = Math.floor((g + 4) / w);
    if (k >= 0 && k < 16) counts[k]++;
  }
  counts.forEach((c, k) => {
    const x0 = ax.X(-4 + k * w), x1 = ax.X(-4 + (k + 1) * w);
    const top = ax.Y(c / (N * w)), base = ax.Y(0);
    const bar = rect(x0 + 3, base, x1 - x0 - 6, 0, { class: 'fill c0', stroke: 'none', opacity: .55 });
    set(bar, 'y', top, cue(1, .5), 3, 'lin');
    set(bar, 'height', base - top, cue(1, .5), 3, 'lin');
  });
  for (let i = 0; i < 36; i++) {
    const g = xs[i];
    if (Math.abs(g) > 3.9) continue;
    const d = circle(ax.X(g), 70, 9, { class: 'fill c0' });
    show(d, cue(1, i * .08), .1);
    move(d, ax.X(g), ax.Y(0) - 10, cue(1, i * .08), .5, 'lin');
    hide(d, cue(1, i * .08 + .5), .15);
  }
  const bl = label(ax.X(2.6), ax.Y(0.32), 'гистограмма', { size: 30, class: 'c0' });
  show(bl, cue(1, 2));
  const curve = ax.curve(pdf, { from: -4, to: 4 });
  curve.setAttribute('class', 'c1');
  curve.setAttribute('stroke-width', 5);
  draw(curve, cue(2));
  const cl = label(ax.X(-2.4), ax.Y(0.3), 'плотность', { size: 30, class: 'c1' });
  show(cl, cue(2, .8));
  const ch = chip(ax.X(-2.4), ax.Y(0.42), 'density=True: площадь = 1', { size: 26 });
  pop(ch, cue(2, 1.2));
});

const BX = 800, BY = 600, SG = 140, BH = 400;   // the bell: centre, baseline, pixels per sigma, height
function bellPath(from, to, closed) {
  let d = '';
  for (let z = from; z <= to + 1e-9; z += .05) d += (d ? ' L' : 'M') + (BX + z * SG).toFixed(1) + ',' + (BY - BH * Math.exp(-z * z / 2)).toFixed(1);
  if (closed) d += ` L${BX + to * SG},${BY} L${BX + from * SG},${BY} Z`;
  return d;
}
function bellBase() {
  line(BX - 4.4 * SG, BY, BX + 4.4 * SG, BY, { 'stroke-width': 2 });
  path(bellPath(-4.3, 4.3), { class: 'c0', 'stroke-width': 5 });
  line(BX, BY, BX, BY - BH - 10, { class: 'c1', 'stroke-dasharray': '10 8' });
  label(BX, BY - BH - 40, 'μ — центр', { size: 30, class: 'c1' });
}

scene('bell', () => {
  line(BX - 4.4 * SG, BY, BX + 4.4 * SG, BY, { 'stroke-width': 2 });
  const c = path(bellPath(-4.3, 4.3), { class: 'c0', 'stroke-width': 5 });
  draw(c, .2, 1.2);
  const ml = line(BX, BY, BX, BY - BH - 10, { class: 'c1', 'stroke-dasharray': '10 8' });
  const mt = label(BX, BY - BH - 40, 'μ — центр', { size: 30, class: 'c1' });
  show(ml, cue(1)); show(mt, cue(1, .3));
  const yS = BY - BH * Math.exp(-.5);
  const sa = arrow(BX, yS, BX + SG, yS, { class: 'c2', head: 'both', 'stroke-width': 4 });
  draw(sa, cue(2));
  const st = label(BX + SG + 150, yS, 'σ — ширина', { size: 30, class: 'c2' });
  show(st, cue(2, .4));
  const f = tex(650, 700, '\\mathcal{N}(\\mu,\\ \\sigma^2)');
  show(f, cue(3));
  const fl = label(650, 760, 'второй параметр — дисперсия', { size: 26 });
  show(fl, cue(3, .5));
  const ch = chip(1170, 700, 'stats.norm.pdf(x, loc=μ, scale=σ)', { size: 26, class: 'c1' });
  pop(ch, cue(3, 1.5));
});

scene('sigmas', () => {
  bellBase();
  const yS = BY - BH * Math.exp(-.5);
  const old = [
    arrow(BX, yS, BX + SG, yS, { class: 'c2', head: 'both', 'stroke-width': 4 }),
    label(BX + SG + 150, yS, 'σ — ширина', { size: 30, class: 'c2' }),
    tex(650, 700, '\\mathcal{N}(\\mu,\\ \\sigma^2)'),
    label(650, 760, 'второй параметр — дисперсия', { size: 26 }),
    chip(1170, 700, 'stats.norm.pdf(x, loc=μ, scale=σ)', { size: 26, class: 'c1' }),
  ];
  old.forEach(e => hide(e, .2));
  [[1, '±σ: 68%'], [2, '±2σ: 95%'], [3, '±3σ: 99.7%']].forEach(([k, s], i) => {
    const sh = path(bellPath(-k, k, true), { class: 'fill c0', stroke: 'none', 'fill-opacity': .18 });
    show(sh, cue(k));
    const y = BY + 40 + i * 50;
    const br = arrow(BX - k * SG, y, BX + k * SG, y, { class: 'c0', head: 'both', 'stroke-width': 3 });
    draw(br, cue(k, .2));
    const l = label(BX, y, s, { size: 28, class: 'c0' });
    show(l, cue(k, .5));
  });
});

scene('spread', () => {
  const X = v => 200 + (v - 1) * 130, Y0 = 400;
  line(X(1) - 30, Y0, X(10) + 30, Y0, { 'stroke-width': 2 });
  for (let v = 1; v <= 10; v++) {
    line(X(v), Y0 - 8, X(v), Y0 + 8, { 'stroke-width': 2 });
    text(X(v), Y0 + 36, String(v), { size: 26, class: 'soft' });
  }
  const data = [2, 4, 4, 4, 5, 5, 7, 9], seen = {};
  const pos = data.map((v, i) => {
    seen[v] = (seen[v] || 0) + 1;
    const y = Y0 - 30 - (seen[v] - 1) * 42;
    const d = circle(X(v), y, 15, { class: 'fill c0' });
    pop(d, .2 + i * .12);
    return [X(v), y, v];
  });
  const ml = line(X(5), 150, X(5), Y0, { class: 'c1', 'stroke-dasharray': '10 8', 'stroke-width': 4 });
  show(ml, cue(1));
  const mt = label(X(5), 120, 'среднее = 40 / 8 = 5', { size: 30, class: 'c1' });
  show(mt, cue(1, .3));
  pos.forEach(([x, y, v], i) => {
    if (v === 5) return;
    const a = arrow(X(5), y, x + (v < 5 ? 17 : -17), y, { class: 'c3', 'stroke-width': 3 });
    draw(a, cue(2, i * .12));
  });
  const dev = label(800, 560, 'отклонения: −3, −1, −1, −1, 0, 0, 2, 4', { size: 30, class: 'c3' });
  show(dev, cue(2, .8));
  const sq = label(800, 625, 'квадраты: 9, 1, 1, 1, 0, 0, 4, 16 → среднее 32 / 8 = 4', { size: 30 });
  show(sq, cue(3));
  const v1 = chip(620, 710, 'дисперсия σ² = 4', { size: 32, class: 'c2' });
  const v2 = chip(980, 710, 'σ = √4 = 2', { size: 32, class: 'c2' });
  pop(v1, cue(3, .8)); pop(v2, cue(3, 1.4));
  const br = arrow(X(3), 470, X(7), 470, { class: 'c2', head: 'both', 'stroke-width': 3 });
  draw(br, cue(3, 1.4));
  const bl = label(X(7) + 90, 470, 'μ ± σ', { size: 26, class: 'c2' });
  show(bl, cue(3, 1.8));
});

scene('kurt', () => {
  const panels = [
    { cx: 800, title: 'нормальное', note: 'эксцесс = 0', cls: 'c0', f: pdf, from: -3.5, to: 3.5, k: 1 },
    { cx: 300, title: 'ограниченное', note: 'эксцесс < 0', cls: 'c2', f: z => Math.sqrt(Math.max(0, 4 - z * z)) / (2 * Math.PI), from: -2, to: 2, k: 2 },
    { cx: 1300, title: 'с выбросами', note: 'эксцесс > 0', cls: 'c1', f: z => Math.exp(-Math.abs(z) * Math.SQRT2) / Math.SQRT2, from: -3.5, to: 3.5, k: 3 },
  ];
  const base = 600, sx = 58, K = 480;
  panels.forEach(p => {
    const g = group(0, 0);
    line(p.cx - 220, base, p.cx + 220, base, { 'stroke-width': 2, parent: g });
    let d = '';
    for (let z = -3.6; z <= 3.6; z += .05) d += (d ? ' L' : 'M') + (p.cx + z * sx).toFixed(1) + ',' + (base - K * pdf(z)).toFixed(1);
    if (p.k !== 1) path(d, { class: 'soft', 'stroke-dasharray': '8 6', parent: g });
    let e = '';
    for (let z = p.from; z <= p.to + 1e-9; z += .025) e += (e ? ' L' : 'M') + (p.cx + z * sx).toFixed(1) + ',' + (base - K * p.f(z)).toFixed(1);
    path(e, { class: p.cls, 'stroke-width': 5, parent: g });
    text(p.cx, 160, p.title, { size: 32, parent: g });
    label(p.cx, 660, p.note, { size: 32, class: p.cls, parent: g });
    show(g, cue(p.k));
  });
  const hint = label(800, 740, 'пунктир — нормальный колокол для сравнения', { size: 26, class: 'soft' });
  show(hint, cue(2, .8));
});

scene('cloud', () => {
  const C = [560, 450], S = 105;
  const pts = group(0, 0);
  for (let i = 0; i < 500; i++) circle(C[0] + gauss() * S, C[1] + gauss() * S, 4, { class: 'fill c0', stroke: 'none', parent: pts, opacity: .6 });
  show(pts, .2, 1);
  line(C[0] - 400, C[1], C[0] + 400, C[1], { class: 'soft', 'stroke-width': 1 });
  line(C[0], C[1] - 400, C[0], C[1] + 340, { class: 'soft', 'stroke-width': 1 });
  const t = tex(1220, 230, 'X \\sim \\mathcal{N}(0,\\ I_d)');
  show(t, cue(1));
  const t2 = tex(1220, 380, 'I_2 = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}');
  show(t2, cue(1, .5));
  const tl = label(1220, 490, 'разброс 1, координаты независимы', { size: 28 });
  show(tl, cue(1, 1));
  for (const r of [1, 2]) {
    const c = circle(C[0], C[1], r * S, { class: 'c1', 'stroke-dasharray': '10 8', 'stroke-width': 3 });
    draw(c, cue(2, (r - 1) * .4));
  }
  const g = group(C[0], C[1]);
  arrow(0, 0, 2.6 * S, 0, { class: 'c1', 'stroke-width': 5, parent: g });
  show(g, cue(2, .8));
  turn(g, -360, cue(2, 1), 4, 'lin');
  const cl = box(1220, 640, 520, 0, 'облако круглое: ни одно направление не выделено', { size: 30, class: 'c1' });
  show(cl, cue(2, 1.2));
});
