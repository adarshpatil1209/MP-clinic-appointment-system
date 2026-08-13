document.addEventListener("DOMContentLoaded", () => {
  initHeroPulse();
  initDividerPulses();
  initHeroVideo();
  renderSpecializations();
});

// Background video stays paused for anyone who prefers reduced motion.
function initHeroVideo() {
  const video = document.querySelector("[data-reduced-motion-pause]");
  if (!video) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (prefersReducedMotion.matches) {
    video.pause();
  }

  prefersReducedMotion.addEventListener("change", (e) => {
    if (e.matches) {
      video.pause();
    } else {
      video.play();
    }
  });
}

// Hero pulse-line draws in once, right on load.
function initHeroPulse() {
  const heroPulse = document.querySelector("[data-pulse='hero']");
  if (heroPulse) {
    requestAnimationFrame(() => heroPulse.classList.add("in-view"));
  }
}

// Section-divider pulse-lines draw in once when they scroll into view.
function initDividerPulses() {
  const dividers = document.querySelectorAll("[data-pulse='divider']");
  if (!dividers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  dividers.forEach((el) => observer.observe(el));
}

// Specializations grid — quick-jump chips, read from the data-access layer.
function renderSpecializations() {
  const grid = document.querySelector("[data-specializations]");
  if (!grid) return;

  const specializations = getSpecializations();

  grid.innerHTML = specializations
    .map(
      (spec) => `
      <div class="col-6 col-md-4 col-lg-3">
        <a class="spec-chip" href="doctors.html?specialization=${encodeURIComponent(spec.name)}">
          <span class="spec-chip__name">${spec.name}</span>
          <span class="spec-chip__count mono">${spec.count}</span>
        </a>
      </div>`
    )
    .join("");
}
