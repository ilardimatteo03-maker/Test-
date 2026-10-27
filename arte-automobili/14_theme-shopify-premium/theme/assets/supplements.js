// Arte Automobili — filtres de la section « Suppléments de prestation » (affichage par catégorie).
(function () {
  "use strict";
  if (customElements.get("supplements-filtres")) return;

  class SupplementsFiltres extends HTMLElement {
    connectedCallback() {
      if (this.dataset.pret) return;
      this.dataset.pret = "1";
      this.addEventListener("click", (e) => {
        const bouton = e.target.closest("[data-filtre]");
        if (bouton) this.filtrer(bouton.dataset.filtre);
      });
    }
    filtrer(id) {
      const section = this.closest(".s-supp");
      if (!section) return;
      this.querySelectorAll("[data-filtre]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtre === id)));
      section.querySelectorAll(".s-supp__groupe").forEach((g) => { g.hidden = id !== "tout" && g.dataset.groupe !== id; });
      section.querySelectorAll(".s-supp__groupe:not([hidden]) .reveal:not(.is-visible)").forEach((el) => el.classList.add("is-visible"));
    }
  }
  customElements.define("supplements-filtres", SupplementsFiltres);

  // Éditeur de thème : un bloc sélectionné dans une catégorie masquée redevient visible.
  document.addEventListener("shopify:block:select", (e) => {
    const section = e.target.closest(".s-supp");
    const filtres = section && section.querySelector("supplements-filtres");
    if (filtres) filtres.filtrer("tout");
  });
})();
