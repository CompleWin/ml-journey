// Part 16: the geometry of the phase transition: out of distribution, the turn to v, LayerNorm, tokens made alike.

const DEG = Math.PI / 180;

scene('phase', () => {
  const C = [250, 640], R = 260;
  path(`M${C[0] + R},${C[1]} A${R},${R} 0 0 0 ${C[0]},${C[1] - R}`, { class: 'soft', 'stroke-width': 3, 'stroke-dasharray': '8 8' });
  arrow(C[0], C[1], C[0] + R, C[1], { class: 'c0', 'stroke-width': 7 });
  label(C[0] + R / 2, C[1] + 40, 'x, ‖x‖ ≈ 14', { size: 26, class: 'c0' });
  const nat = line(C[0] + R, C[1], C[0] + R, C[1] - .27 * R, { class: 'c2', 'stroke-width': 14 });
  show(nat, cue(1));
  const natl = label(C[0] + R + 150, C[1] - 20, 'естественно: ≤ 3.8', { size: 24, class: 'c2' });
  show(natl, cue(1, .3));
  const av = line(C[0] + R, C[1], C[0] + R, C[1], { class: 'c1', 'stroke-width': 6 });
  const hyp = line(C[0], C[1], C[0] + R, C[1], { class: 'c3', 'stroke-width': 4, 'stroke-dasharray': '10 6' });
  const ood = label(C[0] + R + 150, C[1] - R + 30, 'вне распределения', { size: 26, class: 'bad' });
  show(ood, cue(1, 2.2));
  const read = text(300, 140, '', { size: 30 });
  const t0 = cue(1, .6), t1 = cue(1, 2.4);
  clock(t => {
    const a = t <= t0 ? 0 : t >= t1 ? 1 : (t - t0) / (t1 - t0);
    av.setAttribute('y2', C[1] - a * R);
    hyp.setAttribute('y2', C[1] - a * R);
    read.textContent = 'α/‖x‖ = ' + a.toFixed(2) + '   длина ×' + Math.sqrt(1 + a * a).toFixed(2) + '   угол ' + Math.round(Math.atan(a) / DEG) + '°';
  });
  const rot = label(C[0] + 70, C[1] - 70, '45°', { size: 26, class: 'c3' });
  show(rot, cue(2));
  const pyth = label(560, 230, '‖x + αv‖ = ‖x‖·√(1 + (α/‖x‖)²)', { size: 26, class: 'c3' });
  show(pyth, cue(2, .4));
  const unit = circle(C[0], C[1], R, { class: 'soft', 'stroke-width': 2 });
  show(unit, cue(3));
  const ln = arrow(C[0], C[1], C[0] + R * Math.cos(45 * DEG), C[1] - R * Math.sin(45 * DEG), { class: 'c3', 'stroke-width': 7 });
  draw(ln, cue(3, .3));
  const drop = line(C[0] + R * Math.cos(45 * DEG), C[1] - R * Math.sin(45 * DEG), C[0] + R * Math.cos(45 * DEG), C[1], { class: 'c0', 'stroke-dasharray': '6 6', 'stroke-width': 3 });
  draw(drop, cue(3, .8));
  const lnl = label(560, 300, 'LayerNorm: длину обратно к норме → доля x падает в 1.41 раза', { size: 26, class: 'c3' });
  show(lnl, cue(3, 1));

  const C2 = [1190, 600];
  text(C2[0], 360, 'разные токены + одна и та же αv', { size: 26 });
  const starts = [10, 150, 215, 320];
  starts.forEach((a0, k) => {
    const g = group(C2[0], C2[1]);
    arrow(0, 0, 170, 0, { class: 'c0', 'stroke-width': 5, parent: g });
    pose(g, { r: -a0 });
    show(g, cue(4, k * .15));
    turn(g, -(84 + k * 4), cue(4, 1), 2);
  });
  const up = arrow(C2[0] + 230, C2[1] + 20, C2[0] + 230, C2[1] - 170, { class: 'c1', 'stroke-width': 7 });
  draw(up, cue(4, .6));
  const ul = label(C2[0] + 300, C2[1] - 200, 'αv', { size: 28, class: 'c1' });
  show(ul, cue(4, .6));
  const al = box(C2[0], 200, 520, 0, 'все токены похожи: внимание их не различает → цикл и мусор', { size: 26, class: 'bad' });
  show(al, cue(4, 2.6));
});

scene('spread', () => {
  const T = 300, B = 760, th = 70;
  text(400, 70, 'толчок одной и той же длины', { size: 26 });
  const top = group(0, 0);
  text(120, 140, 'признак', { size: 26, class: 'c1', parent: top });
  line(60, T, 740, T, { 'stroke-width': 2, parent: top });
  line(60, T - th, 740, T - th, { class: 'c3', 'stroke-dasharray': '8 6', 'stroke-width': 2, parent: top });
  for (let i = 0; i < 12; i++) rect(90 + i * 54, i === 5 ? T - 160 : T - 4, 34, i === 5 ? 160 : 4, { class: 'fill ' + (i === 5 ? 'c1' : 'soft'), stroke: 'none', parent: top });
  label(400, 110, 'вся сила — в один признак, выше порога', { size: 24, class: 'c1', parent: top });
  show(top, cue(1));
  const bot = group(0, 0);
  text(120, 500, 'нейрон 42', { size: 26, class: 'c3', parent: bot });
  line(60, B, 740, B, { 'stroke-width': 2, parent: bot });
  line(60, B - th, 740, B - th, { class: 'c3', 'stroke-dasharray': '8 6', 'stroke-width': 2, parent: bot });
  [30, 18, 42, 25, 36, 12, 40, 22, 33, 15, 28, 38].forEach((h, i) => rect(90 + i * 54, B - h, 34, h, { class: 'fill c0', stroke: 'none', parent: bot }));
  label(560, 520, 'по ~0.044 на многие признаки', { size: 24, class: 'c0', parent: bot });
  label(400, B + 40, 'всё ниже порога → срезано, как у случайного', { size: 24, class: 'c0', parent: bot });
  show(bot, cue(2));
  const c = box(400, 410, 680, 0, 'нейрон: грамматика цела, смысла нет · признак: смысл, но есть порог', { size: 24, class: 'c2' });
  show(c, cue(3));
});
