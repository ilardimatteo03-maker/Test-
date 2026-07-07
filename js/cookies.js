'use strict';

/* ============================================================
   ASM — Gestion du consentement aux cookies (CMP maison)
   Conforme RGPD + ePrivacy + recommandations APD (Belgique).

   - Aucun cookie/traceur non essentiel avant consentement explicite.
   - Google Consent Mode v2 : tout "denied" par défaut (voir le snippet
     inline dans le <head> de chaque page), mis à jour au consentement.
   - Preuve de consentement : enregistrée dans localStorage (horodatage,
     version, identifiant, méthode, choix). Hook POST optionnel.
   - Accessible (dialog modale, focus trap, ESC), sans dark pattern
     (Refuser = même poids qu'Accepter, non-essentiels décochés par défaut).

   API publique : window.ASMConsent.open() | get() | reset()
   ============================================================ */

(function () {
  /* ---------- Configuration ---------- */
  var CONFIG = {
    version: '1.0.0',              // incrémenter = redemande le consentement
    storageKey: 'asm_cookie_consent',
    policyUrl: 'politique-cookies.html',
    // Renseigner une URL pour journaliser le consentement côté serveur
    // (ex. une Netlify Function). Laisser null pour rester 100 % client.
    logEndpoint: null
  };

  /* ---------- Catégories ---------- */
  var CATEGORIES = ['essential', 'performance', 'marketing', 'personalization'];

  /* ---------- i18n (FR par défaut ; ajouter 'nl'/'en' ici) ---------- */
  var LANG = (document.documentElement.lang || 'fr').slice(0, 2);
  var I18N = {
    fr: {
      bannerTitle: 'Nous respectons votre vie privée',
      bannerText: 'Nous utilisons des cookies pour faire fonctionner le site et, avec votre accord, en mesurer l’audience et améliorer votre expérience. Vous pouvez accepter, refuser ou choisir en détail. Aucun cookie non essentiel n’est déposé sans votre consentement.',
      acceptAll: 'Accepter tout',
      rejectAll: 'Refuser tout',
      customize: 'Personnaliser',
      policyLink: 'Politique de cookies',
      save: 'Enregistrer mes choix',
      modalTitle: 'Paramètres des cookies',
      modalIntro: 'Choisissez les catégories que vous autorisez. Vous pourrez modifier ou retirer votre choix à tout moment via « Gérer mes cookies » en bas de page.',
      close: 'Fermer',
      alwaysOn: 'Toujours actif',
      manage: 'Gérer mes cookies',
      cats: {
        essential: {
          name: 'Cookies essentiels',
          desc: 'Nécessaires au fonctionnement du site (sécurité, préférences d’affichage, mémorisation de votre choix de cookies). Ils ne peuvent pas être désactivés.'
        },
        performance: {
          name: 'Mesure d’audience',
          desc: 'Nous aident à comprendre l’usage du site (pages vues, parcours) pour l’améliorer. Statistiques agrégées. Ex. : Google Analytics 4.'
        },
        marketing: {
          name: 'Marketing / Publicité',
          desc: 'Servent à mesurer et personnaliser la publicité et à limiter sa répétition. Ex. : Google Ads, Meta (Facebook/Instagram).'
        },
        personalization: {
          name: 'Personnalisation',
          desc: 'Adaptent le contenu et mémorisent vos préférences pour une expérience sur mesure.'
        }
      }
    }
  };
  var T = I18N[LANG] || I18N.fr;

  /* ---------- Consent Mode helper ---------- */
  function gtagConsentUpdate(choices) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage:       choices.performance ? 'granted' : 'denied',
      ad_storage:              choices.marketing ? 'granted' : 'denied',
      ad_user_data:            choices.marketing ? 'granted' : 'denied',
      ad_personalization:      choices.marketing ? 'granted' : 'denied',
      personalization_storage: choices.personalization ? 'granted' : 'denied',
      functionality_storage:   choices.personalization ? 'granted' : 'denied',
      security_storage:        'granted'
    });
  }

  /* ---------- Stockage / preuve ---------- */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== CONFIG.version) return null; // version obsolète → redemande
      return data;
    } catch (e) { return null; }
  }

  function writeConsent(choices, method) {
    var record = {
      version: CONFIG.version,
      id: uuid(),
      timestamp: new Date().toISOString(),
      method: method,                 // 'accept_all' | 'reject_all' | 'custom'
      choices: choices,
      lang: LANG
    };
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(record)); } catch (e) {}
    // Journalisation serveur optionnelle (preuve côté serveur)
    if (CONFIG.logEndpoint) {
      try {
        fetch(CONFIG.logEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }
    return record;
  }

  /* ---------- Application du consentement ---------- */
  function applyConsent(choices) {
    gtagConsentUpdate(choices);

    /* ---- Branchez ici vos traceurs, gardés par catégorie ----
       N'exécutez le chargement QUE si la catégorie est autorisée.
       Exemples (décommenter + renseigner vos identifiants) :

       if (choices.performance) {
         // Google Analytics 4
         // var s = document.createElement('script');
         // s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
         // s.async = true; document.head.appendChild(s);
         // gtag('js', new Date());
         // gtag('config', 'G-XXXXXXX', { anonymize_ip: true });
       }

       if (choices.marketing) {
         // Meta Pixel, Google Ads, etc.
       }
    ------------------------------------------------------------ */

    document.dispatchEvent(new CustomEvent('asm:consent', { detail: choices }));
  }

  function choicesFrom(all) {
    return {
      essential: true,
      performance: !!all,
      marketing: !!all,
      personalization: !!all
    };
  }

  /* ============================================================
     Interface (bandeau + modale) — injectée par JS
     ============================================================ */
  var lastFocus = null;

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------- Bandeau ---------- */
  function buildBanner() {
    var b = el('div', {
      id: 'asm-cookie-banner',
      class: 'cc-banner',
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': 'cc-banner-title',
      'aria-describedby': 'cc-banner-text'
    });
    b.innerHTML =
      '<div class="cc-banner-inner">' +
        '<div class="cc-banner-copy">' +
          '<h2 id="cc-banner-title" class="cc-title">' + T.bannerTitle + '</h2>' +
          '<p id="cc-banner-text" class="cc-text">' + T.bannerText +
            ' <a class="cc-link" href="' + CONFIG.policyUrl + '">' + T.policyLink + '</a>.</p>' +
        '</div>' +
        '<div class="cc-banner-actions">' +
          '<button type="button" class="cc-btn cc-btn-ghost" data-cc="customize">' + T.customize + '</button>' +
          '<button type="button" class="cc-btn cc-btn-outline" data-cc="reject">' + T.rejectAll + '</button>' +
          '<button type="button" class="cc-btn cc-btn-primary" data-cc="accept">' + T.acceptAll + '</button>' +
        '</div>' +
      '</div>';
    return b;
  }

  /* ---------- Modale de préférences ---------- */
  function buildModal(current) {
    var overlay = el('div', { id: 'asm-cookie-modal', class: 'cc-overlay', hidden: '' });
    var rows = CATEGORIES.map(function (cat) {
      var c = T.cats[cat];
      var locked = cat === 'essential';
      var checked = locked ? true : !!(current && current.choices && current.choices[cat]);
      var control = locked
        ? '<span class="cc-always">' + T.alwaysOn + '</span>'
        : '<label class="cc-switch">' +
            '<input type="checkbox" data-cat="' + cat + '"' + (checked ? ' checked' : '') + ' />' +
            '<span class="cc-slider" aria-hidden="true"></span>' +
            '<span class="cc-sr">' + c.name + '</span>' +
          '</label>';
      return '<div class="cc-cat">' +
          '<div class="cc-cat-head">' +
            '<h3 class="cc-cat-name">' + c.name + '</h3>' + control +
          '</div>' +
          '<p class="cc-cat-desc">' + c.desc + '</p>' +
        '</div>';
    }).join('');

    overlay.innerHTML =
      '<div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">' +
        '<div class="cc-modal-head">' +
          '<h2 id="cc-modal-title" class="cc-title">' + T.modalTitle + '</h2>' +
          '<button type="button" class="cc-close" data-cc="close" aria-label="' + T.close + '">&times;</button>' +
        '</div>' +
        '<p class="cc-text">' + T.modalIntro + '</p>' +
        '<div class="cc-cats">' + rows + '</div>' +
        '<div class="cc-modal-actions">' +
          '<button type="button" class="cc-btn cc-btn-outline" data-cc="reject">' + T.rejectAll + '</button>' +
          '<button type="button" class="cc-btn cc-btn-outline" data-cc="accept">' + T.acceptAll + '</button>' +
          '<button type="button" class="cc-btn cc-btn-primary" data-cc="save">' + T.save + '</button>' +
        '</div>' +
      '</div>';
    return overlay;
  }

  /* ---------- Gestion focus (accessibilité) ---------- */
  function trapFocus(container, e) {
    var f = container.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ============================================================
     Contrôleur
     ============================================================ */
  var bannerEl = null, modalEl = null;

  function removeBanner() {
    if (bannerEl) { bannerEl.remove(); bannerEl = null; }
  }

  function finish(choices, method) {
    writeConsent(choices, method);
    applyConsent(choices);
    removeBanner();
    closeModal();
  }

  function openModal() {
    lastFocus = document.activeElement;
    var current = readConsent();
    modalEl = buildModal(current);
    document.body.appendChild(modalEl);
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';

    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeModal(); // clic sur le fond
      var action = e.target.getAttribute && e.target.getAttribute('data-cc');
      if (action === 'close') closeModal();
      if (action === 'reject') finish(choicesFrom(false), 'reject_all');
      if (action === 'accept') finish(choicesFrom(true), 'accept_all');
      if (action === 'save') {
        var choices = { essential: true };
        modalEl.querySelectorAll('input[data-cat]').forEach(function (i) {
          choices[i.getAttribute('data-cat')] = i.checked;
        });
        finish(choices, 'custom');
      }
    });
    modalEl.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      trapFocus(this, e);   // 'this' = l'élément écouté (jamais null)
    });

    var firstBtn = modalEl.querySelector('.cc-close');
    if (firstBtn) firstBtn.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.remove(); modalEl = null;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
    bannerEl.addEventListener('click', function (e) {
      var action = e.target.getAttribute && e.target.getAttribute('data-cc');
      if (action === 'accept') finish(choicesFrom(true), 'accept_all');
      if (action === 'reject') finish(choicesFrom(false), 'reject_all');
      if (action === 'customize') openModal();
    });
  }

  /* ---------- API publique ---------- */
  window.ASMConsent = {
    open: openModal,
    get: readConsent,
    reset: function () {
      try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
      showBanner();
    }
  };

  /* ---------- Liens « Gérer mes cookies » ---------- */
  function wireManageLinks() {
    document.querySelectorAll('[data-cc-open]').forEach(function (link) {
      link.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    wireManageLinks();
    var existing = readConsent();
    if (existing) {
      applyConsent(existing.choices);   // ré-applique le choix mémorisé
    } else {
      showBanner();                      // 1re visite (ou version obsolète)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
