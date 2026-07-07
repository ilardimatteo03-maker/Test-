/* ==========================================================================
   Chrono Guide — JS léger (vanilla, aucune dépendance)
   Thème clair/sombre, menu mobile, apparition au scroll, validation du form.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---- Année du footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Bascule de thème (persistée dans localStorage) ---- */
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---- Menu mobile ---- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Ombre du header au scroll (IntersectionObserver, pas de listener scroll) ---- */
  var header = document.getElementById("header");
  if (header && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px;";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---- Apparition au scroll ---- */
  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealables.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Validation légère du formulaire de contact ---- */
  var form = document.getElementById("contactForm");
  if (form) {
    var status = document.getElementById("formStatus");

    function setError(name, msg) {
      var field = form.querySelector("#" + name).closest(".field");
      var small = form.querySelector('.error[data-for="' + name + '"]');
      field.classList.toggle("invalid", Boolean(msg));
      if (small) small.textContent = msg || "";
    }

    function validEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      var ok = true;

      if (!name) { setError("name", "Merci d'indiquer votre nom."); ok = false; }
      else setError("name", "");

      if (!validEmail(email)) { setError("email", "Adresse email invalide."); ok = false; }
      else setError("email", "");

      if (message.length < 10) { setError("message", "Un peu plus de détails ? (10 caractères min.)"); ok = false; }
      else setError("message", "");

      if (!ok) { if (status) status.textContent = ""; return; }

      // Démo : aucun backend branché. Remplacez par un fetch() vers votre
      // service (Formspree, Netlify Forms, votre API...).
      if (status) status.textContent = "Merci ! Votre demande a bien été envoyée (démo).";
      form.reset();
    });
  }
})();
