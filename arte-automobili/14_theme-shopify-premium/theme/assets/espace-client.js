// Arte Automobili — espace client : QR code de la carte, fenêtre « Présenter ma carte », navigation interne.
// Aucune donnée n'est calculée ici : points, niveaux et rendez-vous sont rendus par Shopify (snippet ec-donnees).
// Chargé par plusieurs sections : la garde ci-dessous évite une double initialisation.
(function () {
  "use strict";
  if (window.ArteEspaceClient) return;
  window.ArteEspaceClient = true;

  // ── QR code (bibliothèque ec-qrcode.js, licence MIT) ──
  // Le code contient le lien de la fiche client dans l'administration Shopify : seul un membre de l'équipe
  // connecté à Shopify peut l'ouvrir. Il n'affiche aucune donnée par lui-même.
  class EcQr extends HTMLElement {
    connectedCallback() {
      if (this.dataset.pret) return;
      // la bibliothèque peut arriver après ce script (scripts différés chargés par plusieurs sections)
      if (typeof window.qrcode !== "function") {
        var el = this;
        window.addEventListener("load", function () { el.connectedCallback(); }, { once: true });
        return;
      }
      var valeur = this.dataset.valeur;
      if (!valeur) return;
      this.dataset.pret = "1";
      var qr = window.qrcode(0, "M");
      qr.addData(valeur);
      qr.make();
      var n = qr.getModuleCount();
      var marge = Number(this.dataset.marge || 2);
      var taille = n + marge * 2;
      var d = "";
      for (var y = 0; y < n; y++) {
        for (var x = 0; x < n; x++) {
          if (qr.isDark(y, x)) d += "M" + (x + marge) + " " + (y + marge) + "h1v1h-1z";
        }
      }
      this.innerHTML =
        '<svg viewBox="0 0 ' + taille + " " + taille + '" role="img" aria-label="' + (this.dataset.libelle || "QR code").replace(/"/g, "&quot;") + '" shape-rendering="crispEdges">' +
        '<rect width="' + taille + '" height="' + taille + '" fill="#fff"/><path fill="#0D0F0E" d="' + d + '"/></svg>';
    }
  }
  if (!customElements.get("ec-qr")) customElements.define("ec-qr", EcQr);

  // ── Fenêtre « Présenter ma carte » ──
  document.addEventListener("click", function (e) {
    var ouvrir = e.target.closest("[data-ec-presenter]");
    if (ouvrir) {
      var dialogue = document.getElementById(ouvrir.getAttribute("data-ec-presenter"));
      if (dialogue && typeof dialogue.showModal === "function") {
        dialogue.showModal();
        document.documentElement.classList.add("ec-dialogue-ouvert");
      }
      return;
    }
    if (e.target.closest("[data-ec-fermer]")) {
      var d = e.target.closest("dialog");
      if (d) d.close();
      return;
    }
    // clic sur le fond de la fenêtre
    if (e.target.tagName === "DIALOG" && e.target.classList.contains("ec-presentation")) e.target.close();
  });
  document.addEventListener("close", function (e) {
    if (e.target.classList && e.target.classList.contains("ec-presentation")) document.documentElement.classList.remove("ec-dialogue-ouvert");
  }, true);

  // ── Demande de rendez-vous : prestation présélectionnée (« Réserver à nouveau », ?service=interieur) ──
  var demande = new URLSearchParams(window.location.search).get("service");
  if (demande) {
    var choix = document.querySelector('.ec-choix input[data-id="' + demande.replace(/[^a-z-]/g, "") + '"]');
    if (choix) choix.checked = true;
  }

  // ── Navigation interne : rubrique active selon la position de lecture ──
  var observateur = null;
  function initNavigation() {
    if (observateur) observateur.disconnect();
    var liens = Array.prototype.slice.call(document.querySelectorAll(".ec-nav a[href^='#']"));
    if (!liens.length || !("IntersectionObserver" in window)) return;
    var cibles = [];
    liens.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute("href").slice(1));
      var cible = id && document.getElementById(id);
      if (cible && cibles.indexOf(cible) === -1) cibles.push(cible);
    });
    var visibles = new Map();
    observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) { visibles.set(en.target, en.isIntersecting ? en.intersectionRect.top : null); });
      var actif = null;
      cibles.forEach(function (c) { if (!actif && visibles.get(c) !== null && visibles.get(c) !== undefined) actif = c; });
      if (!actif) return;
      liens.forEach(function (a) {
        var est = a.getAttribute("href") === "#" + actif.id;
        a.classList.toggle("is-actif", est);
        if (est) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-30% 0px -55% 0px" });
    cibles.forEach(function (c) { observateur.observe(c); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initNavigation);
  else initNavigation();

  document.addEventListener("shopify:section:load", initNavigation);
  document.addEventListener("shopify:section:unload", function () { setTimeout(initNavigation, 0); });
})();
