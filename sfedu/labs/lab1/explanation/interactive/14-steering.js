// Part 14: calibrating the push by the mean length of x; what the hook sees with a KV cache.

scene('calib', () => {
  const O = [300, 620], S = 25, LX = 14.04 * S;
  const x = arrow(O[0], O[1], O[0] + LX, O[1], { class: 'c0', 'stroke-width': 8 });
  draw(x, cue(1));
  const xl = label(O[0] + LX / 2, O[1] + 45, '‖x‖ ≈ 14.04', { size: 30, class: 'c0' });
  show(xl, cue(1, .5));
  const src = chip(1180, 170, 'нейтральные тексты: 40 документов, слой 3', { size: 26 });
  pop(src, cue(1, .8));

  const ruler = group(0, 0);
  line(O[0] + 1.4 * S, 740, O[0] + 21.1 * S, 740, { 'stroke-width': 2, parent: ruler });
  for (let k = 0; k < 15; k++) {
    const a = (0.1 + 0.1 * k) * 14.04;
    line(O[0] + a * S, 730, O[0] + a * S, 750, { 'stroke-width': 2, parent: ruler });
  }
  text(O[0] + 1.4 * S, 780, '1.4', { size: 24, parent: ruler });
  text(O[0] + 21.1 * S, 780, '21.1', { size: 24, parent: ruler });
  text(O[0] + 11 * S, 700, 'сетка α: 0.1‖x‖ … 1.5‖x‖, 15 значений', { size: 26, parent: ruler });
  show(ruler, cue(2));

  const push = group(O[0] + LX, O[1]);
  arrow(0, 0, 0, -LX, { class: 'c1', 'stroke-width': 8, parent: push });
  pose(push, { s: .1 });
  show(push, cue(3));
  scale(push, 1.5, cue(3, .3), 3, 'lin');
  const read = label(O[0] + LX + 170, O[1] - 120, 'α = #', { size: 30, class: 'c1' });
  show(read, cue(3));
  count(read, 1.4, 21.1, cue(3, .3), 3, 1);
  const same = box(1180, 420, 560, 0, 'v единичный и у нейрона, и у признака: при одном α добавка одной длины', { size: 28, class: 'c1' });
  show(same, cue(3, 1.2));
});

scene('kvcache', () => {
  const box3 = box(800, 400, 360, 130, 'слой 3 + хук', { size: 32 });
  const cache = rect(1230, 330, 220, 140, { rx: 14, class: 'paper' });
  text(1340, 300, 'KV-кэш', { size: 28, class: 'c3' });
  const toks = [];
  for (let i = 0; i < 12; i++) {
    const c = chip(470 + i * 60, 170, 't', { size: 22, class: 'c0' });
    show(c, cue(1), .3);
    move(c, 470 + i * 60, 300, cue(1, .4), 1);
    hide(c, cue(1, 1.4), .3);
    toks.push(c);
  }
  const s1 = chip(800, 560, 'шаг 1: [1, 12, 512] — весь промпт', { size: 28, class: 'c0' });
  pop(s1, cue(1, 1.2));
  hide(s1, cue(2));
  const fill = rect(1240, 340, 200, 0, { class: 'fill c3', stroke: 'none', 'fill-opacity': .4 });
  set(fill, 'height', 60, cue(1, 1.4), .6);
  for (let k = 0; k < 3; k++) {
    const c = chip(800, 170, 't', { size: 22, class: 'c1' });
    show(c, cue(2, k * 1.1), .2);
    move(c, 800, 350, cue(2, k * 1.1 + .2), .6);
    hide(c, cue(2, k * 1.1 + .8), .2);
    set(fill, 'height', 60 + (k + 1) * 20, cue(2, k * 1.1 + .8), .3);
  }
  const s2 = chip(800, 560, 'шаги 2, 3, …: [1, 1, 512] — один новый токен', { size: 28, class: 'c1' });
  pop(s2, cue(2, .4));
  const sh = chip(330, 400, 'shift: (512,)', { size: 28, class: 'c2' });
  pop(sh, cue(3));
  const a = arrow(440, 400, 615, 400, { class: 'c2', 'stroke-width': 5 });
  draw(a, cue(3, .3));
  const br = label(800, 640, 'бродкастинг: прибавляется к каждому вектору любой формы', { size: 26, class: 'c2' });
  show(br, cue(3, .6));
  const out = label(800, 720, 'ноутбук: [(1, 12, 512), (1, 1, 512), (1, 1, 512), (1, 1, 512)]', { size: 24 });
  show(out, cue(3, 1.2));
});

scene('steerloop', () => {
  text(400, 60, '…a large table with', { size: 26, class: 'soft' });
  const toks = ['␣a', '␣table', '␣on', '␣which', '␣to', '␣sit', '␣and', '␣wait', '.', '⏎'];
  box(300, 470, 260, 110, 'слой 3', { size: 30 });
  arrow(300, 330, 300, 410, { class: 'soft', 'stroke-width': 3 });
  arrow(300, 530, 300, 610, { class: 'soft', 'stroke-width': 3 });
  text(300, 640, 'дальше слои 4, 5 → токен', { size: 22, class: 'soft' });
  const hk = chip(580, 470, '+ αv', { size: 30, class: 'c1' });
  const ha = arrow(530, 470, 435, 470, { class: 'c1', 'stroke-width': 4 });
  pop(hk, cue(1)); draw(ha, cue(1, .2));
  const rl = label(580, 400, 'хук подменяет выход', { size: 24, class: 'c1' });
  show(rl, cue(1, .4));
  const loop = path('M150,600 C40,600 40,300 150,300', { class: 'c3', 'stroke-width': 4 });
  draw(loop, cue(2));
  const cnt = label(400, 250, 'проход # из 25', { size: 28, class: 'c3' });
  show(cnt, cue(2));
  count(cnt, 1, 25, cue(2), 4, 0);
  toks.forEach((s, i) => {
    const c = chip(120 + (i % 5) * 140, 120 + Math.floor(i / 5) * 55, s, { size: 22, class: 'c0' });
    show(c, cue(2, .2 + i * .4), .2);
    pulse(hk, cue(2, .2 + i * .4), .3, 1.15);
  });
  const g = chip(400, 720, 'do_sample=False: самый вероятный токен', { size: 24, class: 'c2' });
  pop(g, cue(3));
  const f = chip(400, 780, 'finally: handle.remove()', { size: 24, class: 'c2' });
  pop(f, cue(3, .5));
});
