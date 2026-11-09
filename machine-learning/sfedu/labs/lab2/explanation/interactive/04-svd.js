// SVD как поворот, растяжение и ещё один поворот: что матрица делает с единичным кругом
const C = [800, 545], RAD = 195;
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const rot = (a, p) => [Math.cos(a) * p[0] - Math.sin(a) * p[1], Math.sin(a) * p[0] + Math.cos(a) * p[1]];
const toXY = p => [C[0] + RAD * p[0], C[1] - RAD * p[1]];
const DEG = Math.PI / 180;

scene('svd', () => {
  text(560, 120, 'X =', { size: 44 });
  const f = [['U', 700, 'поворот 2'], ['S', 850, 'растяжение'], ['V^T', 1000, 'поворот 1']].map(([s, x, w]) =>
    [tex(x, 120, s, { size: 50, class: 'soft' }), text(x, 190, w, { size: 24, class: 'soft' })]);

  circle(C[0], C[1], RAD, { class: 'soft', 'stroke-dasharray': '8 8' });
  const fill = path('', { class: 'fill c0', opacity: .12, stroke: 'none' });
  const ell = path('', { class: 'c0', 'stroke-width': 4 });
  const ax = [['c1', [1, 0]], ['c2', [0, 1]]].map(([cls, p]) => ({ p, l: line(C[0], C[1], C[0], C[1], { class: cls, 'stroke-width': 6 }), h: circle(C[0], C[1], 11, { class: 'fill ' + cls, stroke: 'none' }) }));

  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const st = t => ({
    v: -40 * DEG * ease((t - c1) / 1.2),
    sx: 1 + .8 * ease((t - c2) / 1.2),
    sy: 1 - .5 * ease((t - c2) / 1.2),
    u: 30 * DEG * ease((t - c3) / 1.2),
  });
  const map = (s, p) => { const q = rot(s.v, p); return rot(s.u, [s.sx * q[0], s.sy * q[1]]); };
  clock(t => {
    const s = st(t);
    let d = '';
    for (let i = 0; i <= 90; i++) { const a = 2 * Math.PI * i / 90, q = toXY(map(s, [Math.cos(a), Math.sin(a)])); d += (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }
    ell.setAttribute('d', d + 'Z');
    fill.setAttribute('d', d + 'Z');
    ax.forEach(a => { const q = toXY(map(s, a.p)); a.l.setAttribute('x2', q[0]); a.l.setAttribute('y2', q[1]); a.h.setAttribute('cx', q[0]); a.h.setAttribute('cy', q[1]); });
  });

  f.forEach((pair, j) => pair.forEach(e => { recolor(e, 'hl', cue(3 - j)); recolor(e, 'ink', cue(3 - j) + 1.6); }));

  const u = 30 * DEG, a1 = rot(u, [1.8, 0]), a2 = rot(u, [0, .5]);
  const semi = group(0, 0);
  const o = toXY([0, 0]), q1 = toXY(a1), q2 = toXY(a2);
  line(o[0], o[1], q1[0], q1[1], { class: 'hl', 'stroke-width': 4, 'stroke-dasharray': '10 8', parent: semi });
  line(o[0], o[1], q2[0], q2[1], { class: 'hl', 'stroke-width': 4, 'stroke-dasharray': '10 8', parent: semi });
  const p1 = toXY(rot(u, [2.1, 0])), p2 = toXY(rot(u, [0, .95]));
  label(p1[0], p1[1], 's₁', { class: 'hl', parent: semi });
  label(p2[0], p2[1], 's₂', { class: 'hl', parent: semi });
  show(semi, cue(4));
});
