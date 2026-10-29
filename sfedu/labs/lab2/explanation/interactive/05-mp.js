// Задание 1: эксперимент, гистограммы режимов А и Б из прогона ноутбука, наложение закона МП
const H500 = [0.71, 0.958, 0.851, 0.745, 0.816, 0.71, 0.674, 0.603, 0.603, 0.568, 0.532, 0.532, 0.461, 0.568, 0.426, 0.39, 0.461, 0.319, 0.426, 0.39, 0.355, 0.319, 0.319, 0.319, 0.319, 0.284, 0.319, 0.248, 0.284, 0.284, 0.248, 0.213, 0.248, 0.213, 0.177, 0.213, 0.177, 0.142, 0.177, 0.142, 0.177, 0.106, 0.142, 0.071, 0.106, 0.142, 0.071, 0.071, 0.0355, 0.071];
const H2000 = [0.409, 0.444, 0.409, 0.418, 0.364, 0.355, 0.338, 0.302, 0.311, 0.284, 0.258, 0.284, 0.24, 0.213, 0.24, 0.213, 0.213, 0.204, 0.187, 0.178, 0.169, 0.195, 0.151, 0.16, 0.16, 0.142, 0.142, 0.124, 0.142, 0.124, 0.124, 0.115, 0.115, 0.107, 0.107, 0.0977, 0.0888, 0.0888, 0.0799, 0.0799, 0.0711, 0.0799, 0.0711, 0.0533, 0.0622, 0.0444, 0.0444, 0.0355, 0.0266, 0.0178];
const A = { H: H500, e0: 0.0859, e1: 2.9048, g: .5, lm: .0858, lp: 2.9142, vmax: 3.2, ky: 480, k: 1 };
const B = { H: H2000, e0: 0.1806, e1: 5.8093, g: 2, lm: .1716, lp: 5.8284, vmax: 6.2, ky: 900, k: 2 };
const HX0 = 140, HX1 = 1460, BASE = 720;

const P = parent => parent ? { parent } : {};
const fr = m => ({ X: v => HX0 + (HX1 - HX0) * v / m.vmax, Y: d => BASE - m.ky * d });

function axis(m, parent) {
  const f = fr(m), g = group(0, 0, P(parent));
  line(HX0 - 20, BASE, HX1 + 20, BASE, { class: 'ink', parent: g });
  for (let v = 0; v <= m.vmax; v++) {
    line(f.X(v), BASE, f.X(v), BASE + 12, { class: 'ink', parent: g });
    text(f.X(v), BASE + 44, String(v), { size: 28, parent: g });
  }
  text(HX1 + 30, BASE + 44, 'λ', { size: 32, parent: g });
  return g;
}

function bars(m, parent) {
  const f = fr(m), w = (m.e1 - m.e0) / m.H.length, px = f.X(w) - f.X(0);
  return m.H.map((h, i) => {
    const x = f.X(m.e0 + (i + .5) * w);
    return line(x, BASE, x, f.Y(h), { class: 'c0', 'stroke-width': px - 2, 'stroke-linecap': 'butt', opacity: .85, ...P(parent) });
  });
}

function curve(m, parent) {   // при γ > 1 кривая умножена на γ (поправка из следующей главы)
  const f = fr(m);
  let d = '';
  for (let i = 0; i <= 240; i++) {
    const l = m.lm + (m.lp - m.lm) * i / 240;
    const r = m.k * Math.sqrt(Math.max(0, (m.lp - l) * (l - m.lm))) / (2 * Math.PI * m.g * l);
    d += (i ? 'L' : 'M') + f.X(l).toFixed(1) + ',' + f.Y(r).toFixed(1);
  }
  return path(d, { class: 'c1', 'stroke-width': 5, ...P(parent) });
}

function edgeLines(m, parent) {
  const f = fr(m), g = group(0, 0, P(parent));
  [[m.lm, 'λ₋', -26], [m.lp, 'λ₊', 0]].forEach(([v, s, dx]) => {
    line(f.X(v), BASE, f.X(v), 290, { class: 'ink', 'stroke-dasharray': '12 10', parent: g });
    label(f.X(v) + dx, 262, s, { parent: g });
  });
  return g;
}

scene('exp', () => {
  hide(text(800, 450, 'задание 1: спектр чистого шума', { size: 40, class: 'soft' }), cue(1) - .4, .4);
  const b1 = group(230, 520);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++)
    rect(-120 + c * 30, -72 + r * 24, 26, 20, { class: 'fill ' + (random() < .5 ? 'c0' : 'c1'), stroke: 'none', opacity: (.15 + .75 * random()).toFixed(2), rx: 3, parent: b1 });
  text(0, 110, 'белый шум X, N(0, 1)', { size: 28, parent: b1 });
  text(0, 158, 'n = 1000 наблюдений', { size: 26, class: 'soft', parent: b1 });
  pop(b1, cue(1));
  pop(chip(230, 250, 'режим А: p = 500, γ = 0,5'), cue(2));
  pop(chip(230, 320, 'режим Б: p = 2000, γ = 2'), cue(3));
  const boxes = [[650, '\\hat\\Sigma = \\tfrac{1}{n}XX^T'], [1040, '\\lambda_1,\\,\\dots,\\,\\lambda_p']].map(([x, s]) => {
    const g = group(x, 520);
    rect(-130, -65, 260, 130, { class: 'c0', rx: 14, parent: g });
    tex(0, 0, s, { size: 36, parent: g });
    return g;
  });
  const b4 = group(1420, 520);
  [.71, .85, .6, .5, .4, .32, .22, .12].forEach((h, i) => line(-84 + i * 24, 60, -84 + i * 24, 60 - 150 * h, { class: 'c0', 'stroke-width': 20, 'stroke-linecap': 'butt', parent: b4 }));
  line(-100, 60, 100, 60, { class: 'ink', parent: b4 });
  text(0, 110, 'гистограмма', { size: 28, parent: b4 });
  const arrows = [[380, 512], [790, 905], [1180, 1290]].map(([a, b]) => arrow(a, 520, b, 520, { class: 'ink' }));
  const t = cue(4);
  draw(arrows[0], t, .5); pop(boxes[0], t + .4);
  draw(arrows[1], t + 1, .5); pop(boxes[1], t + 1.4);
  draw(arrows[2], t + 2, .5); pop(b4, t + 2.4);
  const tok = chip(380, 470, 'X');
  show(tok, t, .2);
  move(tok, 1290, 470, t + .1, 2.6, 'lin');
  hide(tok, t + 2.7, .3);
});

scene('hist', () => {
  const f = fr(A);
  axis(A);
  const sp = line(f.X(1), BASE, f.X(1), 250, { class: 'hl', 'stroke-width': 16, 'stroke-linecap': 'butt' });
  const spl = label(f.X(1) + 215, 240, 'ожидание: все λ ≈ 1', { class: 'hl' });
  hide(sp, cue(1), .4); hide(spl, cue(1), .4);
  bars(A).forEach((b, i) => draw(b, cue(1) + .2 + i * .03, .5));
  const ann = group(0, 0);
  [[A.e0, 'λmin = 0,0859', 40], [A.e1, 'λmax = 2,905', 0]].forEach(([v, s, dx]) => {
    line(f.X(v), BASE + 4, f.X(v), 786, { class: 'c0', parent: ann });
    label(f.X(v) + dx, 812, s, { class: 'c0', parent: ann });
  });
  show(ann, cue(2));
  const ratio = group(0, 0);
  line(f.X(1), BASE, f.X(1), 160, { class: 'soft', 'stroke-dasharray': '10 8', parent: ratio });
  label(f.X(1), 130, 'истинная дисперсия = 1', { parent: ratio });
  const l = arrow(f.X(1), 232, f.X(A.e0) + 6, 232, { class: 'hl', 'stroke-width': 4, parent: ratio });
  const r = arrow(f.X(1), 232, f.X(A.e1) - 6, 232, { class: 'hl', 'stroke-width': 4, parent: ratio });
  label((f.X(1) + f.X(A.e0)) / 2, 196, 'почти в 12 раз меньше', { class: 'hl', parent: ratio });
  label((f.X(1) + f.X(A.e1)) / 2, 196, 'почти в 3 раза больше', { class: 'hl', parent: ratio });
  show(ratio, cue(3));
});

scene('fit', () => {
  const ga = group(0, 0);
  axis(A, ga);
  bars(A, ga);
  const ann = group(0, 0);
  const f = fr(A);
  [[A.e0, 'λmin = 0,0859', 40], [A.e1, 'λmax = 2,905', 0]].forEach(([v, s, dx]) => {
    line(f.X(v), BASE + 4, f.X(v), 786, { class: 'c0', parent: ann });
    label(f.X(v) + dx, 812, s, { class: 'c0', parent: ann });
  });
  line(f.X(1), BASE, f.X(1), 160, { class: 'soft', 'stroke-dasharray': '10 8', parent: ann });
  label(f.X(1), 130, 'истинная дисперсия = 1', { parent: ann });
  arrow(f.X(1), 232, f.X(A.e0) + 6, 232, { class: 'hl', 'stroke-width': 4, parent: ann });
  arrow(f.X(1), 232, f.X(A.e1) - 6, 232, { class: 'hl', 'stroke-width': 4, parent: ann });
  label((f.X(1) + f.X(A.e0)) / 2, 196, 'почти в 12 раз меньше', { class: 'hl', parent: ann });
  label((f.X(1) + f.X(A.e1)) / 2, 196, 'почти в 3 раза больше', { class: 'hl', parent: ann });
  hide(ann, .2, .5);
  draw(curve(A, ga), cue(1), 1.4);
  show(edgeLines(A, ga), cue(2));
  hide(ga, cue(3), .5);
  const gb = group(0, 0);
  axis(B, gb);
  bars(B, gb);
  curve(B, gb);
  edgeLines(B, gb);
  show(gb, cue(3) + .5, .6);
  const fb = fr(B);
  const rg = group(0, 0);
  line(fb.X(A.lm), 205, fb.X(A.lp), 205, { class: 'soft', 'stroke-width': 10, parent: rg });
  label(fb.X(A.lp) + 80, 205, 'γ = 0,5', { parent: rg });
  line(fb.X(B.lm), 150, fb.X(B.lp), 150, { class: 'hl', 'stroke-width': 10, parent: rg });
  label(fb.X(B.lp) + 70, 150, 'γ = 2', { class: 'hl', parent: rg });
  show(rg, cue(4));
});
