'use strict';

/* ========================
   UTILS
   ======================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

/* ========================
   NAVBAR — sticky + scroll state
   ======================== */
const navbar   = $('#navbar');
const navToggle = $('#navToggle');
const navDrawer = $('#navDrawer');
const SCROLL_THRESHOLD = 24;

// Declared early so updateActiveLink (called by onScroll) can access them
const sections = $$('section[id]');
const navLinks  = $$('.nav-link[data-section]');

function onScroll() {
  navbar.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  updateActiveLink();
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // set initial state on page load

/* ========================
   MOBILE DRAWER
   ======================== */
navToggle.addEventListener('click', () => {
  const isOpen = navDrawer.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');

  // Trap focus inside drawer when open
  if (isOpen) {
    const firstFocusable = navDrawer.querySelector('a, button');
    firstFocusable?.focus();
  }
});

// Close drawer on link click
$$('a', navDrawer).forEach(link => {
  link.addEventListener('click', () => {
    navDrawer.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Ouvrir le menu');
  });
});

// Close drawer on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navDrawer.classList.contains('is-open')) {
    navDrawer.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.focus();
  }
});

/* ========================
   ACTIVE NAV LINK
   ======================== */

function updateActiveLink() {
  let current = '';
  sections.forEach(section => {
    const top = section.getBoundingClientRect().top;
    if (top <= 100) current = section.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.section === current);
  });
}

/* ========================
   SMOOTH SCROLL (offset for fixed nav)
   ======================== */
$$('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const navH = navbar.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ========================
   SCROLL-REVEAL (IntersectionObserver)
   ======================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
});

$$('.reveal').forEach(el => revealObserver.observe(el));

/* ========================
   HERO — load animation trigger
   ======================== */
const heroBg = $('.hero-bg');
if (heroBg) {
  // Image preload for smooth BG
  const img = new Image();
  img.src = heroBg.style.backgroundImage?.replace(/url\(['"]?|['"]?\)/g, '') || '';
}

/* ========================
   CONTACT FORM
   ======================== */
const form        = $('#contactForm');
const formBody    = $('#formBody');
const formSuccess = $('#formSuccess');

const formError = $('#formError');

function showFormSuccess() {
  formBody.style.display = 'none';
  formSuccess.classList.add('is-visible');
  formSuccess.setAttribute('role', 'status');
  formSuccess.setAttribute('aria-live', 'polite');
  form.reset();
}

// Post the form to its configured endpoint. Returns a promise that
// resolves on success and rejects on a network/HTTP error.
async function sendForm() {
  const response = await fetch(form.action, {
    method: (form.method || 'POST').toUpperCase(),
    headers: { Accept: 'application/json' },
    body: new FormData(form),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response;
}

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (formError) formError.classList.remove('is-visible');

    const submitBtn = form.querySelector('[type="submit"]');
    const submitLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    try {
      // If no endpoint is configured yet, simulate the round-trip so the
      // demo stays functional; otherwise perform the real API call.
      if (!form.getAttribute('action')) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else {
        await sendForm();
      }
      showFormSuccess();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
      if (formError) {
        formError.textContent =
          'Une erreur est survenue lors de l’envoi. Veuillez réessayer.';
        formError.classList.add('is-visible');
        formError.setAttribute('role', 'alert');
        formError.setAttribute('aria-live', 'assertive');
      }
    }
  });
}

/* ========================
   COUNTER ANIMATION (stats)
   ======================== */
function animateCounter(el) {
  const raw    = el.dataset.count || el.textContent;
  const isPlus = raw.startsWith('+');
  const num    = parseFloat(raw.replace(/[^0-9.]/g, ''));
  const suffix = raw.replace(/[^a-zA-Z%+]/g, '').replace(/^\+/, '');
  const prefix = isPlus ? '+' : '';
  const duration = 1400;
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(eased * num);

    el.textContent = prefix + current + suffix;

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Trigger counters when stats section enters viewport
const statNumbers = $$('.stat-number[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => counterObserver.observe(el));
