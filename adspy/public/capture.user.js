/* eslint-disable */
/* ==UserScript==
   @name         ADSPY — capture Ad Library
   @namespace    adspy
   @match        https://www.facebook.com/ads/library*
   @grant        none
   @description  Renvoie vers ADSPY (localhost) les annonces que la page Ad Library charge déjà.
   ==/UserScript== */

/* =========================================================
   CAPTURE NAVIGATEUR

   À quoi ça sert : quand Meta refuse les appels automatisés
   (captcha, blocage régional, limite de débit), c'est ton
   propre navigateur qui charge la page Ad Library, tout à
   fait normalement. Ce script écoute simplement les données
   que la page reçoit déjà et les recopie vers ton ADSPY
   local. Rien n'est envoyé ailleurs qu'à http://localhost.

   Deux façons de l'utiliser :
   - en marque-page (bookmarklet) : à cliquer sur la page ;
   - en userscript (Tampermonkey) : automatique à chaque visite.

   Note : écrit sans commentaire en fin de ligne et avec des
   points-virgules partout, parce que le serveur en génère une
   version compactée sur une seule ligne pour le marque-page.
   ========================================================= */

(function () {
  'use strict';

  var ENDPOINT = 'http://localhost:4177/api/capture';
  var MARKER = '__adspyCaptureActive';

  if (window[MARKER]) {
    if (window.__adspyToast) window.__adspyToast('Capture déjà active — fais défiler la page.');
    return;
  }
  window[MARKER] = true;

  var sent = 0;
  var pending = 0;
  var lastError = '';

  /* ---------- petit badge de statut ---------- */
  var badge = document.createElement('div');
  badge.style.cssText = [
    'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483647',
    'background:#0A0A0A', 'color:#fff', 'border:1px solid #8B5CF6',
    'border-radius:12px', 'padding:12px 16px', 'font:500 13px/1.5 system-ui,sans-serif',
    'box-shadow:0 12px 32px rgba(0,0,0,.45)', 'max-width:280px', 'cursor:pointer'
  ].join(';');
  badge.title = 'Cliquer pour masquer';
  badge.onclick = function () { badge.style.display = 'none'; };

  function render(message) {
    badge.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;font-weight:700">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:#8B5CF6;display:inline-block"></span>' +
      'ADSPY — capture active</div>' +
      '<div style="margin-top:6px;color:#9CA3AF">' + message + '</div>';
  }

  function status() {
    var text = sent + ' annonce(s) envoyée(s)';
    if (pending) text += ' · ' + pending + ' en cours';
    if (lastError) text += '<br><span style="color:#F87171">' + lastError + '</span>';
    else text += '<br>Fais défiler pour en charger plus.';
    render(text);
  }

  window.__adspyToast = function (message) { render(message); };

  render('Initialisation…');
  (document.body || document.documentElement).appendChild(badge);

  /* ---------- envoi vers le serveur local ---------- */
  function push(text) {
    if (!text || text.indexOf('ad_archive_id') === -1 && text.indexOf('adArchiveID') === -1) return;
    pending++;
    status();
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: text
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      pending--;
      sent += (data && data.found) || 0;
      lastError = '';
      status();
    }).catch(function (err) {
      pending--;
      lastError = 'ADSPY injoignable — le serveur tourne-t-il ? (' + err.message + ')';
      status();
    });
  }

  function isTarget(url) {
    if (!url) return false;
    url = String(url);
    return url.indexOf('/api/graphql') !== -1 || url.indexOf('/ads/library/async') !== -1;
  }

  /* ---------- interception de fetch ---------- */
  var originalFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    var url = '';
    try {
      url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
    } catch (e) { url = ''; }

    var promise = originalFetch.apply(this, args);
    if (isTarget(url)) {
      promise.then(function (response) {
        try {
          response.clone().text().then(push).catch(function () {});
        } catch (e) {}
        return response;
      }).catch(function () {});
    }
    return promise;
  };

  /* ---------- interception de XMLHttpRequest ---------- */
  var originalOpen = XMLHttpRequest.prototype.open;
  var originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__adspyUrl = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    if (isTarget(xhr.__adspyUrl)) {
      xhr.addEventListener('load', function () {
        try {
          if (typeof xhr.responseText === 'string') push(xhr.responseText);
        } catch (e) {}
      });
    }
    return originalSend.apply(this, arguments);
  };

  /* ---------- récupération de ce qui est déjà chargé ---------- */
  try {
    var scripts = document.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var content = scripts[i].textContent || '';
      if (content.length > 400 && content.indexOf('ad_archive_id') !== -1) push(content);
    }
  } catch (e) {}

  status();
})();
