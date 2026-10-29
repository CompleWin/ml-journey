// Модель с одним шипом: облако, генерация через первую строку, перекрытие как cos², код опыта
function prng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const gauss = r => { const u = Math.max(1e-9, r()), v = r(); return Math.max(-2.4, Math.min(2.4, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); };
const setText = (e, s) => { (e.tagName === 'text' ? e : e.querySelector('text')).textContent = s; };
const fmt = (v, d) => v.toFixed(d).replace('.', ',');

scene('spike', () => {
  const C = [400, 450];
  line(60, C[1], 740, C[1], { class: 'soft' });
  line(C[0], 160, C[0], 750, { class: 'soft' });
  text(690, C[1] + 40, 'признак 1', { size: 28 });
  text(C[0], 128, 'другие признаки', { size: 28 });
  const r = prng(4), P = [];
  const g = group(0, 0);
  for (let i = 0; i < 110; i++) { const u = gauss(r), w = gauss(r); P.push([u, w, circle(C[0] + 80 * u, C[1] - 80 * w, 6, { class: 'fill c0', stroke: 'none', opacity: .75, parent: g })]); }
  show(g, cue(1));
  show(label(C[0] - 210, 230, 'шум: круглое облако', { class: 'c0' }), cue(1) + .3);
  const c2 = cue(2);
  clock(t => { const k = 1 + .5 * ease((t - c2) / 1.4); P.forEach(([u, , e]) => e.setAttribute('cx', C[0] + 80 * u * k)); });
  const v = arrow(C[0], C[1], C[0] + 250, C[1], { class: 'c2', 'stroke-width': 7 });
  draw(v, c2 + .4, .6);
  show(label(C[0] + 250, C[1] - 44, 'v₁', { class: 'c2' }), c2 + .9);
  const sp = group(0, 0);
  arrow(C[0] - 240, 760, C[0] + 240, 760, { head: 'both', class: 'hl', 'stroke-width': 4, parent: sp });
  label(C[0], 810, 'θ: насколько вытянуто', { class: 'hl', parent: sp });
  show(sp, cue(3));
});

scene('rows', () => {
  const r = prng(8), x0 = 330, y0 = 230, w = 56, h = 46;
  const row0 = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 14; j++) {
    const z = gauss(r), op = Math.min(.95, .2 + .32 * Math.abs(z));
    const e = rect(x0 + j * w, y0 + i * h, w - 4, h - 4, { class: 'fill ' + (z > 0 ? 'c0' : 'c1'), stroke: 'none', opacity: op.toFixed(2), rx: 4 });
    if (i === 0) row0.push([e, op]);
  }
  [['признак 1', 0], ['признак 2', 1], ['⋮', 3], ['признак p', 5]].forEach(([s, i]) => text(x0 - 16, y0 + i * h + h / 2 - 2, s, { size: 28, 'text-anchor': 'end' }));
  text(720, 165, 'v₁ = (1, 0, …, 0): сигнал сидит в первом признаке', { size: 30 });
  const hlr = rect(x0 - 4, y0 - 4, 14 * w + 4, h + 4, { class: 'hl', 'stroke-width': 5 });
  show(hlr, cue(1));
  row0.forEach(([e, op]) => set(e, 'opacity', Math.min(.98, op * 1.7), cue(1) + .3, .8));
  show(label(1250, y0 + h / 2, '× √(1 + θ)', { class: 'hl' }), cue(1) + .4);
  const why = group(0, 0);
  tex(720, 620, '\\mathrm{Var}(cX) = c^2\\,\\mathrm{Var}(X)', { size: 40, parent: why });
  tex(720, 700, 'c = \\sqrt{1+\\theta} \\;\\Rightarrow\\; c^2 = 1 + \\theta', { size: 40, parent: why });
  show(why, cue(2));
  pop(chip(720, 800, 'θ = 0,44:  × 1,2,  дисперсия 1,44'), cue(3));
});

scene('angle', () => {
  const X = v => 100 + 128.9 * v, B = 640;
  line(90, B, 690, B, { class: 'ink' });
  [0, 1, 2, 3, 4].forEach(v => text(X(v), B + 36, String(v), { size: 26 }));
  const lm = .0858, lp = 2.9142;
  let d = `M${X(lm)},${B}`;
  for (let i = 0; i <= 80; i++) { const l = lm + (lp - lm) * i / 80; d += `L${X(l).toFixed(1)},${(B - 300 * Math.sqrt(Math.max(0, (lp - l) * (l - lm))) / (Math.PI * l)).toFixed(1)}`; }
  const left = group(0, 0);
  path(d + 'Z', { class: 'fill c0', opacity: .25, stroke: 'none', parent: left });
  line(X(3.6), B, X(3.6), B - 220, { class: 'hl', 'stroke-width': 8, parent: left });
  label(X(3.6) - 40, B - 250, 'λ̂₁', { class: 'hl', parent: left });
  text(390, 250, 'наибольшая найденная дисперсия', { size: 28, parent: left });
  show(left, cue(1));

  const O = [960, 640], L = 400;
  const right = group(0, 0);
  arrow(O[0], O[1], O[0] + L, O[1], { class: 'c2', 'stroke-width': 7, parent: right });
  label(O[0] + L - 40, O[1] + 44, 'истинное v₁', { class: 'c2', parent: right });
  const found = arrow(O[0], O[1], O[0] + L, O[1], { class: 'c0', 'stroke-width': 7, parent: right });
  const fl = label(0, 0, 'найденное v̂₁', { class: 'c0', parent: right });
  const arc = path('', { class: 'hl', 'stroke-width': 4, parent: right });
  const ph = label(0, 0, 'φ', { class: 'hl', parent: right });
  const rd = text(1180, 790, 'перекрытие cos²φ = 0,67', { size: 34, parent: right });
  show(right, cue(2));
  const keys = [[cue(3), 0], [cue(4), 90], [cue(5), 60]];
  const phiAt = t => keys.reduce((f, [k, a]) => f + (a - f) * ease((t - k) / 1.2), 35);
  clock(t => {
    const f = phiAt(t), a = f * Math.PI / 180;
    pose(found, { r: -f });
    pose(fl, { x: O[0] + (L + 10) * Math.cos(a) - 30, y: O[1] - (L + 40) * Math.sin(a) });
    const R = 110;
    arc.setAttribute('d', `M${O[0] + R},${O[1]} A${R},${R} 0 0 0 ${(O[0] + R * Math.cos(a)).toFixed(1)},${(O[1] - R * Math.sin(a)).toFixed(1)}`);
    pose(ph, { x: O[0] + (R + 34) * Math.cos(a / 2), y: O[1] - (R + 34) * Math.sin(a / 2) });
    setText(rd, 'перекрытие cos²φ = ' + fmt(Math.cos(a) ** 2, 2));
  });
});

scene('pipe', () => {
  const r = prng(12), x0 = 90, y0 = 140, w = 50, h = 40;
  const X = group(0, 0);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 10; j++) {
    const z = gauss(r);
    rect(x0 + j * w, y0 + i * h, w - 4, h - 4, { class: 'fill ' + (z > 0 ? 'c0' : 'c1'), stroke: 'none', opacity: Math.min(.95, .2 + .32 * Math.abs(z)).toFixed(2), rx: 3, parent: X });
  }
  text(340, 105, 'X: p × n, шум', { size: 28, parent: X });
  show(X, cue(1));
  const r0 = group(0, 0);
  rect(x0 - 4, y0 - 4, 10 * w + 4, h + 4, { class: 'hl', 'stroke-width': 5, parent: r0 });
  label(690, y0 + h / 2, '× √(1 + θ)', { class: 'hl', parent: r0 });
  show(r0, cue(2));
  const sv = group(0, 0);
  arrow(340, 480, 340, 540, { class: 'ink', parent: sv });
  rect(160, 545, 360, 80, { class: 'c0', rx: 14, parent: sv });
  text(340, 585, 'svds(X, k = 1)', { size: 32, parent: sv });
  text(340, 660, 'одна тройка: s₁, u₁, v₁', { size: 26, class: 'soft', parent: sv });
  show(sv, cue(3));
  const out = group(0, 0);
  arrow(260, 690, 210, 740, { class: 'ink', parent: out });
  arrow(420, 690, 520, 740, { class: 'ink', parent: out });
  chip(200, 780, 'λ̂₁ = s₁² / n', { parent: out });
  chip(560, 780, 'перекрытие = u₁[0]²', { parent: out });
  show(out, cue(4));
});
