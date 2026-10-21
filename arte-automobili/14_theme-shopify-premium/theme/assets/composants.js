// Arte Automobili — composants interactifs (éléments personnalisés, réinitialisés automatiquement
// dans l'éditeur de thème). Chaque composant respecte la préférence « réduire les animations ».
(function () {
  "use strict";
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  function definir(nom, classe) { if (!customElements.get(nom)) customElements.define(nom, classe); }

  // Barre d'annonce : alternance des messages
  definir("annonce-rotation", class extends HTMLElement {
    connectedCallback() {
      this.items = Array.prototype.slice.call(this.querySelectorAll(".annonce__item"));
      this.index = 0;
      if (this.items.length < 2 || this.hasAttribute("data-fixe")) return;
      var self = this;
      this.addEventListener("click", function (e) {
        if (e.target.closest("[data-prec]")) { self.aller(self.index - 1); self.relancer(); }
        if (e.target.closest("[data-suiv]")) { self.aller(self.index + 1); self.relancer(); }
      });
      this.addEventListener("mouseenter", function () { self.arreter(); });
      this.addEventListener("mouseleave", function () { self.relancer(); });
      this.addEventListener("focusin", function () { self.arreter(); });
      this.relancer();
    }
    disconnectedCallback() { this.arreter(); }
    aller(i) {
      var n = this.items.length;
      this.items[this.index].hidden = true;
      this.items[this.index].classList.remove("is-active");
      this.index = (i + n) % n;
      this.items[this.index].hidden = false;
      this.items[this.index].classList.add("is-active");
    }
    arreter() { clearInterval(this.minuteur); }
    relancer() {
      this.arreter();
      if (reduit.matches) return;
      var self = this;
      this.minuteur = setInterval(function () { self.aller(self.index + 1); }, parseInt(this.dataset.intervalle, 10) || 5000);
    }
  });
})();
