// p = n = 1000: дисперсии вдоль случайных направлений, ошибки элементов, сплюснутый эллипсоид, след
// данные из прогона ноутбука (та же матрица, что дала λmax = 4,02)
const RAND = [1.1, 1.01, 0.969, 1.02, 0.996, 0.959, 0.969, 1.02, 1.01, 1.04, 1.05, 0.99];
const Q = [0.000378, 0.00329, 0.00946, 0.0188, 0.0308, 0.0466, 0.0652, 0.0876, 0.111, 0.14, 0.171, 0.207, 0.243, 0.287, 0.333, 0.381, 0.437, 0.492, 0.551, 0.62, 0.686, 0.763, 0.839, 0.923, 1.0, 1.11, 1.2, 1.31, 1.43, 1.54, 1.67, 1.81, 1.96, 2.13, 2.3, 2.5, 2.7, 2.96, 3.25, 3.64];
const DIAG = ['1,05', '0,99', '1,03', '1,06', '0,97', '1,04', '0,99', '1,06', '1,01', '1,01', '1,03', '0,92'];
const B = 760, K = 120;

function prng(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

scene('dirs', () => {
  line(110, B, 1440, B, { class: 'ink' });
  line(110, B, 110, B - 4.4 * K, { class: 'ink' });
  for (let v = 0; v <= 4; v++) { line(100, B - v * K, 110, B - v * K, { class: 'ink' }); text(80, B - v * K, String(v), { size: 26 }); }
  line(110, B - K, 1440, B - K, { class: 'soft', 'stroke-dasharray': '10 8' });
  label(1117, B - K - 30, 'истина: 1', { class: 'soft' });
  const bars = RAND.map((v, k) => line(220 + k * 70, B, 220 + k * 70, B - v * K, { class: 'c0', 'stroke-width': 44, 'stroke-linecap': 'butt' }));
  draw(bars[0], cue(1), .6);
  show(label(420, 560, 'заранее выбранное направление', { class: 'c0' }), cue(1) + .4);
  bars.slice(1).forEach((b, k) => draw(b, cue(2) + k * .08, .5));
  show(text(605, B + 40, '12 случайных направлений: всё около 1', { size: 28 }), cue(2) + .6);
  const pca = line(1250, B, 1250, B - 4.02 * K, { class: 'hl', 'stroke-width': 56, 'stroke-linecap': 'butt' });
  draw(pca, cue(3), 2.4, 'out');
  show(text(1250, B + 40, 'направление PCA', { size: 28, class: 'hl' }), cue(3) + .3);
  show(label(1180, 170, 'максимум по всем направлениям', { class: 'hl' }), cue(3) + .6);
  pop(chip(1250, B - 4.02 * K - 30, '4,02'), cue(4));
  show(label(1180, 112, 'переобучение на шум', { class: 'hl' }), cue(4) + .4);
});

scene('errs', () => {
  const r = prng(21);
  const g = group(0, 0);
  for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) {
    const z = (r() - .5) * 2;
    rect(120 + j * 36, 200 + i * 36, 32, 32, { class: 'fill ' + (z > 0 ? 'c0' : 'c1'), stroke: 'none', opacity: (.15 + .6 * Math.abs(z)).toFixed(2), rx: 3, parent: g });
  }
  text(372, 160, 'ошибки элементов: Σ̂ − I', { size: 30 });
  const one = rect(120 + 5 * 36 - 3, 200 + 3 * 36 - 3, 38, 38, { class: 'hl', 'stroke-width': 5 });
  show(one, cue(1)); pulse(one, cue(1) + .3);
  show(label(372, 750, 'каждая ≈ ±1/√n ≈ ±0,03', { class: 'hl' }), cue(1) + .4);
  const cnt = label(372, 812, 'элементов ≈ p²/2 = #', { class: 'c0' });
  show(cnt, cue(2)); count(cnt, 0, 500000, cue(2), 1.4, 0);
  line(1080, B, 1320, B, { class: 'ink' });
  const bar = line(1200, B, 1200, B - 110, { class: 'hl', 'stroke-width': 80, 'stroke-linecap': 'butt' });
  show(text(1200, B + 40, 'λmax', { size: 30 }), 0);
  set(bar, 'y2', B - 4.02 * 110, cue(3) + .6, 2, 'out');
  const fl = group(0, 0);
  [260, 380, 500, 620].forEach((y, k) => arrow(640, y, 1140, B - 260 + k * 30, { class: 'soft', 'stroke-width': 3, bend: .1, parent: fl }));
  show(fl, cue(3));
  show(label(900, 260, 'ошибки складываются', { class: 'hl' }), cue(3) + .3);
  const v = label(1200, B - 4.02 * 110 - 36, 'λmax: 1 → 4,02', { class: 'hl' });
  show(v, cue(3) + 2.4);
});

scene('ball', () => {
  const C = [800, 470];
  const g = group(C[0], C[1]);
  const fill = el('ellipse', { cx: 0, cy: 0, rx: 160, ry: 160, class: 'fill c0', opacity: .15, stroke: 'none', parent: g });
  const ol = el('ellipse', { cx: 0, cy: 0, rx: 160, ry: 160, class: 'c0', 'stroke-width': 4, fill: 'none', parent: g });
  show(g, cue(1));
  const l1 = label(800, 720, 'шар: все полуоси 1', { class: 'c0' });
  show(l1, cue(1) + .3);
  hide(l1, cue(2), .3);
  [fill, ol].forEach(e => { set(e, 'rx', 320, cue(2), 1.2); set(e, 'ry', 16, cue(2), 1.2); });
  show(label(800, 600, 'сплюснутый эллипсоид', { class: 'c0' }), cue(2) + 1);
  const ax = group(0, 0);
  arrow(C[0], C[1], C[0] + 318, C[1], { class: 'hl', 'stroke-width': 5, parent: ax });
  label(C[0] + 200, C[1] - 50, '√4 = 2', { class: 'hl', parent: ax });
  label(C[0] - 150, C[1] - 60, 'другие полуоси ≈ 0', { class: 'hl', parent: ax });
  show(ax, cue(3));
});

scene('trace', () => {
  const old = group(0, 0);
  el('ellipse', { cx: 800, cy: 470, rx: 320, ry: 16, class: 'fill c0', opacity: .15, stroke: 'none', parent: old });
  el('ellipse', { cx: 800, cy: 470, rx: 320, ry: 16, class: 'c0', 'stroke-width': 4, fill: 'none', parent: old });
  label(800, 600, 'сплюснутый эллипсоид', { class: 'c0', parent: old });
  arrow(800, 470, 1118, 470, { class: 'hl', 'stroke-width': 5, parent: old });
  label(1000, 420, '√4 = 2', { class: 'hl', parent: old });
  label(650, 410, 'другие полуоси ≈ 0', { class: 'hl', parent: old });
  hide(old, .1, .5);
  const KB = 110;
  const bars = group(0, 0);
  line(140, B, 1440, B, { class: 'ink', parent: bars });
  Q.forEach((v, k) => line(170 + k * 32, B, 170 + k * 32, B - v * KB, { class: 'c0', 'stroke-width': 24, 'stroke-linecap': 'butt', parent: bars }));
  line(140, B - KB, 1440, B - KB, { class: 'c2', 'stroke-width': 4, 'stroke-dasharray': '12 8', parent: bars });
  label(260, B - KB - 34, 'среднее ≈ 1', { class: 'c2', parent: bars });
  text(790, B + 40, '40 собственных чисел по возрастанию', { size: 28, parent: bars });
  show(bars, .6);
  show(tex(800, 120, '\\textstyle\\sum_i \\lambda_i = \\mathrm{tr}\\,\\hat\\Sigma = \\sum_i \\hat\\Sigma_{ii}', { size: 40 }), cue(1));
  const dg = group(0, 0);
  DIAG.forEach((s, k) => chip(275 + k * 95, 225, s, { parent: dg }));
  label(800, 285, 'диагональ Σ̂: дисперсии признаков, все около 1', { parent: dg });
  show(dg, cue(2));
  const ghost = group(0, 0);
  Q.forEach((v, k) => rect(170 + k * 32 - 12, B - KB, 24, KB, { class: 'soft', 'stroke-width': 2, 'stroke-dasharray': '4 4', parent: ghost }));
  show(ghost, cue(3));
  show(label(1340, 330, 'завышено почти до 4', { class: 'hl' }), cue(3) + .4);
  show(label(330, 702, 'занижено почти до 0', { class: 'hl' }), cue(3) + .6);
});
