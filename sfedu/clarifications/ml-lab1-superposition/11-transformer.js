// Part 11: the residual stream, a polysemantic neuron, the sparse autoencoder, Top-K.

const DEG = Math.PI / 180;
function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

scene('stream', () => {
  const Y = 560, LX = i => 230 + i * 220;
  line(90, Y, 1510, Y, { class: 'c0', 'stroke-width': 16, opacity: .35 });
  text(150, Y + 60, 'residual stream', { size: 26, class: 'c0' });
  for (let i = 0; i < 6; i++) {
    const g = group(LX(i), 330);
    rect(-85, -90, 170, 200, { rx: 14, class: 'paper', parent: g });
    text(0, -60, 'слой ' + i, { size: 26, parent: g });
    box(0, -5, 140, 46, 'Attention', { size: 22, parent: g });
    box(0, 60, 140, 46, 'MLP', { size: 22, parent: g });
    line(-40, 110, -40, Y - 330 - 10, { class: 'soft', parent: g, 'stroke-width': 2 });
    line(40, 110, 40, Y - 330 - 10, { class: 'soft', parent: g, 'stroke-width': 2 });
  }
  const tok = group(110, Y);
  for (let k = 0; k < 5; k++) rect(-50 + k * 20, -18, 16, 36, { class: 'fill c1', stroke: 'none', parent: tok });
  show(tok, cue(1));
  move(tok, 1450, Y, cue(1, .3), 9, 'lin');
  const rd = arrow(LX(1) - 40, Y - 20, LX(1) - 40, 450, { class: 'c2', 'stroke-width': 5 });
  const wr = arrow(LX(1) + 40, 450, LX(1) + 40, Y - 20, { class: 'c1', 'stroke-width': 5 });
  draw(rd, cue(2)); draw(wr, cue(2, .6));
  const rl = label(LX(1) - 40, 690, 'читает', { size: 26, class: 'c2' });
  const wl = label(LX(1) + 70, 640, '+ добавка', { size: 26, class: 'c1' });
  show(rl, cue(2, .2)); show(wl, cue(2, .8));
  const f = tex(800, 120, 'x_l = x_{l-1} + \\mathrm{Attn}(x_{l-1}) + \\mathrm{MLP}(x_{l-1})');
  show(f, cue(3));
  const hk = arrow(LX(3) + 110, Y + 20, LX(3) + 110, 700, { class: 'c3', 'stroke-width': 5 });
  draw(hk, cue(3, .8));
  const hl = label(LX(3) + 110, 740, 'перехват после слоя 3', { size: 28, class: 'c3' });
  show(hl, cue(3, 1));
});

scene('poly', () => {
  const O = [180, 600], L = 380;
  arrow(O[0], O[1], O[0] + 760, O[1], { class: 'c3', 'stroke-width': 7 });
  label(O[0] + 790, O[1] + 45, 'ось нейрона eₖ', { size: 28, class: 'c3' });
  const feats = [['Юлий Цезарь', 52, 'c0'], ['def __init__', 30, 'c2'], ['кимчи', 72, 'c1']];
  feats.forEach(([s, a, cls], i) => {
    const tx = O[0] + L * Math.cos(a * DEG), ty = O[1] - L * Math.sin(a * DEG);
    const ar = arrow(O[0], O[1], tx, ty, { class: cls, 'stroke-width': 5 });
    const lb = label(O[0] + (L + 60) * Math.cos(a * DEG) + 30, O[1] - (L + 60) * Math.sin(a * DEG), s, { size: 26, class: cls });
    draw(ar, cue(1, i * .4)); show(lb, cue(1, i * .4 + .3));
    const drop = line(tx, ty, tx, O[1], { class: cls, 'stroke-dasharray': '6 6', 'stroke-width': 2 });
    const seg = line(O[0], O[1] + 14 + i * 12, tx, O[1] + 14 + i * 12, { class: cls, 'stroke-width': 7 });
    draw(drop, cue(2, i * .3)); draw(seg, cue(2, i * .3 + .3));
  });
  const nl = label(560, 720, 'нейрон k горит на всех трёх', { size: 28, class: 'c3' });
  show(nl, cue(2, 1.2));
  const an = group(0, 0);
  rect(1100, 250, 90, 70, { class: 'fill bad', stroke: 'none', parent: an });
  rect(1100, 380, 90, 70, { class: 'fill good', stroke: 'none', parent: an });
  box(1390, 350, 150, 80, 'датчик', { size: 26, parent: an });
  arrow(1200, 285, 1310, 340, { class: 'soft', parent: an });
  arrow(1200, 415, 1310, 360, { class: 'soft', parent: an });
  text(1390, 450, 'одинаковый отклик', { size: 24, parent: an });
  box(1290, 560, 420, 0, 'нужен правильный базис — его даёт SAE', { size: 26, class: 'c2', parent: an });
  show(an, cue(3));
});

scene('sae', () => {
  const col = (x, n, cls) => { const g = group(x, 0); for (let i = 0; i < n; i++) rect(-18, 260 + i * 24, 36, 20, { class: cls || 'paper', parent: g }); return g; };
  col(140, 12);
  text(140, 230, 'x: 512', { size: 26 });
  const enc = path('M200,270 L470,170 L470,630 L200,550 Z', { class: 'c0', 'stroke-width': 3 });
  const el = text(335, 410, 'энкодер', { size: 26, class: 'c0' });
  draw(enc, cue(1)); show(el, cue(1, .3));
  const code = group(0, 0);
  for (let r = 0; r < 18; r++) for (let c = 0; c < 4; c++) rect(520 + c * 30, 150 + r * 27, 24, 22, { class: 'paper', parent: code });
  text(580, 120, 'код: 2048', { size: 26, parent: code });
  show(code, cue(1, .5));
  const lit = [[3, 1], [9, 3], [14, 0]].map(([r, c]) => rect(520 + c * 30, 150 + r * 27, 24, 22, { class: 'fill c1', stroke: 'none' }));
  lit.forEach((e, i) => pop(e, cue(2, i * .2)));
  const kl = label(580, 680, 'включены K = 32', { size: 28, class: 'c1' });
  show(kl, cue(2, .6));
  const dec = path('M690,170 L960,270 L960,550 L690,630 Z', { class: 'c2', 'stroke-width': 3 });
  const dl = text(825, 410, 'декодер', { size: 26, class: 'c2' });
  draw(dec, cue(3)); show(dl, cue(3, .3));
  const xh = col(1020, 12, 'paper');
  const xl = text(1020, 230, 'x̂: 512', { size: 26 });
  show(xh, cue(3, .5)); show(xl, cue(3, .5));
  const f = tex(1320, 420, '\\hat x = \\sum_{i} f_i\\, d_i + b_{dec}');
  show(f, cue(3, .8));
  const fl = label(1320, 510, 'сумма 32 направлений словаря', { size: 26, class: 'c2' });
  show(fl, cue(3, 1.1));
});

scene('topk', () => {
  const base = 470, K = 8, xs = i => 160 + i * 32;
  const vals = []; for (let i = 0; i < 40; i++) vals.push(gauss());
  const order = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, K).map(p => p[1]);
  line(130, base, 1460, base, { 'stroke-width': 2 });
  text(800, 110, 'предактивации латентов (40 из 2048)', { size: 28 });
  vals.forEach((v, i) => {
    const h = Math.abs(v) * 120, top = order.includes(i);
    const b = v >= 0 ? rect(xs(i), base - h, 24, h, { class: 'fill c0', stroke: 'none' }) : rect(xs(i), base, 24, h, { class: 'fill c0', stroke: 'none' });
    show(b, cue(1, i * .02));
    if (top) { recolor(b, 'c1', cue(2)); pulse(b, cue(2, .2)); }
    else { set(b, 'height', 0, cue(3), .8); if (v >= 0) set(b, 'y', base, cue(3), .8); }
  });
  const c1 = chip(800, 690, 'torch.topk: K самых больших — значения и номера', { size: 26, class: 'c1' });
  pop(c1, cue(2, .4));
  const c2 = chip(800, 750, 'scatter_: разложить их в вектор из нулей', { size: 26, class: 'c2' });
  pop(c2, cue(3, .4));
});
