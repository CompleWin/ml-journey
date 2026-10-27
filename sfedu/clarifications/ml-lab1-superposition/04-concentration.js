// Part 4: a uniform direction by normalizing a normal vector, the 1/d derivation, angles, the code, the narrowing bells.

function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

scene('project', () => {
  const L = [420, 440], Rr = [1180, 440], R = 200;
  text(L[0], 110, 'нормальное облако', { size: 30 });
  text(Rr[0], 110, 'равномерно в квадрате', { size: 30 });
  circle(L[0], L[1], R, { class: 'soft', 'stroke-dasharray': '8 8' });
  circle(Rr[0], Rr[1], R, { class: 'soft', 'stroke-dasharray': '8 8' });
  rect(Rr[0] - 150, Rr[1] - 150, 300, 300, { class: 'soft' });
  for (let i = 0; i < 480; i++) {
    const x = gauss(), y = gauss(), n = Math.hypot(x, y) || 1;
    const p = circle(L[0] + x * 85, L[1] + y * 85, 4, { class: 'fill c0', stroke: 'none', opacity: .5 });
    move(p, L[0] + R * x / n, L[1] + R * y / n, cue(1, (i % 24) * .04), 1.2);
  }
  for (let i = 0; i < 480; i++) {
    const x = random() * 2 - 1, y = random() * 2 - 1, n = Math.hypot(x, y) || 1;
    const p = circle(Rr[0] + x * 150, Rr[1] + y * 150, 4, { class: 'fill c1', stroke: 'none', opacity: .5 });
    move(p, Rr[0] + R * x / n, Rr[1] + R * y / n, cue(2, (i % 24) * .04), 1.2);
  }
  const a1 = chip(L[0], 700, 'x / ‖x‖', { size: 28 });
  pop(a1, cue(1));
  const a2 = chip(Rr[0], 700, 'x / ‖x‖', { size: 28 });
  pop(a2, cue(2));
  for (const s of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const ar = arrow(Rr[0] + s[0] * 270, Rr[1] + s[1] * 270, Rr[0] + s[0] * 160, Rr[1] + s[1] * 160, { class: 'c1', 'stroke-width': 4 });
    draw(ar, cue(2, 1.6));
  }
  const v1 = label(L[0], 760, 'равномерно по окружности', { size: 30, class: 'c2' });
  const v2 = label(Rr[0], 760, 'гуще у диагоналей', { size: 30, class: 'c1' });
  show(v1, cue(3)); show(v2, cue(3, .3));
});

scene('fixu', () => {
  const C = [520, 480], R = 290;
  circle(C[0], C[1], R, { class: 'soft', 'stroke-width': 2 });
  line(C[0] - R - 60, C[1], C[0] + R + 80, C[1], { 'stroke-width': 2 });
  text(C[0] + R + 40, C[1] + 40, 'первая ось', { size: 24, class: 'soft' });
  const rot = group(C[0], C[1]);
  const au = -35 * Math.PI / 180, av = -110 * Math.PI / 180;
  arrow(0, 0, R * Math.cos(au), R * Math.sin(au), { class: 'c0', 'stroke-width': 6, parent: rot });
  arrow(0, 0, R * Math.cos(av), R * Math.sin(av), { class: 'c2', 'stroke-width': 6, parent: rot });
  const lu = label(C[0] + (R + 45) * Math.cos(au), C[1] + (R + 45) * Math.sin(au), 'u', { size: 34, class: 'c0' });
  const lv = label(C[0] + (R + 45) * Math.cos(av), C[1] + (R + 45) * Math.sin(av), 'v', { size: 34, class: 'c2' });
  turn(rot, 35, cue(1), 1.5);
  move(lu, C[0] + R + 45, C[1] - 40, cue(1), 1.5);
  const av2 = -75 * Math.PI / 180;
  move(lv, C[0] + (R + 45) * Math.cos(av2), C[1] + (R + 45) * Math.sin(av2), cue(1), 1.5);
  const note = box(1200, 250, 560, 0, 'поворот не меняет распределение: все направления равноправны', { size: 28 });
  show(note, cue(1, .5));
  const tip = [C[0] + R * Math.cos(av2), C[1] + R * Math.sin(av2)];
  const drop = line(tip[0], tip[1], tip[0], C[1], { class: 'c2', 'stroke-dasharray': '10 8', 'stroke-width': 3 });
  draw(drop, cue(2));
  const seg = line(C[0], C[1], tip[0], C[1], { class: 'c1', 'stroke-width': 9 });
  draw(seg, cue(2, .5));
  const sl = label(C[0] + 40, C[1] + 45, 'v₁', { size: 32, class: 'c1' });
  show(sl, cue(2, .7));
  const f1 = tex(1200, 450, 'u = (1, 0, \\dots, 0)');
  show(f1, cue(1, 1.5));
  const f2 = tex(1200, 580, '\\langle u, v\\rangle = v_1');
  show(f2, cue(2, .8));
});

scene('angles', () => {
  const C = [800, 660], R = 400;
  path(`M${C[0] - R},${C[1]} A${R},${R} 0 0 1 ${C[0] + R},${C[1]}`, { class: 'soft', 'stroke-width': 2 });
  line(C[0] - R - 30, C[1], C[0] + R + 30, C[1], { class: 'soft', 'stroke-width': 2 });
  arrow(C[0], C[1], C[0] + R, C[1], { class: 'c0', 'stroke-width': 6 });
  label(C[0] + R + 45, C[1] - 30, 'u', { size: 32, class: 'c0' });
  function sector(a0, a1, cls) {
    const p = (a) => [C[0] + R * Math.cos(a * Math.PI / 180), C[1] - R * Math.sin(a * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return path(`M${C[0]},${C[1]} L${x0},${y0} A${R},${R} 0 0 0 ${x1},${y1} Z`, { class: 'fill ' + cls, stroke: 'none', 'fill-opacity': .3 });
  }
  const s16 = sector(41.4, 138.6, 'c1');
  show(s16, cue(1));
  const l16 = label(300, 220, 'd = 16: θ от 41° до 139°', { size: 30, class: 'c1' });
  const c16 = chip(300, 285, 'σ = 0.25, 3σ = 0.75', { size: 26, class: 'c1' });
  show(l16, cue(1, .4)); pop(c16, cue(1, .8));
  hide(s16, cue(2), .8);
  const s4k = sector(87.3, 92.7, 'c2');
  show(s4k, cue(2, .4));
  const l4k = label(1300, 220, 'd = 4096: θ от 87.3° до 92.7°', { size: 30, class: 'c2' });
  const c4k = chip(1300, 285, 'σ = 1/64 ≈ 0.0156, 3σ ≈ 0.047', { size: 26, class: 'c2' });
  show(l4k, cue(2, .6)); pop(c4k, cue(2, 1));
  const v = arrow(C[0], C[1], C[0] + R * Math.cos(Math.PI * 90.8 / 180), C[1] - R * Math.sin(Math.PI * 90.8 / 180), { class: 'c2', 'stroke-width': 5 });
  draw(v, cue(2, 1.2));
  const vl = label(C[0] + 45, C[1] - R - 25, 'v', { size: 32, class: 'c2' });
  show(vl, cue(2, 1.6));
});

function minigrid(x, y, rows, cols, w, h) {
  const g = group(x, y);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    rect(j * w, i * h, w - 5, h - 5, { rx: 3, class: 'paper', parent: g });
    text(j * w + (w - 5) / 2, i * h + (h - 5) / 2, (random() * 2 - 1).toFixed(1), { size: 18, class: 'soft', parent: g });
  }
  return g;
}

scene('pipeline', () => {
  const c0 = chip(400, 60, 'dimension = d, number_of_pairs = 20 000', { size: 24 });
  pop(c0, .3);
  const w = 62, h = 44;
  const X = minigrid(60, 140, 4, 6, w, h), Y = minigrid(60, 390, 4, 6, w, h);
  show(X, cue(1)); show(Y, cue(1, .3));
  const xl = text(246, 115, 'X: 20 000 × d', { size: 26 });
  const yl = text(246, 365, 'Y: 20 000 × d', { size: 26 });
  show(xl, cue(1)); show(yl, cue(1, .3));
  const ox = rect(54, 134, 6 * w + 4, 4 * h + 4, { rx: 6, class: 'c0', 'stroke-width': 4 });
  const oy = rect(54, 384, 6 * w + 4, 4 * h + 4, { rx: 6, class: 'c0', 'stroke-width': 4 });
  show(ox, cue(2)); show(oy, cue(2, .2));
  const nl = label(600, 300, 'строки длины 1', { size: 26, class: 'c0' });
  show(nl, cue(2, .4));
  const s = group(0, 0);
  for (let i = 0; i < 4; i++) {
    arrow(445, 412 + i * h, 560, 412 + i * h, { class: 'soft', parent: s });
    chip(610, 412 + i * h, 'sᵢ', { size: 22, class: 'c1', parent: s });
  }
  show(s, cue(3));
  const hs = group(0, 0);
  const hb = [2, 5, 11, 18, 22, 18, 11, 5, 2];
  hb.forEach((v, k) => rect(240 + k * 36, 760 - v * 6, 30, v * 6, { class: 'fill c1', stroke: 'none', opacity: .6, parent: hs }));
  line(220, 760, 580, 760, { parent: hs, 'stroke-width': 2 });
  text(400, 590, 'гистограмма 20 000 косинусов', { size: 24, class: 'c1', parent: hs });
  show(hs, cue(3, .6));
});

scene('narrow', () => {
  const ds = [16, 64, 256, 512, 4096], sig = ['0.25', '0.125', '0.0625', '0.044', '0.0156'];
  ds.forEach((d, i) => {
    const cx = 175 + i * 310, base = 600, hw = 135, s = 1 / Math.sqrt(d);
    const g = group(0, 0);
    line(cx - hw, base, cx + hw, base, { 'stroke-width': 2, parent: g });
    for (const v of [-1, 0, 1]) {
      line(cx + v * hw, base, cx + v * hw, base + 10, { 'stroke-width': 2, parent: g });
      text(cx + v * hw, base + 34, String(v), { size: 22, class: 'soft', parent: g });
    }
    let p = '';
    for (let k = 0; k <= 600; k++) {
      const x = -1 + 2 * k / 600, y = Math.exp(-x * x / (2 * s * s));
      p += (p ? ' L' : 'M') + (cx + x * hw).toFixed(1) + ',' + (base - 330 * y).toFixed(1);
    }
    path(p, { class: 'c1', 'stroke-width': 4, parent: g });
    text(cx, 200, 'd = ' + d, { size: 32, parent: g });
    label(cx, 680, 'σ = ' + sig[i], { size: 28, class: 'c1', parent: g });
    show(g, cue(i + 1));
  });
  const n = label(800, 760, 'общая шкала косинуса: от −1 до 1', { size: 26, class: 'soft' });
  show(n, cue(1, .5));
});
