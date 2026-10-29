// Спектр шума из прогона ноутбука: p = 500, n = 1000 (γ = 0,5), гистограмма из 50 бинов, density = True
const H500 = [0.71, 0.958, 0.851, 0.745, 0.816, 0.71, 0.674, 0.603, 0.603, 0.568, 0.532, 0.532, 0.461, 0.568, 0.426, 0.39, 0.461, 0.319, 0.426, 0.39, 0.355, 0.319, 0.319, 0.319, 0.319, 0.284, 0.319, 0.248, 0.284, 0.284, 0.248, 0.213, 0.248, 0.213, 0.177, 0.213, 0.177, 0.142, 0.177, 0.142, 0.177, 0.106, 0.142, 0.071, 0.106, 0.142, 0.071, 0.071, 0.0355, 0.071];
const E0 = 0.0859, E1 = 2.9048, LP = 2.9142;
const X0 = 160, X1 = 1480, BASE = 720, VMAX = 4.5, KY = 480;
const X = v => X0 + (X1 - X0) * v / VMAX;
const Y = d => BASE - KY * d;

function rho(l, g) {
  const lm = (1 - Math.sqrt(g)) ** 2, lp = (1 + Math.sqrt(g)) ** 2;
  return Math.sqrt(Math.max(0, (lp - l) * (l - lm))) / (2 * Math.PI * g * l);
}

function mpPath(g) {
  const lm = (1 - Math.sqrt(g)) ** 2, lp = (1 + Math.sqrt(g)) ** 2;
  let d = '';
  for (let i = 0; i <= 200; i++) {
    const l = lm + (lp - lm) * i / 200;
    d += (i ? 'L' : 'M') + X(l).toFixed(1) + ',' + Y(rho(l, g)).toFixed(1);
  }
  return d;
}

function axis() {
  line(X0 - 20, BASE, X1 + 20, BASE, { class: 'ink' });
  for (let v = 0; v <= 4; v++) {
    line(X(v), BASE, X(v), BASE + 12, { class: 'ink' });
    text(X(v), BASE + 44, String(v), { size: 28 });
  }
  text(X1 + 10, BASE + 44, 'λ', { size: 32 });
}

function bars() {
  const w = (E1 - E0) / H500.length;
  return H500.map((h, i) => {
    const x = X(E0 + (i + .5) * w);
    return line(x, BASE, x, Y(h), { class: 'c0', 'stroke-width': X(w) - X(0) - 2, 'stroke-linecap': 'butt', opacity: .85 });
  });
}

function noise() {
  const g = group(1270, 190);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++)
    rect(-200 + c * 40, -95 + r * 28, 36, 24, { class: 'fill ' + (random() < .5 ? 'c0' : 'c1'), stroke: 'none', opacity: (.15 + .75 * random()).toFixed(2), rx: 3, parent: g });
  text(0, 115, 'шум: истинная дисперсия 1', { size: 28, parent: g });
  return g;
}

function edges() {
  const e = group(0, 0);
  label(X(E0) + 10, 832, '0,09', { class: 'c0', parent: e });
  label(X(E1), 832, '2,9', { class: 'c0', parent: e });
  return e;
}

scene('smear', () => {
  axis();
  show(noise(), cue(1));
  const sp = line(X(1), BASE, X(1), 230, { class: 'hl', 'stroke-width': 16 });
  const spl = label(X(1) + 210, 220, 'ожидание: все λ ≈ 1', { class: 'hl' });
  draw(sp, cue(2), .8);
  show(spl, cue(2) + .5);
  hide(spl, cue(3), .4);
  set(sp, 'y2', BASE - 2, cue(3), .6);
  hide(sp, cue(3) + .5, .2);
  bars().forEach((b, i) => draw(b, cue(3) + .3 + i * .03, .5));
  show(edges(), cue(3) + 1.6);
  draw(path(mpPath(.5), { class: 'c1', 'stroke-width': 5 }), cue(4), 1.4);
  show(label(X(1.95), 470, 'закон Марченко–Пастура', { class: 'c1' }), cue(4) + 1);
});

scene('beyond', () => {
  axis();
  hide(noise(), .2, .5);
  bars();
  edges();
  path(mpPath(.5), { class: 'c1', 'stroke-width': 5 });
  hide(label(X(1.95), 470, 'закон Марченко–Пастура', { class: 'c1' }), .2, .5);
  show(line(X(LP), BASE, X(LP), 300, { class: 'ink', 'stroke-dasharray': '12 10' }), cue(1));
  show(label(X(LP), 268, 'λ₊ — край шума'), cue(1) + .3);
  draw(line(X(4.24), BASE, X(4.24), 470, { class: 'good', 'stroke-width': 14 }), cue(2), .7);
  show(label(X(3.95), 420, 'структура: за краем шума', { class: 'good' }), cue(2) + .5);
});
