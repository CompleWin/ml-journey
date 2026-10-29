// МНК по гистограмме спектра layer4.1.conv2 (512 собственных чисел) из прогона ноутбука
const X20 = [-9.992, -8.966, -8.47, -8.14, -7.892, -7.694, -7.529, -7.387, -7.262, -7.152, -6.962, -6.436];
const Y20 = [8.672, 7.33, 7.16, 7.0, 6.809, 6.503, 6.216, 5.368, 4.27, 3.864, 3.171, 3.171];
const X200 = [-11.63, -10.98, -10.59, -10.3, -10.09, -9.906, -9.754, -9.622, -9.505, -9.401, -9.306, -9.22, -9.141, -9.067, -8.998, -8.934, -8.874, -8.817, -8.763, -8.712, -8.663, -8.617, -8.573, -8.53, -8.49, -8.451, -8.413, -8.377, -8.342, -8.308, -8.275, -8.244, -8.213, -8.183, -8.154, -8.126, -8.099, -8.072, -8.046, -8.021, -7.996, -7.972, -7.949, -7.926, -7.903, -7.881, -7.86, -7.839, -7.818, -7.798, -7.778, -7.759, -7.74, -7.721, -7.703, -7.685, -7.667, -7.65, -7.633, -7.616, -7.6, -7.583, -7.568, -7.552, -7.536, -7.521, -7.506, -7.491, -7.477, -7.462, -7.434, -7.42, -7.407, -7.393, -7.38, -7.367, -7.329, -7.316, -7.292, -7.257, -7.168, -7.106, -6.941, -6.413];
const Y200 = [9.962, 9.187, 8.806, 8.469, 8.307, 7.959, 7.872, 7.872, 7.553, 7.553, 7.671, 7.42, 7.42, 7.42, 7.42, 7.083, 7.265, 7.083, 7.265, 7.083, 7.42, 6.86, 7.265, 7.083, 7.265, 6.86, 7.265, 6.86, 7.265, 7.265, 7.083, 6.572, 7.265, 7.083, 6.572, 7.265, 6.86, 7.083, 6.86, 7.083, 7.083, 6.86, 6.572, 6.167, 7.083, 6.86, 7.083, 6.86, 6.86, 6.167, 6.86, 6.167, 6.86, 6.167, 6.86, 6.572, 6.167, 6.86, 5.474, 6.167, 6.86, 5.474, 6.167, 6.572, 6.167, 6.167, 6.167, 5.474, 5.474, 6.572, 5.474, 5.474, 5.474, 6.167, 5.474, 5.474, 6.167, 5.474, 5.474, 5.474, 5.474, 5.474, 5.474, 5.474];
const FIT = { 20: [-1.69155, -7.4393], 200: [-0.881425, -0.472767] };
const SX = x => 140 + 220 * (x + 12), SY = y => 760 - 64 * (y - 2);

function axes() {
  line(120, 760, 1480, 760, { class: 'ink' });
  line(120, 760, 120, SY(10.5), { class: 'ink' });
  [-12, -11, -10, -9, -8, -7, -6].forEach(x => { line(SX(x), 760, SX(x), 772, { class: 'ink' }); text(SX(x), 806, String(x).replace('-', '−'), { size: 26 }); });
  [2, 4, 6, 8, 10].forEach(y => { line(108, SY(y), 120, SY(y), { class: 'ink' }); text(84, SY(y), String(y), { size: 26 }); });
  text(1545, 806, 'ln λ', { size: 28 });
  text(190, 195, 'ln ρ', { size: 28 });
}

const fitLine = (k, cls) => { const [a, b] = FIT[k]; const x0 = k === 20 ? -10.2 : -11.8, x1 = -6.3; return line(SX(x0), SY(a * x0 + b), SX(x1), SY(a * x1 + b), { class: cls, 'stroke-width': 4 }); };

scene('floor', () => {
  axes();
  const g20 = group(0, 0);
  X20.forEach((x, i) => circle(SX(x), SY(Y20[i]), 10, { class: 'fill c0', stroke: 'none', parent: g20 }));
  show(g20, cue(1));
  const f20 = fitLine(20, 'c0');
  draw(f20, cue(1) + .6, .8);
  const l20 = label(1150, 300, 'bins = 20: α = 1,69', { class: 'c0' });
  show(l20, cue(1) + 1);
  [g20, f20, l20].forEach(e => hide(e, cue(2), .5));
  const g200 = group(0, 0);
  X200.forEach((x, i) => circle(SX(x), SY(Y200[i]), 8, { class: 'fill c1', stroke: 'none', parent: g200 }));
  show(g200, cue(2) + .4, .6);
  show(label(1150, 300, 'bins = 200', { class: 'c1' }), cue(2) + .6);
  show(label(1150, 360, 'пустые бины выброшены: ln 0 не существует', {}), cue(3));
  const fl = group(0, 0);
  [[5.474, 'по 1 числу', 1515], [6.167, 'по 2', 1515], [6.572, 'по 3', 1455], [6.86, 'по 4', 1545]].forEach(([y, s, x]) => {
    line(SX(-8.2), SY(y), SX(-6.3), SY(y), { class: 'hl', 'stroke-width': 18, opacity: .22, 'stroke-linecap': 'round', parent: fl });
    text(x, SY(y), s, { size: 24, class: 'hl', parent: fl });
  });
  show(fl, cue(4));
  draw(fitLine(200, 'c1'), cue(5), .8);
  show(label(560, 560, 'α = 0,88: прямая положе', { class: 'c1' }), cue(5) + .6);
});

// логарифмические бины [1,2], [2,4], [4,8] для закона λ^(−3): счётчик падает в 4 раза, плотность — в 8
scene('logbins', () => {
  const X = l => 90 + 82 * (l - 1), B = 700;
  line(70, B, 690, B, { class: 'ink' });
  [1, 2, 4, 8].forEach(l => { line(X(l), B, X(l), B + 12, { class: 'ink' }); text(X(l), B + 44, String(l), { size: 26 }); });
  text(710, B + 44, 'λ', { size: 30 });
  const bins = [[1, 2, 'ширина 1'], [2, 4, 'ширина 2'], [4, 8, 'ширина 4']];
  bins.forEach(([a, b, s]) => { rect(X(a), 320, X(b) - X(a), B - 320, { class: 'soft', 'stroke-width': 2 }); text((X(a) + X(b)) / 2, 296, s, { size: 24 }); });
  let d = '';
  for (let i = 0; i <= 140; i++) { const l = 1 + 7 * i / 140; d += (i ? 'L' : 'M') + X(l).toFixed(1) + ',' + (B - 360 * l ** -3).toFixed(1); }
  path(d, { class: 'c1', 'stroke-width': 4 });
  text(400, 150, 'плотность λ^(−3): ÷ 8 на каждом шаге', { size: 26, class: 'c1' });
  const cnt = [300, 75, 18.75], per = [300, 37.5, 4.69];
  const gs = bins.map(() => group(0, 0));
  const bars = bins.map(([a, b], k) => rect(X(a) + 4, B - cnt[k], X(b) - X(a) - 8, cnt[k], { class: 'fill c0', opacity: .45, stroke: 'none', parent: gs[k] }));
  gs.forEach((g, k) => show(g, cue(1) + k * .2));
  const lb1 = label(400, 205, 'счётчик в бине: ÷ 4 на каждом шаге', { class: 'c0' });
  show(lb1, cue(1) + .5);
  show(label(400, 820, 'наклон 1 − α вместо −α', { class: 'hl' }), cue(2));
  bars.forEach((e, k) => { set(e, 'y', B - per[k], cue(3), .9); set(e, 'height', per[k], cue(3), .9); });
  hide(lb1, cue(3), .3);
  show(label(400, 205, 'поделили на ширину: снова ÷ 8', { class: 'c0' }), cue(3) + .5);
});

scene('logcount', () => {
  show(text(800, 140, 'МНК предполагает: ошибки точек независимы и с одинаковым разбросом', { size: 30 }), cue(1));
  const ruler = (x, lo, title, a, b, jump) => {
    const g = group(0, 0);
    const Y = v => 690 - 420 * (v - lo);
    line(x, Y(lo), x, Y(lo + 1), { class: 'ink', parent: g });
    for (let k = 0; k <= 10; k++) line(x - (k % 5 ? 8 : 16), Y(lo + k / 10), x, Y(lo + k / 10), { class: 'ink', parent: g });
    text(x - 60, Y(lo), String(lo).replace('.', ','), { size: 24, parent: g });
    text(x - 60, Y(lo + 1), String(lo + 1).replace('.', ','), { size: 24, parent: g });
    text(x, 225, title, { size: 30, parent: g });
    circle(x, Y(a), 11, { class: 'fill c0', stroke: 'none', parent: g });
    circle(x, Y(b), 11, { class: 'fill hl', stroke: 'none', parent: g });
    arrow(x + 40, Y(a), x + 40, Y(b) + (b - a > .1 ? 10 : 0), { class: 'hl', 'stroke-width': 4, parent: g });
    label(x + 170, (Y(a) + Y(b)) / 2, jump, { class: 'hl', parent: g });
    return g;
  };
  show(ruler(420, 0, 'ln 1 → ln 2', 0, Math.log(2), 'скачок 0,69'), cue(2));
  show(ruler(1080, 4.2, 'ln 100 → ln 101', Math.log(100), Math.log(101), 'всего 0,01'), cue(2) + .8);
  show(label(800, 770, 'в хвосте счётчики маленькие — разброс огромный', { class: 'hl' }), cue(3));
  show(label(800, 830, 'точки гистограммы — наша группировка, а не независимые наблюдения'), cue(4));
});
