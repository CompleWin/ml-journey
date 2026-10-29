// Матрица данных, γ, дисперсия и ковариация, сборка XXᵀ/n
function gauss() {
  const u = Math.max(1e-9, random()), v = random();
  return Math.max(-2.2, Math.min(2.2, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
}

function cell(x, y, w, h, z, parent) {
  return rect(x, y, w - 4, h - 4, { class: 'fill ' + (z > 0 ? 'c0' : 'c1'), stroke: 'none', opacity: Math.min(.95, .2 + .35 * Math.abs(z)).toFixed(2), rx: 4, parent });
}

function grid(x, y, rows, cols, w, h, parent) {
  const z = [];
  for (let r = 0; r < rows; r++) {
    z.push([]);
    for (let c = 0; c < cols; c++) {
      const v = gauss();
      z[r].push(v);
      cell(x + c * w, y + r * h, w, h, v, parent);
    }
  }
  return z;
}

const GX = 400, GY = 250, CW = 70, CH = 62;

function matrix() {
  const g = group(0, 0);
  grid(GX, GY, 6, 12, CW, CH, g);
  [['признак 1 (рост)', 0], ['признак 2 (вес)', 1], ['⋮', 3], ['признак p', 5]].forEach(([s, r]) =>
    text(GX - 16, GY + r * CH + CH / 2 - 2, s, { size: 28, 'text-anchor': 'end', parent: g }));
  [['1', 0], ['2', 1], ['3', 2], ['…', 6], ['n', 11]].forEach(([s, c]) =>
    text(GX + c * CW + CW / 2 - 2, GY - 26, s, { size: 28, parent: g }));
  text(95, GY + 3 * CH + 28, 'p признаков', { size: 30, parent: g });
  text(GX + 6 * CW, GY - 78, 'n наблюдений', { size: 30, parent: g });
  return g;
}

function marks(parent) {
  const row = group(0, 0, { parent });
  rect(GX - 4, GY - 4, 12 * CW + 4, CH + 4, { class: 'hl', 'stroke-width': 4, parent: row });
  label(1420, GY + CH / 2, 'строка = признак', { class: 'hl', parent: row });
  const col = group(0, 0, { parent });
  rect(GX - 4, GY - 4, CW + 4, 6 * CH + 4, { class: 'hl', 'stroke-width': 4, parent: col });
  label(GX + 170, GY + 6 * CH + 52, 'столбец = наблюдение', { class: 'hl', parent: col });
  const sk = label(GX + 6 * CW, 790, 'в sklearn наоборот: объекты в строках', { class: 'soft', size: 30, parent });
  return [row, col, sk];
}

scene('mat', () => {
  matrix();
  const [row, col, sk] = marks(group(0, 0));
  show(row, cue(1));
  show(col, cue(2));
  show(sk, cue(3));
});

scene('gamma', () => {
  const old = matrix();
  marks(old);
  hide(old, .1, .5);
  show(tex(800, 115, '\\gamma = \\dfrac{p}{n}', { size: 56 }), .5);
  const A = group(450, 420);
  rect(-125, -62, 250, 125, { class: 'fill c0', opacity: .25, stroke: 'none', parent: A });
  rect(-125, -62, 250, 125, { class: 'c0', parent: A });
  text(0, -92, 'n = 1000', { size: 28, parent: A });
  text(-205, 0, 'p = 500', { size: 28, parent: A });
  chip(0, 120, 'γ = 0,5', { parent: A });
  pop(A, cue(1));
  const B = group(1100, 480);
  rect(-125, -250, 250, 500, { class: 'fill c1', opacity: .25, stroke: 'none', parent: B });
  rect(-125, -250, 250, 500, { class: 'c1', parent: B });
  text(0, -280, 'n = 1000', { size: 28, parent: B });
  text(-205, 0, 'p = 2000', { size: 28, parent: B });
  chip(0, 300, 'γ = 2', { parent: B });
  pop(B, cue(2));
  show(label(450, 700, 'больше γ — меньше данных на признак'), cue(3));
});

scene('cov', () => {
  const A = group(290, 560);
  line(-220, 0, 220, 0, { class: 'soft', parent: A });
  line(0, -8, 0, 8, { class: 'soft', parent: A });
  text(0, 32, '0', { size: 24, parent: A });
  const sq = group(0, 0, { parent: A });
  [-150, -95, -40, 25, 65, 110, 165].forEach(v => {
    const s = Math.abs(v);
    rect(Math.min(0, v), -s, s, s, { class: 'fill c0', opacity: .12, stroke: 'none', parent: sq });
    rect(Math.min(0, v), -s, s, s, { class: 'c0', 'stroke-width': 2, opacity: .7, parent: sq });
    circle(v, 0, 7, { class: 'fill c1', stroke: 'none', parent: sq });
  });
  show(sq, cue(1));
  show(text(0, 120, 'дисперсия = средний квадрат', { size: 28, parent: A }), cue(1) + .4);

  const cloud = (cx, k, cls) => {
    const g = group(cx, 420);
    line(-200, 0, 200, 0, { class: 'soft', parent: g });
    line(0, -200, 0, 200, { class: 'soft', parent: g });
    for (let i = 0; i < 70; i++) {
      const u = gauss(), w = gauss();
      circle(95 * u, -95 * (k * u + Math.sqrt(1 - k * k) * w), 6, { class: 'fill ' + cls, stroke: 'none', opacity: .75, parent: g });
    }
    return g;
  };
  show(cloud(800, .85, 'c0'), cue(2));
  show(text(800, 680, 'растут вместе: ковариация > 0', { size: 28 }), cue(2) + .4);
  show(cloud(1300, 0, 'c3'), cue(3));
  show(text(1300, 680, 'не связаны: ковариация ≈ 0', { size: 28 }), cue(3) + .4);
});

const XG = { x: 190, y: 220, w: 56, h: 52 };
const SG = { x: 1110, y: 220, w: 72, h: 64 };
const NAMES = ['рост', 'вес', 'возраст', 'доход'];

scene('xxt', () => {
  show(tex(800, 95, '\\hat\\Sigma = \\frac{1}{n}\\,X X^T', { size: 46 }), .2);
  text(XG.x + 4 * XG.w, XG.y - 34, 'X', { size: 32 });
  const z = grid(XG.x, XG.y, 4, 8, XG.w, XG.h);
  NAMES.forEach((s, r) => text(XG.x - 14, XG.y + r * XG.h + XG.h / 2 - 2, s, { size: 26, 'text-anchor': 'end' }));

  tex(SG.x + 2 * SG.w, SG.y - 40, '\\hat\\Sigma', { size: 40 });
  const S = [];
  for (let r = 0; r < 4; r++) {
    S.push([]);
    text(SG.x - 12, SG.y + r * SG.h + SG.h / 2 - 3, NAMES[r], { size: 22, 'text-anchor': 'end' });
    for (let c = 0; c < 4; c++) {
      rect(SG.x + c * SG.w, SG.y + r * SG.h, SG.w - 6, SG.h - 6, { class: 'soft', rx: 6 });
      S[r].push(rect(SG.x + c * SG.w, SG.y + r * SG.h, SG.w - 6, SG.h - 6, { class: 'fill ' + (r === c ? 'c2' : 'c3'), opacity: .6, stroke: 'none', rx: 6 }));
    }
  }

  const t = cue(1);
  [0, 1].forEach(r => show(rect(XG.x - 4, XG.y + r * XG.h - 4, 8 * XG.w + 4, XG.h + 4, { class: 'hl', 'stroke-width': 4 }), t));
  const dest = [560, 620];
  [0, 1].forEach(r => {
    const g = group(0, 0);
    for (let c = 0; c < 8; c++) cell(XG.x + c * XG.w, XG.y + r * XG.h, XG.w, XG.h, z[r][c], g);
    show(g, t + .3, .3);
    move(g, 0, dest[r] - (XG.y + r * XG.h), t + .3, 1);
    show(text(XG.x - 14, dest[r] + XG.h / 2 - 2, NAMES[r], { size: 26, 'text-anchor': 'end' }), t + 1.3);
  });
  show(text(XG.x + 8 * XG.w + 26, 616, '×', { size: 40 }), t + 1.3);
  const prod = group(0, 0);
  for (let c = 0; c < 8; c++) cell(XG.x + c * XG.w, 700, XG.w, XG.h, z[0][c] * z[1][c], prod);
  text(XG.x - 14, 700 + XG.h / 2 - 2, 'произведения', { size: 22, 'text-anchor': 'end', parent: prod });
  show(prod, t + 1.6);
  const ch = chip(XG.x + 4 * XG.w, 810, 'сумма / n');
  pop(ch, t + 2.4);
  move(ch, SG.x + SG.w + 33, SG.y + 29, t + 3, 1);
  show(S[0][1], t + 3.9, .3);
  hide(ch, t + 4, .3);

  for (let r = 0; r < 4; r++) show(S[r][r], cue(2) + r * .15);
  show(label(1505, SG.y + SG.h / 2, 'дисперсии', { class: 'c2' }), cue(2) + .5);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (r !== c && !(r === 0 && c === 1)) show(S[r][c], cue(3) + (r + c) * .06);
  show(label(1505, SG.y + 3.5 * SG.h, 'ковариации', { class: 'c3' }), cue(3) + .5);
  pop(chip(SG.x + 2 * SG.w - 3, SG.y + 4 * SG.h + 36, 'p × p'), cue(4));
});
