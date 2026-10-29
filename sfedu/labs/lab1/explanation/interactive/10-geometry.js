// Part 10: free negative interference, the tight frame, antipodal pairs on one axis.

const DEG = Math.PI / 180;

scene('freeneg', () => {
  const C = [380, 470], R = 260;
  circle(C[0], C[1], R, { class: 'soft', 'stroke-width': 2 });
  arrow(C[0], C[1], C[0] + R, C[1], { class: 'c1', 'stroke-width': 7 });
  label(C[0] + R + 50, C[1] + 35, 'wᵢ', { size: 30, class: 'c1' });
  const pos = group(0, 0), neg = group(0, 0);
  for (const a of [78, -80, 84]) arrow(C[0], C[1], C[0] + R * Math.cos(a * DEG), C[1] - R * Math.sin(a * DEG), { class: 'c3', 'stroke-width': 4, parent: pos });
  for (const a of [125, -130, 160, -150]) arrow(C[0], C[1], C[0] + R * Math.cos(a * DEG), C[1] - R * Math.sin(a * DEG), { class: 'c0', 'stroke-width': 4, parent: neg });
  label(C[0] + 70, C[1] - R - 30, 'почти ⟂: cos ≈ +0.2', { size: 26, class: 'c3', parent: pos });
  label(C[0] - 150, C[1] + R + 35, 'тупой угол: cos < 0', { size: 26, class: 'c0', parent: neg });
  show(pos, cue(1)); show(neg, cue(2));

  const base = 470, K = 300, x0 = 860;
  line(x0, base, 1500, base, { 'stroke-width': 2 });
  text(1180, 150, 'отклики соседей, когда горит только i', { size: 26 });
  const pb = group(0, 0);
  [.18, .2, .14].forEach((v, k) => rect(x0 + 30 + k * 80, base - v * K, 56, v * K, { class: 'fill c3', stroke: 'none', parent: pb }));
  const thr = line(x0, base - .23 * K, 1500, base - .23 * K, { class: 'c2', 'stroke-width': 4, 'stroke-dasharray': '10 8' });
  const tl = label(1420, base - .23 * K - 30, 'порог b', { size: 26, class: 'c2' });
  show(pb, cue(1, .3)); show(thr, cue(1, .6)); show(tl, cue(1, .6));
  const pl = label(1000, 230, 'ниже порога → срезаны', { size: 26, class: 'c3' });
  show(pl, cue(1, 1));
  const nb = group(0, 0);
  [.57, .4, .5, .3].forEach((v, k) => rect(x0 + 300 + k * 80, base, 56, v * K, { class: 'fill c0', stroke: 'none', parent: nb }));
  show(nb, cue(2, .3));
  const nl = label(1300, base + .62 * K, 'ReLU → 0: бесплатно', { size: 26, class: 'c0' });
  show(nl, cue(2, .8));
  const rnd = box(1180, 750, 560, 0, 'случайная схема: положительные cos до 0.81', { size: 26, class: 'bad' });
  show(rnd, cue(3));
});

scene('eig', () => {
  const X = v => 220 + v * 150;
  line(X(0), 680, X(8.2), 680, { 'stroke-width': 2 });
  for (let v = 0; v <= 8; v++) { line(X(v), 672, X(v), 688, { 'stroke-width': 2 }); text(X(v), 715, String(v), { size: 24, class: 'soft' }); }
  text(X(4.1), 765, 'собственные числа WWᵀ', { size: 26, class: 'soft' });
  const m = line(X(4), 180, X(4), 680, { class: 'ink', 'stroke-dasharray': '10 8', 'stroke-width': 2 });
  label(X(4), 160, 'M / d = 4', { size: 28 });
  const r = group(0, 0);
  line(X(1.38), 330, X(7.30), 330, { class: 'c1', 'stroke-width': 14, parent: r });
  label(X(1.38), 280, '1.38', { size: 26, class: 'c1', parent: r });
  label(X(7.30), 280, '7.30', { size: 26, class: 'c1', parent: r });
  label(X(4.3), 385, 'случайная W: оси нагружены неравномерно', { size: 26, class: 'c1', parent: r });
  show(r, cue(1));
  const t = group(0, 0);
  line(X(3.88), 530, X(4.16), 530, { class: 'c2', 'stroke-width': 14, parent: t });
  label(X(3.6), 480, '3.88', { size: 26, class: 'c2', parent: t });
  label(X(4.45), 480, '4.16', { size: 26, class: 'c2', parent: t });
  label(X(4.1), 590, 'обученная, p = 0.01: все ≈ 4 — жёсткий фрейм', { size: 26, class: 'c2', parent: t });
  show(t, cue(2));
});

scene('antipodal', () => {
  const C = [800, 360], U = 300;
  line(C[0] - 420, C[1], C[0] + 420, C[1], { class: 'soft', 'stroke-width': 2 });
  arrow(C[0], C[1], C[0] + U, C[1], { class: 'c1', 'stroke-width': 7 });
  arrow(C[0], C[1], C[0] - U, C[1], { class: 'c0', 'stroke-width': 7 });
  label(C[0] + U, C[1] - 45, 'wᵢ = w', { size: 30, class: 'c1' });
  label(C[0] - U, C[1] - 45, 'wⱼ = −w', { size: 30, class: 'c0' });
  const f = tex(800, 140, 'x = f_i\\, w + f_j\\,(-w) = (f_i - f_j)\\, w');
  show(f, cue(1));
  const mk = circle(C[0], C[1], 18, { class: 'fill c3', stroke: 'none' });
  const ml = label(C[0], C[1] + 50, 'x', { size: 30, class: 'c3' });
  pop(mk, cue(1, .4)); show(ml, cue(1, .4));
  move(mk, C[0] + .8 * U, C[1], cue(2), .8); move(ml, C[0] + .8 * U, C[1] + 50, cue(2), .8);
  const caseA = group(0, 0);
  chip(800, 480, 'горит только i: fᵢ = 0.8, fⱼ = 0', { size: 28, parent: caseA });
  label(800, 560, 'выход i = ReLU(0.8) = 0.8 ✓', { size: 28, class: 'c1', parent: caseA });
  label(800, 620, 'выход j = ReLU(−0.8) = 0 ✓', { size: 28, class: 'c0', parent: caseA });
  show(caseA, cue(2, .3)); hide(caseA, cue(3));
  move(mk, C[0] - .6 * U, C[1], cue(3), .8); move(ml, C[0] - .6 * U, C[1] + 50, cue(3), .8);
  const caseB = group(0, 0);
  chip(800, 480, 'горит только j: fⱼ = 0.6 — симметрично', { size: 28, parent: caseB });
  label(800, 560, 'выход j = 0.6 ✓, выход i = 0 ✓', { size: 28, parent: caseB });
  show(caseB, cue(3, .3)); hide(caseB, cue(3, 3));
  move(mk, C[0] + .2 * U, C[1], cue(3, 3.2), .8); move(ml, C[0] + .2 * U, C[1] + 50, cue(3, 3.2), .8);
  const caseC = group(0, 0);
  chip(800, 480, 'горят оба: 0.8 и 0.6', { size: 28, class: 'bad', parent: caseC });
  label(800, 560, 'выход i = ReLU(0.2) = 0.2 вместо 0.8 — частичная потеря', { size: 28, class: 'bad', parent: caseC });
  show(caseC, cue(3, 3.4));
  const n = label(800, 700, 'положительной интерференции нет: max ≈ 0.03', { size: 26, class: 'c2' });
  show(n, cue(3, 4.5));
});
