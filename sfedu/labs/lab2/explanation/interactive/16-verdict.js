// Итоговая классификация слоёв по фазам и два порога у layer2.0.conv1
const COLS = [240, 520, 800, 1080, 1360];
const NAMES = ['1. Random-like', '2. Bleeding out', '3. Bulk + Decay', '4. Heavy-Tailed', '5. Collapsed'];
const ICON = [
  [10, 30, 34, 30, 24, 16, 9, 4, 0, 0, 0, 0],
  [10, 30, 34, 30, 24, 16, 9, 4, 0, 6, 0, 5],
  [9, 26, 30, 26, 20, 13, 8, 10, 7, 5, 4, 3],
  [40, 26, 18, 13, 10, 8, 6, 5, 4, 3, 3, 2],
  [46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12],
];
// layer2.0.conv1: число собственных чисел в каждом из 30 бинов гистограммы (128 чисел)
const C2 = [24, 17, 12, 8, 7, 8, 6, 5, 4, 2, 4, 5, 3, 1, 3, 1, 2, 3, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 1, 1];

scene('map', () => {
  COLS.forEach((x, k) => {
    const g = group(x, 0);
    rect(-128, 110, 256, 560, { class: k === 3 ? 'good' : 'soft', 'stroke-width': 2, rx: 14, parent: g });
    text(0, 146, NAMES[k], { size: 24, parent: g });
    line(-100, 300, 100, 300, { class: 'ink', parent: g });
    ICON[k].forEach((h, i) => { if (h) line(-90 + i * 16.5, 300, -90 + i * 16.5, 300 - 2.6 * h, { class: 'c0', 'stroke-width': 12, 'stroke-linecap': 'butt', parent: g }); });
  });
  const items = [
    ['layer1.0.conv1', 240, '0 из 64 за λ₊'],
    ['layer2.0.conv1', 660, '18 за λ₊, α ≈ 9'],
    ['layer3.0.conv1', 1360, '2 из 256, srank ≈ 1,5'],
    ['fc', 1080, 'α = 3,38 ∈ (2, 4]'],
  ];
  items.forEach(([s, x, why], k) => {
    const c = chip(340 + k * 300, 780, s);
    const at = cue(k + 1);
    move(c, x, 440, at, 1);
    show(label(x, k === 2 ? 570 : 510, why, { class: k === 3 ? 'good' : 'hl' }), at + 1);
  });
  show(line(660, 300, 660, 400, { class: 'hl', 'stroke-width': 3, 'stroke-dasharray': '6 6' }), cue(2) + 1);
});

function hist(x0, y0, from, cls, parent) {
  const g = group(0, 0, { parent });
  line(x0 - 10, y0, x0 + 570, y0, { class: 'ink', parent: g });
  C2.forEach((c, i) => { if (c) rect(x0 + i * 19, y0 - 9 * c, 17, 9 * c, { class: 'fill ' + (i >= from ? cls : 'soft'), stroke: 'none', opacity: i >= from ? .9 : .5, parent: g }); });
  return g;
}

scene('twothr', () => {
  text(800, 110, 'layer2.0.conv1: 128 собственных чисел, два кандидата в хвост', { size: 30 });
  const a = group(0, 0);
  hist(110, 520, 20, 'hl', a);
  text(395, 580, 'хвост из 10 точек', { size: 28, parent: a });
  label(395, 640, 'α ≈ 9,4,  D = 0,130', { class: 'hl', parent: a });
  show(a, cue(1));
  const b = group(0, 0);
  hist(910, 520, 4, 'c3', b);
  text(1195, 580, 'хвост из 67 точек', { size: 28, parent: b });
  label(1195, 640, 'α ≈ 2,2,  D = 0,143', { class: 'c3', parent: b });
  show(b, cue(2));
  const cmp = group(0, 0);
  rect(395 - 130 * 1.3, 700, 260 * 1.3 * .130 / .143, 24, { class: 'fill hl', stroke: 'none', parent: cmp });
  rect(1195 - 130 * 1.3, 700, 260 * 1.3, 24, { class: 'fill c3', stroke: 'none', parent: cmp });
  show(cmp, cue(3));
  show(label(800, 712, 'KS выбирает меньшее D, но разница мала'), cue(3) + .3);
  const v = group(0, 0);
  chip(560, 810, 'не шум: 18 за λ₊', { parent: v });
  chip(1040, 810, 'не выродился: srank 32', { parent: v });
  show(v, cue(4));
});
