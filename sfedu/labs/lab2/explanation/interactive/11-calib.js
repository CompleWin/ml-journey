// Из чего складывается λ̂₁ при θ = 1, γ = 0,5: шум 1 + сигнал θ + добавка шума γ + γ/θ
const X = v => 200 + 380 * v, Y0 = 400, H = 76;

function seg(a, b, cls, s) {
  const g = group(0, 0);
  rect(X(a), Y0, X(b) - X(a), H, { class: 'fill ' + cls, opacity: .35, stroke: 'none', parent: g });
  rect(X(a), Y0, X(b) - X(a), H, { class: cls, 'stroke-width': 3, parent: g });
  text((X(a) + X(b)) / 2, Y0 + H / 2, s, { size: 28, parent: g });
  return g;
}

// λ̂₁(θ) = (1 + θ)(1 + γ/θ) при γ = 0,5: минимум λ₊ в θc, два корня для λ̂₁ = 3, ни одного внутри балка
const G = .5, TC = Math.sqrt(G), LP = (1 + TC) ** 2;
const RX = t => 90 + 255 * t, RY = l => 760 - 230 * (l - 2.6);
const f = t => (1 + t) * (1 + G / t);
const branch = (a, b) => { let d = ''; for (let i = 0; i <= 120; i++) { const t = a + (b - a) * i / 120; d += (i ? 'L' : 'M') + RX(t).toFixed(1) + ',' + RY(f(t)).toFixed(1); } return d; };

function rootsBase() {
  line(80, 760, 770, 760, { class: 'ink' });
  line(80, 760, 80, 200, { class: 'ink' });
  [0, .5, 1, 1.5, 2, 2.5].forEach(t => { line(RX(t), 760, RX(t), 772, { class: 'ink' }); text(RX(t), 800, String(t).replace('.', ','), { size: 26 }); });
  [3, 4, 5].forEach(l => { line(68, RY(l), 80, RY(l), { class: 'ink' }); text(45, RY(l), String(l), { size: 26 }); });
  text(780, 800, 'θ', { size: 30 });
  tex(420, 150, '\\hat\\lambda_1(\\theta) = (1+\\theta)\\,(1+\\gamma/\\theta)', { size: 34 });
  line(80, RY(LP), 770, RY(LP), { class: 'soft', 'stroke-dasharray': '8 6' });
  label(730, RY(LP) + 30, 'λ₊', { class: 'soft' });
  line(RX(TC), 760, RX(TC), 220, { class: 'soft', 'stroke-dasharray': '8 6' });
  label(RX(TC), 222, 'θc', { class: 'soft' });
}

scene('roots', () => {
  rootsBase();
  draw(path(branch(TC, 2.6), { class: 'c1', 'stroke-width': 5 }), cue(1), 1);
  const lb = group(0, 0);
  path(branch(.15, TC), { class: 'c1', 'stroke-width': 4, 'stroke-dasharray': '10 8', opacity: .7, parent: lb });
  show(lb, cue(1) + .8, .8);
  const low = group(0, 0);
  rect(80, 220, RX(TC) - 80, 540, { class: 'fill soft', opacity: .18, stroke: 'none', parent: low });
  label(175, 300, 'ниже порога', { parent: low });
  show(low, cue(2));
  const hz = line(80, RY(3), 770, RY(3), { class: 'hl', 'stroke-width': 4 });
  draw(hz, cue(3), .6);
  const pts = group(0, 0);
  circle(RX(.5), RY(3), 12, { class: 'fill soft', stroke: 'none', parent: pts });
  circle(RX(1), RY(3), 12, { class: 'fill good', stroke: 'none', parent: pts });
  label(RX(.5), RY(3) - 48, '0,5', { parent: pts });
  label(RX(1) + 10, RY(3) - 48, '1', { class: 'good', parent: pts });
  label(640, RY(3) - 34, 'λ̂₁ = 3', { class: 'hl', parent: pts });
  show(pts, cue(3) + .6);
});

scene('roots2', () => {
  rootsBase();
  path(branch(TC, 2.6), { class: 'c1', 'stroke-width': 5 });
  path(branch(.15, TC), { class: 'c1', 'stroke-width': 4, 'stroke-dasharray': '10 8', opacity: .7 });
  const low = group(0, 0);
  rect(80, 220, RX(TC) - 80, 540, { class: 'fill soft', opacity: .18, stroke: 'none', parent: low });
  label(175, 300, 'ниже порога', { parent: low });
  const hz = line(80, RY(3), 770, RY(3), { class: 'hl', 'stroke-width': 4 });
  const pts = group(0, 0);
  circle(RX(.5), RY(3), 12, { class: 'fill soft', stroke: 'none', parent: pts });
  circle(RX(1), RY(3), 12, { class: 'fill good', stroke: 'none', parent: pts });
  label(RX(.5), RY(3) - 48, '0,5', { parent: pts });
  label(RX(1) + 10, RY(3) - 48, '1', { class: 'good', parent: pts });
  label(640, RY(3) - 34, 'λ̂₁ = 3', { class: 'hl', parent: pts });
  hide(pts, .2, .5);
  set(hz, 'y1', RY(LP), cue(1), 1); set(hz, 'y2', RY(LP), cue(1), 1);
  const touch = group(0, 0);
  circle(RX(TC), RY(LP), 12, { class: 'fill hl', stroke: 'none', parent: touch });
  label(470, 560, 'λ̂₁ = λ₊: один корень, дискриминант 0', { class: 'hl', parent: touch });
  show(touch, cue(1) + 1);
  hide(touch, cue(2), .4);
  set(hz, 'y1', RY(2.8), cue(2), 1); set(hz, 'y2', RY(2.8), cue(2), 1);
  show(label(470, 560, 'λ̂₁ < λ₊: пересечений нет, корня нет', { class: 'c3' }), cue(2) + 1);
  show(label(470, 470, 'такое λ̂₁ даёт и чистый шум', { class: 'c0' }), cue(3));
});

scene('bias', () => {
  text(800, 150, 'λ̂₁ = 3 при θ = 1, γ = 0,5', { size: 36 });
  line(180, 680, 1420, 680, { class: 'ink' });
  [0, 1, 2, 3].forEach(v => { line(X(v), 680, X(v), 692, { class: 'ink' }); text(X(v), 724, String(v), { size: 28 }); });
  text(1450, 724, 'λ', { size: 30 });
  [0, 1, 2, 3].forEach(v => line(X(v), Y0 + H, X(v), 680, { class: 'soft', 'stroke-dasharray': '4 6' }));
  show(seg(0, 1, 'soft', 'шум: 1'), cue(1));
  show(seg(1, 2, 'c2', 'сигнал θ = 1'), cue(2));
  show(seg(2, 3, 'hl', 'добавка γ + γ/θ = 1'), cue(3));
  const naive = group(0, 0);
  arrow(X(1), 330, X(3), 330, { head: 'both', class: 'hl', 'stroke-width': 4, parent: naive });
  label((X(1) + X(3)) / 2, 290, 'наивная оценка: λ̂₁ − 1 = 2', { class: 'hl', parent: naive });
  show(naive, cue(4));
  const truth = group(0, 0);
  arrow(X(1), 545, X(2), 545, { head: 'both', class: 'c2', 'stroke-width': 4, parent: truth });
  label((X(1) + X(2)) / 2, 590, 'на самом деле θ = 1', { class: 'c2', parent: truth });
  show(truth, cue(4) + .8);
});
