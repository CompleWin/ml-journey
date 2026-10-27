// Part 13: tensor shapes through the broken SAE, and its three bugs: no centering, no ReLU, unrelated encoder and decoder.

const DEG = Math.PI / 180;
function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

scene('shapes', () => {
  const p = group(0, 0);
  chip(220, 80, 'W_enc: (512, 2048)', { size: 24, parent: p });
  chip(580, 80, 'W_dec: (2048, 512)', { size: 24, parent: p });
  chip(220, 140, 'b_enc: (2048,)', { size: 24, parent: p });
  chip(580, 140, 'b_dec: (512,)', { size: 24, parent: p });
  show(p, cue(1));
  const rows = [
    [2, 'x: (64, 512)', 'c0', 260], [2, 'x @ W_enc + b_enc', 'soft', 340], [2, 'pre_acts: (64, 2048)', 'c0', 420],
    [3, 'topk → val, idx: (64, 32)', 'c1', 520],
    [4, 'scatter_ → acts: (64, 2048)', 'c2', 620],
    [5, 'acts @ W_dec + b_dec → x_hat: (64, 512)', 'c3', 740],
  ];
  rows.forEach(([k, s, cls, y], i) => {
    const c = cls === 'soft' ? label(400, y, s, { size: 26 }) : chip(400, y, s, { size: 26, class: cls });
    show(c, cue(k, (i === 1 ? .3 : i === 2 ? .6 : 0)));
    if (i > 0) { const a = arrow(400, rows[i - 1][3] + 24, 400, y - 24, { class: 'soft', 'stroke-width': 3 }); draw(a, cue(k, (i === 1 ? .2 : i === 2 ? .5 : 0))); }
  });
  const n = label(400, 670, '32 ненулевых в строке', { size: 24, class: 'c2' });
  show(n, cue(4, .4));
});

scene('nocenter', () => {
  const O = [130, 720], A = 40;
  const pts = [];
  for (let k = 0; k < 40; k++) { const a = A + gauss() * 9, L = 430 + gauss() * 45; pts.push([O[0] + L * Math.cos(a * DEG), O[1] - L * Math.sin(a * DEG)]); }
  pts.forEach(([x, y]) => circle(x, y, 6, { class: 'fill c0', stroke: 'none' }));
  const M = pts.reduce((s, q) => [s[0] + q[0] / 40, s[1] + q[1] / 40], [0, 0]);
  const mv = arrow(O[0], O[1], M[0], M[1], { class: 'c1', 'stroke-width': 8 });
  draw(mv, cue(1));
  const ml = label(M[0] - 40, M[1] + 120, 'общая часть E[x]', { size: 26, class: 'c1' });
  show(ml, cue(1, .3));
  const st = chip(330, 120, '20% энергии, cos между токенами ≈ 0.35', { size: 24 });
  pop(st, cue(1, .6));

  const tokens = [['токен 1', [.9, .3, .1], [.1, .6, .05]], ['токен 2', [.85, .05, .4], [.05, .1, .7]], ['токен 3', [.95, .2, .25], [.55, .1, .2]]];
  const X0 = 960;
  text(1150, 160, 'предактивации латентов A, B, C', { size: 26 });
  tokens.forEach(([name, before, after], r) => {
    const y0 = 230 + r * 170;
    const g = group(0, 0);
    text(X0 - 120, y0 + 40, name, { size: 26, parent: g });
    const winB = before.indexOf(Math.max(...before)), winA = after.indexOf(Math.max(...after));
    before.forEach((v, k) => {
      const y = y0 + k * 42;
      text(X0 - 25, y + 17, 'ABC'[k], { size: 22, class: 'soft', parent: g });
      const bar = rect(X0, y, v * 520, 34, { class: 'fill ' + (k === winB ? 'c1' : 'c0'), stroke: 'none', parent: g });
      set(bar, 'width', after[k] * 520, cue(3, .4), 1);
      if (k === winB && k !== winA) recolor(bar, 'c0', cue(3, 1.2));
      if (k === winA && k !== winB) recolor(bar, 'c1', cue(3, 1.2));
    });
    show(g, cue(2, r * .3));
  });
  const w = label(1150, 760, 'без центрирования всегда побеждает A', { size: 26, class: 'c1' });
  show(w, cue(2, 1)); hide(w, cue(3));
  const fx = chip(1150, 760, 'x − b_dec, b_dec = E[x]: победители разные', { size: 26, class: 'c2' });
  pop(fx, cue(3, 1.4));
  const nO = circle(M[0], M[1], 14, { class: 'fill c2', stroke: 'none' });
  pop(nO, cue(3));
});

scene('norelu', () => {
  const vals = [-.2, -.5, .3, -.1, -.7, .15, -.3, -.05, -.6, .1, -.4, -.25], K = 6, base = 420, H = 380;
  const top = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, K).map(q => q[1]);
  line(180, base, 1420, base, { 'stroke-width': 2 });
  text(800, 120, 'предактивации одного вектора (K = 6 для наглядности)', { size: 28 });
  const bars = vals.map((v, i) => {
    const x = 220 + i * 100;
    const b = v >= 0 ? rect(x, base - v * H, 60, v * H, { class: 'fill c0', stroke: 'none' }) : rect(x, base, 60, -v * H, { class: 'fill c0', stroke: 'none' });
    if (top.includes(i)) recolor(b, v >= 0 ? 'c1' : 'bad', cue(1, .3));
    return b;
  });
  const l1 = label(800, 690, 'topk берёт 6 самых больших — среди них отрицательные', { size: 28, class: 'bad' });
  show(l1, cue(1, .6));
  const l2 = box(800, 230, 640, 0, 'отрицательная сила: латент = понятие и «анти-понятие»', { size: 28, class: 'bad' });
  show(l2, cue(2));
  hide(l1, cue(3)); hide(l2, cue(3));
  vals.forEach((v, i) => { if (v < 0) set(bars[i], 'height', 0, cue(3, .3), .8); });
  const l3 = chip(800, 690, 'ReLU перед Top-K: в код попадают только f ≥ 0', { size: 28, class: 'c2' });
  pop(l3, cue(3, 1));
});

scene('tied', () => {
  const C = [520, 470], R = 230;
  circle(C[0], C[1], R, { class: 'soft', 'stroke-dasharray': '8 8', 'stroke-width': 2 });
  label(C[0], C[1] + R + 40, 'длина 1', { size: 24, class: 'soft' });
  const det = arrow(C[0], C[1], C[0] + R * Math.cos(20 * DEG), C[1] - R * Math.sin(20 * DEG), { class: 'c0', 'stroke-width': 7 });
  const dl = label(C[0] + 290, C[1] + 70, 'детектор (W_enc): когда включиться', { size: 26, class: 'c0' });
  const wr = group(C[0], C[1]);
  arrow(0, 0, R, 0, { class: 'c2', 'stroke-width': 7, parent: wr });
  pose(wr, { r: -115 });
  const wl = label(C[0] - 280, C[1] - 250, 'запись (W_dec): что добавить', { size: 26, class: 'c2' });
  show(det, cue(1)); show(dl, cue(1)); show(wr, cue(1, .4)); show(wl, cue(1, .4));
  scale(wr, 1.5, cue(2), 1);
  const amb = chip(1200, 300, 'f · d = (c·f) · (d / c)', { size: 30, class: 'c3' });
  pop(amb, cue(2, .5));
  const ambl = label(1200, 370, 'масштаб не определён', { size: 26, class: 'c3' });
  show(ambl, cue(2, .8));
  turn(wr, -20, cue(3), 1.4);
  scale(wr, 1, cue(3), 1.4);
  hide(wl, cue(3));
  const fx = box(1200, 720, 560, 0, 'W_enc = W_decᵀ при инициализации, ‖dᵢ‖ = 1 всегда', { size: 28, class: 'c2' });
  show(fx, cue(3, 1));
});
