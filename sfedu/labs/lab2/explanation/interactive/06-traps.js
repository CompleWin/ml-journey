// Две ловушки режима Б (p = 2000, n = 1000): нулевые собственные числа и множитель γ у кривой
function prng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);

// трёхмерная картинка в косоугольной проекции
const P3 = (a, b, c) => [760 + 300 * a - 230 * b, 560 + 80 * a + 80 * b - 300 * c];

scene('plane', () => {
  hide(text(800, 450, 'ловушка 1: нулевые собственные числа', { size: 40, class: 'soft' }), cue(1) - .4, .4);
  const O = P3(0, 0, 0);
  const ax = group(0, 0);
  [[P3(1.6, 0, 0), 'признак 1', 90, 12], [P3(0, 1.6, 0), 'признак 2', -90, 12], [P3(0, 0, 1.5), 'признак 3', 0, -36]].forEach(([q, s, dx, dy]) => {
    arrow(O[0], O[1], q[0], q[1], { class: 'soft', 'stroke-width': 3, parent: ax });
    text(q[0] + dx, q[1] + dy, s, { size: 28, parent: ax });
  });
  const pts = group(0, 0);
  [[P3(1.2, .3, .9), 'наблюдение 1', 140, -20], [P3(.2, 1.1, .5), 'наблюдение 2', -140, -40]].forEach(([q, s, dx, dy]) => {
    line(O[0], O[1], q[0], q[1], { class: 'c0', 'stroke-width': 4, parent: pts });
    circle(q[0], q[1], 13, { class: 'fill c0', stroke: 'none', parent: pts });
    label(q[0] + dx, q[1] + dy, s, { class: 'c0', parent: pts });
  });
  show(ax, cue(1)); show(pts, cue(1) + .4);
  const c = [P3(-.56, -.56, -.56), P3(1.6, -.02, 1.06), P3(1.96, 1.96, 1.96), P3(-.2, 1.42, .34)];
  const d = 'M' + c.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L') + 'Z';
  const pl = group(0, 0);
  path(d, { class: 'fill c2', opacity: .18, stroke: 'none', parent: pl });
  path(d, { class: 'c2', 'stroke-width': 2, parent: pl });
  label(990, 322, 'плоскость точек', { class: 'c2', parent: pl });
  show(pl, cue(2), .8);
  const N = P3(-.615, -.307, .922);
  const nrm = arrow(O[0], O[1], N[0], N[1], { class: 'hl', 'stroke-width': 6 });
  draw(nrm, cue(3), .7);
  show(label(N[0] - 125, N[1] - 20, 'дисперсия = 0', { class: 'hl' }), cue(3) + .5);
  pop(chip(800, 830, 'ранг ≤ n  ⇒  нулей не меньше p − n'), cue(4));
});

function squares(x0, y0, cls, parent) {
  const out = [];
  for (let i = 0; i < 1000; i++) out.push(rect(x0 + (i % 40) * 12, y0 + Math.floor(i / 40) * 12, 10, 10, { class: 'fill ' + cls, stroke: 'none', parent }));
  return out;
}

scene('zeros', () => {
  squares(130, 300, 'c0');
  text(370, 262, 'настоящие λ: 1000', { size: 30 });
  text(370, 640, 'от 0,18 до 5,8', { size: 28, class: 'soft' });
  const zg = group(0, 0);
  const z = squares(990, 300, 'soft', zg);
  text(1230, 262, 'должны быть нулями: 1000', { size: 30, parent: zg });
  show(zg, cue(1));
  const r = prng(3), idx = z.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const pos = new Set(idx.slice(0, 496));
  z.forEach((e, i) => recolor(e, pos.has(i) ? 'c1' : 'c3', cue(2) + (i % 40) * .01));
  show(text(1230, 640, '≈ ±10⁻¹⁵: ошибки округления', { size: 28 }), cue(2) + .5);
  show(label(1100, 700, 'плюс', { class: 'c1' }), cue(2) + .7);
  show(label(1360, 700, 'минус', { class: 'c3' }), cue(2) + .7);
  pop(chip(800, 150, 'фильтр λ > 0'), cue(3));
  z.forEach((e, i) => { if (!pos.has(i)) hide(e, cue(3) + .3, .6); });
  show(label(800, 800, '1000 настоящих + 496 ложных = 1496', { class: 'hl' }), cue(3) + 1);
});

const LX = d => 120 + (d + 17) * 76;
const ZLOG = [-14.5, -14.7, -14.8, -14.8, -14.9, -14.9, -15.0, -15.0, -15.1, -15.1, -15.2, -15.2, -15.3, -15.3, -15.4, -15.5, -15.6, -15.7, -15.9, -16.2, -17.2, -16.2, -15.9, -15.7, -15.6, -15.5, -15.4, -15.3, -15.3, -15.2, -15.2, -15.1, -15.1, -15.0, -15.0, -14.9, -14.9, -14.8, -14.8, -14.7];

scene('logscale', () => {
  line(100, 560, 1500, 560, { class: 'ink' });
  for (let d = -17; d <= 1; d++) line(LX(d), 560, LX(d), d % 4 === 0 ? 576 : 568, { class: 'ink' });
  [[-16, '10⁻¹⁶'], [-12, '10⁻¹²'], [-8, '10⁻⁸'], [-4, '10⁻⁴'], [0, '1']].forEach(([d, s]) => text(LX(d), 606, s, { size: 26 }));
  const r = prng(9);
  const zc = group(0, 0);
  ZLOG.forEach(d => circle(LX(d), 470 + 70 * (r() - .5), 7, { class: 'fill soft', stroke: 'none', parent: zc }));
  label(LX(-15.3), 360, 'ошибки округления ≈ 10⁻¹⁵', { parent: zc });
  show(zc, cue(1));
  const tx = LX(Math.log10(2.58e-12));
  const th = group(0, 0);
  line(tx, 600, tx, 300, { class: 'hl', 'stroke-width': 4, 'stroke-dasharray': '12 8', parent: th });
  label(tx, 270, 'порог 2,6·10⁻¹²', { class: 'hl', parent: th });
  arrow(LX(-15), 655, tx, 655, { head: 'both', class: 'ink', parent: th });
  label((LX(-15) + tx) / 2, 695, '≈ 3 порядка', { parent: th });
  show(th, cue(2));
  const re = group(0, 0);
  line(LX(Math.log10(.1806)), 470, LX(Math.log10(5.809)), 470, { class: 'c0', 'stroke-width': 26, 'stroke-linecap': 'butt', parent: re });
  label(1300, 360, 'настоящие λ: 0,18 … 5,8', { class: 'c0', parent: re });
  arrow(tx, 655, LX(Math.log10(.1806)), 655, { head: 'both', class: 'ink', parent: re });
  label((tx + LX(Math.log10(.1806))) / 2, 695, '≈ 11 порядков', { parent: re });
  show(re, cue(3));
  pop(chip(800, 800, 'после фильтра: ровно 1000'), cue(4));
});

// режим Б: гистограмма ненулевых чисел и «сырая» кривая МП (площадь 1/γ)
const H2000 = [0.409, 0.444, 0.409, 0.418, 0.364, 0.355, 0.338, 0.302, 0.311, 0.284, 0.258, 0.284, 0.24, 0.213, 0.24, 0.213, 0.213, 0.204, 0.187, 0.178, 0.169, 0.195, 0.151, 0.16, 0.16, 0.142, 0.142, 0.124, 0.142, 0.124, 0.124, 0.115, 0.115, 0.107, 0.107, 0.0977, 0.0888, 0.0888, 0.0799, 0.0799, 0.0711, 0.0799, 0.0711, 0.0533, 0.0622, 0.0444, 0.0444, 0.0355, 0.0266, 0.0178];
const E0 = 0.1806, E1 = 5.8093, LM = .1716, LP = 5.8284, G = 2;
const rawMP = l => Math.sqrt(Math.max(0, (LP - l) * (l - LM))) / (2 * Math.PI * G * l);

function panel(x0, x1, base, ky) {
  const X = v => x0 + (x1 - x0) * v / 6.2, Y = d => base - ky * d;
  line(x0 - 15, base, x1 + 15, base, { class: 'ink' });
  for (let v = 0; v <= 6; v++) { line(X(v), base, X(v), base + 12, { class: 'ink' }); text(X(v), base + 42, String(v), { size: 26 }); }
  const w = (E1 - E0) / 50;
  H2000.forEach((h, i) => line(X(E0 + (i + .5) * w), base, X(E0 + (i + .5) * w), Y(h), { class: 'c0', 'stroke-width': X(w) - X(0) - 1.5, 'stroke-linecap': 'butt', opacity: .45 }));
  const curveD = k => {
    let d = '';
    for (let i = 0; i <= 240; i++) { const l = LM + (LP - LM) * i / 240; d += (i ? 'L' : 'M') + X(l).toFixed(1) + ',' + Y(k * rawMP(l)).toFixed(1); }
    return d;
  };
  return { X, Y, curveD };
}

scene('mass', () => {
  const p = panel(140, 1460, 720, 900);
  const cv = path(p.curveD(1), { class: 'c1', 'stroke-width': 5 });
  label(900, 330, 'кривая вдвое ниже столбиков', { class: 'c1' });
  const sp = group(0, 0);
  line(p.X(0), 720, p.X(0), 260, { class: 'hl', 'stroke-width': 12, parent: sp });
  circle(p.X(0), 260, 14, { class: 'fill hl', stroke: 'none', parent: sp });
  label(p.X(0) + 270, 225, 'пик в нуле: 1 − 1/γ = 0,5', { class: 'hl', parent: sp });
  show(sp, cue(1));
  const area = group(0, 0);
  path(p.curveD(1) + 'L' + p.X(LM).toFixed(1) + ',720Z', { class: 'fill c1', opacity: .3, stroke: 'none', parent: area });
  show(area, cue(2));
  show(label(p.X(3.3), 520, 'непрерывная часть ρ_MP', { class: 'c1' }), cue(2) + .4);
  pulse(cv, cue(2));
  const mb = group(0, 0);
  rect(880, 135, 250, 40, { class: 'fill hl', stroke: 'none', parent: mb });
  rect(1130, 135, 250, 40, { class: 'fill c1', stroke: 'none', opacity: .7, parent: mb });
  rect(880, 135, 500, 40, { class: 'ink', parent: mb });
  text(1130, 100, 'вся масса = 1', { size: 28, parent: mb });
  text(1005, 205, 'пик 0,5', { size: 26, parent: mb });
  text(1255, 205, 'кривая 0,5', { size: 26, parent: mb });
  show(mb, cue(3));
  show(label(p.X(1.1), 660, 'площадь 1/γ = 0,5', { class: 'c1' }), cue(3) + .5);
});

scene('cond', () => {
  const p = panel(60, 760, 640, 900);
  const cv = path(p.curveD(1), { class: 'c1', 'stroke-width': 5 });
  label(400, 110, 'кривая: площадь 0,5', { class: 'c1' });
  show(label(400, 162, 'столбики: площадь 1', { class: 'c0' }), cue(1));
  show(label(400, 214, 'P(λ > 0) = 1/γ = 0,5'), cue(2));
  const c3 = cue(3);
  clock(t => cv.setAttribute('d', p.curveD(1 + ease((t - c3) / 1.5))));
  show(label(560, 320, '× γ = 2', { class: 'c1' }), c3 + .3);
});
