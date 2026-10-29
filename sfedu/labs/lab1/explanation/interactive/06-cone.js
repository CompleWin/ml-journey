// Part 6: token pairs, the cone in embed_out, how it is measured, why it forms, centering and whitening.

const DEG = Math.PI / 180;
function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function ray(ox, oy, a, L, attrs) { return arrow(ox, oy, ox + L * Math.cos(a * DEG), oy - L * Math.sin(a * DEG), attrs); }

scene('pairs', () => {
  const tb = group(0, 0);
  text(230, 80, 'embed_in[:50277]', { size: 28, parent: tb });
  for (let i = 0; i < 12; i++) rect(80, 120 + i * 40, 300, 34, { rx: 4, class: 'paper', parent: tb });
  show(tb, cue(1));
  const pairs = [[1, 6], [3, 10], [4, 8], [7, 7], [2, 11]];
  pairs.forEach(([i, j], k) => {
    const same = i === j;
    const y1 = 137 + i * 40, y2 = 137 + j * 40;
    const a = same
      ? circle(395, y1, 16, { class: 'bad', 'stroke-width': 4 })
      : path(`M380,${y1} C${470 + k * 40},${y1} ${470 + k * 40},${y2} 380,${y2}`, { class: 'c' + (k % 3), 'stroke-width': 4 });
    if (same) show(a, cue(2, .2)); else draw(a, cue(2, k * .2));
  });
  const n = chip(620, 160, '10 000 пар (i, j)', { size: 26 });
  pop(n, cue(2));
  const x = label(620, 420, 'i = j → выбросить', { size: 26, class: 'bad' });
  show(x, cue(2, 1));
  const c = group(0, 0);
  for (let k = 0; k < 4; k++) chip(560 + (k % 2) * 140, 560 + Math.floor(k / 2) * 60, 'cos', { size: 24, class: 'c1', parent: c });
  text(630, 700, 'построчно ⟨u, v⟩', { size: 26, class: 'c1', parent: c });
  show(c, cue(3));
  const nl = text(230, 640, 'строки длины 1', { size: 26, class: 'c0' });
  show(nl, cue(3));
});

scene('cones', () => {
  const L = [430, 470], R = [1170, 470], r = 250;
  for (const [c, t] of [[L, 'embed_in'], [R, 'embed_out']]) {
    circle(c[0], c[1], r, { class: 'soft', 'stroke-width': 2 });
    text(c[0], 160, t, { size: 34 });
  }
  const gi = group(0, 0);
  for (let k = 0; k < 18; k++) ray(L[0], L[1], k * 20 + random() * 12, r * (.85 + .15 * random()), { class: 'c0', 'stroke-width': 3, parent: gi });
  show(gi, cue(1));
  const li = label(L[0], 790, 'средний cos пар ≈ 0.005', { size: 30, class: 'c0' });
  show(li, cue(1, .5));
  const go = group(0, 0);
  for (let k = 0; k < 18; k++) ray(R[0], R[1], 30 + (random() * 2 - 1) * 15, r * (.85 + .15 * random()), { class: 'c1', 'stroke-width': 3, parent: go });
  for (const s of [-17, 17]) ray(R[0], R[1], 30 + s, r + 40, { class: 'c1', head: 'none', 'stroke-dasharray': '8 8', 'stroke-width': 2, parent: go });
  show(go, cue(2));
  const lo = label(R[0], 790, 'средний cos пар ≈ 0.918', { size: 30, class: 'c1' });
  show(lo, cue(2, .5));
});

scene('meanvec', () => {
  const O = [220, 700], A = 25;
  for (let k = 0; k < 14; k++) ray(O[0], O[1], A + (random() * 2 - 1) * 15, 470 + random() * 90, { class: 'soft', 'stroke-width': 3 });
  const m = ray(O[0], O[1], A, 500, { class: 'c1', 'stroke-width': 10 });
  draw(m, cue(1));
  const ml = label(O[0] + 560 * Math.cos(A * DEG), O[1] - 560 * Math.sin(A * DEG), 'средний вектор', { size: 28, class: 'c1' });
  show(ml, cue(1, .5));
  const c1 = chip(1270, 250, '‖E[w]‖ / E‖w‖ = 0.959', { size: 30, class: 'c1' });
  pop(c1, cue(1, .8));
  const one = ray(O[0], O[1], A + 13, 540, { class: 'c0', 'stroke-width': 5 });
  draw(one, cue(2));
  const arc = path(`M${O[0] + 300 * Math.cos(A * DEG)},${O[1] - 300 * Math.sin(A * DEG)} A300,300 0 0 0 ${O[0] + 300 * Math.cos((A + 13) * DEG)},${O[1] - 300 * Math.sin((A + 13) * DEG)}`, { class: 'c0', 'stroke-width': 4 });
  draw(arc, cue(2, .4));
  const c2 = chip(1270, 360, 'средний cos(w, E[w]) = 0.958', { size: 30, class: 'c0' });
  pop(c2, cue(2, .8));
  const b = group(0, 0);
  for (const s of [-16.7, 16.7]) ray(O[0], O[1], A + s, 660, { class: 'c2', head: 'none', 'stroke-dasharray': '10 8', 'stroke-width': 3, parent: b });
  show(b, cue(3));
  const c3 = chip(1270, 470, 'полуугол = arccos 0.958 ≈ 17°', { size: 30, class: 'c2' });
  pop(c3, cue(3, .5));
  const c4 = label(1270, 580, 'у embed_in: 86° — конуса нет', { size: 28, class: 'soft' });
  show(c4, cue(3, 1.2));
});

scene('wind', () => {
  const O1 = [200, 640], O2 = [1040, 560], AX = 22;
  const beta = ray(O1[0], O1[1], AX, 330, { class: 'c3', 'stroke-width': 8 });
  draw(beta, cue(1));
  const bl = label(O1[0] + 200, O1[1] - 30, 'β — общий сдвиг', { size: 28, class: 'c3' });
  show(bl, cue(1, .4));
  const f = tex(420, 200, 'h = \\gamma \\odot \\mathrm{norm}(x) + \\beta');
  show(f, cue(1, .6));
  const hs = group(0, 0);
  for (let k = 0; k < 7; k++) ray(O1[0], O1[1], AX - 6 + k * 2, 380 + random() * 60, { class: 'c0', 'stroke-width': 3, parent: hs });
  show(hs, cue(2));
  const hl = label(420, 300, 'h разных токенов: средний cos = 0.990', { size: 28, class: 'c0' });
  show(hl, cue(2, .5));

  line(O2[0] - 380 * Math.cos(AX * DEG), O2[1] + 380 * Math.sin(AX * DEG), O2[0] + 470 * Math.cos(AX * DEG), O2[1] - 470 * Math.sin(AX * DEG), { class: 'c3', 'stroke-dasharray': '6 10', 'stroke-width': 2 });
  const start = [80, 130, 170, 215, 260, 300, 340, 120, 200, 285, 45, 155];
  start.forEach((a0, k) => {
    const g = group(O2[0], O2[1]);
    arrow(0, 0, 240, 0, { class: 'c1', 'stroke-width': 4, parent: g });
    pose(g, { r: -a0 });
    const a1 = AX + ((k * 7) % 25) - 12;
    turn(g, -a1, cue(3, .3 + k * .05), 3);
  });
  const wl = label(O2[0], 160, 'все толчки — вдоль одной оси', { size: 30, class: 'c3' });
  show(wl, cue(3));
  const cl = label(O2[0] + 150, 790, 'миллионы шагов → конус', { size: 30, class: 'c1' });
  show(cl, cue(3, 2.5));
});

scene('prices', () => {
  const rows = [[100, 300], [250, 420], [400, 540]], k = .5, x0 = 300;
  text(800, 170, 'цены', { size: 32 });
  rows.forEach(([v, y], i) => {
    const bar = rect(x0, y - 30, v * k, 60, { class: 'fill c0', stroke: 'none' });
    const t = label(x0 + v * k + 90, y, v + ' ₽', { size: 30 });
    show(bar, cue(1, i * .2)); show(t, cue(1, i * .2));
    set(bar, 'width', (v + 1000) * k, cue(2), 1.5);
    move(t, x0 + (v + 1000) * k + 110, y, cue(2), 1.5);
    count(t, v, v + 1000, cue(2), 1.5, 0);
  });
  const add = chip(800, 680, '+ 1000 ₽ ко всем', { size: 30, class: 'c1' });
  pop(add, cue(2));
  const o = label(800, 230, 'порядок тот же: softmax не заметит', { size: 28, class: 'c2' });
  show(o, cue(2, 1.6));
  const r = box(1180, 760, 640, 0, 'разница в 4 раза → в 1.27 раза: «тысяча с хвостиком»', { size: 28, class: 'c1' });
  show(r, cue(3));
});

scene('center', () => {
  const O = [110, 760], A = 38;
  const pts = [];
  for (let k = 0; k < 40; k++) {
    const a = A + gauss() * 7, L = 470 + gauss() * 40;
    pts.push([O[0] + L * Math.cos(a * DEG), O[1] - L * Math.sin(a * DEG)]);
  }
  const old = group(0, 0);
  pts.slice(0, 10).forEach(([x, y]) => arrow(O[0], O[1], x, y, { class: 'soft', 'stroke-width': 2, parent: old }));
  pts.forEach(([x, y]) => circle(x, y, 7, { class: 'fill c0', stroke: 'none' }));
  const M = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
  const mv = arrow(O[0], O[1], M[0], M[1], { class: 'c1', 'stroke-width': 8 });
  draw(mv, cue(1));
  const ml = label(M[0] - 120, M[1] + 140, 'средний вектор', { size: 28, class: 'c1' });
  show(ml, cue(1, .5));
  hide(old, cue(2));
  const cross = group(M[0], M[1]);
  circle(0, 0, 14, { class: 'fill c1', stroke: 'none', parent: cross });
  pop(cross, cue(2));
  const nl = label(M[0] + 40, M[1] - 190, 'новое начало координат', { size: 26, class: 'c1' });
  show(nl, cue(2, .4));
  const fresh = group(0, 0);
  pts.slice(0, 14).forEach(([x, y]) => arrow(M[0], M[1], M[0] + (x - M[0]) * 1.6, M[1] + (y - M[1]) * 1.6, { class: 'c2', 'stroke-width': 3, parent: fresh }));
  show(fresh, cue(3));
  const fl = label(400, 120, 'направления — во все стороны', { size: 28, class: 'c2' });
  show(fl, cue(3, .5));
});

scene('whiten', () => {
  const C = [800, 450], SX = 250, SY = 70, R = 150;
  const g = group(C[0], C[1]);
  const pts = [];
  for (let k = 0; k < 360; k++) {
    const x = gauss(), y = gauss();
    pts.push([x, y, circle(x * SX / 2, y * SY / 2, 4, { class: 'fill c0', stroke: 'none', parent: g, opacity: .6 })]);
  }
  const ax1 = line(-SX * 1.3, 0, SX * 1.3, 0, { class: 'c1', 'stroke-width': 4, parent: g });
  const ax2 = line(0, -SY * 1.6, 0, SY * 1.6, { class: 'c2', 'stroke-width': 4, parent: g });
  pose(g, { r: -30 });
  show(ax1, cue(1)); show(ax2, cue(1, .3));
  const l1 = label(1300, 200, 'главные оси = собственные векторы', { size: 28 });
  show(l1, cue(1, .6));
  turn(g, 0, cue(2), 1.5);
  const l2 = label(1300, 270, 'поворот: оси вдоль координат', { size: 28 });
  show(l2, cue(2, .5));
  pts.forEach(([x, y, e]) => move(e, x * R / 2, y * R / 2, cue(3), 1.6));
  set(ax1, 'x1', -R * 1.3, cue(3), 1.6); set(ax1, 'x2', R * 1.3, cue(3), 1.6);
  set(ax2, 'y1', -R * 1.3, cue(3), 1.6); set(ax2, 'y2', R * 1.3, cue(3), 1.6);
  const l3 = label(1300, 340, 'деление на σ каждой оси', { size: 28 });
  show(l3, cue(3, .3));
  const l4 = chip(800, 760, 'облако круглое: ковариация = I', { size: 30, class: 'c2' });
  pop(l4, cue(3, 1.8));
});
