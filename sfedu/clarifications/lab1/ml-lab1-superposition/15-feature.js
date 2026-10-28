// Part 15: the SAE feature direction against the axis of neuron 42, coordinate by coordinate.

function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

scene('featvec', () => {
  const H = 300, n = 64, X = i => 170 + i * 20, B1 = 300, B2 = 720, K = 22;
  text(800, 70, 'координаты векторов (показаны 64 из 512)', { size: 26, class: 'soft' });
  const r1 = group(0, 0);
  line(150, B1, 1460, B1, { 'stroke-width': 2, parent: r1 });
  const vals = [];
  for (let i = 0; i < n; i++) vals.push(Math.max(-.2, Math.min(.2, gauss() * .07)));
  vals[37] = .22;
  vals.forEach((v, i) => rect(X(i), v >= 0 ? B1 - v * H : B1, 14, Math.abs(v) * H, { class: 'fill c1', stroke: 'none', parent: r1 }));
  label(800, B1 - 170, 'v_SAE = d₁₈₉₂ / ‖d₁₈₉₂‖, длина 1', { size: 28, class: 'c1', parent: r1 });
  show(r1, cue(1));
  const r2 = group(0, 0);
  line(150, B2, 1460, B2, { 'stroke-width': 2, parent: r2 });
  rect(X(K), B2 - H, 14, H, { class: 'fill c3', stroke: 'none', parent: r2 });
  label(X(K) + 230, B2 - H + 20, 'e₄₂: одна координата = 1', { size: 28, class: 'c3', parent: r2 });
  show(r2, cue(2));
  const cs = chip(1180, 520, 'cos(v_SAE, e₄₂) = −0.027', { size: 30 });
  pop(cs, cue(2, .5));
  const mx = label(X(37) + 7, B1 - .22 * H - 30, 'max |vᵢ| = 0.22', { size: 26, class: 'c1' });
  show(mx, cue(3));
  const sp = box(1180, 620, 520, 0, 'признак размазан по многим нейронам', { size: 28, class: 'c1' });
  show(sp, cue(3, .5));
});

scene('precision', () => {
  const X = v => 80 + v * 160, base = 640;
  line(X(0), base, X(4), base, { 'stroke-width': 2 });
  for (let v = 0; v <= 4; v++) text(X(v), base + 34, String(v), { size: 22, class: 'soft' });
  text(400, base + 75, 'активация латента 1892', { size: 24, class: 'soft' });
  const dots = [], bins = {};
  const add = (v, cls) => {
    const b = Math.round(v * 6); bins[b] = (bins[b] || 0) + 1;
    dots.push([v, circle(X(v), base - 14 - (bins[b] - 1) * 22, 9, { class: 'fill ' + cls, stroke: 'none' })]);
  };
  [.1, .15, .2, .25, .3, .35, .4, .45, .5, .55, .6, .7, .75, .8, .9, 1.1, 1.3].forEach(v => add(v, 'c0'));
  [.2, .4, .6, .8, .9, 1.1, 1.2, 1.4, 1.6, 1.7, 1.9, 2.1, 2.3, 2.6, 2.9, 3.2, 3.55, 3.78].forEach(v => add(v, 'c1'));
  label(250, 160, '● скобки', { size: 24, class: 'c1' });
  label(550, 160, '● другие токены', { size: 24, class: 'c0' });
  const th = line(X(0), 220, X(0), base, { class: 'c3', 'stroke-width': 4, 'stroke-dasharray': '10 6' });
  const thl = label(X(0), 200, 'f > 0', { size: 24, class: 'c3' });
  const stops = [0, .5, 1, 1.5, 2], times = [1, 2, 3, 4, 5].map(k => cue(k));
  const thAt = t => { let v = 0; times.forEach((c, i) => { if (t >= c) v = stops[i] + 0; }); return v; };
  clock(t => {
    const v = thAt(t);
    th.setAttribute('x1', X(v)); th.setAttribute('x2', X(v));
    pose(thl, { x: X(v) });
    thl.querySelector && (thl.lastChild.textContent = 'f > ' + v);
    dots.forEach(([d, e]) => e.setAttribute('opacity', d > v ? 1 : .15));
  });
  const p = label(400, 270, 'выше порога — почти одни скобки: точность ↑', { size: 24, class: 'c1' });
  show(p, cue(3, .5));
  const r = label(400, 320, 'но часть скобок осталась слева: полнота ↓', { size: 24, class: 'c0' });
  show(r, cue(4, .5));
});
