/* Simple Clarificator player: plays window.SCENARIO from build.py (chapters, narration, captions, blocks, scenes, quizzes).
   Playback driven by the audio clock, step seeking, captions and speed follow Papermorph's player, and the scene
   timeline (element state written by render, tweens on the step clock) follows its engine
   (engine/engine.js, MIT License, Copyright (c) 2026 TedKaczynski). */
'use strict';

// MathJax reads this configuration when lib/mathjax.js loads after this file.
window.MathJax = {
  startup: { typeset: false },
  svg: { fontCache: 'none' },
  tex: { packages: { '[-]': ['noerrors', 'noundefined'] }, formatError: (_, error) => { throw error; } },
  options: { enableMenu: false },
};

const SC = window.SCENARIO, STEPS = SC.steps, CH = SC.chapters, MULTI = CH.length > 1, ARGS = new URLSearchParams(location.search);
const CHECK = ARGS.has('check'), PAD = .7, SPEEDS = [.75, 1, 1.25, 1.5, 2];
const UI = SC.ui;   // interface strings of the scenario language, from ui.json

const $ = id => document.getElementById(id);
function h(tag, cls, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids.flat()) if (k != null) e.append(k);
  return e;
}
function sv(tag, attrs = {}, parent) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (parent) parent.append(e);
  return e;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const local = s => (SC.lang === 'ru' ? s.replace('.', ',') : s).replace('-', '−');
function plural(n, forms) {   // ru: one, few, many; en: one, other
  if (forms.length < 3) return forms[n === 1 ? 0 : 1];
  const d = n % 10, dd = n % 100;
  return forms[d === 1 && dd !== 11 ? 0 : d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? 1 : 2];
}
const EASE = {
  io: p => p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2,
  out: p => 1 - (1 - p) ** 3,
  back: p => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2,
  lin: p => p,
  soft: p => (1 - Math.cos(Math.PI * p)) / 2,
};
const still = () => CHECK || document.body.classList.contains('still');

/* ---------- errors, formulas, text ---------- */
const ERRORS = [];
function report(loc, field, error) {
  complain(`${loc[0]}: ${loc[1]}${field}: ${error && error.message || error}`);
}
function complain(line) {
  ERRORS.push(line);
  if (!CHECK) console.error(line);
}
const TEX = new Map();
function tex(src, display) {
  const key = (display ? 'D' : 'I') + src;
  if (!TEX.has(key)) {
    if (!window.MathJax || !MathJax.tex2svg) throw new Error('lib/mathjax.js did not load');
    TEX.set(key, MathJax.tex2svg(src, { display }));
  }
  return TEX.get(key).cloneNode(true);
}
function math(src, display, fail) {
  try { return tex(src, display); } catch (e) { fail(new Error(`$${src}$: ${e.message}`)); return h('span', 'bad', src); }
}
// Tokens from build.py: t text, b bold, i italic, c code, m formula, M display formula.
function inline(tokens, fail) {
  const span = h('span', 'rich');
  for (const [k, v] of tokens || []) {
    if (k === 't') span.append(v);
    else if (k === 'm' || k === 'M') span.append(math(v, k === 'M', fail));
    else span.append(h({ b: 'strong', i: 'em', c: 'code' }[k], null, v));
  }
  return span;
}
function paras(list, fail) {
  const box = h('div', 'md'), units = [];
  let group = null, kind = null;
  for (const [k, tokens] of list) {
    let el;
    if (k === 'ul' || k === 'ol') {
      if (kind !== k) box.append(group = h(k));
      el = h('li', null, inline(tokens, fail));
      group.append(el);
    } else box.append(el = h(k === 'h' ? 'h3' : 'p', null, inline(tokens, fail)));
    kind = k;
    units.push([el]);
  }
  return { el: box, units };
}

/* ---------- blocks ----------
   BLOCKS[type](b, fail, ctx) -> { el, units, extra?, after?, tick?, look?, mark?, state?, end? }
   units: reveal units (lists of elements, or functions on(shown)); extra: units that exist whatever the reveal mode
   (flows, trace stops). ctx: { times: reveal times of this block's units, kept: the block stays from the previous
   step, from: its look there, cues, dur }. A kept block starts from its old look, then mark(state) changes it smoothly. */
const BLOCKS = {};
BLOCKS.text = (b, fail) => paras(b.paras, fail('.md'));

BLOCKS.formula = (b, fail, ctx) => {
  const el = h('div', 'formula');
  if (!b.parts) { el.append(math(b.tex, true, fail('.tex'))); return { el, units: [[el]] }; }
  let m;
  try { m = tex(b.parts.map((p, i) => `\\class{sc-p${i}}{${p.tex}}`).join(''), true); }
  catch (e) {
    const bad = b.parts.findIndex(p => { try { tex(p.tex, true); return false; } catch { return true; } });
    fail(bad < 0 ? '.parts' : `.parts[${bad + 1}].tex`)(bad < 0 ? e : new Error(`$${b.parts[bad].tex}$: ${e.message}`));
    m = h('span', 'bad', b.parts.map(p => p.tex).join(' '));
  }
  el.append(m);
  const groups = b.parts.map((_, i) => m.querySelector(`.sc-p${i}`));
  groups.forEach(g => g && g.classList.add('part'));
  const notes = b.parts.map((p, i) => p.note ? h('div', 'note', h('i', 'brace'), h('i', 'stem'),
    h('span', null, inline(p.note, fail(`.parts[${i + 1}].note`)))) : null);
  notes.forEach(n => n && el.append(n));
  let cur;
  const mark = look => { cur = look; groups.forEach((g, i) => g && g.classList.toggle('hl', look.hl.includes(i))); };
  mark(ctx.from || { hl: b.hl });
  return { el, units: b.parts.map((_, i) => [groups[i], notes[i]].filter(Boolean)), after: () => placeNotes(el, groups, notes),
    look: () => cur, mark, state: { hl: b.hl } };
};
// Notes sit under their parts; a note that would overlap its neighbour drops one row lower on a longer stem.
function placeNotes(el, groups, notes) {
  const box = el.getBoundingClientRect(), svg = el.querySelector('svg');
  if (!svg || !notes.some(Boolean)) return;
  const top = svg.getBoundingClientRect().bottom - box.top + 4, rows = [];
  let depth = 0;
  notes.forEach((n, i) => {
    if (!n || !groups[i]) return;
    const r = groups[i].getBoundingClientRect(), mid = r.left - box.left + r.width / 2;
    n.querySelector('.brace').style.width = r.width + 'px';
    Object.assign(n.style, { left: mid + 'px', top: top + 'px' });
    const w = n.querySelector('span').offsetWidth / 2 + 8;
    let row = rows.findIndex(spans => spans.every(([a, c]) => mid + w < a || mid - w > c));
    if (row < 0) row = rows.push([]) - 1;
    rows[row].push([mid - w, mid + w]);
    n.querySelector('.stem').style.height = 6 + row * 1.6 * parseFloat(getComputedStyle(n).fontSize) + 'px';
    depth = Math.max(depth, n.offsetHeight);
  });
  el.style.paddingBottom = depth + 12 + 'px';
}

BLOCKS.derivation = (b, fail, ctx) => {
  const el = h('div', 'deriv'), units = [];
  b.lines.forEach((line, i) => {
    const f = fail(`.lines[${i + 1}]`), side = s => math(s, false, f);
    const cells = [h('div', 'dl', line.l == null ? null : side(line.l)), h('div', 'dr', side(line.r)),
      h('div', 'dn', line.note ? inline(line.note, f) : null)];
    el.append(...cells);
    units.push(cells);
  });
  let cur;
  const mark = look => { cur = look; units.forEach((cells, i) => cells.forEach(c => c.classList.toggle('hl', look.hl.includes(i)))); };
  mark(ctx.from || { hl: b.hl });
  return { el, units, mark, look: () => cur, state: { hl: b.hl } };
};

BLOCKS.table = (b, fail, ctx) => {
  const rows = SC.data[b.data] || [], body = h('tbody'), units = [], cells = [];
  const heads = b.heads.map(t => h('th', null, inline(t, fail('.labels'))));
  rows.forEach(row => {
    const tds = b.cols.map(c => h('td', null, typeof row[c] === 'string' ? row[c] : inline(row[c], fail('.rows'))));
    const tr = h('tr', null, tds);
    body.append(tr);
    units.push([tr]);
    cells.push(tds);
  });
  const lit = (L, i, j) => L.cols.includes(j) || L.cells.some(([r, c]) => r === i && c === j);
  let ready = false, cur;
  const mark = L => {
    cur = L;
    heads.forEach((th, j) => th.classList.toggle('hl', lit(L, -1, j)));
    cells.forEach((tds, i) => {
      const row = L.rows.includes(i);
      tds.forEach((td, j) => {
        const on = row || lit(L, i, j), was = td.classList.contains('hl');
        td.classList.toggle('hl', on);
        if (on && !was && ready && !still()) { td.classList.remove('flash'); void td.offsetWidth; td.classList.add('flash'); }
      });
    });
  };
  mark(ctx.from || b.hl);
  ready = true;
  return { el: h('div', 'tablebox', h('table', null, h('thead', null, h('tr', null, heads)), body)), units, mark, look: () => cur, state: b.hl };
};

function niceTicks(a, b) {
  const raw = (b - a) / 6, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  const step = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p, out = [];
  for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  const places = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return out.map(v => [v, local(v.toFixed(places))]);
}
let uid = 0;   // ids of clip paths
BLOCKS.plot = (b, fail, ctx) => {
  const W = 640, H = 380, L = 62, R = 18, T = 14, B = 40, id = ++uid;
  const names = b.params.map(p => p.name), val = Object.fromEntries(b.params.map(p => [p.name, p.value]));
  const fns = b.fns.map((f, i) => {
    try { return new Function('x', ...names, `return ${f.js};`); }
    catch (e) { fail(`.fn[${i + 1}]`)(e); return () => NaN; }
  });
  const call = (f, x, v) => { try { return f(x, ...names.map(n => v[n])); } catch { return NaN; } };
  const xs = [], ys = [];
  b.series.forEach(s => s.pts.forEach(([x, y, xe, ye]) => { xs.push(x - xe, x + xe); ys.push(y - ye, y + ye); }));
  const span = (lo, hi, zero) => {
    if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    const d = hi - lo || Math.abs(hi) || 1;
    return [lo === 0 && zero ? 0 : lo - d * .06, hi === 0 && zero ? 0 : hi + d * .06];
  };
  const [x0, x1] = b.xr || span(Math.min(...xs), Math.max(...xs), b.origin);
  const sets = [val];
  if (b.sweep) for (const v of [b.sweep.from, b.sweep.to]) sets.push({ ...val, [b.sweep.name]: v });
  fns.forEach((f, i) => {
    let found = false;
    for (const v of sets) for (let k = 0; k <= 120; k++) {
      const y = call(f, x0 + (x1 - x0) * k / 120, v);
      if (Number.isFinite(y)) { ys.push(y); found = true; }
    }
    if (!found) fail(`.fn[${i + 1}]`)(new Error('gives no finite value on the x range'));
  });
  b.fits.forEach(f => ys.push(f.a * x0 + f.b, f.a * x1 + f.b));
  const [y0, y1] = b.yr || (ys.length ? span(Math.min(...ys), Math.max(...ys), b.origin) : [0, 1]);
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => H - B - (y - y0) / (y1 - y0) * (H - T - B);
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img' }), defs = sv('defs', {}, svg);
  sv('rect', { x: L, y: T, width: W - L - R, height: H - T - B }, sv('clipPath', { id: `clip${id}` }, defs));
  const grid = sv('g', { class: 'grid' }, svg);
  for (const [v, s] of niceTicks(x0, x1)) {
    sv('line', { x1: X(v), x2: X(v), y1: T, y2: H - B, class: v === 0 ? 'zero' : '' }, grid);
    sv('text', { x: X(v), y: H - B + 18, 'text-anchor': 'middle' }, grid).textContent = s;
  }
  for (const [v, s] of niceTicks(y0, y1)) {
    sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: v === 0 ? 'zero' : '' }, grid);
    sv('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end' }, grid).textContent = s;
  }
  sv('path', { d: `M${L},${T}V${H - B}H${W - R}`, class: 'axis' }, svg);
  const plotArea = sv('g', { 'clip-path': `url(#clip${id})` }, svg), legend = h('div', 'legend'), layers = [];
  const key = (cls, label, f) => { const k = h('span', 'key ' + cls, h('i'), label && inline(label, f)); legend.append(k); return k; };
  // A series shows its points one after another; a fit or a curve draws itself from left to right behind a clip.
  const wipe = g => {
    const rect = sv('rect', { x: L, y: 0, width: W - L - R, height: H }, sv('clipPath', { id: `wipe${id}-${layers.length}` }, defs));
    g.setAttribute('clip-path', `url(#wipe${id}-${layers.length})`);
    let shown = null;
    return dt => {
      const q = EASE.io(clamp(dt / .9, 0, 1));
      if (q !== shown) rect.setAttribute('width', (W - L - R) * (shown = q));
    };
  };
  b.series.forEach((s, i) => {
    const g = sv('g', { class: `series c${i % 4}` }, plotArea), pts = [];
    for (const [x, y, xe, ye] of s.pts) {
      const bars = [];
      if (ye) bars.push(sv('line', { x1: X(x), x2: X(x), y1: Y(y - ye), y2: Y(y + ye), class: 'err' }, g));
      if (xe) bars.push(sv('line', { x1: X(x - xe), x2: X(x + xe), y1: Y(y), y2: Y(y), class: 'err' }, g));
      pts.push({ dot: sv('circle', { cx: X(x), cy: Y(y), r: 4.5 }, g), bars, q: null });
    }
    const gap = Math.min(.12, 1.2 / Math.max(pts.length, 1));
    const show = dt => pts.forEach((p, j) => {
      const q = clamp((dt - j * gap) / .35, 0, 1);
      if (q === p.q) return;
      p.q = q;
      p.dot.setAttribute('r', +(4.5 * EASE.back(q)).toFixed(2));
      p.bars.forEach(bar => bar.setAttribute('opacity', q));
    });
    layers.push({ keys: [b.series.length > 1 || b.fits.length ? key(`c${i % 4} dot`, s.label, fail('.y')) : null], show });
  });
  if (b.fits.length) {
    const g = sv('g', { class: 'fit' }, plotArea);
    const keys = b.fits.map((f, i) => {
      sv('line', { x1: X(x0), y1: Y(f.a * x0 + f.b), x2: X(x1), y2: Y(f.a * x1 + f.b), class: `c${i % 4}` }, g);
      return key(`c${i % 4} line`, [['t', f.eq]], fail('.fit'));
    });
    layers.push({ keys, show: wipe(g) });
  }
  const paths = fns.map((f, i) => {
    const g = sv('g', { class: `fn c${(i + b.series.length) % 4}` }, plotArea);
    layers.push({ keys: [b.fns[i].label ? key(`c${(i + b.series.length) % 4} line`, b.fns[i].label, fail(`.fn[${i + 1}]`)) : null], show: wipe(g) });
    return sv('path', {}, g);
  });
  const redraw = () => paths.forEach((p, i) => {
    let d = '', pen = 'M';
    for (let k = 0; k <= 400; k++) {
      const x = x0 + (x1 - x0) * k / 400, y = call(fns[i], x, val);
      if (!Number.isFinite(y)) { pen = 'M'; continue; }
      d += `${pen}${X(x).toFixed(1)},${clamp(Y(y), -1e4, 1e4).toFixed(1)}`;
      pen = 'L';
    }
    p.setAttribute('d', d);
  });
  redraw();
  let touched = false;
  const sliders = b.params.map(p => {
    const out = h('output'), input = h('input');
    Object.assign(input, { type: 'range', min: p.min, max: p.max, step: (p.max - p.min) / 200, value: p.value });
    const show = () => { out.textContent = local(String(+val[p.name].toPrecision(3))); };
    input.oninput = () => { touched = true; val[p.name] = +input.value; show(); redraw(); };
    show();
    return { name: p.name, input, show, el: h('label', 'param', h('span', null, inline([['m', p.name]], fail('.params')), ' = '), out, input) };
  });
  const el = h('div', 'plot' + (sliders.length ? ' tuned' : ''), h('div', 'plotbox',
    b.ylabel && h('div', 'ylabel', inline(b.ylabel, fail('.ylabel'))), svg, b.xlabel && h('div', 'xlabel', inline(b.xlabel, fail('.xlabel'))),
    legend.childNodes.length ? legend : null, sliders.length ? h('div', 'params', sliders.map(s => s.el)) : null));
  // Layers draw at their reveal times; a fresh plot without a reveal draws them all at the start, a kept one stands.
  const times = b.reveal !== 'all' ? ctx.times : ctx.kept ? null : layers.map(() => 0);
  const tick = (t, dur) => {
    if (times) layers.forEach((l, k) => {
      const dt = t - (times[k] || 0);
      l.show(dt);
      l.keys.forEach(e => e && (e.style.opacity = dt >= -.05 ? '' : 0));
    });
    if (!b.sweep || touched) return;
    const s = b.sweep, v = s.from + (s.to - s.from) * clamp(dur ? t / dur : 1, 0, 1), sl = sliders.find(x => x.name === s.name);
    if (val[s.name] === v) return;
    val[s.name] = v; sl.input.value = v; sl.show(); redraw();
  };
  return { el, units: layers.map(() => () => {}), tick };
};

const FLOW_SECS = 1.2, FLOW_SPAN = [.12, .88];   // a token's ride along its edge, which stops short of the nodes
BLOCKS.diagram = (b, fail, ctx) => {
  const el = h('div', 'diagram' + (b.reveal === 'all' && !ctx.kept ? ' all' : '')), svg = sv('svg', { class: 'wires' });
  el.style.height = Math.max(6, b.size[1] * 5.2) + 'em';
  el.append(svg);
  const nodes = b.nodes.map((n, i) => {
    const d = h('div', 'node', inline(n.label, fail(`.nodes[${i + 1}]`)));
    Object.assign(d.style, { left: n.x * 100 + '%', top: n.y * 100 + '%', '--k': i });
    el.append(d);
    return d;
  });
  const edges = b.edges.map((e, i) => {
    const g = sv('g', { class: 'edge', style: `--k: ${i}` }, svg), path = sv('path', { pathLength: 1 }, g);
    const tips = [e.dir ? sv('path', { class: 'tip' }, g) : null, e.dir === 2 ? sv('path', { class: 'tip' }, g) : null];
    const label = e.label ? h('div', 'elabel', inline(e.label, fail(`.edges[${i + 1}]`))) : null;
    if (label) el.append(label);
    return { e, g, path, tips, label };
  });
  const flows = b.flows.map((f, i) => {
    const token = h('div', 'flow', f.label ? inline(f.label, fail(`.flow[${i + 1}]`)) : null);
    el.append(token);
    return { ...f, token, o: null };
  });
  // Layout sizes, not screen boxes: a hidden node is shrunk for its pop, and a kept block may be gliding.
  const after = () => {
    svg.setAttribute('viewBox', `0 0 ${el.offsetWidth} ${el.offsetHeight}`);
    const rs = nodes.map(n => ({ x: n.offsetLeft, y: n.offsetTop, w: n.offsetWidth / 2 + 5, h: n.offsetHeight / 2 + 5 }));
    const edge = (P, Q) => { const dx = Q.x - P.x, dy = Q.y - P.y, k = Math.min(P.w / Math.abs(dx || 1e-9), P.h / Math.abs(dy || 1e-9), 1); return { x: P.x + dx * k, y: P.y + dy * k }; };
    const hits = (A, B, skip) => rs.some((R, k) => !skip.includes(k) && [.25, .5, .75].some(t => {
      const x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t;
      return Math.abs(x - R.x) < R.w && Math.abs(y - R.y) < R.h;
    }));
    // An arrowhead is its own path, so a line can draw itself before its head shows.
    const head = (C, Q) => {
      const a = Math.atan2(Q.y - C.y, Q.x - C.x), l = 11, w = .45;
      return `M${Q.x},${Q.y}L${Q.x - l * Math.cos(a - w)},${Q.y - l * Math.sin(a - w)}L${Q.x - l * Math.cos(a + w)},${Q.y - l * Math.sin(a + w)}Z`;
    };
    for (const x of edges) {
      const A = rs[x.e.a], B = rs[x.e.b];
      const twin = edges.some(y => y !== x && y.e.a === x.e.b && y.e.b === x.e.a);
      const bend = hits(A, B, [x.e.a, x.e.b]) ? .32 : twin ? .14 : 0;
      const C = { x: (A.x + B.x) / 2 - (B.y - A.y) * bend, y: (A.y + B.y) / 2 + (B.x - A.x) * bend };
      const p = edge(A, bend ? C : B), q = edge(B, bend ? C : A), M = bend ? C : { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      x.path.setAttribute('d', `M${p.x},${p.y}Q${M.x},${M.y} ${q.x},${q.y}`);
      if (x.tips[0]) x.tips[0].setAttribute('d', head(M, q));
      if (x.tips[1]) x.tips[1].setAttribute('d', head(M, p));
      if (x.label) Object.assign(x.label.style, { left: (p.x + 2 * M.x + q.x) / 4 + 'px', top: (p.y + 2 * M.y + q.y) / 4 + 'px' });
    }
    flows.forEach(f => { f.o = null; });
  };
  let cur;
  const mark = look => {
    cur = look;
    nodes.forEach((n, i) => n.classList.toggle('hl', look.nodes.includes(i)));
    edges.forEach((x, i) => x.g.classList.toggle('hl', look.edges.includes(i)));
  };
  mark(ctx.from || b.hl);
  // Each reveal unit names its nodes and edges (build.py groups them); each flow is one more unit.
  const units = b.groups.map(g => [...g.n.map(k => nodes[k]), ...g.e.flatMap(k => [edges[k].g, edges[k].label])].filter(Boolean));
  const starts = flows.length ? ctx.times.slice(-flows.length) : [];
  // A token rides its edge from its reveal time and parks at the end until the next flow starts; its edge lights up.
  const tick = t => {
    if (!flows.length) return;
    const live = new Set();
    flows.forEach((f, k) => {
      const dt = t - (starts[k] || 0), path = edges[f.edge].path, len = path.getTotalLength();
      if (!len) return;
      const q = EASE.io(clamp(dt / FLOW_SECS, 0, 1)), [a, z] = FLOW_SPAN, along = a + (z - a) * q;
      const at = path.getPointAtLength(len * (f.rev ? 1 - along : along));
      const next = starts[k + 1], o = next != null && t > next ? 1 - clamp((t - next) / .3, 0, 1) : 1;
      const pos = `${at.x.toFixed(1)}:${at.y.toFixed(1)}:${o}`;
      if (pos !== f.o) { f.o = pos; Object.assign(f.token.style, { left: at.x + 'px', top: at.y + 'px', opacity: o === 1 ? '' : o }); }
      if (dt >= 0 && dt < FLOW_SECS) live.add(f.edge);
    });
    edges.forEach((x, i) => x.g.classList.toggle('live', live.has(i)));
  };
  return { el, units, extra: flows.map(f => [f.token]), after, tick, mark, look: () => cur, state: b.hl };
};

BLOCKS.figure = (b, fail) => {
  const img = h('img');
  Object.assign(img, { src: b.src, alt: '' });
  const box = h('div', 'figbox', img);
  const units = b.marks.map((m, i) => {
    const d = h('div', 'mark' + (m.x > .62 ? ' left' : ''), h('i'), h('span', null, inline(m.text, fail(`.marks[${i + 1}]`))));
    Object.assign(d.style, { left: m.x * 100 + '%', top: m.y * 100 + '%' });
    box.append(d);
    return [d];
  });
  return { el: h('figure', 'figure', box), units };
};

BLOCKS.compare = (b, fail) => {
  const el = h('div', 'compare ' + b.style);
  const side = (k, i) => {
    const col = h('div', 'side ' + k, b.titles ? h('div', 'stitle', inline(b.titles[i], fail('.titles'))) : null, paras(b[k], fail('.' + k)).el);
    el.append(col);
    return [col];
  };
  return { el, units: [side('left', 0), side('right', 1)] };
};

const colorCode = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/(#.*$|\/\/.*$)|("[^"]*"|'[^']*')|\b(\d+(?:\.\d+)?)\b/g,
  (m, c, q, n) => `<span class="${c ? 'cm' : q ? 'st' : 'nm'}">${m}</span>`);
// Highlighted lines lie on bands that slide from line to line: along a trace, and from one step's highlight to the next.
BLOCKS.code = (b, fail, ctx) => {
  const pre = h('pre'), bands = [];
  const lines = b.lines.map(line => {
    const d = h('div', 'ln');
    d.innerHTML = colorCode(line) || ' ';
    pre.append(d);
    return d;
  });
  let lit = ctx.from ? ctx.from.lines : b.hl, placed = false;
  const reached = b.trace.map(() => false), stop = () => reached.lastIndexOf(true);
  const active = () => stop() >= 0 ? b.trace[stop()] : lit;
  const place = () => {
    if (!placed) return;
    const runs = [];
    for (const i of [...new Set(active())].sort((x, y) => x - y)) {
      if (runs.length && runs[runs.length - 1][1] === i - 1) runs[runs.length - 1][1] = i; else runs.push([i, i]);
    }
    runs.forEach(([a, z], k) => {
      const band = bands[k] || (bands[k] = pre.insertBefore(h('div', 'band gone'), pre.firstChild));
      const top = lines[a].offsetTop, bottom = lines[z].offsetTop + lines[z].offsetHeight;
      Object.assign(band.style, { top: top + 'px', height: bottom - top + 'px' });
      band.classList.remove('gone');
    });
    bands.slice(runs.length).forEach(band => band.classList.add('gone'));
  };
  const after = () => {
    if (!placed) {   // the first bands appear in place; later moves slide
      placed = true;
      place();
      bands.forEach(band => { band.style.transition = 'none'; void band.offsetWidth; band.style.transition = ''; });
    } else place();
  };
  const extra = b.trace.map((_, k) => on => { reached[k] = on; place(); });
  return { el: h('div', 'codebox', b.lang ? h('div', 'lang', b.lang) : null, pre), units: lines.map(d => [d]), extra, after,
    look: () => ({ lines: active() }), mark: look => { lit = look.lines; place(); }, state: { lines: b.hl } };
};

BLOCKS.cards = (b, fail) => {
  const el = h('div', 'cards');
  const units = b.cards.map((c, i) => {
    const f = fail(`.items[${i + 1}]`), card = h('button', 'card', h('div', 'cq', inline(c.q, f)), h('div', 'ca', inline(c.a, f)));
    card.onclick = () => card.classList.toggle('open');
    el.append(card);
    return [card];
  });
  return { el, units };
};

/* ---------- scenes: the scenario's own drawings and motion from its .js files (scenes.md has the contract) ----------
   Every drawn element keeps a state { x y s r o d, a:<attr>, col, n } that paint() writes to the DOM. x, y place the
   element's anchor (a group's origin, a shape's centre); s and r scale and turn about it. Motion helpers add tweens to
   the scene's timeline; the timeline gives every state as a function of the step time, so pause and seeking show the
   same frame as playback. */
const ART = { to: null, tl: null, clocks: null, ctx: null, seed: 0, loading: null }, SEED = 20261013;
const FILES = {};   // scene file name -> { name, index, scenes: Map name -> { f, line }, setD, ok }
const COLORS = { c0: '--c0', c1: '--c1', c2: '--c2', c3: '--c3', hl: '--hl', soft: '--muted', ink: '--ink', good: '--good', bad: '--bad' };
const GEOMETRY = new Set(['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect']);
const num = v => Math.round(v * 100) / 100;

function stackLine(file, e) {
  const key = `sc-scene/f${file.index}.js:`, s = String(e && e.stack || ''), i = s.indexOf(key);
  return i < 0 ? '' : ':' + parseInt(s.slice(i + key.length), 10);
}
function artError(file, where, e, also = '') {
  const text = e instanceof Error ? (e.name === 'Error' ? '' : e.name + ': ') + e.message : String(e);
  complain(`${file.name}${e instanceof Error ? stackLine(file, e) : ''}: ${where ? where + ': ' : ''}${also}${text}`);
}

// The state starts from what was drawn: the anchor in place, the opacity and transform the drawing gave.
function state(e) {
  if (e._st) return e._st;
  let ax = 0, ay = 0;
  if (!e._group) { try { const b = e.getBBox(); ax = b.x + b.width / 2; ay = b.y + b.height / 2; } catch {} }
  Object.assign(e, { _a: [ax, ay], _tf0: e.getAttribute('transform'), _o: e.hasAttribute('opacity') ? +e.getAttribute('opacity') : 1 });
  e._tf = e._tf0;
  return e._st = { x: e._group ? e._gx : ax, y: e._group ? e._gy : ay, s: 1, r: 0, o: e._o };
}
function paint(e) {
  const s = e._st, [ax, ay] = e._a;
  const moved = s.x !== ax || s.y !== ay || s.s !== 1 || s.r;
  const own = moved ? `translate(${num(s.x)},${num(s.y)})${s.r ? ` rotate(${num(s.r)})` : ''}${s.s !== 1 ? ` scale(${+s.s.toFixed(4)})` : ''}` +
    (ax || ay ? ` translate(${num(-ax)},${num(-ay)})` : '') : null;
  const tf = [own, e._tf0].filter(Boolean).join(' ') || null;
  if (tf !== e._tf) { if (tf) e.setAttribute('transform', tf); else e.removeAttribute('transform'); e._tf = tf; }
  if (s.o !== e._o) { if (s.o === 1) e.removeAttribute('opacity'); else e.setAttribute('opacity', +s.o.toFixed(3)); e._o = s.o; }
  if (s.d !== undefined && s.d !== e._d) { drawn(e, s.d); e._d = s.d; }
  if (s.col !== undefined && s.col !== e._col) { e.style.color = s.col || ''; e._col = s.col; }
  if (s.n !== undefined && s.n !== e._n) { counted(e, s.n); e._n = s.n; }
  for (const k in s) if (k.startsWith('a:') && s[k] !== e['_' + k]) { e.setAttribute(k.slice(2), num(s[k])); e['_' + k] = s[k]; }
}
// draw(): lines dash in from their start; texts, heads and fills join at the end.
function drawn(e, d) {
  if (!e._parts) {
    const lines = [], late = [];
    const walk = n => {
      if (n._late || n.tagName === 'text' || n.classList.contains('sc-tex')) return late.push(n);
      if (GEOMETRY.has(n.tagName)) {
        n.setAttribute('pathLength', 1);
        n.setAttribute('stroke-dasharray', '1 2');
        return lines.push(n);
      }
      for (const c of n.children) walk(c);
    };
    walk(e);
    e._parts = { lines, late };
  }
  for (const p of e._parts.lines) {
    p.setAttribute('stroke-dashoffset', +(1 - d).toFixed(4));
    p.style.visibility = d < .002 ? 'hidden' : '';
    p.style.fillOpacity = clamp((d - .6) / .4, 0, 1);
  }
  for (const p of e._parts.late) p.style.opacity = clamp((d - .8) / .2, 0, 1);
}
function counted(e, v) {
  const tpl = e._tpl, s = local(v.toFixed(e._digits)), str = tpl.includes('#') ? tpl.replace('#', s) : s;
  if (e._setText) e._setText(str); else e.textContent = str;
}

function put(tag, base, attrs, into) {
  const { parent, ...rest } = attrs || {};
  const target = into || parent || ART.to;
  if (!target) throw new Error(`${tag === 'g' ? 'group' : tag}: draw inside a scene: scene('name', () => { ... })`);
  return sv(tag, { ...base, ...rest }, target);
}
function classed(attrs, cls) {
  return { ...attrs, class: `${cls} ${attrs && attrs.class || ''}`.trim() };
}
function makeGroup(x, y, attrs) {
  const g = put('g', {}, attrs);
  Object.assign(g, { _group: true, _gx: +x, _gy: +y });
  state(g);
  paint(g);
  return g;
}
function textEl(attrs, size, into) {
  return put('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': size }, attrs, into);
}
// Lines of text that fit width, broken at spaces and at \n.
function wrap(t, s, width) {
  const lines = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + word : word;
      t.textContent = test;
      if (line && width && t.getComputedTextLength() > width) { lines.push(line); line = word; } else line = test;
    }
    lines.push(line);
  }
  t.textContent = '';
  lines.forEach((l, k) => { sv('tspan', { x: 0, dy: k ? '1.2em' : `${-(lines.length - 1) * .6}em` }, t).textContent = l; });
  return lines.length;
}
function needEl(e, name) {
  if (!e || typeof e.setAttribute !== 'function') throw new Error(`${name}: the first argument is not a drawn element (got ${e})`);
}
function seconds(v, what, name) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new Error(`${name}: ${what} is ${v}; give seconds from 0, e.g. cue(1)`);
  return v;
}
function addTween(name, e, key, to, at, dur, ease, extra) {
  if (!ART.tl) throw new Error(`${name}: set motion inside a scene: scene('name', () => { ... })`);
  needEl(e, name);
  const f = typeof ease === 'function' ? ease : EASE[ease];
  if (!f) throw new Error(`${name}: unknown ease '${ease}'; eases: ${Object.keys(EASE).join(', ')}`);
  ART.tl.push({ e, key, to, t0: seconds(at, 'the start', name), dur: seconds(dur, 'the duration', name), ease: f, n: ART.tl.length, ...extra });
  return e;
}
const mixColor = (from, to, q) => q >= 1 ? to : q <= 0 ? from : `color-mix(in srgb, ${to} ${+(q * 100).toFixed(1)}%, ${from || 'currentColor'})`;
function baseOf(e, key) {
  if (key === 'd') return 1;
  if (key === 'col') { const c = [...e.classList].find(k => COLORS[k]); return c ? `var(${COLORS[c]})` : null; }
  if (key.startsWith('a:')) return parseFloat(e.getAttribute(key.slice(2))) || 0;
  return state(e)[key];
}

const HELPERS = {
  scene(name, f) {
    const file = ART.loading;
    if (!file) throw new Error('scene: call it at the top level of the file, not inside another scene');
    if (typeof name !== 'string' || !name) throw new Error(`scene: the name must be text, got ${name}`);
    if (typeof f !== 'function') throw new Error(`scene '${name}': the second argument must be a function () => { ... }`);
    const line = stackLine(file, new Error()).slice(1), first = file.scenes.get(name);
    if (first) complain(`${file.name}${line ? ':' + line : ''}: scene '${name}' is defined twice (first at line ${first.line})`);
    else file.scenes.set(name, { f, line });
  },
  cue(k, offset = 0) {
    const c = ART.ctx && ART.ctx.cues;
    if (!c) throw new Error('cue: use it inside a scene');
    if (!Number.isInteger(k) || k < 1 || k > c.length) throw new Error(c.length
      ? `cue(${k}): the step has ${c.length} [+] mark${c.length > 1 ? 's' : ''}, so cue takes 1 to ${c.length}`
      : `cue(${k}): the step has no [+] marks: put [+] in say before the words that start each motion`);
    return c[k - 1] + offset;
  },
  group: (x = 0, y = 0, attrs) => makeGroup(x, y, attrs),
  el: (tag, attrs, parent) => put(tag, {}, attrs, parent),
  line: (x1, y1, x2, y2, attrs) => put('line', { x1, y1, x2, y2 }, attrs),
  circle: (cx, cy, r, attrs) => put('circle', { cx, cy, r }, attrs),
  rect: (x, y, width, height, attrs) => put('rect', { x, y, width, height }, attrs),
  path: (d, attrs) => put('path', { d }, attrs),
  text(x, y, s, attrs) {
    const { size = 32, ...rest } = attrs || {};
    const t = put('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': size }, rest);
    t.textContent = s;
    return t;
  },
  tex(x, y, src, attrs) {   // a formula centred at x, y; size is its font size in drawing units
    if (/[\x00-\x1f]/.test(src)) throw new Error('tex: the JS string turned a backslash into a control character: write \\\\frac, not \\frac');
    const { size = 38, ...rest } = attrs || {};
    let m;
    try { m = tex(src, false).querySelector('svg'); } catch (e) { throw new Error(`tex $${src}$: ${e.message}`); }
    const [, , vw, vh] = m.getAttribute('viewBox').split(' ').map(Number), w = vw / 1000 * size, ht = vh / 1000 * size;
    m.removeAttribute('style');   // MathJax draws 1000 units to the em
    for (const [a, v] of Object.entries({ x: x - w / 2, y: y - ht / 2, width: w, height: ht })) m.setAttribute(a, v);
    const g = put('g', {}, classed(rest, 'sc-tex'));
    g._name = `$${src}$`;
    g.append(m);
    return g;
  },
  box(x, y, w, h, s, attrs) {   // centred at x, y; h 0 fits the text
    const { size = 30, ...rest } = attrs || {};
    const g = makeGroup(x, y, classed(rest, 'box')), plate = put('rect', {}, {}, g), t = textEl({}, size, g);
    g._setText = v => {
      g._str = String(v);
      const n = wrap(t, v, w - size * 1.2), ht = h || n * 1.2 * size + size;
      for (const [a, val] of Object.entries({ x: -w / 2, y: -ht / 2, width: w, height: ht, rx: Math.min(16, ht / 4) })) plate.setAttribute(a, val);
    };
    g._setText(s);
    return g;
  },
  label(x, y, s, attrs) {   // text on a plate, readable over lines
    const { size = 28, ...rest } = attrs || {};
    const g = makeGroup(x, y, classed(rest, 'label')), plate = put('rect', { rx: size * .3 }, {}, g), t = textEl({}, size, g);
    g._setText = v => {
      g._str = String(v);
      t.textContent = v;
      const w = t.getComputedTextLength() + size * .7, ht = size * 1.35;
      for (const [a, val] of Object.entries({ x: -w / 2, y: -ht / 2, width: w, height: ht })) plate.setAttribute(a, val);
    };
    g._setText(s);
    return g;
  },
  chip(x, y, s, attrs) {   // a token: a value, a packet of data
    const { size = 26, ...rest } = attrs || {};
    const g = makeGroup(x, y, classed(rest, 'chip')), plate = put('rect', {}, {}, g), t = textEl({}, size, g);
    g._setText = v => {
      g._str = String(v);
      t.textContent = v;
      const ht = size * 1.5, w = Math.max(ht, t.getComputedTextLength() + size * 1.1);
      for (const [a, val] of Object.entries({ x: -w / 2, y: -ht / 2, width: w, height: ht, rx: ht / 2 })) plate.setAttribute(a, val);
    };
    g._setText(s);
    return g;
  },
  arrow(x1, y1, x2, y2, attrs) {   // a group at the tail: move puts the tail, turn and scale act about it
    const { bend = 0, head = 'end', ...rest } = attrs || {};
    const g = makeGroup(x1, y1, classed(rest, 'arrow')), dx = x2 - x1, dy = y2 - y1;
    const cx = dx / 2 - dy * bend, cy = dy / 2 + dx * bend, hl = 20, hw = .42;
    const pull = (px, py, qx, qy) => { const l = Math.hypot(qx - px, qy - py) || 1; return [qx - (qx - px) / l * hl * .7, qy - (qy - py) / l * hl * .7]; };
    const tip = (px, py, qx, qy) => {
      const a = Math.atan2(qy - py, qx - px), p = put('path', { class: 'fill head', stroke: 'none',
        d: `M${qx},${qy}L${qx - hl * Math.cos(a - hw)},${qy - hl * Math.sin(a - hw)}L${qx - hl * Math.cos(a + hw)},${qy - hl * Math.sin(a + hw)}Z` }, {}, g);
      p._late = true;
      return p;
    };
    const [ex, ey] = head === 'none' ? [dx, dy] : pull(cx, cy, dx, dy), [sx, sy] = head === 'both' ? pull(cx, cy, 0, 0) : [0, 0];
    g.shaft = put('path', { d: `M${num(sx)},${num(sy)}Q${num(cx)},${num(cy)} ${num(ex)},${num(ey)}` }, {}, g);
    if (head !== 'none') tip(cx, cy, dx, dy);
    if (head === 'both') tip(cx, cy, 0, 0);
    return g;
  },
  axes(x, y, w, h, opts) {   // x, y: the top left corner of the plot area
    const { x: xr = [0, 1], y: yr = [0, 1], xlabel, ylabel, ticks = true, size = 24, ...rest } = opts || {};
    const g = put('g', {}, classed(rest, 'axes'));
    const X = v => x + (v - xr[0]) / (xr[1] - xr[0]) * w, Y = v => y + h - (v - yr[0]) / (yr[1] - yr[0]) * h;
    put('path', { d: `M${x},${y - 10}V${y + h}H${x + w + 10}` }, {}, g);
    if (ticks) {
      for (const [v, s] of niceTicks(xr[0], xr[1])) {
        put('line', { x1: X(v), x2: X(v), y1: y + h, y2: y + h + 8 }, {}, g);
        textEl({ x: X(v), y: y + h + 12 + size * .6, class: 'soft' }, size, g).textContent = s;
      }
      for (const [v, s] of niceTicks(yr[0], yr[1])) {
        put('line', { x1: x - 8, x2: x, y1: Y(v), y2: Y(v) }, {}, g);
        textEl({ x: x - 14, y: Y(v), 'text-anchor': 'end', class: 'soft' }, size, g).textContent = s;
      }
    }
    if (xlabel) textEl({ x: x + w, y: y + h + 22 + size * 1.6, 'text-anchor': 'end' }, size + 2, g).textContent = xlabel;
    if (ylabel) textEl({ x: x + 6, y: y - 24, 'text-anchor': 'start' }, size + 2, g).textContent = ylabel;
    Object.assign(g, {
      X, Y,
      curve(f, attrs) {   // a path of y = f(x); the pen lifts where f leaves the y range
        const { from = xr[0], to = xr[1], ...more } = attrs || {}, lo = yr[0] - (yr[1] - yr[0]) * .02, hi = yr[1] + (yr[1] - yr[0]) * .02;
        let d = '', pen = 'M';
        for (let k = 0; k <= 240; k++) {
          const v = from + (to - from) * k / 240, fv = f(v);
          if (!Number.isFinite(fv) || fv < lo || fv > hi) { pen = 'M'; continue; }
          d += `${pen}${num(X(v))},${num(Y(fv))}`;
          pen = 'L';
        }
        return put('path', { d }, { parent: g, ...more });
      },
      dot: (vx, vy, attrs) => put('circle', { cx: X(vx), cy: Y(vy), r: 8 }, { parent: g, ...classed(attrs, 'fill') }),
    });
    return g;
  },
  random() {   // mulberry32 from a fixed seed: the same numbers on every run
    let t = ART.seed = ART.seed + 0x6D2B79F5 | 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  },
  // ----- motion: each takes its start (cue(k) or seconds) and duration -----
  show: (e, at = 0, dur = .5) => addTween('show', e, 'o', 1, at, dur, 'io', { enter: 0 }),
  hide: (e, at = 0, dur = .5) => addTween('hide', e, 'o', 0, at, dur, 'io'),
  pop(e, at = 0, dur = .45) {
    addTween('pop', e, 's', 1, at, dur, 'back', { enter: 0 });
    return addTween('pop', e, 'o', 1, at, Math.min(dur, .2), 'io', { enter: 0 });
  },
  move(e, x, y, at = 0, dur = .8, ease = 'io') {
    addTween('move', e, 'x', +x, at, dur, ease);
    return addTween('move', e, 'y', +y, at, dur, ease);
  },
  scale: (e, k, at = 0, dur = .6, ease = 'io') => addTween('scale', e, 's', +k, at, dur, ease),
  turn: (e, deg, at = 0, dur = .8, ease = 'io') => addTween('turn', e, 'r', +deg, at, dur, ease),
  draw: (e, at = 0, dur = .9, ease = 'io') => addTween('draw', e, 'd', 1, at, dur, ease, { enter: 0 }),
  along(e, line, at = 0, dur = 1.5, opts) {   // e's anchor rides the line; turn: true also turns it along the way
    const { turn = false, from = 0, to = 1, ease = 'io' } = opts || {};
    needEl(e, 'along');
    if (!line || typeof line.getPointAtLength !== 'function') throw new Error('along: the second argument must be a line, a path or another shape to ride');
    let last = null;
    const point = q => {
      if (last && last.q === q) return last;
      const m = e.parentNode.getScreenCTM().inverse().multiply(line.getScreenCTM()), len = line.getTotalLength();
      const at = l => { const p = line.getPointAtLength(clamp(l, 0, len)); return [m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f]; };
      const L = len * (from + (to - from) * q), [x, y] = at(L), [ax, ay] = at(L - 1), [bx, by] = at(L + 1);
      return last = { q, x, y, r: Math.atan2(by - ay, bx - ax) * 180 / Math.PI };
    };
    addTween('along', e, 'x', null, at, dur, ease, { mix: (_, q) => point(q).x });
    addTween('along', e, 'y', null, at, dur, ease, { mix: (_, q) => point(q).y });
    if (turn) addTween('along', e, 'r', null, at, dur, ease, { mix: (_, q) => point(q).r });
    return e;
  },
  count(e, from, to, at = 0, dur = 1, digits) {   // the number replaces # in e's text, or the whole text
    needEl(e, 'count');
    if (!Number.isFinite(+from) || !Number.isFinite(+to)) throw new Error(`count: from and to must be numbers, got ${from} and ${to}`);
    const places = v => (String(v).split('.')[1] || '').length;
    if (e._tpl === undefined) e._tpl = e._str !== undefined ? e._str : e.textContent;
    e._digits = digits !== undefined ? digits : Math.max(places(from), places(to));
    return addTween('count', e, 'n', +to, at, dur, 'io', { enter: +from, fixed: +from });
  },
  set(e, attr, value, at = 0, dur = .6, ease = 'io') {
    needEl(e, 'set');
    if (!Number.isFinite(parseFloat(e.getAttribute(attr)))) throw new Error(`set: the element has no number in its attribute '${attr}' to change`);
    return addTween('set', e, 'a:' + attr, +value, at, dur, ease);
  },
  recolor(e, cls, at = 0, dur = .4) {
    if (!COLORS[cls]) throw new Error(`recolor: unknown colour '${cls}'; colours: ${Object.keys(COLORS).join(', ')}`);
    const to = `var(${COLORS[cls]})`;
    return addTween('recolor', e, 'col', to, at, dur, 'io', { mix: (from, q) => mixColor(from, to, q) });
  },
  pulse(e, at = 0, dur = .6, k = 1.25) {
    return addTween('pulse', e, 's', null, at, dur, 'lin', { mix: (from, q) => from * (1 + (k - 1) * Math.sin(Math.PI * q)) });
  },
  clock(f) {   // f(t) on every frame, t in seconds from the step start: continuous motion as a function of time
    if (!ART.clocks) throw new Error('clock: use it inside a scene');
    if (typeof f !== 'function') throw new Error('clock: give a function of the time, t => { ... }');
    ART.clocks.push(f);
  },
  pose(e, values) {   // set x y s r o d at once: in a clock, or for a starting pose
    needEl(e, 'pose');
    const s = state(e);
    for (const k in values) {
      if (!['x', 'y', 's', 'r', 'o', 'd'].includes(k)) throw new Error(`pose: unknown key '${k}'; keys: x y s r o d`);
      s[k] = +values[k];
    }
    paint(e);
    return e;
  },
};

// The timeline: tweens grouped by element and state key. A key's value at time t comes from its latest started
// tween, which starts from the value the key had at that moment; before its first tween the key keeps its base.
function timeline(list, clocks, file, where) {
  list.sort((a, b) => a.t0 - b.t0 || a.n - b.n);
  const byEl = new Map(), tracks = [];
  for (const w of list) {
    let keys = byEl.get(w.e);
    if (!keys) byEl.set(w.e, keys = new Map());
    let tr = keys.get(w.key);
    if (!tr) { keys.set(w.key, tr = { e: w.e, key: w.key, list: [] }); tracks.push(tr); }
    tr.list.push(w);
  }
  const value = (w, t) => {
    const q = w.ease(w.dur > 0 ? clamp((t - w.t0) / w.dur, 0, 1) : t >= w.t0 ? 1 : 0);
    return w.mix ? w.mix(w.from, q) : w.from + (w.to - w.from) * q;
  };
  const at = (tr, t) => {
    let last = null;
    for (const w of tr.list) { if (w.t0 <= t + 1e-9) last = w; else break; }
    return last ? value(last, t) : tr.base;
  };
  for (const tr of tracks) {
    const first = tr.list[0];
    tr.base = first.enter !== undefined ? first.enter : baseOf(tr.e, tr.key);
    tr.list.forEach((w, k) => { w.from = w.fixed !== undefined ? w.fixed : k ? value(tr.list[k - 1], w.t0) : tr.base; });
    state(tr.e)[tr.key] = tr.base;
  }
  byEl.forEach((_, e) => paint(e));
  const ends = list.map(w => w.t0 + w.dur);
  let broken = false;
  return {
    end: Math.max(0, ...ends), ends,
    at(t) {
      if (broken) return;
      const dirty = new Set();
      try {
        for (const tr of tracks) {
          const v = at(tr, t), s = state(tr.e);
          if (s[tr.key] !== v) { s[tr.key] = v; dirty.add(tr.e); }
        }
        dirty.forEach(paint);
      } catch (e) { broken = true; return artError(file, where, e, `at ${+t.toFixed(2)} s: `); }
      for (let k = 0; k < clocks.length; k++) {
        try { clocks[k](t); } catch (e) { artError(file, where, e, `clock at ${+t.toFixed(2)} s: `); clocks.splice(k--, 1); }
      }
    },
  };
}

// A scene file runs once, as an inline script named by sourceURL: over file:// its errors keep their line numbers.
function sceneFile(name) {
  if (FILES[name]) return FILES[name];
  const file = FILES[name] = { name, index: Object.keys(FILES).length, scenes: new Map(), setD: () => {}, ok: false };
  const src = SC.scenes[name];
  if (src == null) { complain(`${name}: the scene file is not in the build`); return file; }
  let parse = null;
  const catcher = e => { parse = parse || e; e.preventDefault(); };
  addEventListener('error', catcher);
  const s = document.createElement('script');
  // The wrapper shares the file's first line, so line numbers match the file. D is the step's narration length.
  s.textContent = `window.SC_SCENE = function (sc, setD) { 'use strict'; const { ${Object.keys(HELPERS)} } = sc; let D = 0; setD(v => { D = v; }); {${src}\n} };\n` +
    `//# sourceURL=sc-scene/f${file.index}.js`;
  document.head.append(s);
  removeEventListener('error', catcher);
  if (parse) {
    complain(`${name}:${parse.lineno}: ${parse.message.replace(/^Uncaught /, '').replace(/Failed to execute .*?: /, '')}`);
    return file;
  }
  ART.loading = file;
  try {
    ART.seed = SEED;
    window.SC_SCENE(HELPERS, f => { file.setD = f; });
    if (!file.scenes.size) throw new Error("no scenes: define them with scene('name', () => { ... })");
    file.ok = true;
  } catch (e) { artError(file, '', e); } finally { ART.loading = null; }
  return file;
}

BLOCKS.scene = (b, fail, ctx) => {
  const [W, H] = b.size, svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' }), file = sceneFile(b.src), el = h('div', 'art', svg);
  el.style.width = `min(100%, max(16em, (100dvh - 12em) * ${+(W / H).toFixed(3)}))`;   // the stage's height less the bars
  const where = `${b.loc[1].replace(/ show.*/, '')} scene ${b.scene}`, out = { el, units: [], end: 0 };
  let tl = null, done = false;
  out.after = () => {   // once the svg is on the page, so sizes of texts and shapes are known
    if (done) return;
    done = true;
    if (!file.ok) return;
    const sc = file.scenes.get(b.scene);
    if (!sc) return complain(`${file.name}: ${where}: no scene '${b.scene}' in the file; scenes: ${[...file.scenes.keys()].join(', ')}`);
    Object.assign(ART, { to: svg, tl: [], clocks: [], ctx, seed: SEED });
    file.setD(ctx.dur);
    let list, clocks;
    try { sc.f(); list = ART.tl; clocks = ART.clocks; }
    catch (e) { return artError(file, where, e); }
    finally { Object.assign(ART, { to: null, tl: null, clocks: null, ctx: null }); }
    try { tl = timeline(list, clocks, file, where); } catch (e) { return artError(file, where, e); }
    out.end = tl.end;
    if (CHECK) checkScene(tl, svg, W, H, ctx, file, where);
  };
  out.tick = t => tl && tl.at(t);
  return out;
};

// The render check: the scene at its start, at each [+] mark, at the end of each motion and at the end of the step.
function checkScene(tl, svg, W, H, ctx, file, where) {
  if (!svg.querySelector('*')) return artError(file, where, 'nothing drawn: draw the picture inside the scene function');
  const moments = [[0, 'start'], [Math.max(ctx.dur, tl.end), 'end'], ...ctx.cues.map((c, k) => [c, `cue ${k + 1}`]),
    ...tl.ends.map(t => [t, null])].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [t, name] of moments) {
    const near = merged.find(m => Math.abs(m[0] - t) < .05);
    if (!near) merged.push([t, name]);
    else if (name && (!near[1] || name.startsWith('cue'))) near[1] = name;
  }
  const seen = new Set(), problems = [];   // each problem once, at the first moment it shows
  const say = (key, moment, text) => { if (!seen.has(key) && problems.length < 3) { seen.add(key); problems.push([moment, text]); } };
  const before = ERRORS.length;
  for (const [t, name] of merged.slice(0, 60)) {
    const k = ctx.cues.filter(c => c <= t + .05).length;   // the latest mark before t
    const moment = `at ${name || (k ? `cue ${k} + ${+(t - ctx.cues[k - 1]).toFixed(1)} s` : +t.toFixed(1) + ' s')}`;
    tl.at(t);
    if (ERRORS.length > before) return;
    const bad = [...svg.querySelectorAll('*')].flatMap(e => [...e.attributes]
      .filter(a => /NaN|undefined|Infinity/.test(a.value)).map(a => `<${e.tagName} ${a.name}="${a.value.slice(0, 40)}">`));
    if (bad.length) { say('nan', moment, `${bad[0]}: a number is missing`); break; }
    const { texts, shapes } = visible(svg), round = Math.round, cut = new Set();
    for (const x of texts) {
      const edge = x.x0 < -1 ? 'left' : x.x1 > W + 1 ? 'right' : x.y0 < -1 ? 'top' : x.y1 > H + 1 ? 'bottom' : null;
      if (edge) { cut.add(x); say('cut ' + x.name, moment, `«${x.name}» is cut by the ${edge} edge of the canvas: move it inside`); }
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], c = texts[j], ka = (a.y1 - a.y0) * .15, kc = (c.y1 - c.y0) * .15;
      if (Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0) > 2 && Math.min(a.y1 - ka, c.y1 - kc) - Math.max(a.y0 + ka, c.y0 + kc) > 0)
        say(`overlap ${a.name} ${c.name}`, moment, `«${a.name}» overlaps «${c.name}»`);
    }
    const all = [...shapes, ...texts.filter(x => !cut.has(x))];
    if (all.length) {
      const x0 = Math.min(...all.map(r => r.x0)), x1 = Math.max(...all.map(r => r.x1));
      const y0 = Math.min(...all.map(r => r.y0)), y1 = Math.max(...all.map(r => r.y1)), dx = W * .03, dy = H * .03;
      if (x0 < -dx || y0 < -dy || x1 > W + dx || y1 > H + dy)
        say('bounds', moment, `the drawing spans x ${round(x0)}..${round(x1)}, y ${round(y0)}..${round(y1)}, outside the canvas ${W}×${H}: move it inside or hide it`);
    }
  }
  problems.forEach(([moment, text]) => artError(file, `${where} ${moment}`, text));
}
// Boxes of what can be seen, in canvas units: texts and formulas by name, and the other shapes.
function visible(svg) {
  const inv = svg.getScreenCTM().inverse(), texts = [], shapes = [];
  const box = e => {
    const b = e.getBBox(), m = inv.multiply(e.getScreenCTM());
    const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
      .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const walk = (n, op) => {
    for (const c of n.children) {
      if (['defs', 'clipPath', 'mask', 'marker', 'title'].includes(c.tagName)) continue;
      const o = op * (c.hasAttribute('opacity') ? +c.getAttribute('opacity') : 1) * (c.style.opacity === '' ? 1 : +c.style.opacity);
      if (o < .05 || c.style.visibility === 'hidden') continue;
      if (c.tagName === 'text' || c.classList.contains('sc-tex')) {
        const r = box(c);
        if (r.x1 - r.x0 > 0) texts.push({ ...r, name: (c._name || c.textContent).trim().slice(0, 40) });
      } else if (GEOMETRY.has(c.tagName)) {
        const r = box(c);
        if (r.x1 - r.x0 > 0 || r.y1 - r.y0 > 0) shapes.push(r);
      } else walk(c, o);
    }
  };
  walk(svg, 1);
  return { texts, shapes };
}

/* ---------- quiz ---------- */
const SOLVED = {};   // step index -> { tries, first: right on the first try, right, done }
function quizPanel(q, index) {
  const st = SOLVED[index] = SOLVED[index] || { tries: 0, first: null, done: false };
  const fail = field => e => report(q.loc, field, e);
  const feedback = h('div', 'feedback'), el = h('div', 'quiz', h('div', 'qq', inline(q.q, fail('.q'))));
  let options = [], input = null, formula = null;
  const fill = k => q.tex.replace('\\?', () => k == null ? '\\boxed{\\;?\\;}' : `\\boxed{${q.options[k].tex}}`);
  const finish = (right, shown) => {
    st.done = true;
    if (st.first === null) st.first = right && !shown;
    st.right = right;
    PROG.solved[index] = [st.first, st.right];
    save();
    paintSolved();
  };
  const paintSolved = () => {
    options.forEach((o, k) => { o.disabled = true; if (k === q.answer) o.classList.add('right'); });
    if (input) { input.disabled = true; input.value = input.value || local(String(q.answer)); }
    if (formula) formula.replaceChildren(math(fill(q.answer), true, fail('.tex')));
    const answer = q.kind === 'number' && !st.right ? h('b', null, local(String(q.answer)), q.unit ? [' ', inline(q.unit, fail('.unit'))] : null) : null;
    const head = st.right ? UI.right : q.kind === 'number' ? UI.answer : UI.marked;
    feedback.replaceChildren(h('p', st.right ? 'ok' : 'shown', head, answer && [' ', answer]), q.explain ? h('p', null, inline(q.explain, fail('.explain'))) : null,
      h('button', 'go', UI.next));
    feedback.querySelector('.go').onclick = next;
    P.keys = null;
  };
  const wrong = why => {
    st.tries++;
    if (st.first === null) st.first = false;
    const more = st.tries >= 2 ? h('button', 'show', UI.reveal) : null;
    if (more) more.onclick = () => finish(false, true);
    feedback.replaceChildren(h('p', 'no', UI.wrong, ' ', why ? inline(why, fail('.why')) : (q.hint ? inline(q.hint, fail('.hint')) : UI.again)), more);
  };
  const pick = k => {
    if (st.done) return;
    if (k === q.answer) return finish(true);
    options[k].classList.add('wrong');
    if (formula) formula.replaceChildren(math(fill(k), true, fail('.tex')));
    wrong(q.kind === 'choice' && q.options[k].why);
  };
  if (q.kind === 'number') {
    input = h('input');
    Object.assign(input, { type: 'text', inputMode: 'decimal', placeholder: UI.number });
    const go = h('button', 'check', UI.check);
    go.onclick = () => {
      const v = parseFloat(input.value.replace(',', '.').replace('−', '-'));
      if (st.done || !Number.isFinite(v)) return;
      if (Math.abs(v - q.answer) <= q.tol + 1e-12) finish(true); else wrong(null);
    };
    el.append(h('div', 'numrow', input, q.unit ? inline(q.unit, fail('.unit')) : null, go));
    P.keys = e => e.key === 'Enter' && (go.click(), true);
  } else {
    if (q.kind === 'blank') el.append(formula = h('div', 'formula', math(fill(null), true, fail('.tex'))));
    options = q.options.map((o, k) => {
      const btn = h('button', 'option', h('b', null, String(k + 1)),
        q.kind === 'blank' ? math('\\displaystyle ' + o.tex, false, fail(`.options[${k + 1}]`)) : inline(o.t, fail(`.options[${k + 1}]`)));
      btn.onclick = () => pick(k);
      if (CHECK && q.kind === 'blank') math(fill(k), true, fail(`.options[${k + 1}]`));
      return btn;
    });
    el.append(h('div', 'options', options));
    P.keys = e => { const k = +e.key - 1; if (k >= 0 && k < options.length) { pick(k); return true; } return false; };
  }
  el.append(feedback);
  if (st.done) paintSolved();
  return el;
}

/* ---------- chapters and progress ----------
   The place lives in the address (#C.S: chapter C, its step S) and, with the chapters passed and the first-try
   answers, in localStorage for this topic. Without storage everything works, only nothing is remembered. */
const STORE = 'sc-progress:' + location.pathname;
const PROG = (() => {
  try {
    const v = JSON.parse(localStorage.getItem(STORE));
    if (v && v.n === STEPS.length && Array.isArray(v.done) && v.solved) return v;
  } catch {}
  return { n: STEPS.length, done: [], last: null, solved: {} };
})();
function save() { try { localStorage.setItem(STORE, JSON.stringify(PROG)); } catch {} }
for (const [i, [first, right]] of Object.entries(PROG.solved)) if (STEPS[i] && STEPS[i].quiz) SOLVED[i] = { tries: 0, first, right, done: true };
const chapterOf = i => CH[STEPS[i].ch];
const placeOf = i => `#${STEPS[i].ch + 1}.${i - chapterOf(i).first + 1}`;
function stepOf(hash) {
  const m = /^#(\d+)(?:\.(\d+))?$/.exec(hash);
  if (!m) return null;
  const c = CH[clamp(+m[1] - 1, 0, CH.length - 1)];
  return c.first + clamp((+m[2] || 1) - 1, 0, c.n - 1);
}
const inChapter = c => STEPS.slice(CH[c].first, CH[c].first + CH[c].n).map((s, k) => [s, CH[c].first + k]);
function contents() {
  const toc = $('toc');
  toc.hidden = !MULTI;
  toc.replaceChildren(...(MULTI ? CH.map((c, k) => {
    const steps = inChapter(k), secs = steps.reduce((t, [s]) => t + s.dur + PAD, 0), quizzes = steps.filter(([s]) => s.quiz).length;
    const meta = `${Math.max(1, Math.round(secs / 60))} ${UI.min}` + (quizzes ? ` · ${quizzes} ${plural(quizzes, UI.quizzes)}` : '');
    const btn = h('button', 'chap' + (PROG.done.includes(k) ? ' done' : ''), h('b', null, String(k + 1)), h('span', 'ctitle', c.title), h('span', 'cmeta', meta));
    btn.onclick = () => begin(c.first);
    return h('li', null, btn);
  }) : []));
  const last = PROG.last != null && PROG.last > 0 && PROG.last < STEPS.length ? PROG.last : null;
  $('bContinue').hidden = last == null;
  if (last != null) $('bContinue').textContent = `▶ ${UI.continue}` + (MULTI ? ` · ${UI.chapter.replace('{n}', STEPS[last].ch + 1)}` : '');
  $('bStart').textContent = (last == null ? '▶ ' : '') + (last == null ? UI.start : UI.fromStart);
  $('bStart').classList.toggle('quiet', last != null);
}
function showContents(push = true) {
  setPlaying(false);
  P.started = false;
  P.done = false;
  $('end').hidden = true;
  contents();
  $('cover').hidden = false;
  if (push && location.hash) history.pushState(null, '', location.pathname + location.search);
}
function chapterBar(c) {
  const ch = CH[c];
  $('chapter').textContent = MULTI ? `${UI.chapter.replace('{n}', c + 1)} · ${ch.title}` : '';
  $('segs').replaceChildren();
  segs = inChapter(c).map(([s, i]) => {
    const seg = h('button', 'seg' + (s.quiz ? ' q' : ''), h('i'));
    seg.style.flex = Math.max(s.dur, 4);
    seg.title = `${i - ch.first + 1}. ${s.section}`;
    seg.onclick = () => go(i);
    $('segs').append(seg);
    return seg.firstChild;
  });
}

/* ---------- playback ---------- */
const P = { i: -1, t: 0, end: PAD, ch: -1, playing: false, started: false, waiting: false, done: false, audio: null, rate: 1, afail: false,
  stall: 0, volume: 1, muted: false, units: [], ticks: [], afters: [], blocks: [], keys: null };

function render(i) {
  const s = STEPS[i], grid = h('div', 'blocks n' + (s.blocks.length + (s.quiz ? 1 : 0)));
  // A block with the same id as one on screen stays: no entrance, and it moves and changes from its old look.
  const before = new Map();
  for (const k of P.blocks) if (k.b.key) before.set(k.b.key, { type: k.b.type, rect: k.section.getBoundingClientRect(), look: k.r.look && k.r.look() });
  Object.assign(P, { units: [], ticks: [], afters: [], blocks: [], keys: null });
  let offset = 0;
  for (const b of s.blocks) {
    const fail = field => e => report(b.loc, field, e);
    const old = b.key && before.get(b.key), kept = !!old && old.type === b.type;
    const ctx = { times: s.at.slice(offset, offset + b.units), kept, from: kept ? old.look : undefined, cues: s.cues, dur: s.dur };
    offset += b.units;
    let r;
    try { r = BLOCKS[b.type](b, fail, ctx); } catch (e) { fail('')(e); r = { el: h('div', 'bad', String(e.message)), units: [] }; }
    const section = h('section', `block b-${b.type}${kept ? '' : ' enter'}`, b.caption ? h('div', 'caption', inline(b.caption, fail('.caption'))) : null, r.el);
    grid.append(section);
    const units = [...(b.reveal === 'all' ? [] : r.units), ...(r.extra || [])];
    if (units.length !== b.units) report(b.loc, '.reveal', `${units.length} units in the player, ${b.units} in the build`);
    // Units start hidden before the step is on the page, so the ones due show with their transition, not after a flash.
    units.forEach(u => typeof u !== 'function' && u.forEach(e => e && e.classList.add('off')));
    P.units.push(...units.map(els => ({ els, on: false })));
    if (r.after) P.afters.push(r.after);
    if (r.tick) P.ticks.push(r.tick);
    P.blocks.push({ b, r, section, kept, old });
  }
  if (s.blocks.some(b => b.type === 'scene')) grid.classList.add('wide');
  if (s.quiz) grid.append(quizPanel(s.quiz, i));
  if (!s.blocks.length && !s.quiz) grid.append(h('h2', 'only', s.section));
  $('stage').replaceChildren(grid);
  $('stage').scrollTop = 0;
  layout();
  P.end = Math.max(s.dur, ...P.blocks.map(k => k.r.end || 0)) + PAD;
  const moving = P.blocks.filter(k => k.kept && k.r.mark);
  if (moving.length && !still()) {
    void grid.offsetWidth;   // the old look is on screen: changing it now runs the transitions
    moving.forEach(k => k.r.mark(k.r.state));
  } else moving.forEach(k => k.r.mark(k.r.state));
  if (!still()) P.blocks.forEach(k => k.kept && flip(k.section, k.old.rect));
  $('section').textContent = s.section;
}
const layout = () => P.afters.forEach(f => { try { f(); } catch (e) { console.error(e); } });
// A kept block glides from where it stood to its new place.
function flip(section, old) {
  const now = section.getBoundingClientRect();
  if (!now.width || !old.width) return;
  const dx = old.left - now.left, dy = old.top - now.top, k = old.width / now.width;
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(k - 1) < .02) return;
  section.animate([{ transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${k})` }, { transformOrigin: '0 0', transform: 'none' }],
    { duration: 450, easing: 'cubic-bezier(.3, .7, .3, 1)' });
}

function apply(t) {
  const s = STEPS[P.i];
  P.units.forEach((u, k) => {
    const on = t >= (s.at[k] || 0) - .05;
    if (on === u.on) return;
    u.on = on;
    if (typeof u.els === 'function') u.els(on);
    else u.els.forEach(e => e && e.classList.toggle('off', !on));
  });
  P.ticks.forEach(f => f(t, s.dur));
  caption(t);
}

function go(i, t = 0) {
  stopAudio();
  const c = STEPS[i].ch, entering = (c !== P.ch || P.fresh) && !P.restore;
  Object.assign(P, { i, waiting: false, done: false, afail: false, stall: 0, fresh: false, restore: false });
  $('end').hidden = true;
  if (c !== P.ch) { P.ch = c; chapterBar(c); }
  render(i);
  if (t === 'end') t = P.end;
  P.t = t;
  const s = STEPS[i];
  if (SC.voice && s.audio) {
    const a = P.audio = new Audio(s.audio);
    a.playbackRate = P.rate;
    applyVolume(a);
    a.onerror = () => { if (P.audio === a) soundFailed(); };
    a.onplaying = () => { if (P.audio === a) $('soundNote').hidden = true; };
    if (t) a.currentTime = Math.min(t, s.dur);
  }
  apply(t);
  setPlaying(P.playing);
  if (ARGS.has('step')) return;   // a review shot leaves the address and the progress alone
  if (location.hash !== placeOf(i)) history[entering ? 'pushState' : 'replaceState'](null, '', placeOf(i));
  PROG.last = i;
  save();
}
function stopAudio() {
  const a = P.audio;
  if (!a) return;
  a.onerror = null; a.pause(); a.removeAttribute('src'); a.load();
  P.audio = null;
}
function soundFailed() { P.afail = true; $('soundNote').hidden = false; }
function setPlaying(v) {
  P.playing = v;
  const a = P.audio;
  if (!a || P.afail) return;
  if (v && !P.waiting && !a.ended) a.play().catch(e => { if (P.audio === a && e.name === 'NotAllowedError') soundFailed(); });
  else a.pause();
}
// The step waits for the reader after a quiz, or always when there is no sound; otherwise the next one starts.
function stepEnd() {
  const s = STEPS[P.i];
  if (s.quiz || !SC.voice) { P.waiting = true; setPlaying(P.playing); }
  else next();
}
const lastOfChapter = i => i === chapterOf(i).first + chapterOf(i).n - 1;
function next() {
  if (P.done) return nextChapter();
  if (lastOfChapter(P.i)) finish();
  else go(P.i + 1);
}
const back = () => go(P.t > 2.5 || P.i === chapterOf(P.i).first ? P.i : P.i - 1);
function finish() {
  P.done = true;
  setPlaying(false);
  const c = STEPS[P.i].ch, quizzes = inChapter(c).filter(([s]) => s.quiz), right = quizzes.filter(([, i]) => SOLVED[i] && SOLVED[i].first).length;
  if (!PROG.done.includes(c)) PROG.done.push(c);
  save();
  const more = c < CH.length - 1;
  $('endTitle').textContent = MULTI && more ? UI.chapterDone.replace('{n}', c + 1) : UI.done;
  $('endScore').textContent = quizzes.length ? UI.score.replace('{r}', right).replace('{n}', quizzes.length) : '';
  $('bNextChapter').hidden = !more;
  $('bAgain').classList.toggle('quiet', more);
  $('bContents').hidden = !MULTI;
  $('end').hidden = false;
  if (more) $('bNextChapter').focus({ preventScroll: true });
}
function nextChapter() {
  const c = STEPS[P.i].ch;
  if (c < CH.length - 1) { P.playing = true; go(CH[c + 1].first); }
}
function again() {   // the chapter once more, its questions unanswered
  const c = STEPS[P.i].ch;
  for (const [, i] of inChapter(c)) { delete SOLVED[i]; delete PROG.solved[i]; }
  P.playing = true;
  go(CH[c].first);
}
function toggle() {
  if (!P.started) return begin(PROG.last || 0);
  if (P.done) return;
  if (P.waiting) { if (!STEPS[P.i].quiz || SOLVED[P.i]?.done) next(); return; }
  setPlaying(!P.playing);
}
// A click on the picture acts as Space; clicks on controls, quiz steps and selected text keep their meaning.
function stageClick(e) {
  if (!P.started || P.done || STEPS[P.i].quiz) return;
  if (e.target.closest('button, input, select, textarea, a, label') || String(getSelection())) return;
  const was = P.playing && !P.waiting;
  toggle();
  if ((P.playing && !P.waiting) !== was) flash(was ? '❚❚' : '▶');
}
function flash(icon) {
  const f = $('flash');
  f.textContent = icon;
  f.hidden = false;
  f.style.animation = 'none';
  void f.offsetWidth;   // restart the fade
  f.style.animation = '';
}
function begin(i = 0, play = true) {
  P.started = true;
  P.fresh = true;   // the first step after the contents adds a history entry
  $('cover').hidden = true;
  P.playing = play;
  go(i);
}
function restart() {   // from the very start: the answers are cleared, the chapters passed stay marked
  for (const k in SOLVED) delete SOLVED[k];
  PROG.solved = {};
  begin(0);
}
function setSpeed(r) {
  P.rate = r;
  $('bSpeed').textContent = local(String(r)) + '×';
  if (P.audio) P.audio.playbackRate = r;
  try { localStorage.setItem('sc-speed', r); } catch {}
}
const stepSpeed = d => setSpeed(SPEEDS[clamp(SPEEDS.indexOf(P.rate) + d, 0, SPEEDS.length - 1)]);
function setVolume(v, muted = false) {
  P.volume = clamp(Math.round(v * 20) / 20, 0, 1);
  P.muted = muted;
  if (P.audio) applyVolume(P.audio);
  const quiet = P.muted || !P.volume;
  $('bMute').textContent = quiet ? '🔇' : P.volume < .5 ? '🔉' : '🔊';
  $('bMute').setAttribute('aria-pressed', String(quiet));
  $('volume').value = quiet ? 0 : P.volume;
  try { localStorage.setItem('sc-volume', P.volume); localStorage.setItem('sc-muted', P.muted ? '1' : '0'); } catch {}
}
// The slider is even in loudness rather than amplitude: half way is a quarter of the amplitude, about −12 dB.
const applyVolume = a => { a.volume = P.volume ** 2; a.muted = P.muted; };
const stepVolume = d => setVolume(P.volume + d);
const toggleMute = () => P.muted || !P.volume ? setVolume(P.volume || .5) : setVolume(P.volume, true);
let CC = true;
function setCC(on) {
  CC = on;
  $('bCC').setAttribute('aria-pressed', String(on));
  try { localStorage.setItem('sc-cc', on ? '1' : '0'); } catch {}
  capKey = '';
  if (P.i >= 0) caption(P.t);
}

let capKey = '';
function caption(t) {
  const s = STEPS[P.i], box = $('captions');
  if (!CC || !s.cap.length) { box.hidden = true; capKey = ''; return; }
  box.hidden = false;
  if (!SC.voice || !s.audio) {
    if (capKey !== 'all' + P.i) { capKey = 'all' + P.i; box.replaceChildren(s.cap.map(c => c[0]).join(' ')); }
    return;
  }
  let k = 0;
  s.cap.forEach(([, words], j) => { if (words.length && words[0][0] <= t + .05) k = j; });
  const [text, words] = s.cap[k], said = words.filter(w => w[0] <= t + .05).length, now = `${P.i}:${k}:${said}`;
  if (now === capKey) return;
  capKey = now;
  let pos = 0;
  box.replaceChildren();
  words.forEach(([, a, z], j) => {
    if (a > pos) box.append(text.slice(pos, a));
    box.append(h('span', j < said ? 'said' : null, text.slice(a, z)));
    pos = z;
  });
  box.append(text.slice(pos));
}

let segs = [];
function ui() {
  const first = chapterOf(P.i).first;
  segs.forEach((f, k) => {
    const i = first + k;
    f.style.width = (i < P.i || P.done ? 100 : i > P.i ? 0 : clamp(P.t / P.end * 100, 0, 100)) + '%';
  });
  $('bPlay').textContent = P.playing && !P.waiting && !P.done ? '❚❚' : '▶';
  $('counter').textContent = `${P.i - first + 1} / ${chapterOf(P.i).n}`;
  $('bNext').classList.toggle('pulse', P.waiting && (!STEPS[P.i].quiz || !!SOLVED[P.i]?.done));
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000);
  last = now;
  if (P.playing && !P.waiting && !P.done && P.started && P.i >= 0) {
    const a = P.audio;
    // While the clip plays, its clock drives the picture; before it starts or after it ends, wall time does.
    if (a && !P.afail && !a.ended) {
      if (!a.paused && a.currentTime > 0) { P.t = Math.max(P.t, a.currentTime); P.stall = 0; }
      else if ((P.stall += dt) > 6) soundFailed();
    } else P.t += dt * P.rate;
    apply(P.t);
    if (P.t >= P.end) stepEnd();
  }
  if (P.i >= 0) ui();
  requestAnimationFrame(frame);
}

function check() {
  document.body.classList.add('still');
  STEPS.forEach((s, i) => {
    P.i = i;
    try { render(i); apply(1e9); } catch (e) { report(['scenario', `step ${i + 1}`], '', e); }
  });
  window.CHECK = { done: true, errors: ERRORS };
}

function boot() {
  if (window.MathJax && MathJax.svgStylesheet) document.head.append(MathJax.svgStylesheet());
  if (CHECK) return check();
  try { const r = +localStorage.getItem('sc-speed'); if (SPEEDS.includes(r)) P.rate = r; } catch {}
  try { CC = localStorage.getItem('sc-cc') !== '0'; } catch {}
  try {
    const v = parseFloat(localStorage.getItem('sc-volume'));
    if (v >= 0 && v <= 1) P.volume = v;
    P.muted = localStorage.getItem('sc-muted') === '1';
  } catch {}
  setSpeed(P.rate);
  setCC(CC);
  setVolume(P.volume, P.muted);
  $('vol').hidden = !SC.voice;
  $('bToc').hidden = !MULTI;
  if (MULTI) $('coverKeys').textContent += UI.keysToc;
  $('bStart').onclick = () => PROG.last ? restart() : begin(0);
  $('bContinue').onclick = () => begin(PROG.last);
  $('bPlay').onclick = toggle;
  $('bPrev').onclick = () => P.started ? back() : begin(PROG.last || 0);
  $('bNext').onclick = () => P.started ? next() : begin(PROG.last || 0);
  $('bSpeed').onclick = () => setSpeed(SPEEDS[(SPEEDS.indexOf(P.rate) + 1) % SPEEDS.length]);
  $('bCC').onclick = () => setCC(!CC);
  $('bMute').onclick = toggleMute;
  $('volume').oninput = e => setVolume(+e.target.value);
  $('bToc').onclick = () => showContents();
  $('bAgain').onclick = again;
  $('bNextChapter').onclick = nextChapter;
  $('bContents').onclick = () => showContents();
  $('stage').addEventListener('click', stageClick);
  document.addEventListener('mousedown', e => { if (e.target.closest('#bar button, #top button')) e.preventDefault(); });
  document.addEventListener('keydown', keys);
  addEventListener('resize', layout);
  addEventListener('popstate', () => {   // Back and Forward move between the contents and the places visited
    const i = stepOf(location.hash);
    if (i == null) return showContents(false);
    Object.assign(P, { started: true, restore: true });
    $('cover').hidden = true;
    go(i);
  });
  contents();
  if (ARGS.has('step')) {   // ?step=N&t=S|end opens a still frame, for review shots; N counts through all chapters
    const i = clamp((+ARGS.get('step') || 1) - 1, 0, STEPS.length - 1), t = ARGS.get('t');
    if (ARGS.has('shot')) document.body.classList.add('still');
    P.started = true;
    $('cover').hidden = true;
    go(i, t === 'end' || t == null ? 'end' : +t || 0);
  } else {
    const i = stepOf(location.hash);
    if (i != null) {   // a reload keeps the place, paused until the reader plays
      Object.assign(P, { started: true, restore: true });
      $('cover').hidden = true;
      go(i);
    }
  }
  requestAnimationFrame(frame);
  window.READY = true;
}
function keys(e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.matches('input:not([type=range])')) {   // the volume slider takes the player's keys
    if (e.key === 'Enter' && P.keys) { e.preventDefault(); P.keys(e); } else if (e.key === 'Escape') e.target.blur();
    return;
  }
  if (P.done && e.key === 'Enter' && !e.target.closest('#end button')) { e.preventDefault(); nextChapter(); return; }
  if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button')) return;   // a focused button acts itself
  if (!P.started) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); begin(PROG.last || 0); }
    else if ((e.code === 'KeyO' || e.key === 'Escape') && P.i >= 0) { e.preventDefault(); begin(P.i, false); }   // back to the step left
    return;
  }
  if (P.keys && P.keys(e)) { e.preventDefault(); return; }
  const actions = { Space: toggle, ArrowRight: next, ArrowLeft: back, Home: () => go(chapterOf(P.i).first), KeyC: () => setCC(!CC),
    Comma: () => stepSpeed(-1), Period: () => stepSpeed(1),
    ...SC.voice && { ArrowUp: () => stepVolume(.1), ArrowDown: () => stepVolume(-.1), KeyM: toggleMute },   // else ↑ ↓ scroll
    ...MULTI && { KeyO: () => showContents() },
    KeyF: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.() };
  const act = actions[e.code];
  if (act) { e.preventDefault(); act(); }
}
addEventListener('load', () => (window.MathJax && MathJax.startup && MathJax.startup.promise || Promise.resolve()).then(boot, boot));
