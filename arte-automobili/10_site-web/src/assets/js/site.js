// Arte Automobili — interactions du site : en-tête, menu mobile, apparitions, formulaire de contact.
(function () {
  "use strict";

  // En-tête : fond opaque dès que la page défile
  var header = document.querySelector("[data-header]");
  function majHeader() {
    if (header) header.classList.toggle("is-solid", window.scrollY > 16);
  }
  majHeader();
  window.addEventListener("scroll", majHeader, { passive: true });

  // Menu mobile
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  if (toggle && menu) {
    var libelle = toggle.querySelector("[data-label-open]");
    var ouvrir = function (ouvert) {
      toggle.setAttribute("aria-expanded", String(ouvert));
      menu.hidden = !ouvert;
      document.body.classList.toggle("menu-ouvert", ouvert);
      if (libelle) libelle.textContent = ouvert ? libelle.dataset.labelClose : libelle.dataset.labelOpen;
      if (ouvert) {
        var premier = menu.querySelector("a");
        if (premier) premier.focus();
      }
    };
    toggle.addEventListener("click", function () {
      ouvrir(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        ouvrir(false);
        toggle.focus();
      }
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) ouvrir(false);
    });
    window.matchMedia("(min-width: 1081px)").addEventListener("change", function (mq) {
      if (mq.matches) ouvrir(false);
    });
  }

  // Apparition discrète des blocs marqués .reveal
  var blocs = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && blocs.length) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    blocs.forEach(function (b) { io.observe(b); });
  } else {
    blocs.forEach(function (b) { b.classList.add("is-visible"); });
  }

  // ── Formulaire de contact ───────────────────────────────────────────────
  var form = document.querySelector("[data-form]");
  if (!form) return;

  var envoi = form.dataset.envoi; // "netlify", "web3forms", "formspree" ou "" (non configuré)
  var statut = form.querySelector("[data-statut]");
  var bouton = form.querySelector("[data-envoyer]");
  var libelleBouton = bouton.querySelector("[data-libelle]");
  var confirmation = document.querySelector("[data-confirmation]");

  // Service présélectionné depuis la page Services (?service=interieur…)
  var demande = new URLSearchParams(window.location.search).get("service");
  if (demande) {
    var option = form.querySelector('option[data-id="' + demande.replace(/[^a-z-]/g, "") + '"]');
    if (option) option.selected = true;
  }

  // Pas de date passée
  var champDate = form.querySelector('input[type="date"]');
  var aujourdhui = new Date();
  var iso = new Date(aujourdhui.getTime() - aujourdhui.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (champDate) champDate.min = iso;

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

  var champs = Array.prototype.slice.call(form.querySelectorAll("[data-msg]"));
  champs.forEach(function (champ) {
    var evenement = champ.type === "checkbox" || champ.tagName === "SELECT" ? "change" : "blur";
    champ.addEventListener(evenement, function () { verifierChamp(champ); });
    champ.addEventListener("input", function () {
      if (champ.getAttribute("aria-invalid") === "true") verifierChamp(champ);
    });
  });

  function afficherStatut(html, erreur) {
    statut.innerHTML = html ? '<p class="notice' + (erreur ? " notice--erreur" : "") + '"' + (erreur ? ' role="alert"' : "") + ">" + html + "</p>" : "";
  }

  function occupe(oui) {
    bouton.disabled = oui;
    bouton.setAttribute("aria-busy", String(oui));
    libelleBouton.textContent = oui ? "Envoi en cours…" : "Envoyer la demande";
  }

  function echec() {
    var email = form.dataset.email;
    afficherStatut(
      "Votre demande n'a pas pu être envoyée. Vérifiez votre connexion et réessayez dans un instant." +
        (email ? ' Vous pouvez aussi nous écrire à <a href="mailto:' + email + '">' + email + "</a>." : ""),
      true
    );
  }

  function succes() {
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.focus();
    confirmation.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  // Envoi réel vers le service configuré ; le succès n'est affiché qu'après sa réponse positive
  function envoyer(donnees) {
    if (envoi === "netlify") {
      return fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(donnees).toString(),
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
      });
    }
    if (envoi === "web3forms") {
      donnees.delete("redirect");
      return fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: donnees,
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok || !j.success) throw new Error(j.message || "HTTP " + r.status);
        });
      });
    }
    if (envoi === "formspree") {
      return fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: donnees,
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
      });
    }
    return Promise.reject(new Error("Aucun service d'envoi configuré"));
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    afficherStatut("");
    var invalides = champs.filter(function (c) { return !verifierChamp(c); });
    if (invalides.length) {
      afficherStatut("Merci de compléter les champs signalés.", true);
      invalides[0].focus();
      return;
    }
    if (!envoi) {
      afficherStatut("Le formulaire en ligne n'est pas encore activé.", true);
      return;
    }
    occupe(true);
    envoyer(new FormData(form))
      .then(succes)
      .catch(echec)
      .then(function () { occupe(false); });
  });
})();
