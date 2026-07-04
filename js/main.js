'use strict';

/* ============================================================
   ASM STUDIO — interactions
   Nav mobile accessible + reveal au scroll (charte V 2.0)
   ============================================================ */

/* ---------- Nav mobile ---------- */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  function close() {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      close();
      toggle.focus();
    }
  });
})();

/* ---------- Reveal au scroll ---------- */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(function (el) { io.observe(el); });
})();
