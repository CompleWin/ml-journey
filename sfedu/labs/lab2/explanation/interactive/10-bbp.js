// Фазовый переход BBP: анимация и результаты прогона ноутбука (p = 1500, n = 3000, по 5 повторов)
const TH = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5];
const LAM1 = [2.902, 2.886, 2.898, 2.907, 2.898, 2.907, 2.908, 2.929, 2.961, 3.024, 3.074, 3.159, 3.202, 3.296, 3.343, 3.396, 3.492, 3.541, 3.71, 3.733, 3.868, 3.961, 4.015, 4.083, 4.235];
const OV = [9.05e-05, 0.000424, 0.00203, 0.00281, 0.00254, 0.0143, 0.0489, 0.137, 0.282, 0.357, 0.419, 0.473, 0.504, 0.549, 0.583, 0.6, 0.646, 0.648, 0.686, 0.688, 0.726, 0.737, 0.736, 0.75, 0.771];
const G = .5, TC = Math.sqrt(G), LP = 2.9142, LM = .0858;
const lamT = t => t <= TC ? LP : (1 + t) * (1 + G / t);
const ovT = t => t <= TC ? 0 : (1 - G / t ** 2) / (1 + G / t);
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const setText = (e, s) => { (e.tagName === 'text' ? e : e.querySelector('text')).textContent = s; };
const fmt = (v, d) => v.toFixed(d).replace('.', ',');

scene('trans', () => {
  const X = v => 90 + 150 * v, B = 640;
  const tr = text(420, 120, 'θ = 0,10', { size: 46 });
  text(420, 180, 'порог θc ≈ 0,707', { size: 28, class: 'soft' });
  line(80, B, 770, B, { class: 'ink' });
  [0, 1, 2, 3, 4].forEach(v => text(X(v), B + 36, String(v), { size: 26 }));
  text(790, B + 36, 'λ', { size: 30 });
  let d = `M${X(LM)},${B}`;
  for (let i = 0; i <= 80; i++) { const l = LM + (LP - LM) * i / 80; d += `L${X(l).toFixed(1)},${(B - 280 * Math.sqrt(Math.max(0, (LP - l) * (l - LM))) / (Math.PI * l)).toFixed(1)}`; }
  const bulk = group(0, 0);
  path(d + 'Z', { class: 'fill c0', opacity: .3, stroke: 'none', parent: bulk });
  line(X(LP), B, X(LP), 350, { class: 'ink', 'stroke-dasharray': '10 8', parent: bulk });
  label(X(LP), 325, 'λ₊', { parent: bulk });
  const mk = line(X(LP), B, X(LP), B - 200, { class: 'hl', 'stroke-width': 8 });
  const ml = label(X(LP), B - 232, 'λ̂₁', { class: 'hl' });
  const O = [1010, 620], L = 380;
  arrow(O[0], O[1], O[0] + L, O[1], { class: 'c2', 'stroke-width': 7 });
  label(O[0] + L - 30, O[1] + 44, 'истинное', { class: 'c2' });
  const fa = arrow(O[0], O[1], O[0] + L, O[1], { class: 'c0', 'stroke-width': 7 });
  const fl = label(0, 0, 'найденное', { class: 'c0' });
  show(label(420, 270, 'спектр', { class: 'soft' }), cue(1));
  show(label(1200, 270, 'направления', { class: 'soft' }), cue(1));
  const c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const thAt = t => .1 + .6 * Math.min(1, Math.max(0, (t - c2) / Math.max(1, c3 - c2 - .2))) + .9 * ease((t - c3) / 3) + .9 * ease((t - c4) / 3);
  clock(t => {
    const th = thAt(t), lam = lamT(th), ov = ovT(th);
    setText(tr, 'θ = ' + fmt(th, 2));
    mk.setAttribute('x1', X(lam)); mk.setAttribute('x2', X(lam));
    pose(ml, { x: X(lam), y: B - 232 });
    const f = Math.acos(Math.sqrt(ov)) * 180 / Math.PI + (1 - ov) * (8 * Math.sin(2.3 * t) + 5 * Math.sin(5.1 * t));
    pose(fa, { r: -f });
    const a = f * Math.PI / 180;
    pose(fl, { x: O[0] + (L + 20) * Math.cos(a) - 20, y: O[1] - (L + 46) * Math.sin(a) });
  });
  show(label(800, 820, 'фазовый переход при θc = √γ ≈ 0,707', { class: 'hl' }), cue(5));
});

const PX = t => 170 + 490 * t;

function frame(ymin, ymax, ky, ticks, ylab) {
  const Y = v => 720 - ky * (v - ymin);
  line(150, 720, 1470, 720, { class: 'ink' });
  line(150, 720, 150, Y(ymax), { class: 'ink' });
  [0, .5, 1, 1.5, 2, 2.5].forEach(t => { line(PX(t), 720, PX(t), 732, { class: 'ink' }); text(PX(t), 760, fmt(t, t % 1 ? 1 : 0), { size: 26 }); });
  ticks.forEach(v => { line(138, Y(v), 150, Y(v), { class: 'ink' }); text(100, Y(v), fmt(v, ylab), { size: 26 }); });
  text(1490, 760, 'θ', { size: 32 });
  line(PX(TC), 720, PX(TC), Y(ymax), { class: 'ink', 'stroke-dasharray': '10 8' });
  label(PX(TC), Y(ymax) - 26, 'θc', {});
  return Y;
}

function curvePath(f, Y, a = .1, b = 2.5) {
  let d = '';
  for (let i = 0; i <= 240; i++) { const t = a + (b - a) * i / 240; d += (i ? 'L' : 'M') + PX(t).toFixed(1) + ',' + Y(f(t)).toFixed(1); }
  return d;
}

scene('lamplot', () => {
  const Y = frame(2.8, 4.4, 325, [2.8, 3.2, 3.6, 4.0, 4.4], 1);
  text(260, 200, 'λ̂₁', { size: 36 });
  const pts = TH.map((t, i) => circle(PX(t), Y(LAM1[i]), 10, { class: 'fill c0', stroke: 'none' }));
  pts.forEach((p, i) => pop(p, cue(1) + i * .06, .3));
  draw(path(curvePath(lamT, Y), { class: 'c1', 'stroke-width': 5 }), cue(2), 1.5);
  const band = group(0, 0);
  rect(PX(.05), Y(2.95), PX(.75) - PX(.05), Y(2.85) - Y(2.95), { class: 'fill soft', opacity: .25, stroke: 'none', parent: band });
  label(PX(.4), 610, 'край шума: 2,89–2,91', { parent: band });
  show(band, cue(3));
  pulse(pts[9], cue(4)); pulse(pts[24], cue(4) + .4);
  show(label(PX(1) + 160, 690, '3,02 (теория 3,00)', { class: 'c0' }), cue(4) + .2);
  show(label(PX(2.5) - 175, Y(4.235) - 38, '4,24 (теория 4,20)', { class: 'c0' }), cue(4) + .6);
});

scene('ovplot', () => {
  const Y = frame(0, 1, 480, [0, .25, .5, .75, 1], 2);
  text(330, 210, 'перекрытие', { size: 32 });
  const pts = TH.map((t, i) => circle(PX(t), Y(OV[i]), 10, { class: 'fill c0', stroke: 'none' }));
  pts.slice(0, 7).forEach((p, i) => pop(p, cue(1) + i * .08, .3));
  show(label(PX(.3), 650, 'при θ ≤ 0,5 меньше 0,003', { class: 'c0' }), cue(1) + .5);
  pts.slice(7).forEach((p, i) => pop(p, cue(2) + i * .06, .3));
  draw(path(curvePath(ovT, Y), { class: 'c1', 'stroke-width': 5 }), cue(2) + .2, 1.5);
  pulse(pts[9], cue(3));
  show(label(PX(1) - 170, Y(.357) - 70, '0,36 (теория 0,33)', { class: 'c0' }), cue(3) + .2);
  pulse(pts[24], cue(4));
  show(label(PX(2.5) - 140, Y(.771) - 60, '0,77 (теория 0,77)', { class: 'c0' }), cue(4) + .2);
});

scene('kink', () => {
  const KX = t => 170 + 1600 * (t - .4), Y = v => 720 - 1450 * (v - 2.85);
  line(150, 720, 1470, 720, { class: 'ink' });
  line(150, 720, 150, Y(3.2), { class: 'ink' });
  [.4, .5, .6, .7, .8, .9, 1, 1.1, 1.2].forEach(t => { line(KX(t), 720, KX(t), 732, { class: 'ink' }); text(KX(t), 760, fmt(t, 1), { size: 26 }); });
  [2.9, 3.0, 3.1, 3.2].forEach(v => { line(138, Y(v), 150, Y(v), { class: 'ink' }); text(100, Y(v), fmt(v, 1), { size: 26 }); });
  text(1490, 760, 'θ', { size: 32 });
  text(260, 200, 'λ̂₁ около порога', { size: 32 });
  const idx = [3, 4, 5, 6, 7, 8, 9, 10, 11];
  idx.forEach(i => circle(KX(TH[i]), Y(LAM1[i]), 11, { class: 'fill c0', stroke: 'none' }));
  let d = '';
  for (let k = 0; k <= 200; k++) { const t = .4 + .8 * k / 200; d += (k ? 'L' : 'M') + KX(t).toFixed(1) + ',' + Y(lamT(t)).toFixed(1); }
  draw(path(d, { class: 'c1', 'stroke-width': 5 }), cue(1), 1.2);
  const kk = group(0, 0);
  circle(KX(TC), Y(LP), 26, { class: 'hl', 'stroke-width': 4, parent: kk });
  label(KX(TC) - 40, Y(LP) - 70, 'излом теории в θc', { class: 'hl', parent: kk });
  show(kk, cue(1) + 1);
  const lab = group(0, 0);
  [[6, '2,908', 50], [7, '2,929', 48], [8, '2,961', 46]].forEach(([i, s, dy]) => label(KX(TH[i]) + 10, Y(LAM1[i]) + dy, s, { class: 'c0', parent: lab }));
  let s = '';
  idx.forEach((i, k) => { s += (k ? 'L' : 'M') + KX(TH[i]).toFixed(1) + ',' + Y(LAM1[i]).toFixed(1); });
  path(s, { class: 'c0', 'stroke-width': 3, 'stroke-dasharray': '8 6', parent: lab });
  show(lab, cue(2));
  show(label(1100, 330, 'конечные p и n: переход размыт', { class: 'c0' }), cue(3));
});
