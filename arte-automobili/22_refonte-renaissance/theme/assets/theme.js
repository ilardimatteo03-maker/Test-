// Arte Automobili — thème Shopify vitrine : en-tête, barre d'annonce, menus, apparitions, formulaires.
// Écrit pour survivre aux rechargements de sections de l'éditeur de thème (délégation d'événements).
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  // ── En-tête : position sous la barre d'annonce, fond au défilement, réduction ──
  function majHeader() {
    var h = $("[data-header]");
    if (!h) return;
    var y = window.scrollY;
    var barre = $("[data-annonce]");
    var barreH = barre ? barre.offsetHeight : 0;
    var fixe = h.dataset.fixe !== "false";
    root.style.setProperty("--entete-top", (fixe ? Math.max(0, barreH - y) : barreH) + "px");
    if ((h.dataset.fond || "defilement") === "defilement") h.classList.toggle("is-solid", y > 16);
    if (h.dataset.reduire === "true") h.classList.toggle("is-reduit", y > 40);
  }
  majHeader();
  window.addEventListener("scroll", majHeader, { passive: true });
  window.addEventListener("resize", majHeader);

  // ── Menu mobile ──
  function ouvrirMenu(ouvert, rendreFocus) {
    var toggle = $("[data-menu-toggle]");
    var menu = $("[data-menu]");
    if (!toggle || !menu) return;
    var libelle = toggle.querySelector("[data-label-open]");
    toggle.setAttribute("aria-expanded", String(ouvert));
    menu.hidden = !ouvert;
    document.body.classList.toggle("menu-ouvert", ouvert);
    if (libelle) libelle.textContent = ouvert ? libelle.dataset.labelClose : libelle.dataset.labelOpen;
    if (ouvert) {
      var premier = menu.querySelector("a");
      if (premier) premier.focus();
    } else if (rendreFocus) {
      toggle.focus();
    }
  }

  // ── Sous-menus (en-tête et menu mobile) ──
  function basculerSousMenu(li, ouvert) {
    li.classList.toggle("is-open", ouvert);
    var b = li.querySelector(".nav__ouvrir");
    if (b) b.setAttribute("aria-expanded", String(ouvert));
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-menu-toggle]");
    if (t) {
      ouvrirMenu(t.getAttribute("aria-expanded") !== "true");
      return;
    }
    var bouton = e.target.closest(".nav__ouvrir");
    if (bouton) {
      var li = bouton.closest("[data-sous-menu]");
      var ouvert = !li.classList.contains("is-open");
      $$("[data-sous-menu].is-open", li.parentNode).forEach(function (autre) { if (autre !== li) basculerSousMenu(autre, false); });
      basculerSousMenu(li, ouvert);
      return;
    }
    $$(".header__nav [data-sous-menu].is-open").forEach(function (li) { if (!li.contains(e.target)) basculerSousMenu(li, false); });
    var menu = $("[data-menu]");
    if (menu && !menu.hidden) {
      if (e.target.closest("[data-menu] a")) ouvrirMenu(false);
      else if (!e.target.closest("[data-menu]") && !e.target.closest("[data-header]")) ouvrirMenu(false);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var ouvertDesktop = $(".header__nav [data-sous-menu].is-open");
    if (ouvertDesktop) {
      basculerSousMenu(ouvertDesktop, false);
      ouvertDesktop.querySelector(".nav__ouvrir").focus();
      return;
    }
    var menu = $("[data-menu]");
    if (menu && !menu.hidden) ouvrirMenu(false, true);
  });
  window.addEventListener("resize", function () {
    var menu = $("[data-menu]");
    if (menu && !menu.hidden && getComputedStyle($("[data-menu-toggle]")).display === "none") ouvrirMenu(false);
  });

  // ── Apparition discrète des blocs marqués .reveal ──
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entrees) {
    entrees.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px" }) : null;
  function initReveal(scope) {
    $$(".reveal:not(.is-visible)", scope).forEach(function (b) {
      if (io) io.observe(b); else b.classList.add("is-visible");
    });
  }
  initReveal(document);

  // ── Formulaires de contact (formulaire natif Shopify) ──
  // La confirmation est rendue par Shopify après réception (form.posted_successfully?) ;
  // ce script vérifie seulement les champs avant l'envoi et donne le focus au message affiché.
  var aujourdhui = new Date();
  var iso = new Date(aujourdhui.getTime() - aujourdhui.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function erreurChamp(champ, message) {
    var zone = document.getElementById(champ.id + "-erreur");
    if (message) {
      champ.setAttribute("aria-invalid", "true");
      if (zone) {
        zone.textContent = message;
        zone.hidden = false;
        champ.setAttribute("aria-describedby", zone.id);
      }
    } else {
      champ.removeAttribute("aria-invalid");
      champ.removeAttribute("aria-describedby");
      if (zone) {
        zone.textContent = "";
        zone.hidden = true;
      }
    }
  }

  function verifierChamp(champ) {
    var valeur = champ.type === "checkbox" ? champ.checked : champ.value.trim();
    var invalide = false;
    if (champ.required && !valeur) invalide = true;
    else if (champ.type === "email" && valeur && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur)) invalide = true;
    else if (champ.type === "tel" && valeur && (valeur.replace(/\D/g, "").length < 6 || !champ.checkValidity())) invalide = true;
    else if (champ.type === "date" && valeur && valeur < iso) invalide = true;
    erreurChamp(champ, invalide ? champ.dataset.msg : "");
    return !invalide;
  }

  function initFormulaire(form) {
    if (form.dataset.pret) return;
    form.dataset.pret = "1";
    var confirmation = form.querySelector("[data-confirmation]");
    if (confirmation) {
      confirmation.focus();
      confirmation.scrollIntoView({ block: "center" });
    }
    var bouton = form.querySelector("[data-envoyer]");
    if (!bouton) return;
    var statut = form.querySelector("[data-statut]");
    var libelleBouton = bouton.querySelector("[data-libelle]");
    var erreurServeur = form.querySelector(".notice--erreur");
    if (erreurServeur) {
      erreurServeur.setAttribute("tabindex", "-1");
      erreurServeur.focus();
    }
    // Service présélectionné depuis la page Services (?service=interieur…)
    var demande = new URLSearchParams(window.location.search).get("service");
    if (demande) {
      var option = form.querySelector('option[data-id="' + demande.replace(/[^a-z-]/g, "") + '"]');
      if (option) option.selected = true;
    }
    var champDate = form.querySelector('input[type="date"]');
    if (champDate) champDate.min = iso;

    var champs = $$("[data-msg]", form);
    champs.forEach(function (champ) {
      var evenement = champ.type === "checkbox" || champ.tagName === "SELECT" ? "change" : "blur";
      champ.addEventListener(evenement, function () { verifierChamp(champ); });
      champ.addEventListener("input", function () {
        if (champ.getAttribute("aria-invalid") === "true") verifierChamp(champ);
      });
    });
    form.addEventListener("submit", function (e) {
      if (statut) statut.innerHTML = "";
      var invalides = champs.filter(function (c) { return !verifierChamp(c); });
      if (invalides.length) {
        e.preventDefault();
        if (statut) statut.innerHTML = '<p class="notice notice--erreur" role="alert">Merci de compléter les champs signalés.</p>';
        invalides[0].focus();
        return;
      }
      // envoi réel par Shopify : la page se recharge avec la confirmation ou l'erreur
      bouton.setAttribute("aria-busy", "true");
      if (libelleBouton) libelleBouton.textContent = "Envoi en cours…";
    });
  }
  function initFormulaires(scope) { $$("form.js-formulaire", scope).forEach(initFormulaire); }
  initFormulaires(document);

  // ── Éditeur de thème : réinitialiser les sections rechargées ──
  document.addEventListener("shopify:section:load", function (e) {
    initReveal(e.target);
    initFormulaires(e.target);
    majHeader();
  });
  document.addEventListener("shopify:section:unload", function () { setTimeout(majHeader, 0); });
})();
