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
  // Avant / après : le curseur (input range, accessible au clavier) déplace la séparation
  definir("avant-apres", class extends HTMLElement {
    connectedCallback() {
      var curseur = this.querySelector("input[type=range]");
      var self = this;
      if (!curseur) return;
      var maj = function () { self.style.setProperty("--position", curseur.value + "%"); };
      curseur.addEventListener("input", maj);
      maj();
    }
  });

  // FAQ : une seule réponse ouverte à la fois (option)
  definir("faq-accordeon", class extends HTMLElement {
    connectedCallback() {
      if (!this.hasAttribute("data-un-seul")) return;
      var self = this;
      this.addEventListener("toggle", function (e) {
        if (!e.target.open) return;
        self.querySelectorAll("details[open]").forEach(function (d) { if (d !== e.target) d.open = false; });
      }, true);
    }
  });

  // Chiffres clés : comptage jusqu'à la valeur quand le bloc apparaît
  definir("compteur-anime", class extends HTMLElement {
    connectedCallback() {
      var brut = (this.dataset.valeur || this.textContent).trim();
      var nombre = parseFloat(brut.replace(/\s/g, "").replace(",", "."));
      if (isNaN(nombre) || reduit.matches || document.body.classList.contains("anim-off")) return;
      var decimales = (brut.split(/[.,]/)[1] || "").length;
      var virgule = brut.indexOf(",") > -1;
      var self = this;
      var formater = function (v) {
        var t = v.toFixed(decimales);
        return virgule ? t.replace(".", ",") : t;
      };
      this.textContent = formater(0);
      var io = new IntersectionObserver(function (entrees) {
        if (!entrees[0].isIntersecting) return;
        io.disconnect();
        var debut = null, duree = 1400;
        var pas = function (t) {
          if (!debut) debut = t;
          var p = Math.min(1, (t - debut) / duree);
          self.textContent = formater(nombre * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(pas); else self.textContent = brut;
        };
        requestAnimationFrame(pas);
      }, { threshold: 0.4 });
      io.observe(this);
    }
  });

  // Vidéo YouTube / Vimeo : chargée seulement au clic (performance, cookies)
  definir("video-externe", class extends HTMLElement {
    connectedCallback() {
      var self = this;
      var bouton = this.querySelector("[data-lire]");
      if (!bouton) return;
      bouton.addEventListener("click", function () {
        var id = self.dataset.id;
        var src = self.dataset.type === "youtube"
          ? "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1"
          : "https://player.vimeo.com/video/" + id + "?autoplay=1";
        var f = document.createElement("iframe");
        f.src = src;
        f.title = bouton.getAttribute("aria-label") || "Vidéo";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        self.replaceChildren(f);
        f.focus();
      });
    }
  });

  // Carte Google Maps : chargée au clic (ou directement si l'option est désactivée)
  definir("carte-differee", class extends HTMLElement {
    connectedCallback() {
      var self = this;
      var charger = function () {
        var f = document.createElement("iframe");
        f.src = self.dataset.src;
        f.title = self.dataset.titre || "Carte";
        f.loading = "lazy";
        f.referrerPolicy = "no-referrer-when-downgrade";
        self.replaceChildren(f);
      };
      if (this.hasAttribute("data-auto")) { charger(); return; }
      var b = this.querySelector("[data-charger]");
      if (b) b.addEventListener("click", charger);
    }
  });

  // Visionneuse : agrandit les images des réalisations
  definir("visionneuse-images", class extends HTMLElement {
    connectedCallback() {
      var dialog = this.querySelector("dialog");
      var cadre = this.querySelector(".visionneuse__cadre");
      var legende = this.querySelector(".visionneuse__legende");
      var section = this.closest(".shopify-section") || document;
      var dernier = null;
      if (!dialog || typeof dialog.showModal !== "function") return;
      section.addEventListener("click", function (e) {
        var b = e.target.closest("[data-agrandir]");
        if (!b) return;
        dernier = b;
        var img = new Image();
        img.src = b.dataset.agrandir;
        img.alt = b.dataset.legende || "";
        cadre.replaceChildren(img);
        legende.textContent = b.dataset.legende || "";
        dialog.showModal();
      });
      dialog.addEventListener("click", function (e) {
        if (e.target === dialog || e.target.closest("[data-fermer]")) dialog.close();
      });
      dialog.addEventListener("close", function () { if (dernier) dernier.focus(); });
    }
  });

  // Compte à rebours de la page de lancement (date saisie dans le fuseau choisi)
  function dateDansFuseau(texte, fuseau) {
    var m = String(texte).trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?$/);
    if (!m) return NaN;
    var utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    try {
      var f = new Intl.DateTimeFormat("en-US", { timeZone: fuseau, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
      var p = {};
      f.formatToParts(new Date(utc)).forEach(function (x) { p[x.type] = x.value; });
      var vu = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
      return utc - (vu - utc);
    } catch (e) {
      return utc;
    }
  }
  definir("compte-a-rebours", class extends HTMLElement {
    connectedCallback() {
      this.cible = dateDansFuseau(this.dataset.date, this.dataset.fuseau || "Europe/Brussels");
      if (isNaN(this.cible)) return;
      this.hidden = false;
      var self = this;
      this.tic();
      this.minuteur = setInterval(function () { self.tic(); }, 1000);
    }
    disconnectedCallback() { clearInterval(this.minuteur); }
    tic() {
      var reste = Math.max(0, this.cible - Date.now());
      if (reste === 0) {
        clearInterval(this.minuteur);
        var fin = document.createElement("p");
        fin.className = "lancement__fin";
        fin.textContent = this.dataset.fin || "";
        this.replaceChildren(fin);
        return;
      }
      var s = Math.floor(reste / 1000);
      var v = { jours: Math.floor(s / 86400), heures: Math.floor(s % 86400 / 3600), minutes: Math.floor(s % 3600 / 60), secondes: s % 60 };
      for (var k in v) {
        var el = this.querySelector("[data-" + k + "]");
        if (el) el.textContent = String(v[k]).padStart(2, "0");
      }
    }
  });
})();
