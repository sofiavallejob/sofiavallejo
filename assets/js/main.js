/* Sofia Vallejo's site: window manager, wallpaper, music player and Modes.exe */
'use strict';

document.body.classList.remove('no-js');

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isNarrow = () => innerWidth <= 760;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* ------------------------------------------------------------
   Pixel icons: 16×16 maps, one character per pixel
   ------------------------------------------------------------ */
const PALETTE = {
  k: '#14130f', w: '#fbf8ee', g: '#a9a596', d: '#3a3a44', y: '#f2c94c', Y: '#c99a1e',
  b: '#6f9cf2', B: '#22398f', r: '#e8411f', G: '#6dffa8', c: '#8fd3ff', p: '#f59ad7',
};

function sineIcon() {
  const rows = Array.from({ length: 16 }, () => Array(16).fill('d'));
  for (let i = 0; i < 16; i++) { rows[0][i] = rows[15][i] = rows[i][0] = rows[i][15] = 'k'; }
  for (let x = 1; x < 15; x++) {
    const y = Math.round(7.5 - 4.5 * Math.sin(((x - 1) / 13) * Math.PI * 2) * Math.exp(-(x - 1) / 22));
    rows[y][x] = 'G';
  }
  for (let x = 1; x < 15; x += 2) if (rows[8][x] === 'd') rows[8][x] = 'g';
  return rows.map(r => r.join(''));
}

const ICONS = {
  note: [
    '..kkkkkkkkk.....', '..kwwwwwwwkk....', '..kwwwwwwwkwk...', '..kwkkkkwwkkkk..',
    '..kwwwwwwwwwwk..', '..kwkkkkkkkwwk..', '..kwwwwwwwwwwk..', '..kwkkkkkkkkwk..',
    '..kwwwwwwwwwwk..', '..kwkkkkkkwwwk..', '..kwwwwwwwwwwk..', '..kwkkkkkkkkwk..',
    '..kwwwwwwwwwwk..', '..kwwwwwwwwwwk..', '..kkkkkkkkkkkk..', '................',
  ],
  folder: [
    '................', '................', '.kkkkk..........', 'kyyyyyk.........',
    'kyyyyyykkkkkkkk.', 'kywwwwwwwwwwwwyk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk',
    'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk',
    'kYYYYYYYYYYYYYYk', 'kYYYYYYYYYYYYYYk', 'kkkkkkkkkkkkkkkk', '................',
  ],
  cd: [
    '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwccwwwwwk..',
    '.kwwwccwwwwwwwk.', '.kwwccwwwwwwwwk.', 'kwwwwwwkkkwwwwwk', 'kwwwwwkdddkwwwwk',
    'kwwwwwkdddkwwwwk', 'kwwwwwwkkkwwwwwk', '.kwwwwwwwwwppwk.', '.kwwwwwwwppwwwk.',
    '..kwwwwwppwwwk..', '...kkwwwwwwkk...', '.....kkkkkk.....', '................',
  ],
  pdf: [
    '..kkkkkkkkk.....', '..kwwwwwwwkk....', '..kwwwwwwwkwk...', '..kwwwwwwwkkkk..',
    '..kwwwwwwwwwwk..', 'rrrrrrrrrrrwwk..', 'rwwrwwrrwwrwwk..', 'rrrrrrrrrrrwwk..',
    '..kwwwwwwwwwwk..', '..kwkkkkkkkkwk..', '..kwwwwwwwwwwk..', '..kwkkkkkkwwwk..',
    '..kwwwwwwwwwwk..', '..kwwwwwwwwwwk..', '..kkkkkkkkkkkk..', '................',
  ],
  mail: [
    '................', '................', '................', 'kkkkkkkkkkkkkkkk',
    'kkwwwwwwwwwwwwkk', 'kwkwwwwwwwwwwkwk', 'kwwkwwwwwwwwkwwk', 'kwwwkwwwwwwkwwwk',
    'kwwwwkwwwwkwwwwk', 'kwwwwwkkkkwwwwwk', 'kwwwwwwwwwwwwwwk', 'kwwwwwwwwwwwwwwk',
    'kkkkkkkkkkkkkkkk', '................', '................', '................',
  ],
  cap: [
    '................', '................', '................', '.......kk.......',
    '.....kkBBkk.....', '...kkBBBBBBkk...', '.kkBBBBBBBBBBkk.', 'kBBBBBBBBBBBBBBk',
    '.kkBBBBBBBBBBkky', '...kkkBBBBkkk.y.', '...kBBkkkkBBk.y.', '...kBBBBBBBBk.yy',
    '....kkkkkkkk..yy', '................', '................', '................',
  ],
  power: [
    '................', '.......rr.......', '...rr..rr..rr...', '..rr...rr...rr..',
    '.rr....rr....rr.', '.rr....rr....rr.', '.rr..........rr.', '.rr..........rr.',
    '..rr........rr..', '...rrr....rrr...', '.....rrrrrr.....', '................',
    '................', '................', '................', '................',
  ],
  camera: [
    '................', '................', '.....kkkkkk.....', '.kkkkggggggkkkk.',
    'kggggggggggggggk', 'kgrggkkkkkkggggk', 'kgggkbcbbbbkgggk', 'kgggkbbbbbbkgggk',
    'kgggkbbbbbbkgggk', 'kgggkbbbbbbkgggk', 'kggggkkkkkkggggk', 'kggggggggggggggk',
    'kkkkkkkkkkkkkkkk', '................', '................', '................',
  ],
  string: sineIcon(),
};
ICONS.folderblue = ICONS.folder.map(r => r.replace(/y/g, 'b').replace(/Y/g, 'B'));

function iconSVG(name) {
  const map = ICONS[name] || ICONS.note;
  let rects = '';
  map.forEach((row, y) => {
    [...row.padEnd(16, '.').slice(0, 16)].forEach((ch, x) => {
      if (ch !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`;
    });
  });
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

$$('[data-icon]').forEach(el => {
  if (el.classList.contains('win')) return; // windows get theirs in the titlebar
  el.insertAdjacentHTML('afterbegin', iconSVG(el.dataset.icon));
});

/* ------------------------------------------------------------
   UI sounds (tiny square-wave blips)
   ------------------------------------------------------------ */
let actx = null;
const audio = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());
let soundOn = store.get('sofiaos-sound') !== 'off';
const soundBtn = $('[data-sound]');
const syncSoundBtn = () => { soundBtn.setAttribute('aria-pressed', soundOn); soundBtn.textContent = soundOn ? '🔊' : '🔈'; };
syncSoundBtn();
soundBtn.addEventListener('click', () => { soundOn = !soundOn; store.set('sofiaos-sound', soundOn ? 'on' : 'off'); syncSoundBtn(); blip('open'); });

function blip(kind) {
  if (!soundOn) return;
  try {
    const ctx = audio();
    const notes = { open: [660, 990], close: [740, 494], min: [520, 390] }[kind] || [600];
    const t0 = ctx.currentTime;
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = f;
      const t = t0 + i * 0.045;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + 0.07);
    });
  } catch { /* no audio, no problem */ }
}

/* ------------------------------------------------------------
   Window manager
   ------------------------------------------------------------ */
const wins = new Map();
const tasks = $('.tasks');
let zTop = 10;

$$('.win').forEach(win => {
  const id = win.id;
  const bar = document.createElement('header');
  bar.className = 'titlebar';
  bar.innerHTML = `${iconSVG(win.dataset.icon)}<span class="t-name">${win.dataset.title}</span>
    <button class="t-btn" data-min aria-label="Minimize ${win.dataset.title}">_</button>
    <button class="t-btn" data-max aria-label="Maximize ${win.dataset.title}">□</button>
    <button class="t-btn" data-close aria-label="Close ${win.dataset.title}">×</button>`;
  win.prepend(bar);

  const task = document.createElement('button');
  task.className = 'task';
  task.hidden = true;
  task.innerHTML = `${iconSVG(win.dataset.icon)}<span>${win.dataset.title}</span>`;
  task.addEventListener('click', () => {
    if (win.classList.contains('focused') && win.classList.contains('open')) minimize(id);
    else open(id);
  });
  tasks.append(task);

  wins.set(id, { win, task, placed: false });

  win.addEventListener('pointerdown', () => focus(id));
  bar.querySelector('[data-close]').addEventListener('click', e => { e.stopPropagation(); close(id); });
  bar.querySelector('[data-min]').addEventListener('click', e => { e.stopPropagation(); minimize(id); });
  bar.querySelector('[data-max]').addEventListener('click', e => { e.stopPropagation(); win.classList.toggle('maximized'); });
  bar.addEventListener('dblclick', e => { if (!e.target.closest('.t-btn') && !isNarrow()) win.classList.toggle('maximized'); });
  makeDraggable(win, bar);
});

function availH() { return innerHeight - $('.taskbar').offsetHeight; }

function place(entry) {
  const { win } = entry;
  const w = Math.min(+win.dataset.w || 560, innerWidth - 16);
  const x = Math.round((+win.dataset.x || 0.1) * innerWidth);
  const y = Math.round((+win.dataset.y || 0.1) * availH());
  win.style.width = w + 'px';
  win.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
  win.style.top = Math.max(8, y) + 'px';
  win.style.maxHeight = Math.max(260, Math.min(availH() - y - 12, availH() * 0.84)) + 'px';
  entry.placed = true;
}

function open(id, { quiet = false } = {}) {
  const entry = wins.get(id);
  if (!entry) return;
  const { win, task } = entry;
  if (!entry.placed) place(entry);
  const wasOpen = win.classList.contains('open');
  win.classList.add('open');
  task.hidden = false;
  if (!wasOpen && !reducedMotion) { win.classList.remove('pop'); void win.offsetWidth; win.classList.add('pop'); }
  if (!wasOpen && !quiet) blip('open');
  focus(id);
  if (id === 'modes') Modes.start();
  if (id === 'projects') Choir.start();
}

function focus(id) {
  const entry = wins.get(id);
  if (!entry || !entry.win.classList.contains('open')) return;
  wins.forEach(({ win, task }) => { win.classList.remove('focused'); task.setAttribute('aria-pressed', 'false'); });
  entry.win.classList.add('focused');
  entry.win.style.zIndex = ++zTop;
  entry.task.setAttribute('aria-pressed', 'true');
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
}

function focusTopmost() {
  let best = null, bestZ = -1;
  wins.forEach(({ win }, id) => {
    if (win.classList.contains('open') && +win.style.zIndex > bestZ) { best = id; bestZ = +win.style.zIndex; }
  });
  if (best) focus(best);
  else history.replaceState(null, '', location.pathname + location.search);
}

function close(id) {
  const { win, task } = wins.get(id);
  win.classList.remove('open', 'focused', 'maximized');
  task.hidden = true;
  task.setAttribute('aria-pressed', 'false');
  if (id === 'music') Amp.stop();
  if (id === 'modes') Modes.stop();
  if (id === 'projects') Choir.stop();
  blip('close');
  focusTopmost();
}

function minimize(id) {
  const { win, task } = wins.get(id);
  win.classList.remove('open', 'focused');
  task.setAttribute('aria-pressed', 'false');
  blip('min');
  focusTopmost();
}

function makeDraggable(win, handle) {
  let dx = 0, dy = 0, dragging = false;
  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.t-btn') || isNarrow() || win.classList.contains('maximized')) return;
    dragging = true;
    dx = e.clientX - win.offsetLeft;
    dy = e.clientY - win.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const x = Math.max(80 - win.offsetWidth, Math.min(e.clientX - dx, innerWidth - 80));
    const y = Math.max(0, Math.min(e.clientY - dy, availH() - 30));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  });
  const end = () => { dragging = false; };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

// Anything with data-open opens that window
document.addEventListener('click', e => {
  const opener = e.target.closest('[data-open]');
  if (!opener) return;
  $$('.icon').forEach(i => i.classList.toggle('selected', i === opener));
  closeStart();
  open(opener.dataset.open);
});

addEventListener('hashchange', () => { const id = location.hash.slice(1); if (wins.has(id)) open(id); });

/* ------------------------------------------------------------
   Start menu, clock, shutdown
   ------------------------------------------------------------ */
const startBtn = $('.start');
const startMenu = $('#startmenu');
function closeStart() { startMenu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
startBtn.addEventListener('click', e => {
  e.stopPropagation();
  const willOpen = startMenu.hidden;
  startMenu.hidden = !willOpen;
  startBtn.setAttribute('aria-expanded', willOpen);
  if (willOpen) $('button, a', startMenu).focus();
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('#startmenu, .start')) closeStart(); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!startMenu.hidden) { closeStart(); startBtn.focus(); }
});

const shutdown = $('#shutdown');
$('[data-shutdown]').addEventListener('click', () => { closeStart(); blip('close'); shutdown.hidden = false; });
shutdown.addEventListener('click', () => { shutdown.hidden = true; blip('open'); });

const clock = $('[data-clock]');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit' });
const tick = () => { clock.textContent = fmt.format(new Date()); };
tick();
setInterval(tick, 15000);

/* ------------------------------------------------------------
   Wallpaper: pastel pixel space. Twinkling stars drift by,
   two little planets bob, and a cat with a rainbow flies past.
   ------------------------------------------------------------ */
const Scope = (() => {
  const cv = $('#scope');
  const ctx = cv.getContext('2d');
  const U = 4; // one sprite pixel = 4 screen px
  let W = 0, H = 0, raf = 0, t = 0;

  const STAR_COLORS = ['#ffffff', '#ffd1e8', '#cfe0ff', '#fff3b0', '#e2d4ff'];
  const RAINBOW = ['#ffb3c7', '#ffd6a5', '#fff1a8', '#c8f7c5', '#a9d8ff', '#d2b8ff'];
  const CAT_PAL = { k: '#2b2440', w: '#ffffff', g: '#d9d6e8', p: '#ffc2de', n: '#ff7fb0', f: '#ff8fc4', y: '#ffe28a', G: '#8fe3b0' };
  const CAT = [
    '...............f....',
    '..............fyf...',
    '...........k...G.k..',
    '..........kwk...kwk.',
    '..........kwwkkkwwk.',
    '.kkkkkkkkkwwwwwwwwwk',
    '.kwwwwwwwwwwkwwwkwwk',
    'kkwgwwgwwwwpwwnwwpwk',
    'kkwwwwwwwwwwwkwkwwwk',
    '.kwgwwwgwwwwwwwwwwwk',
    '.kkkkkkkkkkkkkkkkkk.',
    '..kk.kk.....kk.kk...',
  ];
  let stars = [];
  const cat = { x: -999, y: 0.3, wait: 1.5 };

  function seed() {
    const n = Math.round((W * H) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      v: 8 + Math.random() * 26, ph: Math.random() * 6, rate: 3 + Math.random() * 4,
      c: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    seed();
    draw(0);
  }

  const px = (x, y, c, s = U) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), s, s); };

  // Six-frame twinkle: dot → plus → big plus → four sparks → plus → dot
  function star(st) {
    const f = Math.floor(st.ph) % 6, x = Math.round(st.x / U) * U, y = Math.round(st.y / U) * U, c = st.c;
    if (f === 0 || f === 5) px(x, y, c);
    else if (f === 1 || f === 4) { px(x, y, c); px(x - U, y, c); px(x + U, y, c); px(x, y - U, c); px(x, y + U, c); }
    else if (f === 2) { for (let i = 1; i <= 2; i++) { px(x - i * U, y, c); px(x + i * U, y, c); px(x, y - i * U, c); px(x, y + i * U, c); } }
    else { px(x - 3 * U, y, c); px(x + 3 * U, y, c); px(x, y - 3 * U, c); px(x, y + 3 * U, c); }
  }

  function planet(cx, cy, r, body, shade, ring) {
    cx = Math.round(cx / U) * U; cy = Math.round(cy / U) * U;
    const R = r / U;
    // ring as a tilted ellipse: back half behind the planet, front half in front
    const ringPts = half => {
      if (!ring) return;
      for (let a = 0; a < Math.PI * 2; a += 0.02) {
        const s = Math.sin(a);
        if ((half === 'back') !== (s < 0)) continue;
        px(cx + Math.round(Math.cos(a) * R * 1.75) * U, cy + Math.round(s * R * 0.45) * U, ring);
      }
    };
    ringPts('back');
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      if (i * i + j * j > R * R) continue;
      const lit = (i + j) < -R * 0.6;
      px(cx + i * U, cy + j * U, lit ? '#ffe3f1' : (i - j) > R * 0.8 ? shade : body);
    }
    ringPts('front');
  }

  function drawCat() {
    if (cat.x < -200) return;
    const C = 5;
    const bob = Math.round(Math.sin(t * 6) * 1) * U;
    const cx = Math.round(cat.x / C) * C, cy = Math.round((cat.y * H) / C) * C + bob;
    // rainbow trail, in steps like an 8-bit wave
    const seg = 6 * C;
    for (let k = 0, x = cx; x > -seg && k < 40; k++, x -= seg) {
      const off = ((k + Math.floor(t * 8)) % 2) * C;
      RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x - seg + C, cy + (5 + i) * C + off - C, seg, C); });
    }
    CAT.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') px(cx + i * C, cy + j * C, CAT_PAL[ch], C); }));
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(st => {
      st.x -= st.v * dt;
      st.ph += st.rate * dt;
      if (st.x < -20) { st.x = W + 20; st.y = Math.random() * H; }
      star(st);
    });
    const narrow = isNarrow();
    planet(W * (narrow ? 0.7 : 0.84), H * (narrow ? 0.5 : 0.2) + Math.sin(t * 0.6) * 6, narrow ? 24 : 32, '#ffb3d6', '#e58fbf', '#fff1a8');
    planet(W * (narrow ? 0.25 : 0.68), H * (narrow ? 0.82 : 0.8) + Math.sin(t * 0.8 + 1) * 5, 16, '#a9c8ff', '#8aa8ea', null);

    if (cat.x < -200) {
      cat.wait -= dt;
      if (cat.wait <= 0) { cat.x = -30 * U; cat.y = isNarrow() ? 0.35 + Math.random() * 0.45 : 0.15 + Math.random() * 0.55; }
    } else {
      cat.x += 140 * dt;
      if (cat.x > W + 40) { cat.x = -999; cat.wait = 6 + Math.random() * 6; }
    }
    drawCat();
  }

  let last = 0;
  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    t += dt;
    draw(dt);
    raf = requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf); last = 0;
    if (!document.hidden && !reducedMotion) raf = requestAnimationFrame(frame);
  });
  resize();
  if (reducedMotion) { cat.x = W * 0.35; cat.y = 0.3; draw(0); }
  else raf = requestAnimationFrame(frame);
  // Picking a track sends the cat out right away
  return { bump() { if (cat.x < -200) cat.wait = 0; } };
})();

/* ------------------------------------------------------------
   Projects: filters + the "What Is Left" choir thumbnail
   ------------------------------------------------------------ */
(() => {
  const chips = $$('#projects [data-filter]');
  const cards = $$('#projects .card');
  const count = $('#projects [data-count]');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', c === chip));
    let n = 0;
    cards.forEach(card => {
      const show = f === 'all' || card.dataset.cat.split(' ').includes(f);
      card.hidden = !show;
      if (show) n++;
    });
    count.textContent = `${n} object${n === 1 ? '' : 's'}`;
  }));
  count.textContent = `${cards.length} objects`;
})();

const Choir = (() => {
  const root = $('.choir');
  if (!root) return { start() {}, stop() {} };
  root.innerHTML = '<i></i>'.repeat(160);
  const voices = $$('i', root);
  let timer = 0;
  function step() {
    const left = voices.filter(v => !v.classList.contains('gone'));
    if (left.length < 70) { voices.forEach(v => v.classList.remove('gone')); return; }
    left[Math.floor(Math.random() * left.length)].classList.add('gone');
  }
  if (reducedMotion) for (let i = 0; i < 40; i++) step();
  return {
    start() { if (!reducedMotion && !timer) timer = setInterval(step, 350); },
    stop() { clearInterval(timer); timer = 0; },
  };
})();

/* ------------------------------------------------------------
   Fotos: grid + a simple viewer with arrows
   ------------------------------------------------------------ */
(() => {
  const win = $('#fotos');
  const items = $$('.fotos li button', win);
  const viewer = $('.viewer', win);
  const big = $('img', viewer);
  const cap = $('[data-caption]', viewer);
  $('.fotos-empty', win).hidden = items.length > 0;
  $('[data-foto-count]', win).textContent = `${items.length} photo${items.length === 1 ? '' : 's'}`;
  let i = 0;
  function show(n) {
    i = (n + items.length) % items.length;
    const img = $('img', items[i]);
    big.src = img.src;
    big.alt = img.alt;
    cap.textContent = $('span', items[i])?.textContent || '';
    viewer.hidden = false;
  }
  items.forEach((b, n) => b.addEventListener('click', () => show(n)));
  $('[data-prev]', viewer).addEventListener('click', () => show(i - 1));
  $('[data-next]', viewer).addEventListener('click', () => show(i + 1));
  $('[data-shut]', viewer).addEventListener('click', () => { viewer.hidden = true; });
  win.addEventListener('keydown', e => {
    if (viewer.hidden) return;
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'Escape') viewer.hidden = true;
  });
})();

/* ------------------------------------------------------------
   Research: BibTeX toggle + copy
   ------------------------------------------------------------ */
$$('[data-bib]').forEach(btn => btn.addEventListener('click', async () => {
  const pre = document.getElementById(btn.dataset.bib);
  pre.hidden = !pre.hidden;
  if (!pre.hidden) {
    try { await navigator.clipboard.writeText(pre.textContent); btn.textContent = 'BibTeX ✓ copied'; }
    catch { btn.textContent = 'BibTeX'; }
  } else btn.textContent = 'BibTeX';
}));

/* ------------------------------------------------------------
   Music.amp: playlist, embeds, (decorative) spectrum bars
   ------------------------------------------------------------ */
const Amp = (() => {
  const win = $('#music');
  const now = $('[data-now]', win);
  const role = $('[data-role]', win);
  const embed = $('[data-embed]', win);
  const out = $('[data-out]', win);
  const bars = $('.amp-bars', win);
  const bctx = bars.getContext('2d');
  const items = $$('.playlist button', win);
  const chips = $$('[data-role-filter]', win);
  const count = $('[data-amp-count]', win);
  let playing = false, raf = 0;
  const levels = new Array(14).fill(0);

  items.forEach(btn => btn.addEventListener('click', () => {
    items.forEach(b => b.removeAttribute('aria-current'));
    btn.setAttribute('aria-current', 'true');
    const title = btn.querySelector('.pl-t').firstChild.textContent.trim();
    const artist = btn.querySelector('.pl-t small').textContent;
    now.textContent = `${title} · ${artist}`;
    role.textContent = btn.querySelector('.pl-r').textContent;

    const src = btn.dataset.embed;
    const isVideo = btn.hasAttribute('data-video');
    const height = isVideo ? null : src.includes('soundcloud') ? 166 : src.includes('/album/') ? 352 : 152;
    embed.hidden = false;
    embed.innerHTML = `<iframe src="${src}" title="${title} by ${artist}" loading="lazy"
      ${height ? `height="${height}"` : 'style="aspect-ratio:16/9;height:auto"'}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
    playing = true;
    const link = externalLink(src);
    out.hidden = !link;
    if (link) { out.href = link.href; out.textContent = `open in ${link.name} ↗`; }
    Scope.bump();
    Radio.pause();
    loop();
  }));

  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.roleFilter;
    chips.forEach(c => c.setAttribute('aria-pressed', c === chip));
    let n = 0;
    items.forEach(btn => {
      const show = f === 'all' || btn.dataset.roles.includes(f);
      btn.parentElement.hidden = !show;
      if (show) n++;
    });
    count.textContent = `${n} track${n === 1 ? '' : 's'}`;
  }));

  // Embed URL → the normal page on Spotify / YouTube / SoundCloud
  function externalLink(src) {
    if (src.includes('open.spotify.com/embed/')) return { name: 'Spotify', href: src.replace('/embed/', '/') };
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    if (yt) return { name: 'YouTube', href: `https://www.youtube.com/watch?v=${yt[1]}` };
    return null;
  }

  function drawBars() {
    const W = bars.width, H = bars.height, n = levels.length, bw = W / n;
    bctx.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const target = playing ? (0.25 + Math.random() * 0.75) * Math.exp(-i / 11) : 0.03;
      levels[i] += (target - levels[i]) * 0.25;
      const h = Math.max(1, Math.round(levels[i] * H));
      for (let y = H - 2; y > H - h; y -= 3) {
        const t = (H - y) / H;
        bctx.fillStyle = t > 0.8 ? '#e8411f' : t > 0.55 ? '#f2c94c' : '#6dffa8';
        bctx.fillRect(Math.round(i * bw) + 1, y, Math.round(bw) - 2, 2);
      }
    }
  }
  function loop() {
    cancelAnimationFrame(raf);
    if (reducedMotion) { drawBars(); return; }
    let last = 0;
    const f = t => { if (t - last > 70) { drawBars(); last = t; } raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
  }
  drawBars();
  return {
    stop() {
      playing = false; cancelAnimationFrame(raf); drawBars();
      embed.innerHTML = ''; embed.hidden = true; out.hidden = true;
      items.forEach(b => b.removeAttribute('aria-current'));
      now.textContent = 'Pick a track ↓';
      role.textContent = 'recording · mixing · mastering · sound design';
    },
  };
})();

/* ------------------------------------------------------------
   Modes.exe: an ideal plucked string
   y(x,t) = Σ aₙ sin(nπx) cos(ωₙt) e^(−t/τₙ),  aₙ ∝ sin(nπp) / n²
   ------------------------------------------------------------ */
const Modes = (() => {
  const win = $('#modes');
  const cv = $('.modes-canvas', win);
  const ctx = cv.getContext('2d');
  const pos = $('[data-pos]', win), posOut = $('[data-pos-out]', win);
  const f0 = $('[data-f0]', win), f0Out = $('[data-f0-out]', win);
  const spec = $('[data-spec]', win);
  const NH = 12;
  let amps = [], tPluck = -1, raf = 0, running = false;

  spec.innerHTML = Array.from({ length: NH }, (_, i) => `<div data-n="${i + 1}"></div>`).join('');
  const specBars = $$('div', spec);

  function compute() {
    const p = +pos.value;
    amps = Array.from({ length: NH }, (_, i) => {
      const n = i + 1;
      return (2 / (n * n * Math.PI * Math.PI * p * (1 - p))) * Math.sin(n * Math.PI * p);
    });
    const peak = Math.max(...amps.map(Math.abs));
    specBars.forEach((bar, i) => { bar.style.height = Math.max(1, Math.abs(amps[i]) / peak * 100) + '%'; });
    const inv = 1 / p, near = Math.round(inv);
    posOut.textContent = Math.abs(inv - near) < 0.06 ? `1/${near} of the length` : `${(p * 100).toFixed(0)}% of the length`;
    f0Out.textContent = `${f0.value} Hz`;
  }

  function shape(x, t) {
    let y = 0;
    for (let i = 0; i < NH; i++) {
      const n = i + 1;
      const decay = t < 0 ? 1 : Math.exp(-t / (2.4 / (1 + 0.3 * n)));
      const osc = t < 0 ? 1 : Math.cos(n * 2 * Math.PI * 0.9 * t);
      y += amps[i] * Math.sin(n * Math.PI * x) * osc * decay;
    }
    return y;
  }

  function draw() {
    const W = cv.width, H = cv.height, pad = 22, mid = H / 2;
    ctx.clearRect(0, 0, W, H);
    // bridge + nut
    ctx.fillStyle = '#a9a596';
    ctx.fillRect(pad - 6, mid - 18, 4, 36);
    ctx.fillRect(W - pad + 2, mid - 18, 4, 36);
    const t = tPluck < 0 ? -1 : (performance.now() - tPluck) / 1000;
    const k = (H / 2 - 16) / 1.05;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = mid - shape(x, t) * k * (t < 0 ? 0.0 : 1) - (t < 0 ? idleShape(x) * k : 0);
      const px = pad + x * (W - 2 * pad);
      i ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
    }
    ctx.strokeStyle = '#6dffa8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#6dffa8';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // pluck marker
    const px = pad + (+pos.value) * (W - 2 * pad);
    ctx.fillStyle = '#e8411f';
    ctx.beginPath(); ctx.arc(px, 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#a9a596';
    ctx.fillText(t < 0 ? 'click the string or press Pluck' : `t = ${t.toFixed(1)} s`, pad, H - 8);
  }

  // Before plucking, show the string pulled into a triangle at the pluck point
  function idleShape(x) {
    const p = +pos.value, h = 0.9;
    return x < p ? h * x / p : h * (1 - x) / (1 - p);
  }

  function pluck() {
    compute();
    tPluck = performance.now();
    try {
      const ctxA = audio();
      const out = ctxA.createGain();
      out.gain.value = 0.22;
      out.connect(ctxA.destination);
      const peak = Math.max(...amps.map(Math.abs));
      const now = ctxA.currentTime;
      amps.forEach((a, i) => {
        const n = i + 1, f = n * +f0.value;
        if (f > 9000 || Math.abs(a) / peak < 0.004) return;
        const o = ctxA.createOscillator(), g = ctxA.createGain();
        o.frequency.value = f * (1 + 0.0004 * n * n); // a touch of stiffness
        const tau = 2.4 / (1 + 0.3 * n);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(Math.abs(a) / peak, now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + tau * 4);
        o.connect(g).connect(out);
        o.start(now); o.stop(now + tau * 4 + 0.05);
      });
    } catch { /* silent string */ }
  }

  function loop() { draw(); raf = requestAnimationFrame(loop); }

  pos.addEventListener('input', () => { compute(); tPluck = -1; if (!running) draw(); });
  f0.addEventListener('input', compute);
  $('[data-pluck]', win).addEventListener('click', pluck);
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    pos.value = Math.min(0.95, Math.max(0.05, x > 0.5 ? 1 - x : x));
    pluck();
  });

  compute();
  draw();
  return {
    start() { if (!running) { running = true; loop(); } },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
})();

/* ------------------------------------------------------------
   Background music: a looping YouTube video in a mini-player.
   Browsers only allow sound after the visitor clicks, so the
   entry screen asks "sound on / off" first.
   ------------------------------------------------------------ */
const Radio = (() => {
  const box = $('.radio');
  const trayBtn = $('[data-radio]');
  const playBtn = $('[data-radio-play]');
  const muteBtn = $('[data-radio-mute]');
  const vol = $('[data-radio-vol]');
  const id = box.dataset.video;
  const start = +box.dataset.start || 0;
  let player = null, ready = false, wantPlay = false, playing = false, muted = false;

  vol.value = store.get('sofiaos-volume') ?? 40;

  // Opened as a local file: YouTube refuses to play (error 153), so say so instead
  const isFile = location.protocol === 'file:';
  if (isFile) { $('#yt').hidden = true; $('.radio-note').hidden = false; }

  window.onYouTubeIframeAPIReady = () => {
    if (isFile) return;
    player = new YT.Player('yt', {
      videoId: id,
      playerVars: { autoplay: 0, controls: 0, start, modestbranding: 1, playsinline: 1, rel: 0, origin: location.origin },
      events: {
        onReady: () => { ready = true; player.setVolume(+vol.value); if (wantPlay) play(); },
        onStateChange: e => {
          if (e.data === YT.PlayerState.ENDED) { player.seekTo(start, true); player.playVideo(); } // loop back to the start point
          if (e.data === YT.PlayerState.PLAYING) sync(true);
          if (e.data === YT.PlayerState.PAUSED) sync(false);
        },
      },
    });
  };
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.append(tag);

  function sync(isPlaying) {
    playing = isPlaying;
    playBtn.textContent = playing ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    trayBtn.setAttribute('aria-pressed', playing);
  }
  function show(on) { box.classList.toggle('on', on); }

  function play() {
    wantPlay = true;
    show(true);
    if (!ready) return;
    player.playVideo();
    sync(true);
  }
  function pause() { wantPlay = false; if (ready) player.pauseVideo(); sync(false); }
  function stop(remember) {
    pause();
    show(false);
    if (remember) store.set('sofiaos-music', 'off');
  }
  function setMuted(m) {
    muted = m;
    if (ready) m ? player.mute() : player.unMute();
    muteBtn.textContent = m ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
  }

  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  muteBtn.addEventListener('click', () => setMuted(!muted));
  vol.addEventListener('input', () => {
    if (ready) player.setVolume(+vol.value);
    if (muted && +vol.value > 0) setMuted(false);
    store.set('sofiaos-volume', vol.value);
  });
  trayBtn.addEventListener('click', () => {
    if (box.classList.contains('on')) stop(true);
    else { store.set('sofiaos-music', 'on'); play(); }
  });
  $('[data-radio-stop]').addEventListener('click', () => stop(true));

  // Entry screen once per visit. Later page loads in the same visit
  // start the music on the first click, if it was on.
  const enter = $('#enter');
  if (!store.sget('sofiaos-entered')) {
    enter.hidden = false;
    $('[data-enter="on"]', enter).focus();
    enter.addEventListener('click', e => {
      const choice = e.target.closest('[data-enter]')?.dataset.enter;
      if (!choice) return;
      store.sset('sofiaos-entered', '1');
      store.set('sofiaos-music', choice);
      enter.hidden = true;
      if (choice === 'on') play();
    });
  } else {
    const first = e => {
      if (e.target.closest?.('.radio, [data-radio]')) return;
      removeEventListener('pointerdown', first, true);
      removeEventListener('keydown', first, true);
      if (store.get('sofiaos-music') !== 'off') play();
    };
    addEventListener('pointerdown', first, true);
    addEventListener('keydown', first, true);
  }

  return { pause };
})();

/* ------------------------------------------------------------
   Start on an empty desktop; a #link opens that window
   ------------------------------------------------------------ */
{
  const id = location.hash.slice(1);
  if (wins.has(id)) open(id, { quiet: true });
}
