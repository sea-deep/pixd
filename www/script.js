function toggleMenu(btn) {
  var nav = document.getElementById("nav");
  var overlay = document.getElementById("nav-overlay");
  var body = document.body;
  const willShow = !nav.classList.contains("show");
  nav.classList.toggle("show");
  if (overlay) {
    // Overlay visibility is controlled via sibling selector in CSS
    // but we ensure it's present for click-to-close.
  }
  body.classList.toggle("no-scroll", willShow);
  if (btn && btn.setAttribute) {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    btn.classList.toggle("active", willShow);
  }
}

function toggleAnswer(element) {
  element.classList.toggle("open");
}

/*   i.style.display = i.style.display === "block" ? "none" : "block"; */

function updateTime() {
  const currentTimeElement = document.getElementById("time");
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  currentTimeElement.textContent = `Today at ${timeString.toUpperCase()}`;
}
setInterval(updateTime, 1000);
updateTime();

// Reveal on scroll
(function initReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  items.forEach((el) => io.observe(el));
})();

// Close menu on Escape and add header shadow on scroll
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const nav = document.getElementById('nav');
    const btn = document.querySelector('.menu-icon');
    if (nav && nav.classList.contains('show')) {
      toggleMenu(btn);
    }
  }
});

function onScrollHeaderShadow() {
  const header = document.querySelector('.header');
  if (!header) return;
  if (window.scrollY > 1) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
window.addEventListener('scroll', onScrollHeaderShadow, { passive: true });
onScrollHeaderShadow();
