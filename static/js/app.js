/* ─── app.js ─────────────────────────────────────────────────────────────────
   Shared helpers + Alpine.js data components for MediSlot.
   Every page's JS is in a separate file under static/js/.
   ─────────────────────────────────────────────────────────────────────────── */

// ── CSRF helper ───────────────────────────────────────────────────────────────
const csrf = () =>
  document.cookie.split('; ')
    .find(c => c.startsWith('csrftoken='))
    ?.split('=')[1] ?? '';

// ── JSON POST helper ──────────────────────────────────────────────────────────
const post = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
    body: JSON.stringify(body),
  });

// ── Initials helper ───────────────────────────────────────────────────────────
const initials = n => {
  const parts = (n || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (n || '??').slice(0, 2).toUpperCase();
};

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(isoString) {
  const ms = new Date(isoString) - new Date();
  const abs = Math.abs(ms);
  const past = ms < 0;
  if (abs < 60 * 60 * 1000)         return past ? 'just now' : 'in <1 h';
  if (abs < 24 * 60 * 60 * 1000) {
    const h = Math.round(abs / 3600000);
    return past ? `${h}h ago` : `in ${h}h`;
  }
  const d = Math.round(abs / 86400000);
  return past ? `${d}d ago` : `in ${d} day${d !== 1 ? 's' : ''}`;
}

// ── Toast system ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'ok') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast-item${type === 'err' ? ' err' : ''}`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'polite');
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Modal helper ──────────────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.removeAttribute('hidden');
  el.setAttribute('aria-modal', 'true');
  el.focus();
  // Trap focus inside modal
  const focusable = el.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length) focusable[0].focus();
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('hidden', '');
  document.body.style.overflow = '';
}
// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('[role="dialog"]:not([hidden])').forEach(m => {
      closeModal(m.id);
    });
  }
});

// ── IntersectionObserver: draw pulse lines when in view ──────────────────────
function initPulseLines() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('drawn');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.pulse-line').forEach(el => observer.observe(el));
}

// ─── Alpine.js data components ────────────────────────────────────────────────
document.addEventListener('alpine:init', () => {

  // ── Doctor discovery (doctors.html) ────────────────────────────────────────
  Alpine.data('finder', (doctors) => ({
    doctors,
    q: '',
    spec: '',
    maxFee: 2000,
    sort: new URLSearchParams(location.search).get('sort') || '',

    get specs() {
      return [...new Set(this.doctors.map(d => d.specialization))].sort();
    },
    get shown() {
      let list = this.doctors.filter(d =>
        d.name.toLowerCase().includes(this.q.toLowerCase()) &&
        (!this.spec || d.specialization === this.spec) &&
        d.fee <= this.maxFee
      );
      if (this.sort === 'fee') list = list.sort((a, b) => a.fee - b.fee);
      else if (this.sort === 'experience') list = list.sort((a, b) => b.experience - a.experience);
      else list = list.sort((a, b) => (a.next === null) - (b.next === null) || (a.next || '').localeCompare(b.next || ''));
      return list;
    },

    // Sync filter state to URL so Back button restores filters
    watchFilters() {
      this.$watch('spec', v => this._pushState({ spec: v }));
      this.$watch('sort', v => this._pushState({ sort: v }));
    },
    _pushState(patch) {
      const p = new URLSearchParams(location.search);
      Object.entries(patch).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
      history.replaceState(null, '', `?${p}`);
    },

    initials,
  }));

  // ── Doctor profile: date strip + slot grid + booking modal ─────────────────
  Alpine.data('picker', (doctorId, daysWithSlots, doctorName, fee) => ({
    doctorId,
    daysWithSlots,  // array of ISO date strings that have open slots
    doctorName,
    fee,
    date: null,
    slots: [],
    sel: null,
    loading: false,
    error: '',
    booked: false,
    apptId: null,

    get morningSlots() { return this.slots.filter(s => parseInt(s.time) < 12); },
    get afternoonSlots() { return this.slots.filter(s => { const h = parseInt(s.time); return h >= 12 && h < 17; }); },
    get eveningSlots() { return this.slots.filter(s => parseInt(s.time) >= 17); },

    async init() {
      if (this.daysWithSlots.length) {
        await this.pick(this.daysWithSlots[0]);
      }
    },

    async pick(dateStr) {
      this.date = dateStr;
      this.sel = null;
      this.loading = true;
      this.error = '';
      try {
        const r = await fetch(`/api/doctors/${this.doctorId}/slots/?date=${dateStr}`);
        const data = await r.json();
        if (!r.ok) { this.error = data.error || 'Could not load slots.'; this.slots = []; }
        else this.slots = data;
      } catch {
        this.error = 'Network error — please try again.';
        this.slots = [];
      }
      this.loading = false;
    },

    weekday(iso) { return new Date(iso + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short' }); },
    dayNum(iso) { return new Date(iso + 'T00:00').getDate(); },
    review() { if (this.sel) bootstrap.Modal.getOrCreateInstance(document.getElementById('bookModal')).show(); },

    formatDate(iso) {
      return new Date(iso + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    },

    async confirmBook() {
      this.error = '';
      try {
        const r = await post('/api/book/', { slot_id: this.sel.id });
        const data = await r.json();
        if (r.ok) {
          this.booked = true;
          this.apptId = data.id;
          showToast('Appointment confirmed! Redirecting…');
          setTimeout(() => location.href = '/appointments/', 1500);
        } else {
          this.error = data.error || 'Booking failed.';
          showToast(this.error, 'err');
          await this.pick(this.date);
        }
      } catch {
        this.error = 'Network error. Please try again.';
        showToast(this.error, 'err');
      }
    },
  }));

  // ── Doctor dashboard: status dropdown ──────────────────────────────────────
  Alpine.data('statusRow', (id, status, label, transitions) => ({
    status,
    label,
    allowed: transitions,
    busy: false,

    canSet(v) {
      return this.allowed && this.allowed.includes(v);
    },

    async set(v) {
      if (!this.canSet(v)) {
        showToast(`Cannot move from '${this.label}' to '${v}'.`, 'err');
        return;
      }
      this.busy = true;
      try {
        const r = await post(`/api/appointments/${id}/status/`, { status: v });
        const data = await r.json();
        if (r.ok) {
          this.status = data.status;
          this.label = data.label;
          showToast(`Status → ${data.label}`);
          // Update allowed transitions
          const map = { pending: ['confirmed','cancelled','no_show'], confirmed: ['completed','cancelled','no_show'], completed: [], cancelled: [], no_show: [] };
          this.allowed = map[data.status] || [];
        } else {
          showToast(data.error || 'Error updating status.', 'err');
        }
      } catch {
        showToast('Network error.', 'err');
      }
      this.busy = false;
    },
  }));

  // ── Cancel confirmation modal ───────────────────────────────────────────────
  Alpine.data('cancelModal', () => ({
    apptId: null,
    open(id) { this.apptId = id; openModal('cancel-modal-' + id); },
    close() { closeModal('cancel-modal-' + this.apptId); this.apptId = null; },
  }));

});

// ─── Init on DOMContentLoaded ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPulseLines();

  // Relative times
  document.querySelectorAll('[data-rel-time]').forEach(el => {
    el.textContent = relativeTime(el.dataset.relTime);
  });

  // Auto-dismiss Django messages after 4 s
  document.querySelectorAll('.alert').forEach(a => {
    setTimeout(() => a.style.transition = 'opacity .4s', 3600);
    setTimeout(() => a.style.opacity = '0', 4000);
    setTimeout(() => a.remove(), 4400);
  });
});
