// Part 12: a forward hook taps layer 3, the training split, dead latents.

scene('hook', () => {
  for (let i = 0; i < 6; i++) {
    box(230, 130 + i * 115, 230, 70, 'слой ' + i, { size: 26 });
    if (i < 5) arrow(230, 165 + i * 115, 230, 210 + i * 115, { class: 'soft', 'stroke-width': 3 });
  }
  const y3 = 130 + 3 * 115;
  const hook = group(380, y3);
  path('M0,0 L60,0 L60,40 Q60,70 30,70 Q5,70 5,50', { class: 'c3', 'stroke-width': 6, parent: hook });
  pop(hook, cue(1));
  const hl = label(560, y3 - 80, 'register_forward_hook', { size: 26, class: 'c3' });
  show(hl, cue(1, .3));
  rect(520, 540, 220, 150, { rx: 16, class: 'paper' });
  text(630, 720, 'captured_batches', { size: 24 });
  for (let k = 0; k < 4; k++) {
    const c = chip(440, y3 + 40, 'x', { size: 24, class: 'c1' });
    show(c, cue(2, k * .7), .2);
    move(c, 590 + (k % 2) * 70, 580 + Math.floor(k / 2) * 50, cue(2, k * .7), .7);
  }
  const ol = label(640, y3 - 20, 'output[0] → список', { size: 26, class: 'c1' });
  show(ol, cue(2, .3));
  hide(hook, cue(3));
  const rl = chip(400, 780, 'finally: handle.remove()', { size: 26, class: 'c2' });
  pop(rl, cue(3, .3));
});

scene('split', () => {
  const R = 10, C = 16, X = c => 280 + c * 62, Y = r => 170 + r * 46;
  text(800, 110, '1000 окон × 128 позиций (показано 10 × 16)', { size: 28 });
  const cells = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const e = rect(X(c), Y(r), 52, 36, { rx: 4, class: c === 0 ? 'fill c3' : 'fill c0', stroke: 'none', 'fill-opacity': .55 });
    if (c === 0) { recolor(e, 'bad', cue(1)); hide(e, cue(1, 1)); }
    else cells.push(e);
  }
  const pl = label(X(0) + 26, Y(R) + 30, 'позиция 0 — выбросить', { size: 26, class: 'bad' });
  show(pl, cue(1, .2));
  hide(pl, cue(2));
  const slots = cells.map((_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const n = cells.length, train = Math.round(n * 64 / 127);
  cells.forEach((e, i) => {
    const s = slots[i], r = Math.floor(s / (C - 1)), c = s % (C - 1) + 1;
    move(e, X(c) + 26, Y(r) + 18, cue(2, .2), 1.4);
    recolor(e, s < train ? 'c2' : 'c3', cue(3));
  });
  const sh = chip(800, Y(R) + 40, 'перемешали 127 000 векторов', { size: 28 });
  pop(sh, cue(2, .4)); hide(sh, cue(3));
  const a = chip(560, Y(R) + 40, 'обучение: 64 000 = 1000 × 64', { size: 28, class: 'c2' });
  const b = chip(1150, Y(R) + 40, 'отложено: 63 000', { size: 28, class: 'c3' });
  pop(a, cue(3, .4)); pop(b, cue(3, .8));
});

scene('dead', () => {
  const R = 8, C = 16, X = c => 300 + c * 62, Y = r => 160 + r * 58;
  const n = R * C, cells = [], weight = [];
  for (let i = 0; i < n; i++) weight.push(random() < .2 ? 0 : .3 + random());
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) cells.push(rect(X(c), Y(r), 50, 46, { rx: 6, class: 'paper' }));
  const glow = cells.map((_, i) => { const g = rect(X(i % C), Y(Math.floor(i / C)), 50, 46, { rx: 6, class: 'fill c1', stroke: 'none' }); g.setAttribute('opacity', 0); return g; });
  const frames = [];
  for (let f = 0; f < 40; f++) {
    const lit = new Set();
    while (lit.size < 8) { const i = Math.floor(random() * n); if (weight[i] > 0 && random() < weight[i]) lit.add(i); }
    frames.push(lit);
  }
  text(800, 110, 'латенты словаря (показано 128 из 2048)', { size: 28 });
  const c1 = cue(1), c2 = cue(2);
  clock(t => {
    const lit = t >= c1 && t < c2 ? frames[Math.floor((t - c1) / .18) % 40] : null;
    glow.forEach((g, i) => g.setAttribute('opacity', lit && lit.has(i) ? 1 : 0));
  });
  const cnt = label(800, 660, 'шаг обучения # из 1000', { size: 28 });
  show(cnt, cue(1)); count(cnt, 500, 1000, cue(1), Math.max(1, c2 - c1 - .3), 0);
  cells.forEach((e, i) => {
    if (weight[i] !== 0) return;
    const m = rect(X(i % C), Y(Math.floor(i / C)), 50, 46, { rx: 6, class: 'fill bad', stroke: 'none', 'fill-opacity': .45 });
    show(m, cue(2));
  });
  const dl = chip(800, 720, 'ни разу не вошёл в Top-K за 32 000 векторов → мёртвый', { size: 26, class: 'bad' });
  pop(dl, cue(2, .4));
  hide(cnt, cue(3)); hide(dl, cue(3));
  const loop = box(800, 700, 820, 0, 'нет активации → нет градиента → веса не меняются → снова нет активации', { size: 28, class: 'bad' });
  show(loop, cue(3, .4));
});
