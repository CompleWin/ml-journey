// Part 1: the main question of the lab and the four tasks as one map.

const VALS = [0.6, -0.3, 0.9, 0.1, -0.7, 0.4, -0.2, 0.8, -0.5, 0.3, 0.05, -0.6];

function strip(x, y, n, h) {   // a token's vector: cells with signed bars
  const g = group(x, y);
  for (let i = 0; i < n; i++) {
    const v = VALS[i % VALS.length];
    rect(-60, i * h, 120, h - 6, { rx: 4, class: 'paper', parent: g });
    rect(v < 0 ? v * 52 : 0, i * h + 8, Math.abs(v) * 52, h - 22, { class: 'fill c0', stroke: 'none', parent: g });
  }
  line(0, -6, 0, n * h, { class: 'soft', parent: g });
  return g;
}

scene('question', () => {
  text(300, 110, 'слово « table»', { size: 30 });
  strip(300, 150, 12, 44);
  text(300, 725, '512 чисел', { size: 34, class: 'c0' });
  text(300, 768, 'показаны 12 из них', { size: 24, class: 'soft' });

  const ask = arrow(440, 430, 820, 430, { class: 'soft', 'stroke-width': 5 });
  const askL = label(630, 380, 'как поместилось?', { size: 28 });
  draw(ask, cue(1)); show(askL, cue(1, .3));

  const words = [
    ['существительное', 1000, 150], ['мебель', 1330, 210], ['английский язык', 1060, 280],
    ['после «large»', 1380, 340], ['скобка «(»', 1000, 410], ['код на Python', 1330, 470],
    ['кавычки', 1050, 540], ['Париж', 1370, 600], ['футбол', 1010, 670], ['ед. число', 1330, 730],
  ];
  const chips = words.map(([s, x, y], i) => {
    const c = chip(x, y, s, { size: 26 });
    pop(c, cue(1, .4 + i * .25));
    return c;
  });

  const frameB = rect(860, 378, 280, 64, { rx: 32, class: 'c1', 'stroke-width': 5 });
  show(frameB, cue(2));
  recolor(chips[4], 'c1', cue(2));
  pulse(chips[4], cue(2, .3));
  const pull = arrow(720, 610, 880, 450, { class: 'c1', 'stroke-width': 5 });
  draw(pull, cue(2, .4));
  const pullL = label(620, 660, 'достать и подкрутить', { size: 28, class: 'c1' });
  show(pullL, cue(2, .6));
});

const PX = [215, 605, 995, 1385];
const CAPS = [
  'Случайные векторы почти перпендикулярны, а у Pythia сбиты в конус',
  '40 признаков в 10 числах: случайно или обучено',
  'Починить автоэнкодер, который распаковывает признаки',
  'Толкнуть модель вдоль нейрона или вдоль признака SAE',
];

function art(i) {   // the drawing of task i: stage a, stage b, caption
  const cx = PX[i];
  const a = group(cx, 330), b = group(cx, 330);
  if (i === 0) {
    circle(0, 0, 90, { class: 'soft', parent: a });
    arrow(0, 0, 86, -25, { class: 'c0', parent: a, 'stroke-width': 4 });
    arrow(0, 0, -24, -86, { class: 'c2', parent: a, 'stroke-width': 4 });
    label(60, -78, '≈ 90°', { size: 24, parent: a });
    for (const ang of [-32, -26, -20, -14]) {
      const r = Math.PI * ang / 180;
      arrow(-95, 200, -95 + 170 * Math.cos(r), 200 + 170 * Math.sin(r), { class: 'c1', parent: b });
    }
    label(0, 225, 'Pythia: конус', { size: 24, class: 'c1', parent: b });
  } else if (i === 1) {
    circle(0, 0, 90, { class: 'soft', parent: a });
    for (let k = 0; k < 5; k++) {
      const r = Math.PI * (-90 + 72 * k) / 180;
      arrow(0, 0, 86 * Math.cos(r), 86 * Math.sin(r), { class: 'c0', parent: a, 'stroke-width': 4 });
    }
    text(0, 125, '5 направлений в 2D', { size: 24, parent: a });
    chip(0, 185, 'случайно → обучено', { size: 24, parent: b });
  } else if (i === 2) {
    rect(-140, -60, 30, 120, { class: 'c0', parent: a });
    for (let k = 0; k < 10; k++) rect(-22, -105 + k * 22, 44, 18, { class: 'soft', parent: a });
    rect(110, -60, 30, 120, { class: 'c0', parent: a });
    arrow(-100, 0, -32, 0, { class: 'c0', parent: a });
    arrow(32, 0, 100, 0, { class: 'c0', parent: a });
    text(-125, 90, '512', { size: 22, parent: a });
    text(0, 140, '2048', { size: 22, parent: a });
    text(125, 90, '512', { size: 22, parent: a });
    for (const k of [1, 4, 8]) rect(-22, -105 + k * 22, 44, 18, { class: 'fill c1', parent: b });
    text(0, 185, 'включены K = 32', { size: 22, class: 'c1', parent: b });
  } else {
    arrow(-110, 120, 10, -60, { class: 'c0', parent: a, 'stroke-width': 5 });
    label(-90, 10, 'x', { size: 28, class: 'c0', parent: a });
    arrow(10, -60, 120, 20, { class: 'c1', parent: b, 'stroke-width': 5 });
    label(100, -50, 'αv', { size: 28, class: 'c1', parent: b });
    arrow(-110, 120, 120, 20, { class: 'c2', parent: b, 'stroke-dasharray': '10 8' });
    label(40, 125, 'x + αv', { size: 26, class: 'c2', parent: b });
  }
  const cap = box(cx, 668, 300, 0, CAPS[i], { size: 24 });
  return { a, b, cap };
}

function map(n) {   // panels before n finished, panel n acted out on the marks, later ones waiting
  for (let i = 0; i < 4; i++) {
    const cx = PX[i];
    rect(cx - 170, 140, 340, 590, { rx: 18, class: 'paper' });
    text(cx, 190, 'Задание ' + (i + 1), { size: 32, class: i > n ? 'soft' : 'ink' });
    const hl = rect(cx - 170, 140, 340, 590, { rx: 18, class: 'c0', 'stroke-width': 6 });
    if (i === n - 1) hide(hl, .1); else if (i === n) show(hl, .1); else hl.setAttribute('opacity', 0);
    if (i < n) art(i);
    if (i === n) {
      const z = art(i);
      show(z.a, cue(1)); show(z.b, cue(2)); show(z.cap, cue(2, .5));
    }
    if (i >= n) {
      const q = text(cx, 420, '?', { size: 90, class: 'soft' });
      if (i === n) hide(q, .1);
    }
  }
}

scene('map1', () => map(0));
scene('map2', () => map(1));
scene('map3', () => map(2));
scene('map4', () => map(3));

scene('map5', () => {
  map(4);
  const steps = [['упаковка', 1], ['распаковка', 2], ['управление', 3]];
  const first = chip(PX[0], 790, 'места много', { size: 26, class: 'c2' });
  pop(first, cue(1));
  steps.forEach(([s, k]) => {
    const ar = arrow(PX[k - 1] + 100, 790, PX[k] - 100, 790, { class: 'c2', bend: -.3, 'stroke-width': 4 });
    draw(ar, cue(k + 1));
    const l = label((PX[k - 1] + PX[k]) / 2, 850, s, { size: 26, class: 'c2' });
    show(l, cue(k + 1, .4));
  });
});
