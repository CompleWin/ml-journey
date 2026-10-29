// Part 5: what a language model does, tokens, the embedding table, logits, a training step.

const PROMPT = 'In the middle of the room there was a large table';

scene('predict', () => {
  const p = text(160, 150, PROMPT, { size: 34, 'text-anchor': 'start' });
  show(p, cue(1));
  const m = box(800, 320, 440, 110, 'языковая модель', { size: 34 });
  const a1 = arrow(600, 190, 760, 262, { class: 'soft', 'stroke-width': 4 });
  draw(a1, cue(1, .6));
  const cands = [[' with', 1.0], [' and', .62], ['.', .45], [',', .33], [' in', .2], [' that', .12]];
  const bars = group(0, 0);
  cands.forEach(([s, v], i) => {
    const y = 470 + i * 52;
    label(560, y, '«' + s.replace(' ', '␣') + '»', { size: 26, parent: bars });
    rect(640, y - 18, v * 520, 36, { class: 'fill ' + (i === 0 ? 'c1' : 'c0'), stroke: 'none', parent: bars });
  });
  text(900, 430, 'вероятность следующего токена', { size: 26, class: 'soft', parent: bars });
  const a2 = arrow(800, 378, 800, 418, { class: 'soft', 'stroke-width': 4 });
  draw(a2, cue(2)); show(bars, cue(2, .3));
  const w = chip(1260, 470, '␣with', { size: 30, class: 'c1' });
  pop(w, cue(3));
  move(w, 1190, 150, cue(3, .3), 1.2);
  const again = arrow(1290, 175, 1030, 310, { class: 'c1', bend: -.3, 'stroke-width': 4 });
  draw(again, cue(3, 1.6));
  const al = label(1330, 300, 'и снова', { size: 28, class: 'c1' });
  show(al, cue(3, 1.9));
});

scene('tokens', () => {
  text(800, 170, PROMPT + ' with', { size: 34 });
  const toks = ['In', '␣the', '␣middle', '␣of', '␣the', '␣room', '␣there', '␣was', '␣a', '␣large', '␣table', '␣with'];
  const chips = toks.map((s, i) => {
    const x = 270 + (i % 6) * 212, y = i < 6 ? 340 : 470;
    const c = chip(x, y, s, { size: 30 });
    pop(c, cue(1, i * .15));
    return c;
  });
  recolor(chips[10], 'c1', cue(1, 2));
  pulse(chips[10], cue(1, 2.2));
  const tl = label(270 + 4 * 212, 545, 'пробел приклеен к слову', { size: 26, class: 'c1' });
  show(tl, cue(1, 2.3));
  const n = chip(800, 680, 'словарь Pythia: 50 277 токенов, у каждого свой номер', { size: 30, class: 'c0' });
  pop(n, cue(2));
});

function table() {   // the embedding matrix drawn as rows
  const g = group(0, 0);
  rect(250, 150, 400, 540, { class: 'paper', parent: g });
  for (let i = 1; i < 15; i++) line(250, 150 + i * 36, 650, 150 + i * 36, { class: 'soft', 'stroke-width': 1, parent: g });
  text(450, 85, 'embed_in', { size: 32, parent: g });
  text(150, 420, '50 277 строк', { size: 26, parent: g });
  text(450, 128, '512 столбцов', { size: 24, parent: g });
  return g;
}

function strip(x, y, cls) {
  const g = group(x, y);
  const vals = [.6, -.3, .9, .1, -.7, .4, -.2, .8, -.5, .3];
  vals.forEach((v, i) => {
    rect(i * 52, -30, 46, 60, { rx: 4, class: 'paper', parent: g });
    rect(i * 52 + 4, v < 0 ? 0 : -v * 26, 38, Math.abs(v) * 26, { class: 'fill ' + cls, stroke: 'none', parent: g });
  });
  return g;
}

scene('lookup', () => {
  table();
  const c = chip(1050, 200, '␣table → номер t', { size: 30, class: 'c1' });
  const a = arrow(900, 230, 660, 420, { class: 'c1', 'stroke-width': 4 });
  const row = rect(250, 402, 400, 36, { class: 'fill c1', stroke: 'none', 'fill-opacity': .5 });
  pop(c, .3);
  draw(a, cue(1)); show(row, cue(1, .6));
  const s = strip(780, 420, 'c1');
  show(s, cue(2)); move(s, 820, 520, cue(2), 1);
  const sl = label(1080, 600, 'эмбеддинг: 512 чисел', { size: 30, class: 'c1' });
  show(sl, cue(2, .8));
});

scene('padding', () => {
  table();
  chip(1050, 200, '␣table → номер t', { size: 30, class: 'c1' });
  arrow(900, 230, 660, 420, { class: 'c1', 'stroke-width': 4 });
  rect(250, 402, 400, 36, { class: 'fill c1', stroke: 'none', 'fill-opacity': .5 });
  const s = strip(820, 520, 'c1');
  const sl = label(1080, 600, 'эмбеддинг: 512 чисел', { size: 30, class: 'c1' });
  hide(s, .2); hide(sl, .2);
  const ext = rect(250, 690, 400, 60, { class: 'fill soft', stroke: 'none', 'fill-opacity': .35 });
  show(ext, cue(1));
  const el = label(1050, 720, '+ 27 строк: 50 304 = 64 · 786', { size: 30 });
  show(el, cue(1, .4));
  const tc = chip(1050, 400, 'Tensor Cores любят размеры, кратные 64', { size: 26 });
  pop(tc, cue(1, 1));
  const cut = line(200, 690, 700, 690, { class: 'bad', 'stroke-width': 5, 'stroke-dasharray': '14 8' });
  draw(cut, cue(2));
  recolor(ext, 'bad', cue(2, .4));
  const cl = chip(1050, 520, 'W = W[:50277]', { size: 32, class: 'bad' });
  pop(cl, cue(2, .6));
});

scene('logits', () => {
  const C = [430, 560], deg = Math.PI / 180;
  const hA = 20, toks = [[' with', 32, 300], [' and', 62, 260], ['.', 98, 250], [' banana', 165, 240]];
  arrow(C[0], C[1], C[0] + 330 * Math.cos(hA * deg), C[1] - 330 * Math.sin(hA * deg), { class: 'c0', 'stroke-width': 7 });
  label(C[0] + 370 * Math.cos(hA * deg), C[1] - 370 * Math.sin(hA * deg) + 10, 'h', { size: 36, class: 'c0' });
  text(1180, 200, 'логит = ⟨h, w⟩', { size: 32 });
  line(1180, 240, 1180, 640, { 'stroke-width': 2 });
  const tips = [];
  toks.forEach(([s, a, L], i) => {
    const tx = C[0] + L * Math.cos(a * deg), ty = C[1] - L * Math.sin(a * deg);
    const ar = arrow(C[0], C[1], tx, ty, { class: 'soft', 'stroke-width': 4 });
    const lb = label(C[0] + (L + 50) * Math.cos(a * deg), C[1] - (L + 50) * Math.sin(a * deg), '«' + s.replace(' ', '␣') + '»', { size: 26 });
    draw(ar, cue(1, i * .4)); show(lb, cue(1, i * .4 + .2));
    const z = L * Math.cos((a - hA) * deg) / 300;
    const y = 290 + i * 95;
    const bl = label(850, y, '«' + s.replace(' ', '␣') + '»', { size: 26 });
    const bar = rect(z >= 0 ? 1180 : 1180 + z * 300, y - 20, Math.abs(z) * 300, 40, { class: 'fill ' + (z >= 0 ? 'c0' : 'c1'), stroke: 'none' });
    show(bl, cue(1, i * .4 + .2)); show(bar, cue(1, i * .4 + .3));
    tips.push([tx, ty, bar]);
  });
  const [tx, ty, bar0] = tips[0];
  const t = (tx - C[0]) * Math.cos(hA * deg) + (C[1] - ty) * Math.sin(hA * deg);
  const px = C[0] + t * Math.cos(hA * deg), py = C[1] - t * Math.sin(hA * deg);
  const drop = line(tx, ty, px, py, { class: 'c2', 'stroke-dasharray': '8 6', 'stroke-width': 3 });
  draw(drop, cue(2));
  pulse(bar0, cue(2, .4));
  const nl = label(1250, 720, 'смотрит туда же, куда h, — большой логит', { size: 28, class: 'c2' });
  show(nl, cue(2, .6));
});

scene('pushpull', () => {
  const C = [520, 540], deg = Math.PI / 180, hA = 15;
  const hx = Math.cos(hA * deg), hy = -Math.sin(hA * deg);
  arrow(C[0], C[1], C[0] + 360 * hx, C[1] + 360 * hy, { class: 'c0', 'stroke-width': 7 });
  label(C[0] + 400 * hx, C[1] + 400 * hy, 'h', { size: 36, class: 'c0' });
  const toks = [[' with', 60, 270, true, 0], [' and', 125, 260, false, .3], ['.', 200, 240, false, .15], [' of', 300, 250, false, .1]];
  toks.forEach(([s, a, L, good, p], i) => {
    const tx = C[0] + L * Math.cos(a * deg), ty = C[1] - L * Math.sin(a * deg);
    arrow(C[0], C[1], tx, ty, { class: good ? 'c2' : 'soft', 'stroke-width': 4 });
    label(C[0] + (L + 55) * Math.cos(a * deg), C[1] - (L + 55) * Math.sin(a * deg), '«' + s.replace(' ', '␣') + '»', { size: 26, class: good ? 'c2' : 'ink' });
    const k = good ? 150 : -400 * p;
    const push = arrow(tx, ty, tx + k * hx, ty + k * hy, { class: good ? 'c2' : 'c1', 'stroke-width': 6 });
    draw(push, cue(good ? 1 : 2, good ? 0 : (i - 1) * .3));
  });
  const g1 = label(1250, 240, 'правильный токен — к h', { size: 30, class: 'c2' });
  show(g1, cue(1, .3));
  const g2 = label(1250, 310, 'остальные — от h, с силой pₜ', { size: 30, class: 'c1' });
  show(g2, cue(2, .6));
  const f = tex(1250, 430, '\\frac{\\partial L}{\\partial w_t} = \\big(p_t - \\mathbb{1}[t = y]\\big)\\, h');
  show(f, cue(2, 1));
  const g3 = box(1250, 600, 520, 0, 'каждый толчок направлен вдоль h', { size: 32, class: 'c0' });
  show(g3, cue(3));
  for (const off of [-220, -110, 110]) {
    const nx = -hy, ny = hx;
    const l = line(C[0] + off * nx - 300 * hx, C[1] + off * ny - 300 * hy, C[0] + off * nx + 380 * hx, C[1] + off * ny + 380 * hy, { class: 'c0', 'stroke-dasharray': '6 10', 'stroke-width': 2 });
    show(l, cue(3, .4));
  }
});
