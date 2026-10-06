/* motion.js: spring physics + gesture helpers (Apple-style). No libraries. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;

/* Spring: damping 1 = no bounce. response = seconds to reach target.
   Starts from the CURRENT value + velocity, so it can be interrupted and re-aimed. */
function spring({ from, to, velocity = 0, response = 0.4, damping = 1, eps = 0.01, onUpdate, onDone }) {
  if (reduce) { onUpdate(to); onDone && onDone(); return { stop() {}, v: 0 }; }
  const k = (2 * Math.PI / response) ** 2, c = 4 * Math.PI * damping / response;
  let x = from, v = velocity, last = performance.now(), id, dead = false;
  const ctrl = { stop() { dead = true; cancelAnimationFrame(id); }, get v() { return v; } };
  (function step(now) {
    if (dead) return;
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    v += (-k * (x - to) - c * v) * dt; x += v * dt;
    if (Math.abs(v) < eps && Math.abs(x - to) < eps) { onUpdate(to); onDone && onDone(); return; }
    onUpdate(x); id = requestAnimationFrame(step);
  })(last);
  return ctrl;
}
// Where a flick would come to rest (Apple's deceleration projection)
const project = (v, rate = 0.998) => (v / 1000) * rate / (1 - rate);

/* Magnetic buttons: follow the pointer 1:1, spring back on leave */
function magnetic(el) {
  if (reduce || !canHover) return;
  let x = 0, y = 0, s;
  el.addEventListener('pointermove', e => {
    s && s.stop(); const r = el.getBoundingClientRect();
    x = (e.clientX - r.left - r.width / 2) * 0.22; y = (e.clientY - r.top - r.height / 2) * 0.32;
    el.style.translate = `${x}px ${y}px`;
  });
  el.addEventListener('pointerleave', () => {
    const [fx, fy] = [x, y];
    s = spring({ from: 1, to: 0, response: 0.5, damping: 0.65, eps: 0.001, onUpdate: t => el.style.translate = `${fx * t}px ${fy * t}px` });
  });
}

/* Cursor glow (+ optional 3D tilt with data-tilt) via CSS variables */
function glow(el) {
  if (!canHover) return;
  let raf = 0, s, rx = 0, ry = 0;
  el.addEventListener('pointermove', e => {
    s && s.stop(); if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0; const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
      if (el.hasAttribute('data-tilt') && !reduce) {
        rx = (0.5 - py) * 7; ry = (px - 0.5) * 9;
        el.style.setProperty('--rx', rx + 'deg'); el.style.setProperty('--ry', ry + 'deg');
      }
    });
  });
  el.addEventListener('pointerleave', () => {
    const [fx, fy] = [rx, ry];
    s = spring({ from: 1, to: 0, response: 0.5, eps: 0.001, onUpdate: t => {
      el.style.setProperty('--rx', fx * t + 'deg'); el.style.setProperty('--ry', fy * t + 'deg'); } });
  });
}

/* Draggable strip (mouse): 1:1 tracking, flick momentum projection, velocity handoff to a spring */
function dragStrip(el) {
  let down = false, startX, startLeft, hist = [], moved = false, s;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;          // touch already has native momentum scrolling
    s && s.stop(); down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft; hist = [];
    el.style.scrollSnapType = 'none';
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    if (!moved && Math.abs(e.clientX - startX) > 4) { moved = true; el.setPointerCapture(e.pointerId); }
    if (!moved) return;
    el.scrollLeft = startLeft - (e.clientX - startX);
    hist.push([e.clientX, performance.now()]); if (hist.length > 5) hist.shift();
  });
  const end = () => {
    if (!down) return; down = false;
    const [a, b] = [hist[0], hist[hist.length - 1]];
    const v = moved && a && b && b[1] > a[1] ? -(b[0] - a[0]) / ((b[1] - a[1]) / 1000) : 0;
    const max = el.scrollWidth - el.clientWidth;
    const target = Math.max(0, Math.min(max, el.scrollLeft + project(v)));
    s = spring({ from: el.scrollLeft, to: target, velocity: v, response: 0.45, damping: 0.9,
      onUpdate: x => el.scrollLeft = x, onDone: () => el.style.scrollSnapType = '' });
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
}

/* Live ECG: pauses off-screen, reacts to pointer, static when reduced motion */
function ecg(canvas) {
  const ctx = canvas.getContext('2d'), panel = canvas.closest('.vitals-panel') || canvas;
  const col = getComputedStyle(document.documentElement).getPropertyValue('--signal-glow').trim() || '#5EE0B0';
  let w, h, t = 0, amp = 1, target = 1, last = 0, on = false;
  const size = () => { const d = devicePixelRatio || 1; w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const seg = (p, a, b, f) => p >= a && p < b ? f((p - a) / (b - a)) : null;
  const beat = p => seg(p, 0, .1, u => .12 * Math.sin(u * Math.PI)) ?? seg(p, .2, .24, u => -.15 * Math.sin(u * Math.PI))
    ?? seg(p, .24, .3, u => Math.sin(u * Math.PI)) ?? seg(p, .3, .34, u => -.3 * Math.sin(u * Math.PI))
    ?? seg(p, .55, .7, u => .22 * Math.sin(u * Math.PI)) ?? 0;
  const draw = now => {
    const dt = Math.min((now - last) / 1000, .05) || 0; last = now;
    t += dt * (.5 + (amp - 1) * .5); amp += (target - amp) * Math.min(1, dt * 6);
    ctx.clearRect(0, 0, w, h); ctx.lineWidth = 2.2; ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath();
    for (let x = 0; x < w; x += 2) { const y = h / 2 - beat((((x / 230 - t) % 1) + 1) % 1) * h * .4 * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); if (on && !reduce) requestAnimationFrame(draw);
  };
  size(); addEventListener('resize', size);
  panel.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); target = 1 + .7 * Math.max(0, 1 - Math.abs(e.clientY - r.top - r.height / 2) / 220); });
  panel.addEventListener('pointerleave', () => target = 1);
  new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on) { last = performance.now(); requestAnimationFrame(draw); } }).observe(canvas);
}

/* Scroll reveal: fades in once when it enters the viewport */
function reveal(els) {
  if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15 });
  els.forEach(e => io.observe(e));
}

/* Swipe a ticket left to cancel (touch). 1:1 tracking, rubber band, spring back; opens the existing confirm dialog */
function swipeCancel(row) {
  const btn = row.querySelector('[data-cancel-open]'); if (!btn || reduce) return;
  let x0, dx = 0, on = false, s;
  row.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; s && s.stop(); x0 = e.clientX; dx = 0; on = true; });
  row.addEventListener('pointermove', e => {
    if (!on) return; const d = e.clientX - x0; if (d > 0) return;
    dx = -Math.sqrt(-d) * 9;                       // rubber band: resistance grows with distance
    row.style.transform = `translateX(${dx}px)`;
  });
  const end = () => {
    if (!on) return; on = false;
    if (dx < -70) btn.click();
    s = spring({ from: dx, to: 0, response: .4, damping: .8, onUpdate: v => row.style.transform = `translateX(${v}px)`, onDone: () => row.style.transform = '' });
  };
  row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
}

/* Booking sheet: two detents (peek/full), 1:1 drag, rubber band, flick projection */
function sheet(el) {
  const grip = el.querySelector('.sheet-grip'), more = el.querySelector('.sheet-more');
  const peek = () => more.offsetHeight; let y = peek(), s, y0 = null, startY, hist = [];
  const set = v => { y = v; el.style.transform = `translateY(${v}px)`; };
  const band = v => v < 0 ? -Math.sqrt(-v) * 4 : v > peek() ? peek() + Math.sqrt(v - peek()) * 4 : v;
  const go = (to, vel = 0) => { s && s.stop(); s = spring({ from: y, to, velocity: vel, response: .35, damping: vel ? .8 : 1, onUpdate: set }); };
  requestAnimationFrame(() => set(peek()));
  grip.addEventListener('pointerdown', e => { s && s.stop(); grip.setPointerCapture(e.pointerId); y0 = e.clientY; startY = y; hist = []; });
  grip.addEventListener('pointermove', e => {
    if (y0 == null) return; set(band(startY + e.clientY - y0));
    hist.push([e.clientY, performance.now()]); if (hist.length > 5) hist.shift();
  });
  const end = e => {
    if (y0 == null) return; const [a, b] = [hist[0], hist[hist.length - 1]];
    const v = a && b && b[1] > a[1] ? (b[0] - a[0]) / ((b[1] - a[1]) / 1000) : 0, moved = Math.abs(e.clientY - y0) > 6; y0 = null;
    if (!moved) return go(y > peek() / 2 ? 0 : peek());      // tap toggles
    go(y + project(v) < peek() / 2 ? 0 : peek(), v);          // flick decides the detent
  };
  grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(y > peek() / 2 ? 0 : peek()); } });
}

/* Availability week grid: drag to move (time + weekday), drag bottom edge to resize, saves through the normal form endpoint */
function weekGrid(el) {
  const PX = 36, START = 360, END = 1320, SNAP = 15, body = [...el.querySelectorAll('.wg-body')];
  const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3), hm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const snap = m => Math.round(m / SNAP) * SNAP;
  el.querySelector('.wg-hours').innerHTML = [6, 9, 12, 15, 18, 21].map(h => `<span class="wg-tick" style="top:${(h - 6) * PX}px">${hm(h * 60)}</span>`).join('');
  const csrf = () => document.cookie.split('; ').find(c => c.startsWith('csrftoken='))?.split('=')[1];
  el.querySelectorAll('.wg-block').forEach(b => {
    const d = { wd: +b.dataset.wd, s: toMin(b.dataset.start), e: toMin(b.dataset.end) };
    const draw = () => { b.style.top = (d.s - START) / 60 * PX + 'px'; b.style.height = (d.e - d.s) / 60 * PX + 'px'; b.querySelector('.wg-label').textContent = `${hm(d.s)}–${hm(d.e)}`; body[d.wd].appendChild(b); };
    draw();
    let mode, x0, y0, o;
    b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); mode = e.target.closest('.wg-handle') ? 'resize' : 'move'; x0 = e.clientX; y0 = e.clientY; o = { ...d }; b.classList.add('drag'); });
    b.addEventListener('pointermove', e => {
      if (!mode) return; const dm = snap((e.clientY - y0) / PX * 60);
      if (mode === 'move') {
        const len = o.e - o.s; d.s = Math.max(START, Math.min(END - len, o.s + dm)); d.e = d.s + len;
        const r = body[0].getBoundingClientRect(), w = body[1].getBoundingClientRect().left - r.left;
        d.wd = Math.max(0, Math.min(6, Math.floor((e.clientX - r.left) / w)));
      } else d.e = Math.max(o.s + 30, Math.min(END, o.e + dm));
      draw();
    });
    const end = async () => {
      if (!mode) return; mode = null; b.classList.remove('drag');
      if (d.wd === o.wd && d.s === o.s && d.e === o.e) return;
      const f = new URLSearchParams({ csrfmiddlewaretoken: csrf(), weekday: d.wd, start_time: hm(d.s), end_time: hm(d.e), slot_minutes: b.dataset.slot });
      const r = await fetch(`/doctor/availability/?edit=${b.dataset.id}`, { method: 'POST', body: f });
      if (r.redirected) location.href = r.url; else { showToast('That overlaps another rule. Reverted.', 'err'); setTimeout(() => location.reload(), 900); }
    };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
  });
}

/* Doctor filters: fetch results, swap them inside a View Transition so cards glide to new positions */
function liveFilter(form) {
  const box = document.getElementById('doctor-results'); let t, ctl;
  const run = async () => {
    const url = '?' + new URLSearchParams([...new FormData(form)].filter(([, v]) => v)).toString();
    ctl && ctl.abort(); ctl = new AbortController();
    try {
      const html = await (await fetch(location.pathname + url, { signal: ctl.signal })).text();
      const next = new DOMParser().parseFromString(html, 'text/html').getElementById('doctor-results');
      const swap = () => { box.innerHTML = next.innerHTML; box.querySelectorAll('.doctor-card').forEach(c => { c.setAttribute('data-glow', ''); c.setAttribute('data-tilt', ''); glow(c); }); };
      document.startViewTransition && !reduce ? document.startViewTransition(swap) : swap();
      history.replaceState(null, '', url);
    } catch (e) {}
  };
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
  form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 200); });
}

/* Swipe left/right on touch screens to switch tabs (rows with a cancel button keep their own swipe) */
function tabSwipe(list) {
  const root = list.closest('[x-data]'), tabs = [...list.querySelectorAll('[role=tab]')]; let x0, y0, on = false; root.style.touchAction = 'pan-y';   // hand horizontal swipes to JS
  root.addEventListener('pointerdown', e => { on = e.pointerType !== 'mouse' && !e.target.closest('.tabx') && !e.target.closest('.ticket-row')?.querySelector('[data-cancel-open]'); x0 = e.clientX; y0 = e.clientY; });
  root.addEventListener('pointerup', e => {
    if (!on) return; on = false; const dx = e.clientX - x0;
    if (Math.abs(dx) < 70 || Math.abs(e.clientY - y0) > 45) return;
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'); const n = tabs[i + (dx < 0 ? 1 : -1)]; n && n.click();
  });
}

/* Count-up for stat numbers (once) */
function countUp(el) {
  const to = parseInt(el.textContent, 10); if (reduce || !to) return;
  spring({ from: 0, to, response: .9, eps: .4, onUpdate: v => el.textContent = Math.round(v) });
}

/* Theme toggle with circular View Transition reveal */
function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('ms-theme', t); } catch (e) {} }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-theme-toggle]'); if (!b) return;
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  if (!document.startViewTransition || reduce) return setTheme(next);
  const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.documentElement.classList.add('vt-theme');
  const vt = document.startViewTransition(() => setTheme(next));
  vt.ready.then(() => document.documentElement.animate(
    { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
    { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' }));
  vt.finished.finally(() => document.documentElement.classList.remove('vt-theme'));
});

/* Mobile tab bar: indicator springs from the previous page's tab */
function tabbar(bar) {
  const a = bar.querySelector('a.active'), ind = bar.querySelector('.tabbar-ind'); if (!a || !ind) return;
  const to = a.offsetLeft, w = a.offsetWidth; let from = to;
  try { from = parseFloat(sessionStorage.getItem('ms-tab')) || to; sessionStorage.setItem('ms-tab', to); } catch (e) {}
  ind.style.width = w + 'px';
  spring({ from, to, response: .45, damping: .8, onUpdate: x => ind.style.transform = `translateX(${x}px)` });
}

/* Command palette (Ctrl/Cmd+K): pages + live doctor search */
document.addEventListener('alpine:init', () => {
  Alpine.data('palette', (pages, canSearch) => { let ctl; return ({   // ctl lives outside Alpine's reactive state
    open: false, q: '', i: 0, docs: [], pages, trigger: null,
    get items() { const q = this.q.toLowerCase(); return [...this.docs, ...this.pages.filter(p => p.name.toLowerCase().includes(q))]; },
    toggle(el) {
      this.open = !this.open;
      if (this.open) {
        this.trigger = el || document.activeElement; this.q = ''; this.docs = []; this.i = 0;
        this.$nextTick(() => { this.$refs.q.focus(); const b = this.$refs.box;
          spring({ from: 0, to: 1, response: .35, damping: .85, eps: .001, onUpdate: s => { b.style.transform = `scale(${.94 + .06 * s})`; b.style.opacity = Math.min(1, s * 1.5); } }); });
      } else this.trigger && this.trigger.focus();
    },
    async search() {
      this.i = 0; ctl && ctl.abort();
      if (!canSearch || this.q.length < 2) { this.docs = []; return; }
      ctl = new AbortController();
      try {
        const html = await (await fetch('/doctors/?q=' + encodeURIComponent(this.q), { signal: ctl.signal })).text();
        this.docs = [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a.doctor-card')].slice(0, 5).map(a => ({
          name: a.querySelector('.doc-name').textContent.trim(), hint: a.querySelector('.text-uppercase').textContent.trim(), url: a.getAttribute('href') }));
      } catch (e) {}
    },
    go() { const it = this.items[this.i]; if (it) location.href = it.url; },
  }); });
});

document.addEventListener('DOMContentLoaded', () => {
  const clock = document.getElementById('hero-time');
  if (clock) { const tick = () => clock.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }); tick(); setInterval(tick, 10000); }
  document.querySelectorAll('.btn-sig:not(.btn-sm), [data-magnetic]').forEach(magnetic);
  document.querySelectorAll('.doctor-card, .cardx.lift, [data-glow]').forEach(el => { el.setAttribute('data-glow', ''); glow(el); });
  document.querySelectorAll('.doctor-card').forEach(el => el.setAttribute('data-tilt', ''));
  document.querySelectorAll('.date-strip, [data-drag]').forEach(dragStrip);
  document.querySelectorAll('.ticket-row').forEach(swipeCancel);
  document.querySelectorAll('[data-sheet]').forEach(sheet);
  document.querySelectorAll('[data-week-grid]').forEach(weekGrid);
  document.querySelectorAll('form[data-live-filter]').forEach(liveFilter);
  document.querySelectorAll('[role=tablist]').forEach(tabSwipe);
  reveal(document.querySelectorAll('.reveal'));
  document.querySelectorAll('canvas.ecg-canvas').forEach(ecg);
  document.querySelectorAll('.stat-number').forEach(countUp);
  document.querySelectorAll('.tabbar').forEach(tabbar);
});
