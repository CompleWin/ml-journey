// Part 8: false echoes without a threshold, and what a rising threshold cuts.

function gauss() {
  const u = Math.max(random(), 1e-9), v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const BASE = 470, K = 380;

scene('echo', () => {
  const J = 12, r = .8;
  line(90, BASE, 1520, BASE, { 'stroke-width': 2 });
  text(805, 760, 'номер признака i (40 штук)', { size: 26, class: 'soft' });
  const own = rect(100 + J * 35, BASE - r * K, 26, r * K, { class: 'fill c1', stroke: 'none' });
  const ol = label(100 + J * 35 + 13, BASE - r * K - 40, 'признак j: r', { size: 28, class: 'c1' });
  pulse(own, cue(1));
  const ok = label(100 + J * 35 + 13, BASE - r * K - 95, 'восстановлен точно', { size: 26, class: 'c2' });
  show(ok, cue(1, .3));
  let pos = 0;
  for (let i = 0; i < 40; i++) {
    if (i === J) continue;
    const g = Math.max(-.85, Math.min(.85, gauss() * .31)), v = g * r;
    const x = 100 + i * 35;
    const b = v >= 0
      ? rect(x, BASE - v * K, 26, v * K, { class: 'fill c0', stroke: 'none' })
      : rect(x, BASE, 26, -v * K, { class: 'fill c0', stroke: 'none' });
    show(b, cue(2, i * .03));
    if (v < 0) { set(b, 'height', 0, cue(3), .8); }
    else { recolor(b, 'bad', cue(3, .6)); pos++; }
  }
  const il = label(800, 140, 'отклик i: r · ⟨wᵢ, wⱼ⟩', { size: 30, class: 'c0' });
  show(il, cue(2, .5));
  const rl = chip(400, 700, 'ReLU: отрицательное → 0', { size: 28 });
  pop(rl, cue(3));
  const el = chip(1150, 700, 'осталось ≈ 20 ложных эхо', { size: 28, class: 'bad' });
  pop(el, cue(3, .8));
});

scene('cut', () => {
  const bars = [
    { v: .8, cls: 'c1', name: 'настоящий' }, { v: .12, cls: 'bad' }, { v: .3, cls: 'bad' }, { v: .06, cls: 'bad' },
    { v: .22, cls: 'c2', name: 'слабый настоящий' }, { v: .18, cls: 'bad' }, { v: .26, cls: 'bad' }, { v: .09, cls: 'bad' },
  ];
  line(200, BASE + 100, 1400, BASE + 100, { 'stroke-width': 2 });
  const base = BASE + 100;
  const rects = bars.map((b, i) => {
    const x = 260 + i * 145;
    rect(x, base - b.v * K, 80, b.v * K, { class: b.cls, 'stroke-dasharray': '6 6', 'stroke-width': 2 });
    return [rect(x, base - b.v * K, 80, b.v * K, { class: 'fill ' + b.cls, stroke: 'none' }), b, x];
  });
  label(300, base + 50, 'настоящий', { size: 26, class: 'c1' });
  label(300 + 4 * 145, base + 50, 'слабый настоящий', { size: 26, class: 'c2' });
  label(1100, 160, 'ложные эхо — красные', { size: 26, class: 'bad' });
  const bLine = line(200, base, 1400, base, { class: 'c3', 'stroke-width': 5 });
  const bl = label(1460, base, 'b', { size: 32, class: 'c3' });
  const B = .27, t0 = cue(1), t1 = cue(1) + 2.5;
  const bAt = t => t <= t0 ? 0 : t >= t1 ? B : B * (t - t0) / (t1 - t0);
  clock(t => {
    const b = bAt(t), y = base - b * K;
    bLine.setAttribute('y1', y); bLine.setAttribute('y2', y);
    pose(bl, { y });
    rects.forEach(([e, d]) => {
      const h = Math.max(0, d.v - b) * K;
      e.setAttribute('y', base - h); e.setAttribute('height', h);
    });
  });
  const c1 = chip(800, 760, 'ниже порога → 0: эхо исчезли', { size: 28, class: 'c3' });
  pop(c1, cue(1, 2.6));
  const minus = arrow(370, base - .8 * K, 370, base - (.8 - B) * K, { class: 'c1', head: 'both', 'stroke-width': 3 });
  draw(minus, cue(2));
  const ml = label(470, base - (.8 - B / 2) * K, '− b', { size: 28, class: 'c1' });
  show(ml, cue(2, .3));
  const lost = label(300 + 4 * 145, base - .45 * K, 'пропал целиком', { size: 26, class: 'c2' });
  show(lost, cue(2, .8));
});
