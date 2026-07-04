'use strict';

/* ============================================================
   ASM STUDIO — interactions & animations
   Charte V 2.0 : sobre, transform/opacity uniquement, 60 fps.
   Zéro dépendance : IntersectionObserver + rAF + CSS.
   Tout est désactivé si prefers-reduced-motion est actif.
   ============================================================ */

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ---------- Nav : état "scrollé" ---------- */
(function () {
  var topbar = document.querySelector('.topbar');
  if (!topbar) return;
  var ticking = false;

  function update() {
    topbar.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

/* ---------- Entrée du hero : reveal typographique ----------
   Découpe le H1 en mots masqués qui montent en cascade.
   Le span .accent est traité comme un mot unique pour ne pas
   casser la couleur. Sans JS : hero statique (aucune classe). */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || REDUCED) return;
  var h1 = hero.querySelector('h1');
  if (!h1) return;

  var wordIndex = 0;

  function wrapWord(content) {
    var mask = document.createElement('span');
    mask.className = 'hero-word-mask';
    var word = document.createElement('span');
    word.className = 'hero-word';
    word.style.setProperty('--word-i', wordIndex++);
    if (typeof content === 'string') { word.textContent = content; }
    else { word.appendChild(content); }
    mask.appendChild(word);
    return mask;
  }

  var frag = document.createDocumentFragment();
  Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Découpe le texte en mots, en conservant les espaces entre eux
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); }
        else { frag.appendChild(wrapWord(part)); }
      });
    } else {
      // Élément (ex. <span class="accent">) : un seul bloc animé
      frag.appendChild(wrapWord(node));
    }
  });

  h1.textContent = '';
  h1.appendChild(frag);
  hero.classList.add('has-anim');
})();

/* ---------- Reveal au scroll + stagger ----------
   Les .reveal frères d'un même parent reçoivent un délai en
   cascade (70 ms, plafonné) pour une apparition en vague. */
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (REDUCED || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  items.forEach(function (el) {
    var siblings = Array.prototype.filter.call(
      el.parentElement.children,
      function (c) { return c.classList.contains('reveal'); }
    );
    if (siblings.length > 1) {
      var i = siblings.indexOf(el);
      el.style.transitionDelay = Math.min(i * 70, 420) + 'ms';
    }
  });

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

/* ---------- Compteurs animés (.stat .num) ----------
   Anime la partie numérique (gère la décimale à la française)
   quand la statistique entre dans le viewport. */
(function () {
  var nums = document.querySelectorAll('.stat .num');
  if (!nums.length || REDUCED || !('IntersectionObserver' in window)) return;

  function animate(el) {
    // Cible le nœud texte contenant le nombre (peut être dans .accent)
    var target = el.querySelector('.accent') || el;
    var original = target.textContent;
    var match = original.match(/(\d+(?:,\d+)?)/);
    if (!match) return;

    var end = parseFloat(match[1].replace(',', '.'));
    var decimals = (match[1].split(',')[1] || '').length;
    var start = null;
    var DURATION = 1100;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      var value = (end * eased).toFixed(decimals).replace('.', ',');
      target.textContent = original.replace(match[1], value);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  nums.forEach(function (el) { io.observe(el); });
})();

/* ---------- Parallaxe décorative (.case-visual) ----------
   Dérive verticale légère (±12 px) des illustrations SVG,
   proportionnelle à la position dans le viewport. Décor
   uniquement — jamais de texte. will-change n'est posé que
   quand l'élément est visible, retiré ensuite. */
(function () {
  var visuals = document.querySelectorAll('.case-visual');
  if (!visuals.length || REDUCED || !('IntersectionObserver' in window)) return;

  var active = [];
  var ticking = false;

  function update() {
    var vh = window.innerHeight;
    active.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var offset = (rect.top + rect.height / 2 - vh / 2) / vh; // -0.5 … 0.5
      var y = Math.max(-12, Math.min(12, offset * -24));
      var svg = el.firstElementChild;
      if (svg) svg.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking && active.length) { requestAnimationFrame(update); ticking = true; }
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var el = entry.target;
      if (entry.isIntersecting) {
        if (active.indexOf(el) === -1) active.push(el);
        el.classList.add('is-parallax');
      } else {
        var i = active.indexOf(el);
        if (i !== -1) active.splice(i, 1);
        el.classList.remove('is-parallax');
      }
    });
    onScroll();
  });

  visuals.forEach(function (el) { io.observe(el); });
  window.addEventListener('scroll', onScroll, { passive: true });
})();
