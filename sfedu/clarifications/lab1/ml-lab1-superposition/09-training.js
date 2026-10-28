// Part 9: training as descending a loss landscape; the learning rate; projection onto the unit ball.

const L = x => .0009 * (x - 950) * (x - 950) + 60;   // the loss over one parameter, in canvas units
const Y = x => 720 - L(x);

function valley() {
  line(120, 720, 1480, 720, { 'stroke-width': 2 });
  line(120, 720, 120, 70, { 'stroke-width': 2 });
  text(800, 765, 'параметр θ', { size: 28, class: 'soft' });
  text(190, 60, 'потеря L', { size: 28, class: 'soft' });
  let d = '';
  for (let x = 150; x <= 1450; x += 10) d += (d ? ' L' : 'M') + x + ',' + Y(x).toFixed(1);
  return path(d, { class: 'c0', 'stroke-width': 5 });
}

scene('landscape', () => {
  const c = chip(800, 150, 'параметры: W (400 чисел) и b (40 чисел)', { size: 30 });
  pop(c, cue(1));
  const v = valley();
  draw(v, cue(2), 1.5);
  const vl = label(1330, 230, 'потеря L', { size: 28, class: 'c0' });
  show(vl, cue(2, 1));
  const ball = circle(300, Y(300) - 20, 20, { class: 'fill c1', stroke: 'none' });
  pop(ball, cue(3));
  const goal = label(950, 560, 'низина: лучшие параметры', { size: 28, class: 'c2' });
  show(goal, cue(3, .6));
  const ga = arrow(950, 590, 950, 640, { class: 'c2', 'stroke-width': 4 });
  draw(ga, cue(3, .6));
});

scene('descent', () => {
  chip(800, 150, 'параметры: W (400 чисел) и b (40 чисел)', { size: 30 });
  valley();
  label(1330, 230, 'потеря L', { size: 28, class: 'c0' });
  const goal = label(950, 560, 'низина: лучшие параметры', { size: 28, class: 'c2' });
  const ga = arrow(950, 590, 950, 640, { class: 'c2', 'stroke-width': 4 });
  hide(goal, .2); hide(ga, .2);
  const ball = circle(300, Y(300) - 20, 20, { class: 'fill c1', stroke: 'none' });
  const s = .0018 * (300 - 950);
  const tan = line(160, Y(300) - 20 + (160 - 300) * s, 440, Y(300) - 20 + (440 - 300) * s, { class: 'c3', 'stroke-width': 4 });
  show(tan, cue(1));
  const g = arrow(300, Y(300) - 20, 230, Y(300) - 20 + (230 - 300) * s, { class: 'c3', 'stroke-width': 5 });
  draw(g, cue(1, .3));
  const gl = label(330, 200, 'градиент: вверх по склону', { size: 26, class: 'c3' });
  show(gl, cue(1, .6));
  hide(tan, cue(2)); hide(g, cue(2)); hide(gl, cue(2));
  let x = 300;
  const fm = tex(1150, 330, '\\theta \\leftarrow \\theta - \\eta\\, \\nabla L');
  show(fm, cue(2));
  for (let k = 0; k < 6; k++) {
    const nx = x - .45 * (x - 950);
    const tr = circle(x, Y(x) - 20, 7, { class: 'fill c1', stroke: 'none' });
    show(tr, cue(2, .4 + k * .7), .2);
    move(ball, nx, Y(nx) - 20, cue(2, .4 + k * .7), .6);
    x = nx;
  }
  const ok = label(1150, 420, 'маленькие шаги: спокойно вниз', { size: 26, class: 'c1' });
  show(ok, cue(2, 2));
  let z = 300;
  const big = circle(z, Y(z) - 20, 20, { class: 'fill bad', stroke: 'none' });
  pop(big, cue(3));
  for (let k = 0; k < 4; k++) {
    const nz = 950 - .71 * (z - 950);
    const hop = arrow(z, Y(z) - 30, nz, Y(nz) - 30, { class: 'bad', bend: -.25, 'stroke-width': 3 });
    draw(hop, cue(3, .3 + k * .8), .6);
    move(big, nz, Y(nz) - 20, cue(3, .3 + k * .8), .6);
    z = nz;
  }
  const bl = label(1150, 490, 'слишком большая η: скачет по склонам', { size: 26, class: 'bad' });
  show(bl, cue(3, .5));
});

scene('ballproj', () => {
  const C = [560, 470], R = 260, D = Math.PI / 180;
  circle(C[0], C[1], R, { class: 'c2', 'stroke-width': 3 });
  label(C[0], C[1] + R + 40, 'единичный шар: ‖w‖ ≤ 1', { size: 26, class: 'c2' });
  const P = (a, l) => [C[0] + l * R * Math.cos(a * D), C[1] - l * R * Math.sin(a * D)];
  const out = arrow(C[0], C[1], ...P(35, 1.35), { class: 'c1', 'stroke-width': 5, 'stroke-dasharray': '10 8' });
  draw(out, cue(1));
  const ol = label(...P(35, 1.55), 'после шага: 1.35', { size: 26, class: 'c1' });
  show(ol, cue(1, .3));
  const back = arrow(C[0], C[1], ...P(35, 1), { class: 'c0', 'stroke-width': 7 });
  draw(back, cue(1, 1.2));
  const pl = label(...P(5, 1.32), 'вернули на границу', { size: 26, class: 'c0' });
  show(pl, cue(1, 1.5));
  const f = tex(1220, 260, 'w_i \\leftarrow \\frac{w_i}{\\max(\\|w_i\\|,\\ 1)}');
  show(f, cue(2));
  const inner = arrow(C[0], C[1], ...P(150, .45), { class: 'c2', 'stroke-width': 6 });
  draw(inner, cue(2, .3));
  const il = label(...P(150, .8), 'короче 1 — не трогаем', { size: 26, class: 'c2' });
  show(il, cue(2, .6));
  const cl = chip(1220, 400, '.clamp(min=1.0)', { size: 28 });
  pop(cl, cue(2, .8));
  const off = group(C[0], C[1]);
  arrow(0, 0, R * .6 * Math.cos(250 * D), -R * .6 * Math.sin(250 * D), { class: 'c3', 'stroke-width': 6, parent: off });
  show(off, cue(3));
  scale(off, .12, cue(3, .5), 2.2);
  const offl = box(1220, 560, 520, 0, 'можно «выключить» признак: ‖wᵢ‖ → 0', { size: 28, class: 'c3' });
  show(offl, cue(3, .8));
});
