// Part 7: sparse features as bulbs, compression x = Wf, reading by projections, ReLU with a threshold, the Gram matrix.

const DEG = Math.PI / 180;
function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function ray(ox, oy, a, L, attrs) { return arrow(ox, oy, ox + L * Math.cos(a * DEG), oy - L * Math.sin(a * DEG), attrs); }

scene('bulbs', () => {
  text(800, 110, 'M = 40 признаков', { size: 32 });
  const glow = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) {
    const x = 330 + k * 105, y = 220 + r * 110;
    circle(x, y, 34, { class: 'paper' });
    glow.push(circle(x, y, 28, { class: 'fill c1', stroke: 'none' }));
  }
  function examples(p) {   // twelve examples: which bulbs are lit
    const out = [];
    for (let e = 0; e < 12; e++) {
      const lit = glow.map(() => random() < p);
      if (!lit.some(Boolean)) lit[Math.floor(random() * 40)] = true;
      out.push(lit);
    }
    return out;
  }
  const A = examples(.05), B = examples(.5);
  const c1 = cue(1), c2 = cue(2);
  clock(t => {
    const ex = t >= c2 ? B[Math.floor((t - c2) / 1.5) % 12] : t >= c1 ? A[Math.floor((t - c1) / 1.5) % 12] : null;
    glow.forEach((g, i) => g.setAttribute('opacity', ex && ex[i] ? 1 : 0));
  });
  const a = chip(800, 690, 'p = 0.05: горят 1–2 лампочки', { size: 30, class: 'c2' });
  pop(a, cue(1));
  hide(a, cue(2));
  const b = chip(800, 690, 'p = 0.5: горит около половины', { size: 30, class: 'c1' });
  pop(b, cue(2, .2));
  const s = label(800, 760, 'разреженность S = 1 − p', { size: 28 });
  show(s, cue(2, 1));
});

scene('compress', () => {
  const fx = 130, top = 110, ch = 15;
  text(fx, 80, 'f: 40', { size: 26 });
  for (let i = 0; i < 40; i++) rect(fx - 20, top + i * ch, 40, ch - 3, (i === 3 || i === 7) ? { class: 'fill c1', stroke: 'none' } : { class: 'paper' });
  const W = box(420, 410, 260, 300, 'W: 10 × 40', { size: 34 });
  const wl = label(420, 610, 'столбец wᵢ — направление признака i', { size: 24, class: 'c0' });
  pulse(W, cue(1)); show(wl, cue(1, .3));
  text(680, 250, 'x: 10', { size: 26 });
  for (let i = 0; i < 10; i++) rect(660, 280 + i * 26, 40, 22, { class: 'paper' });
  const a1 = arrow(fx + 30, 410, 285, 410, { class: 'c1', 'stroke-width': 4 });
  const a2 = arrow(555, 410, 650, 410, { class: 'c1', 'stroke-width': 4 });
  draw(a1, cue(2)); draw(a2, cue(2, .4));
  const f = tex(420, 720, 'x = W f = \\sum_i f_i\\, w_i');
  show(f, cue(2, .6));

  const O = [1050, 600];
  const w3 = [180, 18], w7 = [70, 105], f3 = .8, f7 = .6;
  const p = (a, L) => [O[0] + L * Math.cos(a * DEG), O[1] - L * Math.sin(a * DEG)];
  const g = group(0, 0);
  ray(O[0], O[1], w3[1], 260, { class: 'c0', 'stroke-width': 3, 'stroke-dasharray': '8 6', parent: g });
  ray(O[0], O[1], w7[1], 260, { class: 'c2', 'stroke-width': 3, 'stroke-dasharray': '8 6', parent: g });
  label(...p(w3[1] - 6, 300), 'w₃', { size: 28, class: 'c0', parent: g });
  label(...p(w7[1] + 8, 290), 'w₇', { size: 28, class: 'c2', parent: g });
  show(g, cue(3));
  const v3 = ray(O[0], O[1], w3[1], 260 * f3, { class: 'c0', 'stroke-width': 6 });
  const v7 = ray(O[0], O[1], w7[1], 260 * f7, { class: 'c2', 'stroke-width': 6 });
  draw(v3, cue(3, .5)); draw(v7, cue(3, .8));
  const A = p(w3[1], 260 * f3), B = p(w7[1], 260 * f7), X = [A[0] + B[0] - O[0], A[1] + B[1] - O[1]];
  const d1 = line(A[0], A[1], X[0], X[1], { class: 'soft', 'stroke-dasharray': '6 6' });
  const d2 = line(B[0], B[1], X[0], X[1], { class: 'soft', 'stroke-dasharray': '6 6' });
  show(d1, cue(3, 1.2)); show(d2, cue(3, 1.2));
  const xv = arrow(O[0], O[1], X[0], X[1], { class: 'c1', 'stroke-width': 7 });
  draw(xv, cue(3, 1.5));
  const xl = label(X[0] + 40, X[1] - 30, 'x = f₃w₃ + f₇w₇', { size: 28, class: 'c1' });
  show(xl, cue(3, 2));
});

scene('readout', () => {
  const O = [420, 600], R = 330, ai = 20, aj = 75, fi = .8;
  const P = (a, L) => [O[0] + L * Math.cos(a * DEG), O[1] - L * Math.sin(a * DEG)];
  line(...P(ai, -60), ...P(ai, R + 40), { class: 'c0', 'stroke-dasharray': '8 6' });
  line(...P(aj, -60), ...P(aj, R + 40), { class: 'c2', 'stroke-dasharray': '8 6' });
  label(...P(ai - 4, R + 80), 'wᵢ', { size: 30, class: 'c0' });
  label(...P(aj + 5, R + 70), 'wⱼ', { size: 30, class: 'c2' });
  const X = P(ai, R * fi);
  ray(O[0], O[1], ai, R * fi, { class: 'c1', 'stroke-width': 7 });
  label(X[0] + 10, X[1] + 45, 'x = fᵢ wᵢ', { size: 28, class: 'c1' });
  const t = tex(1180, 200, 'W^\\top x = \\big(\\langle w_1, x\\rangle, \\dots, \\langle w_{40}, x\\rangle\\big)');
  show(t, cue(1));
  const own = line(O[0], O[1] + 14, X[0], X[1] + 14, { class: 'c0', 'stroke-width': 8 });
  draw(own, cue(2));
  const ol = label(1180, 360, '⟨wᵢ, x⟩ = fᵢ · ⟨wᵢ, wᵢ⟩ = fᵢ', { size: 30, class: 'c0' });
  show(ol, cue(2, .4));
  const c = Math.cos((aj - ai) * DEG), F = P(aj, R * fi * c);
  const drop = line(X[0], X[1], F[0], F[1], { class: 'soft', 'stroke-dasharray': '6 6', 'stroke-width': 3 });
  draw(drop, cue(3));
  const seg = line(O[0], O[1], F[0], F[1], { class: 'c3', 'stroke-width': 9 });
  draw(seg, cue(3, .4));
  const il = label(1180, 470, '⟨wⱼ, x⟩ = fᵢ · cos θ ≠ 0', { size: 30, class: 'c3' });
  show(il, cue(3, .6));
  const bl = box(1180, 590, 520, 0, 'интерференция: признак j «слышит» признак i', { size: 28, class: 'c3' });
  show(bl, cue(3, 1));
});

scene('relu', () => {
  const a = axes(140, 170, 560, 480, { x: [-2, 2], y: [-1, 2], xlabel: 'вход z', ylabel: 'выход' });
  const c = a.curve(z => Math.max(0, z), { from: -2, to: 2 });
  c.setAttribute('class', 'c1'); c.setAttribute('stroke-width', 6);
  draw(c, cue(1));
  text(420, 120, 'ReLU(z) = max(0, z)', { size: 32 });
  const n = label(a.X(-1.1), a.Y(0.4), 'отрицательное → 0', { size: 26, class: 'c1' });
  show(n, cue(1, .8));
  const b = axes(900, 170, 560, 480, { x: [-2, 2], y: [-1, 2], xlabel: 'вход z', ylabel: 'выход' });
  const c2 = b.curve(z => Math.max(0, z - .6), { from: -2, to: 2 });
  c2.setAttribute('class', 'c2'); c2.setAttribute('stroke-width', 6);
  const t2 = text(1180, 120, 'ReLU(z − b)', { size: 32 });
  show(t2, cue(2)); draw(c2, cue(2));
  const bm = line(b.X(.6), b.Y(-1), b.X(.6), b.Y(2), { class: 'c2', 'stroke-dasharray': '8 6' });
  show(bm, cue(2, .5));
  const bl = label(b.X(.6), b.Y(1.8), 'порог b', { size: 26, class: 'c2' });
  show(bl, cue(2, .7));
  const m = label(b.X(-1), b.Y(.45), 'меньше b → 0', { size: 26, class: 'c2' });
  show(m, cue(2, 1.1));
});

scene('gram', () => {
  const n = 8, s = 66, x0 = 300, y0 = 150;
  const V = [];
  for (let i = 0; i < n; i++) { V.push([]); for (let j = 0; j < n; j++) V[i].push(0); }
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const v = i === j ? 1 : Math.max(-.9, Math.min(.9, gauss() * .32)); V[i][j] = v; V[j][i] = v; }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = V[i][j];
    rect(x0 + j * s, y0 + i * s, s - 4, s - 4, { class: 'fill ' + (v >= 0 ? 'c1' : 'c0'), stroke: 'none', 'fill-opacity': Math.min(1, Math.abs(v) + .05) });
  }
  text(x0 + n * s / 2, y0 - 40, 'G = WᵀW', { size: 32 });
  const cell = rect(x0 + 5 * s - 4, y0 + 2 * s - 4, s + 4, s + 4, { class: 'ink', 'stroke-width': 5 });
  show(cell, cue(1));
  const t = tex(1200, 260, 'G_{ij} = \\langle w_i, w_j \\rangle = \\cos\\theta_{ij}');
  show(t, cue(1, .3));
  const diag = path(`M${x0 - 6},${y0 - 6} L${x0 + n * s + 2},${y0 + n * s + 2}`, { class: 'c2', 'stroke-width': 5, 'stroke-dasharray': '10 8' });
  draw(diag, cue(2));
  const dl = label(1200, 400, 'диагональ: ‖wᵢ‖² = 1', { size: 30, class: 'c2' });
  show(dl, cue(2, .4));
  const ol = label(1200, 500, 'вне диагонали — интерференция', { size: 30 });
  show(ol, cue(3));
  const leg = group(0, 0);
  rect(1000, 580, 60, 40, { class: 'fill c1', stroke: 'none', parent: leg });
  text(1190, 600, 'положительная', { size: 26, parent: leg });
  rect(1000, 640, 60, 40, { class: 'fill c0', stroke: 'none', parent: leg });
  text(1190, 660, 'отрицательная', { size: 26, parent: leg });
  show(leg, cue(3, .4));
});
