// Слепой тест на четырёх слоях ResNet-18: данные из прогона ноутбука
const L = [
  { name: 'layer1.0.conv1 (случайный)', H: [265, 132, 397, 265, 397, 530, 265, 397, 530, 265, 397, 397, 397, 397, 265, 265, 265, 265, 132, 265, 265, 397, 132, 265, 265, 132, 0, 132, 132, 265], e0: 0.00128073, e1: 0.00482149, edge: 0.00501901, note: 'всё левее λ₊' },
  { name: 'layer2.0.conv1 (штатный)', H: [825, 585, 413, 275, 241, 275, 206, 172, 138, 68.8, 138, 172, 103, 34.4, 103, 34.4, 68.8, 103, 34.4, 68.8, 68.8, 68.8, 68.8, 34.4, 34.4, 0, 0, 0, 34.4, 34.4], e0: 0.000156416, e1: 0.00697197, edge: 0.00374365, note: '18 чисел за λ₊' },
  { name: 'layer3.0.conv1 (коллапс)', H: [4110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16.2], e0: 0, e1: 0.00724966, edge: 9.09964e-05, note: '2 числа далеко справа' },
  { name: 'fc (выходной)', H: [223, 55.1, 42.7, 33.7, 23.8, 15.6, 7.39, 6.57, 3.29, 1.64, 1.64, 0.822, 0.822, 1.64, 0.822, 0, 0, 0, 0, 0, 0.822, 0, 0, 0, 0.822, 0, 0, 0, 0, 0.822], e0: 8.78529e-05, e1: 0.0713999, edge: 0.014199, note: 'хвост до 5 λ₊' },
];

scene('four', () => {
  const cards = [
    ['layer1.0.conv1', 'имитация необученного', 'веса заменены шумом N(0, σ²) с тем же σ'],
    ['layer2.0.conv1', 'штатный', 'без изменений'],
    ['layer3.0.conv1', 'испорчен', 'оставлены 2 сингулярных числа: ранг 2'],
    ['fc', 'выходной слой', 'без изменений'],
  ];
  cards.forEach(([t, sub, cap], k) => {
    const g = group(220 + 385 * k, 450);
    rect(-170, -220, 340, 440, { class: 'paper', rx: 18, parent: g });
    rect(-170, -220, 340, 440, { class: k === 2 ? 'hl' : 'soft', 'stroke-width': 3, rx: 18, parent: g });
    text(0, -175, t, { size: 30, parent: g });
    text(0, -132, sub, { size: 24, class: 'soft', parent: g });
    if (k === 0) for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) rect(-105 + j * 36, -95 + i * 32, 32, 28, { class: 'fill ' + (random() < .5 ? 'c0' : 'c1'), stroke: 'none', opacity: (.2 + .7 * random()).toFixed(2), rx: 3, parent: g });
    if (k === 1 || k === 3) path('M-60,-20 L-15,30 L70,-70', { class: 'good', 'stroke-width': 12, fill: 'none', parent: g });
    if (k === 2) [[-90, 120], [-50, 95], [-10, 4], [30, 4], [70, 4], [110, 4]].forEach(([x, h]) => line(x, 60, x, 60 - h, { class: h > 10 ? 'hl' : 'soft', 'stroke-width': 26, 'stroke-linecap': 'butt', parent: g }));
    box(0, 150, 300, 0, cap, { size: 24, parent: g });
    pop(g, cue(k + 1));
  });
});

scene('rank2', () => {
  const SV = [2.89, 2.138, 2.078, 2.015, 1.984, 1.965], LB = ['2,89', '2,14', '2,08', '2,02', '1,98', '1,97'];
  const B = 650, K = 120, X = k => 330 + 150 * k;
  line(240, B, 1300, B, { class: 'ink' });
  show(tex(800, 140, 'W = U\\,S\\,V^T', { size: 46 }), 0);
  text(800, 210, 'диагональ S: сингулярные числа по убыванию', { size: 28, class: 'soft' });
  const bars = SV.map((s, k) => line(X(k), B, X(k), B - K * s, { class: k < 2 ? 'c0' : 'c3', 'stroke-width': 70, 'stroke-linecap': 'butt' }));
  const vals = LB.map((s, k) => text(X(k), B - K * SV[k] - 28, s, { size: 28 }));
  bars.forEach((b, k) => draw(b, cue(1) + k * .12, .5));
  vals.forEach((v, k) => show(v, cue(1) + .4 + k * .12));
  const more = text(1230, B - 120, '… ещё 250', { size: 28 });
  show(more, cue(1) + 1);
  bars.slice(2).forEach((b, k) => set(b, 'y2', B, cue(2) + k * .1, .8));
  vals.slice(2).forEach((v, k) => hide(v, cue(2) + k * .1, .3));
  [2, 3, 4, 5].forEach((k, i) => show(text(X(k), B - 28, '0', { size: 28, class: 'c3' }), cue(2) + .5 + i * .1));
  hide(more, cue(2), .3);
  show(text(1230, B - 28, '… → 0', { size: 28, class: 'c3' }), cue(2) + .6);
  show(tex(800, 280, 'W_2 = U\\,S_2\\,V^T', { size: 40 }), cue(3));
  pop(chip(800, 760, 'ранг 2: только два ненулевых собственных числа'), cue(3) + .5);
});

scene('srank', () => {
  show(tex(800, 140, '\\mathrm{srank} = \\dfrac{\\sum_i \\lambda_i}{\\lambda_{max}} = \\dfrac{\\|W\\|_F^2}{\\|W\\|_2^2}', { size: 44 }), cue(1));
  show(label(520, 265, 'сумма — вся энергия слоя', { class: 'c0' }), cue(2));
  show(label(1080, 265, 'наибольшее — сильнейшее направление', { class: 'c1' }), cue(2) + .4);
  const B = 680, K = 90;
  const ex = (x0, vals, top, res, at) => {
    const g = group(0, 0);
    line(x0 - 60, B, x0 + 360, B, { class: 'ink', parent: g });
    vals.forEach((v, k) => line(x0 + k * 100, B, x0 + k * 100, B - K * v - (v ? 0 : 3), { class: 'c2', 'stroke-width': 60, 'stroke-linecap': 'butt', parent: g }));
    label(x0 + 150, 545, top, { parent: g });
    label(x0 + 150, 740, res, { class: 'hl', parent: g });
    show(g, at);
  };
  ex(250, [1, 1, 1, 1], 'λ = 1, 1, 1, 1', 'srank = 4 / 1 = 4', cue(3));
  ex(1050, [4, 0, 0, 0], 'λ = 4, 0, 0, 0', 'srank = 4 / 4 = 1', cue(4));
});

function panel(l, x, y, logH) {
  const g = group(0, 0);
  rect(x, y, 690, 340, { class: 'soft', rx: 12, 'stroke-width': 2, parent: g });
  text(x + 345, y + 26, l.name, { size: 26, parent: g });
  const xmax = 1.06 * Math.max(l.e1, l.edge), X = v => x + 30 + 630 * v / xmax, B = y + 310;
  line(x + 20, B, x + 670, B, { class: 'ink', parent: g });
  const pos = l.H.filter(h => h > 0), lo = Math.log10(Math.min(...pos)) - .25, hi = Math.log10(Math.max(...pos));
  const w = (l.e1 - l.e0) / 30;
  l.H.forEach((h, i) => { if (h > 0) { const hh = logH ? 230 * (Math.log10(h) - lo) / (hi - lo) : h; rect(X(l.e0 + i * w) + .5, B - hh, Math.max(2, X(w) - X(0) - 1), hh, { class: 'fill c0', stroke: 'none', opacity: .8, parent: g }); } });
  line(X(l.edge), B, X(l.edge), y + 60, { class: 'bad', 'stroke-width': 3, 'stroke-dasharray': '10 6', parent: g });
  text(X(l.edge) + 22, y + 66, 'λ₊', { size: 26, parent: g });
  return g;
}

scene('panels', () => {
  const pos = [[75, 110], [835, 110], [75, 490], [835, 490]];
  L.forEach((l, k) => panel(l, pos[k][0], pos[k][1], true));
  L.forEach((l, k) => {
    const [x, y] = pos[k];
    const f = rect(x, y, 690, 340, { class: 'hl', rx: 12, 'stroke-width': 6 });
    show(f, cue(k + 1), .3);
    if (k < 3) hide(f, cue(k + 2) - .1, .3);
    show(label(x + 470, y + 110, l.note, { class: 'hl' }), cue(k + 1) + .3);
  });
});

scene('randz', () => {
  const l = L[0], lmS = 0.0028232, g = 64 / 576, lm = lmS * (1 - Math.sqrt(g)) ** 2, lp = l.edge;
  const X = v => 140 + 1300 * (v - .0011) / .0042, Y = h => 740 - .85 * h;
  line(120, 740, 1470, 740, { class: 'ink' });
  [.002, .003, .004, .005].forEach(v => { line(X(v), 740, X(v), 752, { class: 'ink' }); text(X(v), 786, String(v).replace('.', ','), { size: 26 }); });
  text(1490, 786, 'λ', { size: 30 });
  text(800, 130, 'layer1.0.conv1 (случайный): 64 собственных числа', { size: 30 });
  const w = (l.e1 - l.e0) / 30;
  l.H.forEach((h, i) => { if (h > 0) rect(X(l.e0 + i * w) + 1, Y(h), X(w) - X(0) - 2, .85 * h, { class: 'fill c0', stroke: 'none', opacity: .55 }); });
  const band = group(0, 0);
  rect(X(.00373059), 200, X(l.e1) - X(.00373059), 540, { class: 'fill hl', opacity: .14, stroke: 'none', parent: band });
  label(X(.0043), 230, 'подгонка: «хвост» из 14 чисел, α ≈ 10', { class: 'hl', parent: band });
  show(band, cue(1));
  let d = '';
  for (let i = 0; i <= 200; i++) { const v = lm + (lp - lm) * i / 200, r = Math.sqrt(Math.max(0, (lp - v) * (v - lm))) / (2 * Math.PI * lmS * g * v); d += (i ? 'L' : 'M') + X(v).toFixed(1) + ',' + Y(r).toFixed(1); }
  draw(path(d, { class: 'c1', 'stroke-width': 5 }), cue(2), 1.5);
  show(label(X(.0024), 220, 'плотность МП этого слоя', { class: 'c1' }), cue(2) + 1);
  const ed = group(0, 0);
  line(X(lp), 740, X(lp), 300, { class: 'bad', 'stroke-width': 4, 'stroke-dasharray': '10 6', parent: ed });
  label(X(lp) + 40, 300, 'λ₊', { parent: ed });
  arrow(X(l.e1), 680, X(lp) - 4, 680, { class: 'hl', 'stroke-width': 4, parent: ed });
  label(X(l.e1) - 150, 640, 'λmax / λ₊ = 0,96', { class: 'hl', parent: ed });
  show(ed, cue(3));
  show(label(X(.0041), 330, 'край балка: плотность → 0 как √(λ₊ − λ)', { class: 'c1' }), cue(4));
  pop(chip(X(.0041), 400, 'хвоста нет'), cue(4) + .8);
});

scene('collz', () => {
  const X = v => 160 + 1300 * v / .0078, B = 700;
  line(140, B, 1480, B, { class: 'ink' });
  [0, .002, .004, .006].forEach(v => { line(X(v), B, X(v), B + 12, { class: 'ink' }); text(X(v), B + 46, String(v).replace('.', ','), { size: 26 }); });
  text(1500, B + 46, 'λ', { size: 30 });
  text(800, 130, 'layer3.0.conv1 (коллапс): 256 собственных чисел', { size: 30 });
  const z = group(0, 0);
  line(X(0) + 14, B, X(0) + 14, 260, { class: 'soft', 'stroke-width': 28, 'stroke-linecap': 'butt', parent: z });
  label(X(0) + 250, 280, '254 машинных нуля — отброшены drop_zeros', { parent: z });
  const two = group(0, 0);
  [[.00397, 'λ₂ ≈ 0,0040'], [.00725, 'λ₁ ≈ 0,0072']].forEach(([v, s]) => { circle(X(v), B - 40, 16, { class: 'fill hl', stroke: 'none', parent: two }); label(X(v), B - 95, s, { class: 'hl', parent: two }); });
  show(z, cue(1)); show(two, cue(1) + .5);
  show(label(800, 375, 'по 2 точкам степенной закон не оценить: α нет', { class: 'c3' }), cue(2));
  show(tex(800, 465, '\\mathrm{srank} = \\dfrac{\\lambda_1 + \\lambda_2}{\\lambda_1} \\approx 1{,}55', { size: 40 }), cue(3));
});
