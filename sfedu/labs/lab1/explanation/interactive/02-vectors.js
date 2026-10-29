// Part 2: vectors, length, unit sphere, dot product, cosine, basis, matrices and row operations.

const O = [250, 760], UNIT = 110;   // origin of the plane and pixels per unit
function P(x, y) { return [O[0] + x * UNIT, O[1] - y * UNIT]; }

function plane() {
  for (let i = 1; i <= 5; i++) {
    line(...P(i, 0), ...P(i, 5.4), { class: 'soft', 'stroke-width': 1 });
    line(...P(0, i), ...P(5.4, i), { class: 'soft', 'stroke-width': 1 });
    text(P(i, 0)[0], O[1] + 34, String(i), { size: 24, class: 'soft' });
    text(O[0] - 30, P(0, i)[1], String(i), { size: 24, class: 'soft' });
  }
  arrow(...P(-0.3, 0), ...P(5.7, 0), { 'stroke-width': 2 });
  arrow(...P(0, -0.3), ...P(0, 5.7), { 'stroke-width': 2 });
}

function vec34() {   // the arrow (3, 4) with its legs
  const v = arrow(...P(0, 0), ...P(3, 4), { class: 'c0', 'stroke-width': 6 });
  const legs = group(0, 0);
  line(...P(3, 0), ...P(3, 4), { class: 'c0', 'stroke-dasharray': '8 8', parent: legs });
  line(...P(0, 4), ...P(3, 4), { class: 'c0', 'stroke-dasharray': '8 8', parent: legs });
  const l3 = label(...P(1.5, 0.35), '3 вправо', { size: 26, parent: legs });
  const l4 = label(...P(3.75, 2), '4 вверх', { size: 26, parent: legs });
  return { v, legs };
}

scene('vec2d', () => {
  plane();
  const c = chip(1250, 200, 'x = (3, 4)', { size: 34 });
  pop(c, cue(1));
  const z = vec34();
  draw(z.v, cue(2));
  show(z.legs, cue(2, .7));
  const k = label(1250, 280, 'координаты: 3 и 4', { size: 28 });
  show(k, cue(2, 1.2));
});

scene('dims', () => {
  // d = 2
  const a = group(270, 440);
  arrow(-120, 120, 150, 120, { parent: a, 'stroke-width': 2 });
  arrow(-120, 120, -120, -150, { parent: a, 'stroke-width': 2 });
  arrow(-120, 120, 40, -60, { class: 'c0', parent: a, 'stroke-width': 5 });
  text(0, 220, 'd = 2', { size: 36, parent: a });
  // d = 3
  const b = group(800, 440);
  arrow(-100, 100, 170, 100, { parent: b, 'stroke-width': 2 });
  arrow(-100, 100, -100, -170, { parent: b, 'stroke-width': 2 });
  arrow(-100, 100, -200, 190, { parent: b, 'stroke-width': 2 });
  arrow(-100, 100, 60, -80, { class: 'c0', parent: b, 'stroke-width': 5 });
  line(60, -80, 60, 30, { class: 'soft', 'stroke-dasharray': '6 6', parent: b });
  text(0, 220, 'd = 3', { size: 36, parent: b });
  show(b, cue(1));
  // d = 512
  const c = group(1330, 390);
  for (let i = 0; i < 9; i++) rect(-45, -240 + i * 40, 90, 34, { rx: 4, class: 'paper', parent: c });
  text(0, 135, '⋮', { size: 40, parent: c });
  text(0, 270, 'd = 512', { size: 36, class: 'c0', parent: c });
  show(c, cue(2));
  const t = tex(700, 770, 'x \\in \\mathbb{R}^d');
  show(t, cue(2, .8));
  const tl = label(980, 770, 'список из d чисел', { size: 28 });
  show(tl, cue(2, 1));
});

scene('plane2', () => {
  plane();
  chip(1250, 200, 'x = (3, 4)', { size: 34 });
  const z = vec34();
  const len = label(...P(1.05, 2.45), 'длина 5', { size: 30, class: 'c1' });
  show(len, cue(1));
  pulse(z.v, cue(1));
  const t1 = tex(1250, 340, '\\|x\\|_2 = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5');
  show(t1, cue(1, .3));
  const t2 = tex(1250, 500, '\\|x\\|_2 = \\sqrt{x_1^2 + x_2^2 + \\dots + x_d^2}');
  show(t2, cue(2));
  const n = label(1250, 590, 'евклидова, или L2-норма', { size: 28 });
  show(n, cue(2, .5));
});

scene('unit', () => {
  plane();
  chip(1250, 200, 'x = (3, 4)', { size: 34 });
  const z = vec34();
  const len = label(...P(1.05, 2.45), 'длина 5', { size: 30, class: 'c1' });
  const t1 = tex(1250, 340, '\\|x\\|_2 = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5');
  const t2 = tex(1250, 500, '\\|x\\|_2 = \\sqrt{x_1^2 + x_2^2 + \\dots + x_d^2}');
  const n = label(1250, 590, 'евклидова, или L2-норма', { size: 28 });
  for (const e of [len, t1, t2, n]) hide(e, .2);

  recolor(z.v, 'soft', cue(1));
  hide(z.legs, cue(1));
  const u = arrow(...P(0, 0), ...P(0.6, 0.8), { class: 'c1', 'stroke-width': 6 });
  draw(u, cue(1, .3));
  const c = chip(1250, 340, '(3, 4) / 5 = (0.6, 0.8)', { size: 32, class: 'c1' });
  pop(c, cue(1, .5));

  const circ = circle(...P(0, 0), UNIT, { class: 'c2', 'stroke-width': 4 });
  draw(circ, cue(2));
  const cl = label(...P(1.9, 0.75), 'длина 1', { size: 26, class: 'c2' });
  show(cl, cue(2, .6));
  const s = tex(1250, 480, '\\mathbb{S}^{d-1} = \\{\\, x : \\|x\\|_2 = 1 \\,\\}');
  show(s, cue(2, .8));

  const f = tex(1250, 630, 'u = \\frac{x}{\\|x\\|_2}');
  show(f, cue(3));
  const fl = label(1250, 730, 'нормировка', { size: 28 });
  show(fl, cue(3, .4));
});

scene('dotcalc', () => {
  const U = [1, 2, 0, -1], V = [2, 0, 3, 1];
  const xs = [520, 720, 920, 1120];
  text(370, 220, 'u', { size: 40, class: 'c0' });
  text(370, 360, 'v', { size: 40, class: 'c2' });
  const cu = [], cv = [];
  xs.forEach((x, k) => {
    cu.push(box(x, 220, 130, 80, String(U[k]), { size: 34 }));
    cv.push(box(x, 360, 130, 80, String(V[k]), { size: 34 }));
  });
  const prods = [];
  xs.forEach((x, k) => {
    const p = chip(x, 530, U[k] + ' · ' + V[k] + ' = ' + U[k] * V[k], { size: 28 });
    pulse(cu[k], cue(1, k * .6)); pulse(cv[k], cue(1, k * .6));
    pop(p, cue(1, k * .6 + .2));
    prods.push(p);
  });
  const pl = label(370, 530, 'попарно', { size: 26 });
  show(pl, cue(1));
  xs.forEach((x, k) => {
    const a = arrow(x, 570, 820, 680, { class: 'soft' });
    draw(a, cue(2, k * .15));
  });
  const sum = chip(820, 730, '⟨u, v⟩ = 2 + 0 + 0 − 1 = 1', { size: 34, class: 'c1' });
  pop(sum, cue(2, .8));
});

scene('cos', () => {
  const C = [560, 520], R = 290;
  circle(C[0], C[1], R, { class: 'soft', 'stroke-width': 2 });
  arrow(C[0], C[1], C[0] + R, C[1], { class: 'c0', 'stroke-width': 6 });
  label(C[0] + R + 40, C[1] + 40, 'u', { size: 34, class: 'c0' });
  const vg = group(C[0], C[1]);
  arrow(0, 0, R, 0, { class: 'c2', 'stroke-width': 6, parent: vg });
  const vl = label(0, 0, 'v', { size: 34, class: 'c2' });
  const arc = path('M0,0', { class: 'c1', 'stroke-width': 4 });
  const th = label(0, 0, 'θ', { size: 30, class: 'c1' });

  tex(1200, 190, '\\langle u, v \\rangle = \\|u\\|\\,\\|v\\|\\cos\\theta');
  const t2 = tex(1200, 290, '\\|u\\| = \\|v\\| = 1 \\;\\Rightarrow\\; \\langle u, v \\rangle = \\cos\\theta');
  show(t2, cue(1));
  const read = text(1200, 450, '', { size: 46 });
  const deg = text(1200, 520, '', { size: 32, class: 'soft' });
  const notes = [['1 — одно направление', 'c2', 2], ['0 — перпендикулярны', 'ink', 3], ['−1 — противоположны', 'c1', 4]];
  notes.forEach(([s, cls, k], i) => show(label(1200, 640 + i * 70, s, { size: 30, class: cls }), cue(k, 1.6)));

  const keys = [[0, 50], [cue(2), 50], [cue(2) + 1.5, 0], [cue(3), 0], [cue(3) + 1.8, 90], [cue(4), 90], [cue(4) + 1.8, 180]];
  function angle(t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t0, a0] = keys[i - 1], [t1, a1] = keys[i];
      if (t <= t1) { const u = t1 > t0 ? (t - t0) / (t1 - t0) : 1; const e = u * u * (3 - 2 * u); return a0 + (a1 - a0) * e; }
    }
    return keys[keys.length - 1][1];
  }
  clock(t => {
    const a = angle(t), r = a * Math.PI / 180;
    pose(vg, { r: -a });
    const rl = r + .21;
    pose(vl, { x: C[0] + (R + 45) * Math.cos(rl), y: C[1] - (R + 45) * Math.sin(rl) });
    const ar = 70;
    arc.setAttribute('d', `M${C[0] + ar},${C[1]} A${ar},${ar} 0 0 0 ${C[0] + ar * Math.cos(r)},${C[1] - ar * Math.sin(r)}`);
    pose(th, { x: C[0] + 110 * Math.cos(r / 2), y: C[1] - 110 * Math.sin(r / 2) });
    read.textContent = 'cos θ = ' + (Math.abs(Math.cos(r)) < .005 ? '0.00' : Math.cos(r).toFixed(2));
    deg.textContent = 'θ = ' + Math.round(a) + '°';
  });
});

scene('basis', () => {
  const C = [430, 620], L = 300;
  arrow(C[0], C[1], C[0] + L, C[1], { class: 'c0', 'stroke-width': 6 });
  arrow(C[0], C[1], C[0], C[1] - L, { class: 'c2', 'stroke-width': 6 });
  path(`M${C[0] + 40},${C[1]} L${C[0] + 40},${C[1] - 40} L${C[0]},${C[1] - 40}`, { class: 'soft' });
  label(C[0] + L + 20, C[1] + 50, 'e₁ = (1, 0)', { size: 30, class: 'c0' });
  label(C[0] + 10, C[1] - L - 45, 'e₂ = (0, 1)', { size: 30, class: 'c2' });
  label(C[0] + 150, C[1] - 120, '⟨e₁, e₂⟩ = 0', { size: 28 });

  const t = tex(1170, 300, 'e_i = (0, \\dots, 0, \\underset{i}{1}, 0, \\dots, 0)');
  show(t, cue(1));
  const tl = label(1170, 400, 'в ℝᵈ ровно d взаимно перпендикулярных осей', { size: 28 });
  show(tl, cue(1, .5));
  const n = chip(1170, 540, 'нейрон № i = ось eᵢ', { size: 32, class: 'c3' });
  pop(n, cue(2));
  const s = box(1170, 690, 560, 0, 'почти перпендикулярных направлений бывает гораздо больше, чем d', { size: 28, class: 'c1' });
  show(s, cue(2, 1.5));
});

function grid(x, y, rows, cols, w, h, cls) {   // a matrix of small numbers
  const g = group(x, y);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    rect(j * w, i * h, w - 6, h - 6, { rx: 4, class: cls || 'paper', parent: g });
    const v = (random() * 2 - 1).toFixed(1);
    text(j * w + (w - 6) / 2, i * h + (h - 6) / 2, v, { size: 20, class: 'soft', parent: g });
  }
  return g;
}

scene('matrix', () => {
  const x0 = 260, y0 = 210, w = 110, h = 70, R = 5, Cn = 7;
  grid(x0, y0, R, Cn, w, h);
  text(x0 + Cn * w / 2, 160, 'd столбцов', { size: 30 });
  text(150, y0 + R * h / 2, 'M строк', { size: 30 });
  tex(1260, 200, 'X \\in \\mathbb{R}^{M \\times d}');

  const row = rect(x0 - 8, y0 + h - 8, Cn * w + 10, h + 4, { rx: 10, class: 'c0', 'stroke-width': 5 });
  show(row, cue(1));
  const rl = label(1260, y0 + h * 1.5, 'строка = один вектор', { size: 30, class: 'c0' });
  show(rl, cue(1, .3));
  const ra = arrow(1060, y0 + h * 1.5, x0 + Cn * w + 10, y0 + h * 1.5, { class: 'c0' });
  draw(ra, cue(1, .3));
  const rx = chip(1260, y0 + h * 1.5 + 60, 'axis = 1', { size: 26, class: 'c0' });
  pop(rx, cue(1, .6));

  const col = rect(x0 + 3 * w - 8, y0 - 8, w + 4, R * h + 10, { rx: 10, class: 'c1', 'stroke-width': 5 });
  show(col, cue(2));
  const cl = label(x0 + 3.5 * w, y0 + R * h + 70, 'столбец = одна координата у всех векторов', { size: 30, class: 'c1' });
  show(cl, cue(2, .3));
  const cx = chip(1260, 560, 'axis = 0', { size: 26, class: 'c1' });
  pop(cx, cue(2, .6));
  const mean = label(1260, 640, 'среднее по столбцам = средний вектор', { size: 28, class: 'c1' });
  show(mean, cue(2, 1.2));
});

scene('rowops', () => {
  const x0 = 70, w = 76, h = 52, R = 4, Cn = 5;
  const X = grid(x0, 130, R, Cn, w, h);
  pop(X, cue(1));
  const xl = text(x0 + Cn * w / 2, 95, 'X: M × d', { size: 30 });
  show(xl, cue(1));
  const ul = text(x0 + Cn * w / 2, 95, 'U = X / ‖X‖', { size: 30, class: 'c0' });

  const norms = group(0, 0);
  for (let i = 0; i < R; i++) chip(590, 130 + i * h + 23, '‖Xᵢ‖', { size: 22, parent: norms });
  text(590, 95, '(M, 1)', { size: 26, parent: norms });
  show(norms, cue(2));

  hide(xl, cue(3)); show(ul, cue(3));
  const tint = rect(x0 - 6, 124, Cn * w + 6, R * h + 6, { rx: 8, class: 'c0', 'stroke-width': 5 });
  show(tint, cue(3, .2));
  hide(norms, cue(3, .4));

  const V = grid(x0, 450, R, Cn, w, h);
  show(V, cue(4));
  const vl = text(x0 + Cn * w / 2, 415, 'V', { size: 30, class: 'c2' });
  show(vl, cue(4));
  const times = text(x0 + Cn * w + 30, 395, '×', { size: 40 });
  show(times, cue(4, .2));
  const s = group(0, 0);
  for (let i = 0; i < R; i++) {
    arrow(x0 + Cn * w + 10, 476 + i * h, 545, 476 + i * h, { class: 'soft', parent: s });
    chip(600, 476 + i * h, 'sᵢ', { size: 24, class: 'c1', parent: s });
  }
  text(600, 700, 's: M чисел', { size: 28, class: 'c1', parent: s });
  show(s, cue(4, .5));
});
