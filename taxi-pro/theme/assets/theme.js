/*!
 * TAXI PRO — comportements généraux du thème
 * En-tête (défilement, transparence, menu mobile), animations d'apparition,
 * carrousels, compteurs, cartes à la demande, mise en évidence du jour courant.
 * JavaScript sans dépendance ; compatible avec l'éditeur de thème Shopify.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- En-tête ---------- */
  function initHeader(scope) {
    var header = (scope || document).querySelector('[data-header]') || document.querySelector('[data-header]');
    if (!header) return;
    // L'en-tête transparent n'a de sens que si la page commence par un héros illustré
    if (header.hasAttribute('data-transparent')) {
      var first = document.querySelector('main > .shopify-section:first-child');
      if (!first || !first.querySelector('.hero:not(.hero--plain)')) header.classList.remove('site-header--transparent');
      else header.classList.add('site-header--transparent');
    }
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    if (!header.__tpScroll) { window.addEventListener('scroll', onScroll, { passive: true }); header.__tpScroll = true; }
  }

  /* ---------- Menu mobile (boîte de dialogue accessible) ---------- */
  function initMenu() {
    var menu = document.querySelector('[data-mobile-menu]');
    var openBtn = document.querySelector('[data-menu-open]');
    if (!menu || !openBtn || openBtn.__tpBound) return;
    openBtn.__tpBound = true;
    var closeBtn = menu.querySelector('[data-menu-close]');
    var lastFocus = null;
    function focusables() {
      return Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])'));
    }
    function open() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-locked');
      setTimeout(function () { (closeBtn || focusables()[0]).focus(); }, 50);
    }
    function close() {
      menu.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-locked');
      setTimeout(function () { menu.hidden = true; }, 350);
      if (lastFocus) lastFocus.focus();
    }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    menu.addEventListener('click', function (e) { if (e.target.closest('a[href]')) close(); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(); if (!f.length) return;
      var firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 990 && menu.classList.contains('is-open')) close(); });
  }

  /* ---------- Animations d'apparition ---------- */
  var observer = null;
  function initReveal(scope) {
    var els = (scope || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!els.length) return;
    var animated = /anim-(subtle|rich)/.test(document.body.className);
    if (!animated || reduceMotion || !('IntersectionObserver' in window) || window.Shopify && Shopify.designMode) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); observer.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Carrousels (défilement natif + boutons) ---------- */
  function initSliders(scope) {
    (scope || document).querySelectorAll('[data-slider]').forEach(function (slider) {
      if (slider.__tpSlider) return;
      slider.__tpSlider = true;
      var track = slider.querySelector('[data-slider-track]');
      var prev = slider.querySelector('[data-slider-prev]');
      var next = slider.querySelector('[data-slider-next]');
      if (!track) return;
      function step() { var item = track.firstElementChild; return item ? item.getBoundingClientRect().width + 24 : track.clientWidth; }
      function update() {
        if (prev) prev.disabled = track.scrollLeft <= 4;
        if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      }
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
      track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* ---------- Compteurs (chiffres clés) ---------- */
  function initCounters(scope) {
    var els = (scope || document).querySelectorAll('[data-count-to]');
    if (!els.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      var decimals = (el.getAttribute('data-count-to').split('.')[1] || '').length;
      var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
      var locale = document.documentElement.lang || 'fr';
      var fmt = function (n) { return prefix + n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; };
      if (reduceMotion || !isFinite(target)) { el.textContent = fmt(target); return; }
      var start = null, dur = 1400;
      function frame(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Cartes Google intégrées, chargées après accord ---------- */
  function initMaps(scope) {
    (scope || document).querySelectorAll('[data-map-load]').forEach(function (btn) {
      if (btn.__tpMap) return;
      btn.__tpMap = true;
      btn.addEventListener('click', function () {
        var frame = btn.closest('.map-frame');
        var iframe = document.createElement('iframe');
        iframe.src = btn.getAttribute('data-map-load');
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.title = btn.getAttribute('data-map-title') || '';
        frame.appendChild(iframe);
        var consent = frame.querySelector('.map-consent');
        if (consent) consent.remove();
      });
    });
  }

  /* ---------- Horaires : jour courant ---------- */
  function initHours(scope) {
    var day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
    (scope || document).querySelectorAll('[data-hours-day="' + day + '"]').forEach(function (row) { row.classList.add('is-today'); });
  }

  function init(scope) {
    initHeader(scope); initMenu(); initReveal(scope); initSliders(scope); initCounters(scope); initMaps(scope); initHours(scope);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();

  // Éditeur de thème : réinitialiser les sections rechargées
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
  document.addEventListener('shopify:block:select', function (e) {
    var slider = e.target.closest('[data-slider-track]');
    if (slider) slider.scrollTo({ left: e.target.offsetLeft - slider.offsetLeft, behavior: 'smooth' });
  });
})();
