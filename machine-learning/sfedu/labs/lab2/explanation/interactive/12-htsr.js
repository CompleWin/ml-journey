// Спектр весов слоя: балк и хвост, степенной закон, пять фаз Мартина–Махони, развёртка свёртки
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);

scene('train', () => {
  const W = group(0, 0);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 10; j++)
    rect(120 + j * 32, 260 + i * 30, 28, 26, { class: 'fill ' + (random() < .5 ? 'c0' : 'c1'), stroke: 'none', opacity: (.15 + .7 * random()).toFixed(2), rx: 3, parent: W });
  text(280, 215, 'веса слоя W: M × K', { size: 30, parent: W });
  const S = group(0, 0);
  arrow(280, 520, 280, 565, { class: 'ink', parent: S });
  tex(280, 615, 'S = \\tfrac{1}{N}\\,W W^T', { size: 40, parent: S });
  text(280, 680, 'N = max(M, K)', { size: 28, class: 'soft', parent: S });
  show(S, cue(1));
  const X = l => 580 + 110 * l, B = 700, LP = 2.9142, LM = .0858;
  line(560, B, 1500, B, { class: 'ink' });
  text(1520, B + 36, 'λ', { size: 30 });
  let d = `M${X(LM)},${B}`;
  for (let i = 0; i <= 80; i++) { const l = LM + (LP - LM) * i / 80; d += `L${X(l).toFixed(1)},${(B - 330 * Math.sqrt(Math.max(0, (LP - l) * (l - LM))) / (Math.PI * l)).toFixed(1)}`; }
  const bulk = group(0, 0);
  path(d + 'Z', { class: 'fill c0', opacity: .3, stroke: 'none', parent: bulk });
  path(d, { class: 'c0', 'stroke-width': 3, parent: bulk });
  line(X(LP), B, X(LP), 330, { class: 'ink', 'stroke-dasharray': '10 8', parent: bulk });
  label(X(LP), 305, 'λ₊', { parent: bulk });
  label(760, 250, 'случайные веса: балк МП', { class: 'c0', parent: bulk });
  show(bulk, cue(2));
  const tail = group(0, 0);
  let t = `M${X(LP)},${B - 40}`;
  for (let i = 1; i <= 60; i++) { const l = LP + (7.8 - LP) * i / 60; t += `L${X(l).toFixed(1)},${(B - 40 * (l / LP) ** -2.2).toFixed(1)}`; }
  path(t, { class: 'c1', 'stroke-width': 5, parent: tail });
  [[3.4, 30], [3.9, 22], [4.6, 14], [5.5, 10], [6.6, 8], [7.6, 8]].forEach(([l, h]) => line(X(l), B, X(l), B - h - 6, { class: 'c1', 'stroke-width': 10, 'stroke-linecap': 'butt', parent: tail }));
  label(1180, 520, 'обучение (SGD): хвост за краем шума', { class: 'c1', parent: tail });
  show(tail, cue(3), .8);
  show(tex(1180, 600, '\\rho(\\lambda) \\propto \\lambda^{-\\alpha}', { size: 44 }), cue(4));
});

scene('power', () => {
  const X = l => 160 + 300 * (l - 1), Y = r => 760 - 520 * r;
  line(150, 760, 1420, 760, { class: 'ink' });
  line(150, 760, 150, 220, { class: 'ink' });
  [1, 2, 3, 4, 5].forEach(l => { line(X(l), 760, X(l), 772, { class: 'ink' }); text(X(l), 806, String(l), { size: 26 }); });
  [0, .5, 1].forEach(r => { line(138, Y(r), 150, Y(r), { class: 'ink' }); text(110, Y(r), String(r).replace('.', ','), { size: 26 }); });
  text(1445, 806, 'λ', { size: 30 });
  text(205, 205, 'ρ(λ)', { size: 30 });
  const cv = a => { let d = ''; for (let i = 0; i <= 200; i++) { const l = 1 + 4 * i / 200; d += (i ? 'L' : 'M') + X(l).toFixed(1) + ',' + Y(l ** -a).toFixed(1); } return d; };
  draw(path(cv(3), { class: 'c1', 'stroke-width': 5 }), cue(1), 1);
  show(label(1150, 300, 'α = 3', { class: 'c1' }), cue(1) + .4);
  const ex = group(0, 0);
  circle(X(1), Y(1), 11, { class: 'fill hl', stroke: 'none', parent: ex });
  circle(X(2), Y(1 / 8), 11, { class: 'fill hl', stroke: 'none', parent: ex });
  line(X(2), Y(1 / 8), X(2), 760, { class: 'soft', 'stroke-dasharray': '6 6', parent: ex });
  arrow(X(1) + 20, Y(1) + 20, X(2) - 18, Y(1 / 8) - 18, { class: 'hl', 'stroke-width': 4, bend: .2, parent: ex });
  label(520, 420, 'λ × 2  →  ρ ÷ 8', { class: 'hl', parent: ex });
  show(ex, cue(1) + .8);
  draw(path(cv(2), { class: 'c2', 'stroke-width': 5 }), cue(2), 1);
  show(label(1150, 350, 'α = 2: хвост тяжелее', { class: 'c2' }), cue(2) + .4);
  draw(path(cv(6), { class: 'c3', 'stroke-width': 5 }), cue(3), 1);
  show(label(1150, 400, 'α = 6: обрыв круче', { class: 'c3' }), cue(3) + .4);
  const mp = group(0, 0);
  let d = `M${X(1)},${Y(0)}`;
  for (let i = 0; i <= 80; i++) { const l = 1 + 1.6 * i / 80; d += `L${X(l).toFixed(1)},${Y(.56 * Math.sqrt(Math.max(0, (2.6 - l) * (l - 1)))).toFixed(1)}`; }
  path(d + 'Z', { class: 'fill soft', opacity: .35, stroke: 'none', parent: mp });
  line(X(2.6), 760, X(2.6), 470, { class: 'ink', 'stroke-dasharray': '10 8', parent: mp });
  label(X(2.6) + 170, 470, 'балк МП: обрыв в λ₊', { parent: mp });
  show(mp, cue(4));
});

// пять фаз: одни и те же 40 столбиков меняют высоту
const PB = 700, PX = l => 200 + 120 * l, LAMS = Array.from({ length: 40 }, (_, k) => .125 + .25 * k);
const mpH = (() => { const f = l => Math.sqrt(Math.max(0, (4 - l) * (l - .3))) / (l + .3); const m = Math.max(...LAMS.map(f)); return LAMS.map(l => 300 * f(l) / m); })();
const PH = [
  mpH,
  mpH.map((h, k) => [17, 18, 20].includes(k) ? 30 : h),
  mpH.map((h, k) => LAMS[k] > 4 && LAMS[k] <= 8 ? 70 * (LAMS[k] / 4) ** -3 : .85 * h),
  LAMS.map(l => 330 * (1 + l / .8) ** -1.6),
  LAMS.map((l, k) => k === 0 ? 380 : k === 38 ? 70 : 2),
];
const NAMES = ['1. Random-like', '2. Bleeding out', '3. Bulk + Decay', '4. Heavy-Tailed — оптимум', '5. Collapsed'];

scene('phases', () => {
  line(180, PB, 1420, PB, { class: 'ink' });
  text(1440, PB + 36, 'λ', { size: 30 });
  line(PX(4.2), PB, PX(4.2), 300, { class: 'soft', 'stroke-dasharray': '10 8' });
  label(PX(4.2), 278, 'λ₊', { class: 'soft' });
  const bars = LAMS.map(l => line(PX(l), PB, PX(l), PB, { class: 'c0', 'stroke-width': 24, 'stroke-linecap': 'butt' }));
  const dots = NAMES.map((_, k) => circle(560 + k * 120, 800, 20, { class: 'soft', 'stroke-width': 3 }));
  NAMES.forEach((_, k) => text(560 + k * 120, 800, String(k + 1), { size: 24 }));
  NAMES.forEach((s, k) => {
    const at = cue(k + 1);
    bars.forEach((b, i) => set(b, 'y2', PB - PH[k][i], at, .9));
    const lb = label(800, 170, s, { class: k === 3 ? 'good' : 'hl' });
    show(lb, at, .4);
    if (k < 4) hide(lb, cue(k + 2) - .15, .15);
    recolor(dots[k], 'hl', at, .3);
    if (k < 4) recolor(dots[k], 'soft', cue(k + 2), .3);
  });
});

scene('reshape', () => {
  const cube = (x, y) => {
    const g = group(x, y);
    path('M0,0 h90 v90 h-90 Z', { class: 'fill c0', opacity: .35, parent: g });
    path('M0,0 l30,-30 h90 l-30,30 Z', { class: 'fill c0', opacity: .2, parent: g });
    path('M90,0 l30,-30 v90 l-30,30 Z', { class: 'fill c0', opacity: .5, parent: g });
    path('M0,0 h90 v90 h-90 Z M0,0 l30,-30 h90 l-30,30 M90,0 l30,-30 v90 l-30,30', { class: 'c0', 'stroke-width': 2, parent: g });
    return g;
  };
  const cubes = [0, 1, 2, 3].map(k => cube(100 + k * 160, 280));
  text(395, 190, 'фильтр: C_in × K × K', { size: 28 });
  [0, 1, 2, 3].forEach(k => text(145 + k * 160, 410, 'фильтр ' + (k + 1), { size: 24 }));
  text(395, 470, 'C_out фильтров', { size: 28, class: 'soft' });
  pulse(cubes[0], cue(1));
  const hl0 = rect(92, 242, 136, 136, { class: 'hl', 'stroke-width': 4, rx: 8 });
  show(hl0, cue(1)); hide(hl0, cue(2), .3);
  const strip = k => {
    const g = group(0, 0);
    for (let j = 0; j < 18; j++) rect(780 + j * 40, 250 + k * 52, 36, 42, { class: 'fill ' + (random() < .5 ? 'c0' : 'c1'), stroke: 'none', opacity: (.2 + .6 * random()).toFixed(2), rx: 3, parent: g });
    return g;
  };
  const strips = [0, 1, 2, 3].map(strip);
  hide(cubes[0], cue(2), .5);
  show(strips[0], cue(2) + .3, .6);
  [1, 2, 3].forEach(k => { hide(cubes[k], cue(3) + (k - 1) * .4, .4); show(strips[k], cue(3) + (k - 1) * .4 + .3, .5); });
  const lab = group(0, 0);
  line(760, 250, 760, 452, { class: 'ink', 'stroke-width': 3, parent: lab });
  label(1140, 510, 'строк: C_out (по одной на фильтр)', { parent: lab });
  label(1140, 565, 'столбцов: C_in · K²', { parent: lab });
  show(lab, cue(3) + 1.8);
  pop(chip(800, 720, 'layer4.1.conv2:  512 × (512 · 3 · 3) = 512 × 4608'), cue(4));
});
