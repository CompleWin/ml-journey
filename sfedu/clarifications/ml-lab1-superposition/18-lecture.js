// Part 18: two pictures for the lecture questions: the thin shell of a ball, interference noise against the signal.

const DEG = Math.PI / 180;

scene('shell', () => {
  const C = [460, 470], R = 290;
  const q = chip(1180, 150, 'd = 4096: x, y случайно внутри шара', { size: 28 });
  pop(q, cue(1));
  circle(C[0], C[1], R, { class: 'soft', 'stroke-width': 2 });
  const band = circle(C[0], C[1], R - 12, { class: 'c2', 'stroke-width': 24, 'stroke-opacity': .35 });
  show(band, cue(2));
  const bl = box(1180, 290, 520, 0, 'тонкая оболочка: почти весь объём у поверхности (d = 1000: 99.995% в слое 1%)', { size: 26, class: 'c2' });
  show(bl, cue(2, .4));
  const ax = 70, ay = -20;
  const px = [C[0] + (R - 12) * Math.cos(ax * DEG), C[1] - (R - 12) * Math.sin(ax * DEG)];
  const py = [C[0] + (R - 12) * Math.cos(ay * DEG), C[1] - (R - 12) * Math.sin(ay * DEG)];
  const vx = arrow(C[0], C[1], ...px, { class: 'c0', 'stroke-width': 6 });
  const vy = arrow(C[0], C[1], ...py, { class: 'c1', 'stroke-width': 6 });
  draw(vx, cue(2, .8)); draw(vy, cue(2, 1));
  const lx = label(px[0] - 40, px[1] - 35, 'x', { size: 30, class: 'c0' });
  const ly = label(py[0] + 40, py[1] + 20, 'y', { size: 30, class: 'c1' });
  show(lx, cue(2, .8)); show(ly, cue(2, 1));
  const ra = path(`M${C[0] + 45 * Math.cos(ay * DEG)},${C[1] - 45 * Math.sin(ay * DEG)} L${C[0] + 64 * Math.cos(25 * DEG)},${C[1] - 64 * Math.sin(25 * DEG)} L${C[0] + 45 * Math.cos(ax * DEG)},${C[1] - 45 * Math.sin(ax * DEG)}`, { class: 'soft', 'stroke-width': 3 });
  show(ra, cue(3));
  const d = line(...px, ...py, { class: 'c3', 'stroke-width': 6, 'stroke-dasharray': '12 8' });
  draw(d, cue(3, .3));
  const dl = label((px[0] + py[0]) / 2 + 70, (px[1] + py[1]) / 2 - 20, '√2 ≈ 1.41', { size: 30, class: 'c3' });
  show(dl, cue(3, .6));
  const f = tex(1180, 480, '\\|x-y\\|^2 = \\|x\\|^2 + \\|y\\|^2 - 2\\langle x, y\\rangle \\approx 1 + 1 - 0');
  show(f, cue(3, .8));
});

scene('noise', () => {
  const X = v => 200 + (v + 3) * 170, base = 560, H = 330;
  line(X(-3), base, X(4.3), base, { 'stroke-width': 2 });
  for (const v of [-2, -1, 0, 1, 2, 3, 4]) text(X(v), base + 34, String(v), { size: 24, class: 'soft' });
  const bell = (mu, s) => { let d = ''; for (let z = -3; z <= 4.3; z += .02) d += (d ? ' L' : 'M') + X(z).toFixed(1) + ',' + (base - H * .45 * Math.exp(-(z - mu) * (z - mu) / (2 * s * s)) / s * .5).toFixed(1); return d; };
  const off = path(bell(0, 1.08), { class: 'c0', 'stroke-width': 5 });
  const on = path(bell(1, 1.08), { class: 'c1', 'stroke-width': 5 });
  draw(off, cue(1)); draw(on, cue(1, .4));
  const l1 = label(X(-1.9), base - 140, 'признак выключен', { size: 26, class: 'c0' });
  const l2 = label(X(2.6), base - 140, 'признак включён, f = 1', { size: 26, class: 'c1' });
  show(l1, cue(1, .3)); show(l2, cue(1, .7));
  const s = chip(800, 130, 'k = 1200, d = 1024: σ ≈ √(1200/1024) ≈ 1.08', { size: 28 });
  pop(s, cue(1, 1));
  const bad = box(800, 230, 640, 0, 'шум больше сигнала: колокола почти совпадают', { size: 28, class: 'bad' });
  show(bad, cue(2));
  const ok = label(800, 690, 'важно k ≪ d, а не k ≪ M', { size: 28, class: 'c2' });
  show(ok, cue(2, .6));
});
