// TOTEM — interactions et animations de scroll.
// Choix technique : uniquement IntersectionObserver + un seul écouteur de
// scroll passif/throttlé en rAF (pas de librairie externe type GSAP). Le
// site vend la rapidité comme argument commercial ; il aurait été
// contradictoire d'ajouter 50-70 Ko de dépendance pour des effets que les
// API natives couvrent très bien.

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ------------------------------------------------------------------ */
  /* Menu mobile                                                         */
  /* ------------------------------------------------------------------ */

  var burger = document.getElementById("navBurger");
  var mobileNav = document.getElementById("navMobile");

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(isOpen));
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal (fade + slide-up) avec cascade sur les groupes         */
  /* ------------------------------------------------------------------ */

  var revealTargets = document.querySelectorAll(".reveal");

  // Cascade : au sein d'un même parent, chaque élément .reveal reçoit un
  // délai croissant pour créer un effet de vague plutôt qu'une apparition
  // groupée (listes de valeurs, grille de services, bento de résultats...).
  var siblingIndex = new Map();
  revealTargets.forEach(function (el) {
    var parent = el.parentElement;
    var index = siblingIndex.get(parent) || 0;
    var delay = Math.min(index * 70, 420);
    el.style.transitionDelay = delay + "ms";
    siblingIndex.set(parent, index + 1);
  });

  if ("IntersectionObserver" in window && revealTargets.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach(function (target) {
      revealObserver.observe(target);
    });
  } else {
    revealTargets.forEach(function (target) {
      target.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Nav : ombre portée une fois qu'on a quitté le haut de page           */
  /* ------------------------------------------------------------------ */

  var header = document.getElementById("nav");
  var sentinel = document.querySelector(".scroll-sentinel");

  if (header && sentinel && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        header.classList.toggle("nav--scrolled", !entries[0].isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    navObserver.observe(sentinel);
  }

  /* ------------------------------------------------------------------ */
  /* Barre de progression + parallaxe du monolithe                       */
  /* Un seul écouteur de scroll (passif, throttlé en rAF) pour les deux.  */
  /* ------------------------------------------------------------------ */

  var progressBar = document.getElementById("scrollProgressBar");
  var hero = document.querySelector(".hero");
  var monolith = document.getElementById("monolith");
  var heroInView = true;

  if (monolith && !prefersReducedMotion) {
    monolith.classList.add("monolith--parallax");
  }

  if (hero && "IntersectionObserver" in window) {
    var heroObserver = new IntersectionObserver(
      function (entries) {
        heroInView = entries[0].isIntersecting;
      },
      { threshold: 0 }
    );
    heroObserver.observe(hero);
  }

  var ticking = false;

  function updateOnScroll() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (progressBar) {
      var maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      var progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
      progressBar.style.transform = "scaleX(" + progress + ")";
    }

    if (monolith && heroInView && !prefersReducedMotion) {
      var rect = hero.getBoundingClientRect();
      var travel = Math.min(Math.max(-rect.top / rect.height, 0), 1);
      monolith.style.transform =
        "translateY(" + (travel * 50).toFixed(1) + "px) rotate(" +
        (travel * -2.5).toFixed(2) + "deg)";
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateOnScroll();

  /* ------------------------------------------------------------------ */
  /* Compteurs animés (150+, X3, 10 ANS, 98%) dans le bloc "Nos résultats"*/
  /* ------------------------------------------------------------------ */

  var counters = document.querySelectorAll(".bento-cell--swatch span:first-child");

  function animateCounter(el) {
    var raw = el.textContent.trim();
    var match = raw.match(/^(\D*?)(\d+)(\D*)$/);
    if (!match) return;

    var prefix = match[1];
    var target = parseInt(match[2], 10);
    var suffix = match[3];

    if (prefersReducedMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }

    var duration = 1100;
    var start = null;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function frame(timestamp) {
      if (start === null) start = timestamp;
      var elapsed = timestamp - start;
      var progress = Math.min(elapsed / duration, 1);
      var value = Math.round(target * easeOutExpo(progress));
      el.textContent = prefix + value + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      }
    }

    window.requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window && counters.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Méthode : étape active pendant le scroll (colonne sticky)           */
  /* ------------------------------------------------------------------ */

  var methodSteps = document.querySelectorAll(".method__list li");

  if ("IntersectionObserver" in window && methodSteps.length) {
    var methodObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    methodSteps.forEach(function (step) {
      methodObserver.observe(step);
    });
  }
})();
