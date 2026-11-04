/*!
 * TAXI PRO — module de réservation
 * ---------------------------------------------------------------------------
 * - TaxiProBooking : parcours en 5 étapes (trajet, véhicule, options, coordonnées, récapitulatif).
 * - TaxiProQuick   : formulaire rapide (héros) qui estime le prix puis ouvre la réservation.
 *
 * Les tarifs ne sont jamais écrits ici : ils viennent des blocs JSON publiés par le thème
 * (snippets/tp-config-settings.liquid et le groupe de sections « Configuration Taxi Pro »)
 * et sont calculés par assets/tp-pricing.js, le même moteur que celui du backend.
 *
 * Envoi :
 *   - avec le service de réservation (backend) : prix revalidé côté serveur, paiement en ligne possible ;
 *   - sans backend : demande transmise par le formulaire de contact natif de Shopify (sans paiement).
 * Une réservation n'est jamais présentée comme confirmée tant que le serveur ne l'a pas confirmée.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var P = window.TaxiProPricing;
  var G = window.TaxiProGeo;
  var STORE_KEY = 'tp-booking-v1';
  var uid = 0;

  /* ------------------------------------------------------------------ */
  /* Configuration                                                       */
  /* ------------------------------------------------------------------ */
  function readConfig() {
    if (window.__tpConfig) return window.__tpConfig;
    var raw = { settings: {}, vehicles: [], options: [], services: [], zones: [], routes: [], timeRules: [] };
    document.querySelectorAll('script[data-tp-config]').forEach(function (el) {
      var key = el.getAttribute('data-tp-config');
      try {
        var v = JSON.parse(el.textContent);
        if (Array.isArray(raw[key]) && Array.isArray(v)) raw[key] = raw[key].concat(v);
        else raw[key] = v;
      } catch (e) { console.error('[TAXI PRO] Configuration illisible : ' + key, e); }
    });
    raw.labels = raw.settings.labels || {};
    var cfg = P.normalizeConfig(raw);
    window.__tpConfig = { raw: raw, cfg: cfg, s: raw.settings, S: raw.settings.strings || {} };
    return window.__tpConfig;
  }

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var fmt = function (t, p) { return P.fmt(t, p); };
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(sessionStorage.getItem(key) || 'null');
      if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function addMinutes(localStr, min) { return P.toLocalString(P.parseLocal(localStr) + min * 60000); }
  function roundUpQuarter(localStr) {
    var t = P.parseLocal(localStr), q = 15 * 60000;
    return P.toLocalString(Math.ceil(t / q) * q);
  }
  function formatDate(localStr, cfg) {
    var t = P.parseLocal(localStr);
    if (t === null) return '';
    try {
      return new Intl.DateTimeFormat(cfg.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(t));
    } catch (e) { return localStr.replace('T', ' '); }
  }
  function formatDuration(min, S) {
    min = Math.round(min || 0);
    if (min < 60) return fmt(S.minutes, { n: min });
    return fmt(S.hours_minutes, { h: Math.floor(min / 60), m: pad(min % 60) });
  }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }
  function isPhone(v) { return String(v || '').replace(/[^\d]/g, '').length >= 8; }
  function makeRef() {
    var d = new Date();
    return 'TP-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  var ICONS = {
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    luggage: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4h6v3M9 11v5M15 11v5"/>',
    car: '<path d="M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v5h-2.5M5.5 18H3v-5h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    alert: '<path d="M12 3 2 20h20zM12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    plane: '<path d="M10.5 21l1.5-6-5 1-1.5 2H4l1-4-1-4h1.5L7 12l5 1-1.5-6 2 .5 3.5 6 4 .5a1.5 1.5 0 0 1 0 3l-4 .5-3.5 6z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    party: '<path d="M4 20 9 7l8 8zM14 4v2M19 9h-2M17.5 5.5 16 7"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.8 7.5-9.5V6z"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l-2-4M15 21l2-4"/>',
    ring: '<circle cx="12" cy="14.5" r="6"/><path d="m9.5 4.5 2.5 3 2.5-3-1-1.5h-3z"/>',
    van: '<path d="M2 17V7a2 2 0 0 1 2-2h11l4 4 3 2v6h-2.5M2 17h2.5M9 17h6"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    wheelchair: '<circle cx="11" cy="4" r="1.8"/><path d="M11 7v6h6l2 5M11 10h5"/><path d="M8 11.5a5 5 0 1 0 6.5 6.8"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    baby: '<circle cx="12" cy="6.5" r="3"/><path d="M7 21v-6a5 5 0 0 1 10 0v6"/>',
    booster: '<path d="M5 15h14v3H5zM7 15V9a5 5 0 0 1 10 0v6"/>',
    sign: '<rect x="4" y="4" width="16" height="10" rx="1.5"/><path d="M8 8h8M8 11h5M12 14v7"/>',
    water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a5 5 0 0 1 6.4 0"/>',
    dog: '<path d="M6 8 4 4l4 2h8l4-2-2 4v6a6 6 0 0 1-12 0z"/>',
    sparkle: '<path d="M12 3c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7z"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    minus: '<path d="M6 12h12"/>',
    add: '<path d="M12 6v12M6 12h12"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || 'icon') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.car) + '</svg>';
  }

  /* ------------------------------------------------------------------ */
  /* Champ d'adresse avec autocomplétion (motif ARIA « combobox »)       */
  /* ------------------------------------------------------------------ */
  function AddressField(wrap, geo, S, onChange) {
    this.wrap = wrap; this.geo = geo; this.S = S; this.onChange = onChange;
    this.input = $(wrap, '[data-tp-input]');
    this.list = $(wrap, '[data-tp-listbox]');
    this.statusEl = $(wrap, '[data-tp-address-status]');
    this.locateBtn = $(wrap, '[data-tp-locate]');
    this.value = null; this.items = []; this.active = -1; this.timer = null; this.ctrl = null;
    var id = 'tp-lb-' + (++uid);
    this.list.id = id;
    this.manual = !geo.canAutocomplete();
    if (!this.manual) {
      this.input.setAttribute('role', 'combobox');
      this.input.setAttribute('aria-autocomplete', 'list');
      this.input.setAttribute('aria-expanded', 'false');
      this.input.setAttribute('aria-controls', id);
    }
    this.input.setAttribute('autocomplete', 'off');
    this.bind();
  }
  AddressField.prototype.bind = function () {
    var self = this;
    this.input.addEventListener('input', function () {
      if (self.value) { self.value = null; self.onChange(null); }
      if (self.manual) { self.value = self.input.value.trim() ? { label: self.input.value.trim() } : null; self.onChange(self.value); return; }
      clearTimeout(self.timer);
      self.timer = setTimeout(function () { self.search(); }, 260);
    });
    this.input.addEventListener('keydown', function (e) {
      if (self.manual) return;
      var open = self.input.getAttribute('aria-expanded') === 'true';
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!open && self.items.length) self.open(); self.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); self.move(-1); }
      else if (e.key === 'Enter' && open && self.active > -1) { e.preventDefault(); self.choose(self.active); }
      else if (e.key === 'Escape') { self.close(); }
    });
    this.input.addEventListener('blur', function () { setTimeout(function () { self.close(); }, 180); });
    this.input.addEventListener('focus', function () { if (!self.value && self.items.length) self.open(); });
    this.list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    this.list.addEventListener('click', function (e) {
      var li = e.target.closest('[data-index]');
      if (li) self.choose(Number(li.getAttribute('data-index')));
    });
    if (this.locateBtn) {
      if (!('geolocation' in navigator) || this.manual) this.locateBtn.hidden = true;
      this.locateBtn.addEventListener('click', function () { self.locate(); });
    }
  };
  AddressField.prototype.search = async function () {
    var q = this.input.value.trim();
    if (this.ctrl) this.ctrl.abort();
    if (q.length < 3) { this.items = []; this.close(); return; }
    this.ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    this.wrap.classList.add('is-loading');
    try {
      this.items = await this.geo.suggest(q, this.ctrl && this.ctrl.signal);
      this.renderList(this.items.length ? null : this.S.suggestions_none);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.warn('[TAXI PRO] Autocomplétion indisponible', e);
      this.items = [];
      this.renderList(this.S.suggestions_error);
    } finally { this.wrap.classList.remove('is-loading'); }
  };
  AddressField.prototype.renderList = function (message) {
    var self = this;
    this.active = -1;
    if (message) {
      this.list.innerHTML = '<li class="tp-ac__empty" role="presentation">' + esc(message) + '</li>';
    } else {
      this.list.innerHTML = this.items.map(function (s, i) {
        return '<li role="option" id="' + self.list.id + '-' + i + '" data-index="' + i + '" class="tp-ac__item" aria-selected="false">' +
          '<span class="tp-ac__main">' + esc(s.main) + '</span>' +
          (s.secondary ? '<span class="tp-ac__secondary">' + esc(s.secondary) + '</span>' : '') + '</li>';
      }).join('');
    }
    this.open();
  };
  AddressField.prototype.open = function () { this.list.hidden = false; this.input.setAttribute('aria-expanded', 'true'); };
  AddressField.prototype.close = function () { this.list.hidden = true; this.input.setAttribute('aria-expanded', 'false'); this.input.removeAttribute('aria-activedescendant'); };
  AddressField.prototype.move = function (d) {
    if (!this.items.length) return;
    this.active = (this.active + d + this.items.length) % this.items.length;
    var self = this;
    $$(this.list, '[role="option"]').forEach(function (li, i) {
      var on = i === self.active;
      li.setAttribute('aria-selected', on ? 'true' : 'false');
      li.classList.toggle('is-active', on);
      if (on) { self.input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
    });
  };
  AddressField.prototype.choose = async function (i) {
    var s = this.items[i];
    if (!s) return;
    this.input.value = s.label;
    this.close();
    this.setStatus('');
    this.wrap.classList.add('is-loading');
    try {
      var v = await this.geo.resolve(s);
      this.value = v;
      this.items = [];
      this.onChange(v);
    } catch (e) {
      console.warn('[TAXI PRO] Adresse non résolue', e);
      this.setStatus(this.S.suggestions_error, true);
    } finally { this.wrap.classList.remove('is-loading'); }
  };
  AddressField.prototype.locate = function () {
    var self = this;
    this.setStatus(this.S.locating);
    navigator.geolocation.getCurrentPosition(async function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      var label = await self.geo.reverse(lat, lng);
      self.setStatus('');
      self.set({ lat: lat, lng: lng, label: label });
      self.onChange(self.value);
    }, function () { self.setStatus(self.S.locate_error, true); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };
  AddressField.prototype.set = function (v) {
    this.value = v || null;
    this.input.value = v ? v.label || '' : '';
  };
  AddressField.prototype.setStatus = function (msg, isError) {
    if (!this.statusEl) return;
    this.statusEl.textContent = msg || '';
    this.statusEl.classList.toggle('is-error', !!isError);
  };
  AddressField.prototype.isResolved = function () {
    return !!(this.value && (this.manual || (isFinite(this.value.lat) && isFinite(this.value.lng))));
  };

  /* ------------------------------------------------------------------ */
  /* Sélecteur de quantité                                               */
  /* ------------------------------------------------------------------ */
  function bindStepper(wrap, onChange) {
    var input = $(wrap, 'input');
    var min = Number(input.min || 0), max = Number(input.max || 99);
    function set(v) {
      v = Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
      input.value = v;
      $(wrap, '[data-tp-dec]').disabled = v <= min;
      $(wrap, '[data-tp-inc]').disabled = v >= max;
      onChange(v);
    }
    $(wrap, '[data-tp-dec]').addEventListener('click', function () { set(Number(input.value) - 1); });
    $(wrap, '[data-tp-inc]').addEventListener('click', function () { set(Number(input.value) + 1); });
    input.addEventListener('change', function () { set(input.value); });
    return { set: set, input: input };
  }

  /* ------------------------------------------------------------------ */
  /* Module de réservation complet                                       */
  /* ------------------------------------------------------------------ */
  function Booking(root) {
    this.root = root;
    var C = readConfig();
    this.raw = C.raw; this.cfg = C.cfg; this.s = C.s; this.S = C.S;
    this.geo = new G.Geo(this.s);
    this.backend = this.geo.backendUrl;
    this.manual = !this.geo.canAutocomplete();
    this.steps = $$(root, '[data-tp-step]');
    this.total = this.steps.length;
    this.routeSeq = 0;
    this.state = this.defaults();
    this.init();
  }

  Booking.prototype.defaults = function () {
    var cfg = this.cfg;
    var now = P.toLocalString(P.nowLocal(new Date(), cfg.timezone));
    var start = roundUpQuarter(addMinutes(now, Math.max(cfg.booking.leadMin, 0) + 15));
    var pay = (this.s.booking && this.s.booking.payment) || {};
    return {
      step: 1,
      serviceId: cfg.services[0] ? cfg.services[0].id : '',
      pickup: null, dropoff: null, route: null, routeStatus: 'idle',
      when: cfg.booking.scheduled ? 'schedule' : 'asap',
      date: start.slice(0, 10), time: start.slice(11, 16),
      passengers: 1, luggage: 0, hours: Math.max(2, Math.ceil(cfg.hourly.minHours || 1)),
      roundTrip: false, returnDate: start.slice(0, 10), returnTime: addMinutes(start, 240).slice(11, 16), waitingMin: 0,
      vehicleId: '', options: {},
      customer: { firstName: '', lastName: '', email: '', phone: '', flight: '', comments: '' },
      payment: pay.default || 'request', terms: false, serverQuote: null
    };
  };

  Booking.prototype.init = function () {
    var root = this.root, self = this, S = this.S;
    root.classList.add('is-ready');
    if (!this.cfg.vehicles.length) {
      $(root, '[data-tp-unavailable]').hidden = false;
      $(root, '[data-tp-form]').hidden = true;
      return;
    }
    if (this.manual) {
      $$(root, '[data-tp-manual-note]').forEach(function (n) { n.hidden = false; });
    }
    this.pickupField = new AddressField($(root, '[data-tp-address="pickup"]'), this.geo, S, function (v) { self.state.pickup = v; self.onAddressChange(); });
    this.dropoffField = new AddressField($(root, '[data-tp-address="dropoff"]'), this.geo, S, function (v) { self.state.dropoff = v; self.onAddressChange(); });
    var mapEl = $(root, '[data-tp-map]');
    if (mapEl && this.geo.mapEnabled && !this.manual) this.map = new G.RouteMap(mapEl, this.geo);
    else if (mapEl) mapEl.hidden = true;

    this.renderServices();
    this.bindTrip();
    this.bindDetails();
    $$(root, '[data-tp-next]').forEach(function (b) { b.addEventListener('click', function () { self.next(); }); });
    $$(root, '[data-tp-back]').forEach(function (b) { b.addEventListener('click', function () { self.go(self.state.step - 1); }); });
    $$(root, '[data-tp-goto]').forEach(function (b) { b.addEventListener('click', function () { self.go(Number(b.getAttribute('data-tp-goto'))); }); });
    $(root, '[data-tp-confirm]').addEventListener('click', function () { self.submit(); });
    $(root, '[data-tp-form]').addEventListener('submit', function (e) { e.preventDefault(); });
    root.addEventListener('tp:prefill', function (e) { self.prefill(e.detail || {}); });

    // Retour du paiement, formulaire Shopify envoyé, préremplissage, ou reprise de session
    var params = new URLSearchParams(location.search);
    if (params.get('tp_booking') && params.get('tp_token')) { this.loadStatus(params.get('tp_booking'), params.get('tp_token')); return; }
    if ($(root, '[data-tp-contact-posted]')) {
      var sent = store('tp-contact-sent');
      store('tp-contact-sent', null); store(STORE_KEY, null);
      this.showResult('request', { ref: sent && sent.ref, name: sent && sent.name, contactForm: true });
      return;
    }
    var saved = store(STORE_KEY);
    if (params.get('tp_from') || params.get('tp_service')) this.prefillFromUrl(params);
    else if (saved && saved.state) this.restore(saved.state);
    this.syncInputs();
    this.render();
    if (this.state.pickup && this.state.dropoff && !this.state.route) this.computeRoute();
  };

  /* ---------- Étape 1 : trajet ---------- */
  Booking.prototype.renderServices = function () {
    var wrap = $(this.root, '[data-tp-services]'), self = this;
    var list = this.cfg.services;
    if (list.length <= 1) { wrap.closest('[data-tp-services-field]').hidden = true; return; }
    var name = 'tp-service-' + (++uid);
    wrap.innerHTML = list.map(function (sv) {
      return '<label class="tp-chip"><input type="radio" name="' + name + '" value="' + esc(sv.id) + '">' +
        icon(sv.icon || 'car') + '<span>' + esc(sv.name) + '</span></label>';
    }).join('');
    $$(wrap, 'input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        self.state.serviceId = inp.value;
        self.state.options = self.filterOptions(self.state.options);
        self.state.serverQuote = null;
        self.render();
        if (self.service().mode !== 'hourly' && self.state.pickup && self.state.dropoff && !self.state.route) self.computeRoute();
      });
    });
  };
  Booking.prototype.service = function () {
    var id = this.state.serviceId;
    return this.cfg.services.filter(function (s) { return s.id === id; })[0] ||
      { id: '', name: '', mode: 'meter', roundTrip: true, airport: false };
  };
  Booking.prototype.bindTrip = function () {
    var root = this.root, self = this, st = this.state;
    var swap = $(root, '[data-tp-swap]');
    if (swap) swap.addEventListener('click', function () {
      var a = self.state.pickup, b = self.state.dropoff;
      self.pickupField.set(b); self.dropoffField.set(a);
      self.state.pickup = b; self.state.dropoff = a;
      self.onAddressChange();
    });
    $$(root, 'input[name="tp-when"]').forEach(function (r) {
      r.addEventListener('change', function () { self.state.when = r.value; self.render(); });
    });
    ['date', 'time', 'returnDate', 'returnTime', 'hours', 'waitingMin'].forEach(function (n) {
      var inp = $(root, '[name="' + n + '"]');
      if (inp) inp.addEventListener('change', function () { self.state[n] = n === 'hours' || n === 'waitingMin' ? Number(inp.value) : inp.value; self.state.serverQuote = null; self.render(); });
    });
    var rt = $(root, '[name="roundTrip"]');
    if (rt) rt.addEventListener('change', function () { self.state.roundTrip = rt.checked; self.state.serverQuote = null; self.render(); });
    this.steppers = {};
    $$(root, '[data-tp-stepper]').forEach(function (w) {
      var key = w.getAttribute('data-tp-stepper');
      var inp = $(w, 'input');
      if (key === 'passengers') inp.max = self.cfg.booking.maxPassengers;
      if (key === 'luggage') inp.max = self.cfg.booking.maxLuggage;
      self.steppers[key] = bindStepper(w, function (v) {
        if (self.state[key] === v) return;
        self.state[key] = v; self.state.serverQuote = null; self.render();
      });
    });
    var date = $(root, '[name="date"]'), rdate = $(root, '[name="returnDate"]');
    var today = P.toLocalString(P.nowLocal(new Date(), this.cfg.timezone)).slice(0, 10);
    var max = this.cfg.booking.maxDays ? P.toLocalString(P.parseLocal(today) + this.cfg.booking.maxDays * 86400000).slice(0, 10) : '';
    [date, rdate].forEach(function (d) { if (d) { d.min = today; if (max) d.max = max; } });
    if (!this.cfg.booking.immediate || !this.cfg.booking.scheduled) {
      var whenField = $(root, '[data-tp-when-field]');
      if (whenField) whenField.hidden = true;
    }
  };
  Booking.prototype.onAddressChange = function () {
    this.state.route = null; this.state.routeStatus = 'idle'; this.state.serverQuote = null;
    this.render();
    if (this.state.pickup && (this.state.dropoff || this.service().mode === 'hourly')) this.computeRoute();
  };
  Booking.prototype.computeRoute = async function () {
    var st = this.state, self = this;
    if (this.manual) { this.render(); return; }
    var a = st.pickup, b = st.dropoff;
    if (!a || !isFinite(a.lat)) return;
    if (!b || !isFinite(b.lat)) { if (this.map) this.map.show(a, null, null, this.accent()); return; }
    var seq = ++this.routeSeq;
    st.routeStatus = 'loading'; this.render();
    if (this.routeCtrl) this.routeCtrl.abort();
    this.routeCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    try {
      var r = await this.geo.route(a, b, this.routeCtrl && this.routeCtrl.signal);
      if (seq !== this.routeSeq) return;
      st.route = r; st.routeStatus = 'ok';
      if (this.map) this.map.show(a, b, r.geometry, this.accent());
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.warn('[TAXI PRO] Itinéraire indisponible', e);
      if (seq !== this.routeSeq) return;
      st.route = null; st.routeStatus = 'error';
      if (this.map) this.map.show(a, b, null, this.accent());
    }
    this.save();
    this.render();
    if (this.autoAdvance && st.routeStatus === 'ok') {
      this.autoAdvance = false;
      this.pickupField.set(st.pickup); this.dropoffField.set(st.dropoff);
      if (!this.stepErrors(1).length) this.go(2);
    }
  };
  Booking.prototype.accent = function () {
    return getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim() || '#c8a35a';
  };

  /* ---------- Demande transmise au moteur de tarification ---------- */
  Booking.prototype.priceOnRequest = function () {
    return this.manual || this.state.routeStatus === 'error';
  };
  Booking.prototype.request = function (vehicleId) {
    var st = this.state, sv = this.service();
    var route = st.route ? { distanceKm: st.route.distanceKm, durationMin: st.route.durationMin, estimated: st.route.estimated } : {};
    return {
      serviceId: st.serviceId, vehicleId: vehicleId === undefined ? st.vehicleId : vehicleId,
      pickup: st.pickup, dropoff: sv.mode === 'hourly' && !st.dropoff ? null : st.dropoff, route: route,
      immediate: st.when === 'asap', datetime: st.when === 'asap' ? '' : st.date + 'T' + st.time,
      roundTrip: st.roundTrip && this.roundTripAllowed(), returnDatetime: st.returnDate + 'T' + st.returnTime,
      passengers: st.passengers, luggage: st.luggage, hours: sv.mode === 'hourly' ? st.hours : 0,
      waitingMin: this.s.booking && this.s.booking.waitingField ? st.waitingMin : 0,
      options: st.options
    };
  };
  Booking.prototype.roundTripAllowed = function () {
    var sv = this.service();
    return this.cfg.roundTrip.enabled && sv.mode === 'meter' && sv.roundTrip !== false;
  };
  Booking.prototype.quote = function (vehicleId) {
    var q = P.quote(this.cfg, this.request(vehicleId), { allowNoVehicle: !vehicleId });
    if (this.priceOnRequest()) {
      q.errors = q.errors.filter(function (e) { return ['ROUTE_REQUIRED', 'DISTANCE_UNAVAILABLE', 'PICKUP_REQUIRED'].indexOf(e.code) < 0; });
      q.onRequest = true; q.total = null; q.lines = []; q.ok = q.errors.length === 0;
    }
    return q;
  };
  Booking.prototype.currentQuote = function () {
    var q = this.quote(this.state.vehicleId || undefined);
    if (this.state.serverQuote && this.state.serverQuote.total !== undefined) {
      q = Object.assign({}, q, this.state.serverQuote, { errors: q.errors, ok: q.ok });
    }
    return q;
  };
  Booking.prototype.filterOptions = function (opts) {
    var sid = this.state.serviceId, out = {};
    this.cfg.options.forEach(function (o) {
      if (opts[o.id] && (!o.services.length || o.services.indexOf(sid) > -1)) out[o.id] = opts[o.id];
    });
    return out;
  };

  var STEP_CODES = {
    1: ['ROUTE_REQUIRED', 'PICKUP_REQUIRED', 'DISTANCE_UNAVAILABLE', 'FORBIDDEN_ZONE', 'OUT_OF_AREA', 'MAX_DISTANCE',
      'DATETIME_REQUIRED', 'DATETIME_INVALID', 'LEAD_TIME', 'TOO_FAR', 'CLOSED', 'CLOSED_RETURN', 'IMMEDIATE_DISABLED',
      'SCHEDULED_DISABLED', 'RETURN_REQUIRED', 'RETURN_BEFORE', 'MAX_PASSENGERS', 'MAX_LUGGAGE', 'PASSENGERS_MIN',
      'HOURS_REQUIRED', 'SERVICE_UNKNOWN'],
    2: ['VEHICLE_REQUIRED', 'VEHICLE_UNKNOWN', 'VEHICLE_CAPACITY', 'VEHICLE_LUGGAGE'],
    3: ['OPTION_UNKNOWN', 'OPTION_QTY']
  };
  Booking.prototype.stepErrors = function (n) {
    var st = this.state, S = this.S, errs = [];
    if (n === 1) {
      if (!st.pickup) errs.push({ field: 'pickup', message: this.manual ? S.required : S.select_from_list });
      else if (!this.pickupField.isResolved()) errs.push({ field: 'pickup', message: S.select_from_list });
      if (this.service().mode !== 'hourly') {
        if (!st.dropoff) errs.push({ field: 'dropoff', message: this.manual ? S.required : S.select_from_list });
        else if (!this.dropoffField.isResolved()) errs.push({ field: 'dropoff', message: S.select_from_list });
      }
      if (errs.length) return errs;
      if (st.routeStatus === 'loading') return [{ field: 'route', message: S.route_calculating }];
    }
    if (n === 4) {
      var c = st.customer;
      if (!c.firstName.trim()) errs.push({ field: 'firstName', message: S.required });
      if (!c.lastName.trim()) errs.push({ field: 'lastName', message: S.required });
      if (!isEmail(c.email)) errs.push({ field: 'email', message: c.email ? S.invalid_email : S.required });
      if (!isPhone(c.phone)) errs.push({ field: 'phone', message: c.phone ? S.invalid_phone : S.required });
      if (this.s.booking && this.s.booking.requireTerms && $(this.root, '[name="terms"]') && !st.terms) errs.push({ field: 'terms', message: S.terms_required });
      return errs;
    }
    if (n === 2 && !st.vehicleId) return [{ field: 'vehicle', message: this.cfg.labels.err_VEHICLE_REQUIRED }];
    var codes = STEP_CODES[n];
    if (!codes) return errs;
    var q = n === 1 ? this.quote() : this.quote(st.vehicleId);
    return q.errors.filter(function (e) { return codes.indexOf(e.code) > -1; });
  };
  Booking.prototype.next = function () {
    var n = this.state.step;
    var errs = this.stepErrors(n);
    this.showErrors(n, errs);
    if (errs.length) {
      var first = errs[0].field && $(this.root, '[data-tp-step="' + n + '"] [name="' + errs[0].field + '"]');
      if (first && first.focus) first.focus();
      return;
    }
    this.go(n + 1);
  };
  Booking.prototype.go = function (n) {
    n = Math.max(1, Math.min(this.total, n));
    for (var i = 1; i < n; i++) {
      if (this.stepErrors(i).length) { n = i; break; }
    }
    var changed = n !== this.state.step;
    this.state.step = n;
    this.render();
    this.save();
    if (changed) {
      var panel = $(this.root, '[data-tp-step="' + n + '"]');
      var title = panel && $(panel, '.tp-step__title');
      var top = this.root.getBoundingClientRect().top + window.pageYOffset - 100;
      if (Math.abs(window.pageYOffset - top) > 160) window.scrollTo({ top: top, behavior: 'smooth' });
      if (title) title.focus({ preventScroll: true });
    }
  };
  Booking.prototype.showErrors = function (n, errs) {
    var step = $(this.root, '[data-tp-step="' + n + '"]');
    if (!step) return;
    var box = $(step, '[data-tp-errors]');
    $$(step, '[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    $$(step, '.field__error[data-tp-inline]').forEach(function (el) { el.parentNode.removeChild(el); });
    var msgs = [], seen = {};
    errs.forEach(function (e) {
      var f = e.field && $(step, '[name="' + e.field + '"]');
      var text = e.message;
      if (f && f.id) {
        // Erreur rattachée au champ : signalée sous le champ et nommée dans le résumé
        f.setAttribute('aria-invalid', 'true');
        var label = $(step, 'label[for="' + f.id + '"]');
        var name = label ? label.textContent.trim().replace(/\s+/g, ' ') : '';
        var p = document.createElement('p');
        p.className = 'field__error';
        p.setAttribute('data-tp-inline', '');
        p.id = f.id + '-error';
        p.textContent = e.message;
        var holder = f.closest('.field, .tp-address, .checkbox') || f.parentNode;
        if (holder.classList.contains('checkbox')) holder.insertAdjacentElement('afterend', p); else holder.appendChild(p);
        f.setAttribute('aria-describedby', p.id);
        if (name && f.type !== 'checkbox') text = name + ' : ' + e.message;
      }
      if (!seen[text]) { seen[text] = true; msgs.push(text); }
    });
    if (!box) return;
    box.innerHTML = msgs.map(function (m) { return '<li>' + icon('alert') + '<span>' + esc(m) + '</span></li>'; }).join('');
    box.hidden = !msgs.length;
  };

  /* ---------- Étape 4 : coordonnées et paiement ---------- */
  Booking.prototype.bindDetails = function () {
    var root = this.root, self = this;
    ['firstName', 'lastName', 'email', 'phone', 'flight', 'comments'].forEach(function (n) {
      var inp = $(root, '[name="' + n + '"]');
      if (inp) inp.addEventListener('input', function () { self.state.customer[n] = inp.value; self.saveSoon(); });
    });
    var terms = $(root, '[name="terms"]');
    if (terms) terms.addEventListener('change', function () { self.state.terms = terms.checked; });
  };
  Booking.prototype.paymentModes = function (q) {
    var pay = (this.s.booking && this.s.booking.payment) || {}, modes = [];
    if (pay.request) modes.push('request');
    if (pay.driver) modes.push('driver');
    if (this.backend && q && !q.onRequest && q.total > 0) {
      if (pay.online) modes.push('online');
      if (pay.deposit && this.cfg.deposit.percent > 0) modes.push('deposit');
    }
    if (!modes.length) modes.push('request');
    return modes;
  };
  Booking.prototype.renderPayments = function (q) {
    var wrap = $(this.root, '[data-tp-payments]'), S = this.S, self = this, st = this.state;
    var modes = this.paymentModes(q);
    if (modes.indexOf(st.payment) < 0) st.payment = modes[0];
    var key = modes.join(',') + '|' + st.payment + '|' + (q && q.total);
    if (wrap.getAttribute('data-key') === key) return;
    wrap.setAttribute('data-key', key);
    var name = 'tp-pay-' + (++uid);
    wrap.innerHTML = modes.map(function (m) {
      var title = m === 'deposit' ? fmt(S.payment_deposit, { percent: P.formatNumber(self.cfg.deposit.percent, self.cfg, 0) }) : S['payment_' + m];
      var text = m === 'deposit' ? fmt(S.payment_deposit_text, { amount: P.formatMoney(q.deposit, self.cfg) }) : S['payment_' + m + '_text'];
      var ic = m === 'online' || m === 'deposit' ? 'shield' : m === 'driver' ? 'car' : 'calendar';
      return '<label class="tp-pay' + (st.payment === m ? ' is-selected' : '') + '"><input type="radio" name="' + name + '" value="' + m + '"' + (st.payment === m ? ' checked' : '') + '>' +
        '<span class="tp-pay__icon">' + icon(ic) + '</span><span class="tp-pay__text"><strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></span></label>';
    }).join('');
    $$(wrap, 'input').forEach(function (r) {
      r.addEventListener('change', function () { st.payment = r.value; self.render(); });
    });
  };

  /* ---------- Rendu ---------- */
  Booking.prototype.syncInputs = function () {
    var root = this.root, st = this.state, self = this;
    $$(root, '[data-tp-services] input').forEach(function (r) { r.checked = r.value === st.serviceId; });
    this.pickupField.set(st.pickup); this.dropoffField.set(st.dropoff);
    $$(root, 'input[name="tp-when"]').forEach(function (r) { r.checked = r.value === st.when; });
    ['date', 'time', 'returnDate', 'returnTime', 'hours', 'waitingMin'].forEach(function (n) {
      var inp = $(root, '[name="' + n + '"]'); if (inp) inp.value = st[n];
    });
    var rt = $(root, '[name="roundTrip"]'); if (rt) rt.checked = !!st.roundTrip;
    Object.keys(this.steppers).forEach(function (k) { self.steppers[k].set(st[k]); });
    ['firstName', 'lastName', 'email', 'phone', 'flight', 'comments'].forEach(function (n) {
      var inp = $(root, '[name="' + n + '"]'); if (inp) inp.value = st.customer[n] || '';
    });
    var terms = $(root, '[name="terms"]'); if (terms) terms.checked = !!st.terms;
  };

  Booking.prototype.render = function () {
    var root = this.root, st = this.state, S = this.S, cfg = this.cfg, sv = this.service();
    // Étapes et progression
    this.steps.forEach(function (p) { p.hidden = Number(p.getAttribute('data-tp-step')) !== st.step; });
    $$(root, '[data-tp-progress] [data-step-indicator]').forEach(function (li) {
      var n = Number(li.getAttribute('data-step-indicator'));
      li.classList.toggle('is-done', n < st.step);
      li.classList.toggle('is-current', n === st.step);
      if (n === st.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      var b = $(li, 'button'); if (b) b.disabled = n > st.step;
    });
    var counter = $(root, '[data-tp-step-counter]');
    if (counter) counter.textContent = fmt(S.step_of, { current: st.step, total: this.total });
    $$(root, '[data-tp-back]').forEach(function (b) { b.hidden = st.step === 1; });
    $$(root, '[data-tp-next]').forEach(function (b) { b.hidden = st.step === 5; });

    // Champs conditionnels de l'étape 1
    var hourly = sv.mode === 'hourly';
    var dropWrap = $(root, '[data-tp-address="dropoff"]');
    dropWrap.closest('[data-tp-dropoff-field]').classList.toggle('is-optional', hourly);
    $(root, '[data-tp-hours-field]').hidden = !hourly;
    $(root, '[data-tp-schedule]').hidden = st.when === 'asap';
    var rtField = $(root, '[data-tp-roundtrip-field]');
    rtField.hidden = !this.roundTripAllowed();
    $(root, '[data-tp-return]').hidden = !(st.roundTrip && this.roundTripAllowed());
    var waitField = $(root, '[data-tp-waiting-field]');
    if (waitField) waitField.hidden = !(this.s.booking && this.s.booking.waitingField && cfg.surcharges.waiting.enabled);
    this.renderRoute();

    // Devis
    var q = this.currentQuote();
    this.lastQuote = q;
    if (st.step === 2) this.renderVehicles();
    if (st.step === 3) this.renderOptions(q);
    if (st.step >= 4) {
      var flightMode = (this.s.booking && this.s.booking.flightField) || 'airport';
      var isAirport = sv.airport || q.airport || q.rules.some(function (r) { return r.indexOf('airport:') === 0; });
      $(root, '[data-tp-flight-field]').hidden = flightMode === 'never' || (flightMode === 'airport' && !isAirport);
      this.renderPayments(q);
    }
    if (st.step === 5) this.renderSummary(q);
    this.renderAside(q);
  };

  Booking.prototype.renderRoute = function () {
    var box = $(this.root, '[data-tp-route]'), st = this.state, S = this.S;
    if (!box) return;
    if (this.manual || (!st.route && st.routeStatus !== 'loading' && st.routeStatus !== 'error')) { box.hidden = true; return; }
    box.hidden = false;
    if (st.routeStatus === 'loading') { box.innerHTML = '<p class="tp-route__loading"><span class="tp-spinner" aria-hidden="true"></span>' + esc(S.route_calculating) + '</p>'; return; }
    if (st.routeStatus === 'error') { box.innerHTML = '<p class="tp-route__error">' + icon('alert') + esc(S.route_error) + '</p>'; return; }
    var r = st.route;
    box.innerHTML = '<dl class="tp-route__facts">' +
      '<div><dt>' + icon('route') + esc(r.estimated ? S.route_estimated : S.distance) + '</dt><dd>' + esc(fmt(S.km, { n: P.formatNumber(r.distanceKm, this.cfg, 1) })) + '</dd></div>' +
      '<div><dt>' + icon('clock') + esc(S.duration) + '</dt><dd>' + esc(formatDuration(r.durationMin, S)) + '</dd></div></dl>';
  };

  Booking.prototype.renderVehicles = function () {
    var wrap = $(this.root, '[data-tp-vehicles]'), self = this, st = this.state, S = this.S, cfg = this.cfg;
    var list = P.quoteVehicles(cfg, this.request(''), {});
    var onReq = this.priceOnRequest();
    var name = 'tp-vehicle-' + (++uid);
    var suffix = this.s.priceSuffix || '';
    wrap.innerHTML = list.map(function (item) {
      var v = item.vehicle, q = item.quote, sel = st.vehicleId === v.id && item.fits;
      var price = onReq || q.onRequest || q.total === null ? '<strong>' + esc(S.price_on_request) + '</strong>'
        : '<strong>' + esc(P.formatMoney(q.total, cfg)) + '</strong>' + (suffix ? '<small>' + esc(suffix) + '</small>' : '');
      var media = v.image ? '<img src="' + esc(v.image) + '"' + (v.image2x ? ' srcset="' + esc(v.image) + ' 1x, ' + esc(v.image2x) + ' 2x"' : '') +
        ' alt="' + esc(v.imageAlt || v.name) + '" width="640" height="400" loading="lazy">' : icon(v.passengers > 4 ? 'van' : 'car', 'tp-vehicle__placeholder');
      return '<label class="tp-vehicle' + (sel ? ' is-selected' : '') + (item.fits ? '' : ' is-disabled') + '">' +
        '<input class="visually-hidden" type="radio" name="' + name + '" value="' + esc(v.id) + '"' + (sel ? ' checked' : '') + (item.fits ? '' : ' disabled') + '>' +
        '<span class="tp-vehicle__media">' + media + '</span>' +
        '<span class="tp-vehicle__body"><span class="tp-vehicle__head"><span class="tp-vehicle__name">' + esc(v.name) + '</span>' +
        (v.badge ? '<span class="badge">' + esc(v.badge) + '</span>' : '') + '</span>' +
        (v.description ? '<span class="tp-vehicle__desc">' + esc(v.description) + '</span>' : '') +
        '<span class="specs"><span>' + icon('users') + esc(fmt(S.vehicle_capacity, { n: v.passengers })) + '</span><span>' + icon('luggage') + esc(fmt(S.vehicle_luggage, { n: v.luggage })) + '</span></span>' +
        (v.equipment.length ? '<span class="tp-vehicle__equip">' + v.equipment.map(esc).join(' · ') + '</span>' : '') +
        (item.fits ? '' : '<span class="tp-vehicle__warn">' + icon('alert') + esc(S.vehicle_unavailable) + '</span>') +
        '</span><span class="tp-vehicle__price">' + price + '<span class="tp-vehicle__cta">' + icon('check') + '<span>' + esc(sel ? S.vehicle_selected : S.vehicle_select) + '</span></span></span></label>';
    }).join('') || '<p>' + esc(S.no_vehicles) + '</p>';
    $$(wrap, 'input').forEach(function (r) {
      r.addEventListener('change', function () {
        st.vehicleId = r.value; st.serverQuote = null;
        self.showErrors(2, []);
        self.render(); self.save();
      });
    });
  };

  Booking.prototype.renderOptions = function (q) {
    var wrap = $(this.root, '[data-tp-options]'), self = this, st = this.state, S = this.S, cfg = this.cfg;
    var sid = st.serviceId;
    var opts = cfg.options.filter(function (o) { return !o.services.length || o.services.indexOf(sid) > -1; });
    var key = sid + '|' + JSON.stringify(st.options) + '|' + (q.total || '');
    if (wrap.getAttribute('data-key') === key) return;
    wrap.setAttribute('data-key', key);
    if (!opts.length) { wrap.innerHTML = '<p class="text-muted">' + esc(S.options_none) + '</p>'; return; }
    var tripTotal = (q.legs || []).reduce(function (a, l) { return a + l.tripAmount; }, 0);
    wrap.innerHTML = opts.map(function (o) {
      var qty = st.options[o.id] || 0;
      var price = o.price === 0 ? S.option_free : o.type === 'percent'
        ? fmt(S.option_percent, { value: P.formatNumber(o.price, cfg, 2) }) + (tripTotal ? ' · ' + P.formatMoney(Math.round(tripTotal * o.price) / 100, cfg) : '')
        : P.formatMoney(o.price, cfg) + (o.type === 'per_unit' ? ' / u.' : '');
      var control = o.type === 'per_unit'
        ? '<span class="tp-stepper tp-stepper--small" data-option-stepper="' + esc(o.id) + '"><button type="button" class="tp-stepper__btn" data-tp-dec aria-label="' + esc(S.decrease + ' ' + o.name) + '">' + icon('minus') + '</button>' +
          '<input type="number" inputmode="numeric" min="0" max="' + o.maxQty + '" value="' + qty + '" aria-label="' + esc(o.name) + '">' +
          '<button type="button" class="tp-stepper__btn" data-tp-inc aria-label="' + esc(S.increase + ' ' + o.name) + '">' + icon('add') + '</button></span>'
        : '<span class="tp-switch"><input type="checkbox" data-option-check="' + esc(o.id) + '"' + (qty ? ' checked' : '') + ' aria-label="' + esc(o.name) + '"><span class="tp-switch__ui" aria-hidden="true"></span></span>';
      return '<div class="tp-option' + (qty ? ' is-selected' : '') + '"><span class="tp-option__icon">' + icon(o.icon || 'plus') + '</span>' +
        '<span class="tp-option__text"><span class="tp-option__name">' + esc(o.name) + '</span>' + (o.description ? '<span class="tp-option__desc">' + esc(o.description) + '</span>' : '') + '</span>' +
        '<span class="tp-option__price">' + esc(price) + '</span>' + control + '</div>';
    }).join('');
    $$(wrap, '[data-option-check]').forEach(function (c) {
      c.addEventListener('change', function () {
        var id = c.getAttribute('data-option-check');
        if (c.checked) st.options[id] = 1; else delete st.options[id];
        st.serverQuote = null; self.render(); self.save();
      });
    });
    $$(wrap, '[data-option-stepper]').forEach(function (w) {
      var id = w.getAttribute('data-option-stepper');
      bindStepper(w, function (v) {
        if ((st.options[id] || 0) === v) return;
        if (v) st.options[id] = v; else delete st.options[id];
        st.serverQuote = null; self.render(); self.save();
      });
      var inp = $(w, 'input'); $(w, '[data-tp-dec]').disabled = Number(inp.value) <= 0; $(w, '[data-tp-inc]').disabled = Number(inp.value) >= Number(inp.max);
    });
  };

  Booking.prototype.summaryRows = function (q) {
    var st = this.state, S = this.S, cfg = this.cfg, sv = this.service(), rows = [];
    var vehicle = cfg.vehicles.filter(function (v) { return v.id === st.vehicleId; })[0];
    if (sv.name) rows.push([S.summary_service, sv.name, 1]);
    rows.push([S.summary_from, st.pickup ? st.pickup.label : '', 1]);
    if (st.dropoff) rows.push([S.summary_to, st.dropoff.label, 1]);
    rows.push([S.summary_when, st.when === 'asap' ? S.asap : formatDate(st.date + 'T' + st.time, cfg), 1]);
    if (q.roundTrip) rows.push([S.summary_return, formatDate(st.returnDate + 'T' + st.returnTime, cfg), 1]);
    if (sv.mode === 'hourly') rows.push([S.summary_hours, st.hours + ' h', 1]);
    if (st.route) rows.push([S.summary_distance, fmt(S.km, { n: P.formatNumber(st.route.distanceKm, cfg, 1) }) + ' · ' + formatDuration(st.route.durationMin, S), 1]);
    if (vehicle) rows.push([S.summary_vehicle, vehicle.name, 2]);
    rows.push([S.summary_passengers, fmt(S.vehicle_capacity, { n: st.passengers }) + ' · ' + fmt(S.vehicle_luggage, { n: st.luggage }), 1]);
    var opts = cfg.options.filter(function (o) { return st.options[o.id]; }).map(function (o) { return o.name + (st.options[o.id] > 1 ? ' × ' + st.options[o.id] : ''); });
    if (opts.length) rows.push([S.summary_options, opts.join(', '), 3]);
    var c = st.customer;
    rows.push([S.summary_customer, [c.firstName + ' ' + c.lastName, c.email, c.phone].join(' · '), 4]);
    if (c.flight) rows.push([S.summary_flight, c.flight, 4]);
    if (c.comments) rows.push([S.summary_comments, c.comments, 4]);
    var payLabel = st.payment === 'deposit' ? fmt(S.payment_deposit, { percent: P.formatNumber(cfg.deposit.percent, cfg, 0) }) : S['payment_' + st.payment];
    rows.push([S.summary_payment, payLabel, 4]);
    return rows;
  };

  Booking.prototype.renderSummary = function (q) {
    var S = this.S, cfg = this.cfg, st = this.state;
    var rows = this.summaryRows(q);
    $(this.root, '[data-tp-summary]').innerHTML = '<dl class="tp-summary">' + rows.map(function (r) {
      return '<div class="tp-summary__row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd><dd class="tp-summary__edit"><button type="button" class="btn btn--ghost btn--small" data-goto="' + r[2] + '">' + esc(S.edit) + '</button></dd></div>';
    }).join('') + '</dl>' + this.priceBlock(q, true);
    var self = this;
    $$(this.root, '[data-tp-summary] [data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { self.go(Number(b.getAttribute('data-goto'))); });
    });
    var btn = $(this.root, '[data-tp-confirm]');
    var label = st.payment === 'online' ? fmt(S.confirm_online, { amount: P.formatMoney(q.total, cfg) })
      : st.payment === 'deposit' ? fmt(S.confirm_deposit, { amount: P.formatMoney(q.deposit, cfg) })
        : st.payment === 'driver' ? S.confirm_driver : S.confirm_request;
    if (!this.submitting) btn.textContent = label;
    btn.disabled = !q.ok || this.submitting;
    var needsPay = st.payment === 'online' || st.payment === 'deposit';
    $(this.root, '[data-tp-notice]').textContent = fmt(S.not_confirmed_notice, { payment: needsPay ? S.not_confirmed_payment : '' });
  };

  Booking.prototype.priceBlock = function (q, full) {
    var S = this.S, cfg = this.cfg, st = this.state, s = this.s;
    if (q.onRequest || q.total === null) {
      return '<div class="tp-price"><div class="tp-price__total"><span>' + esc(S.total) + '</span><strong>' + esc(S.price_on_request) + '</strong></div>' +
        (q.warnings || []).map(function (w) { return '<p class="tp-price__note">' + esc(w.message) + '</p>'; }).join('') + '</div>';
    }
    var html = '<div class="tp-price">';
    if (s.showBreakdown !== false && q.lines.length) {
      html += '<details class="tp-price__details"' + (full ? ' open' : '') + '><summary>' + esc(S.price_details) + '</summary><ul class="tp-price__lines">' +
        q.lines.map(function (l) { return '<li><span>' + esc(l.label) + '</span><span>' + esc(P.formatMoney(l.amount, cfg)) + '</span></li>'; }).join('') + '</ul></details>';
    }
    html += '<div class="tp-price__total"><span>' + esc(S.total) + (q.warnings.some(function (w) { return w.code === 'ESTIMATED_DISTANCE'; }) ? ' <span class="badge badge--soft">' + esc(S.estimate_badge) + '</span>' : '') +
      '</span><strong>' + esc(P.formatMoney(q.total, cfg)) + '</strong></div>';
    if (q.vat) html += '<p class="tp-price__vat">' + esc(fmt(S.vat_included, { rate: P.formatNumber(q.vatRate, cfg, 2), amount: P.formatMoney(q.vat, cfg) })) + (s.priceSuffix ? ' · ' + esc(s.priceSuffix) : '') + '</p>';
    if (st.payment === 'deposit' && full) {
      html += '<div class="tp-price__deposit"><span>' + esc(S.deposit_now) + '</span><strong>' + esc(P.formatMoney(q.deposit, cfg)) + '</strong></div>' +
        '<div class="tp-price__deposit tp-price__deposit--muted"><span>' + esc(S.balance_driver) + '</span><span>' + esc(P.formatMoney(q.balance, cfg)) + '</span></div>';
    }
    if (s.priceNote) html += '<p class="tp-price__note">' + esc(s.priceNote) + '</p>';
    if (!this.backend && full) html += '<p class="tp-price__note">' + esc(S.not_server_validated) + '</p>';
    return html + '</div>';
  };

  Booking.prototype.renderAside = function (q) {
    var S = this.S, cfg = this.cfg, st = this.state;
    var label, amount;
    if (!st.vehicleId) {
      var cheapest = null;
      if (st.route && !this.priceOnRequest()) {
        P.quoteVehicles(cfg, this.request(''), {}).forEach(function (it) {
          if (it.fits && it.quote.total !== null && !it.quote.onRequest && (!cheapest || it.quote.total < cheapest)) cheapest = it.quote.total;
        });
      }
      label = S.live_total;
      amount = cheapest !== null ? fmt(S.quick_result, { amount: P.formatMoney(cheapest, cfg) }) : (this.priceOnRequest() && st.pickup ? S.price_on_request : '—');
    } else {
      label = S.total;
      amount = q.onRequest || q.total === null ? S.price_on_request : P.formatMoney(q.total, cfg);
    }
    $$(this.root, '[data-tp-total-label]').forEach(function (e) { e.textContent = label; });
    $$(this.root, '[data-tp-total]').forEach(function (e) { e.textContent = amount; });
    var recap = $(this.root, '[data-tp-aside-recap]');
    if (recap) {
      var parts = [];
      if (st.pickup) parts.push('<li>' + icon('route') + '<span>' + esc(st.pickup.label) + (st.dropoff ? ' → ' + esc(st.dropoff.label) : '') + '</span></li>');
      if (st.when === 'asap') parts.push('<li>' + icon('clock') + '<span>' + esc(S.asap) + '</span></li>');
      else if (st.date) parts.push('<li>' + icon('calendar') + '<span>' + esc(formatDate(st.date + 'T' + st.time, cfg)) + '</span></li>');
      var v = cfg.vehicles.filter(function (x) { return x.id === st.vehicleId; })[0];
      if (v) parts.push('<li>' + icon('car') + '<span>' + esc(v.name) + '</span></li>');
      recap.innerHTML = parts.join('');
    }
    var details = $(this.root, '[data-tp-aside-price]');
    if (details) details.innerHTML = st.vehicleId && st.step < 5 ? this.priceBlock(q, false) : '';
  };

  /* ---------- Sauvegarde de session ---------- */
  Booking.prototype.save = function () {
    var st = Object.assign({}, this.state);
    delete st.serverQuote;
    store(STORE_KEY, { state: st, at: Date.now() });
  };
  Booking.prototype.saveSoon = function () {
    var self = this; clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(function () { self.save(); }, 400);
  };
  Booking.prototype.restore = function (saved) {
    var d = this.defaults();
    var st = Object.assign(d, saved, { customer: Object.assign(d.customer, saved.customer || {}), step: Math.min(saved.step || 1, 4) });
    // La date enregistrée peut être dépassée : on repart d'un créneau valide
    if (P.parseLocal(st.date + 'T' + st.time) < P.parseLocal(d.date + 'T' + d.time)) { st.date = d.date; st.time = d.time; }
    if (!this.cfg.services.some(function (s) { return s.id === st.serviceId; })) st.serviceId = d.serviceId;
    if (!this.cfg.vehicles.some(function (v) { return v.id === st.vehicleId; })) st.vehicleId = '';
    this.state = st;
    this.pickupField.set(st.pickup); this.dropoffField.set(st.dropoff);
    if (st.routeStatus === 'loading') { st.routeStatus = 'idle'; st.route = null; }
    if (st.route && this.map) this.map.show(st.pickup, st.dropoff, st.route.geometry, this.accent());
    this.state.step = 1;
    for (var i = 1; i < (saved.step || 1) && i < 4; i++) { if (this.stepErrors(i).length) break; this.state.step = i + 1; }
  };
  Booking.prototype.prefillFromUrl = function (p) {
    var pt = function (prefix) {
      var lat = parseFloat(p.get(prefix + '_lat')), lng = parseFloat(p.get(prefix + '_lng')), label = p.get(prefix);
      if (!label) return null;
      return isFinite(lat) && isFinite(lng) ? { lat: lat, lng: lng, label: label } : { label: label };
    };
    this.prefill({
      service: p.get('tp_service'), pickup: pt('tp_from'), dropoff: pt('tp_to'), date: p.get('tp_date'), time: p.get('tp_time'),
      asap: p.get('tp_asap') === '1', passengers: p.get('tp_pax'), luggage: p.get('tp_bags'), vehicle: p.get('tp_vehicle'), silent: true
    });
    this.autoAdvance = true;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* sans effet */ }
  };
  Booking.prototype.prefill = function (d) {
    var st = this.state;
    if (d.service && this.cfg.services.some(function (s) { return s.id === d.service; })) st.serviceId = d.service;
    if (d.pickup) st.pickup = d.pickup;
    if (d.dropoff) st.dropoff = d.dropoff;
    if (d.asap) st.when = 'asap';
    else if (d.date && d.time) { st.when = 'schedule'; st.date = d.date; st.time = d.time; }
    if (d.passengers) st.passengers = Math.max(1, parseInt(d.passengers, 10) || 1);
    if (d.luggage) st.luggage = Math.max(0, parseInt(d.luggage, 10) || 0);
    if (d.vehicle) st.vehicleId = d.vehicle;
    st.route = d.route || null; st.routeStatus = d.route ? 'ok' : 'idle';
    st.step = 1;
    if (!d.silent) {
      this.syncInputs(); this.render();
      if (st.route && this.map) this.map.show(st.pickup, st.dropoff, st.route.geometry, this.accent());
      else if (st.pickup && st.dropoff) this.computeRoute();
      this.go(st.route ? 2 : 1);
      this.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* ---------- Envoi ---------- */
  Booking.prototype.submit = async function () {
    if (this.submitting) return;
    for (var i = 1; i <= 4; i++) {
      var errs = this.stepErrors(i);
      if (errs.length) { this.go(i); this.showErrors(i, errs); return; }
    }
    var q = this.currentQuote();
    if (!q.ok) return;
    this.setSubmitting(true);
    if (this.backend) await this.submitBackend(q);
    else this.submitContactForm(q);
  };
  Booking.prototype.setSubmitting = function (on) {
    this.submitting = on;
    var btn = $(this.root, '[data-tp-confirm]');
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
    if (on) btn.textContent = this.S.sending;
    else this.render();
  };
  Booking.prototype.payload = function (q) {
    var st = this.state;
    var req = this.request();
    req.pickup = st.pickup; req.dropoff = req.dropoff ? st.dropoff : null;
    return {
      shop: this.geo.shop, locale: this.s.language, request: req,
      customer: st.customer, payment: st.payment,
      clientTotal: q.onRequest ? null : q.total,
      acceptTotal: st.serverQuote ? st.serverQuote.total : undefined,
      returnUrl: location.origin + location.pathname,
      website: ($(this.root, '[name="tp_website"]') || {}).value || ''
    };
  };
  Booking.prototype.submitBackend = async function (q) {
    var S = this.S, self = this;
    try {
      var res = await fetch(this.backend + '/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.payload(q))
      });
      var data = {};
      try { data = await res.json(); } catch (e) { /* réponse vide */ }
      if (res.status === 409 && data.code === 'PRICE_CHANGED' && data.quote) {
        this.state.serverQuote = data.quote;
        this.setSubmitting(false);
        var box = $(this.root, '[data-tp-step="5"] [data-tp-errors]');
        box.innerHTML = '<li>' + icon('info') + '<span>' + esc(fmt(S.status_price_changed, { amount: P.formatMoney(data.quote.total, this.cfg) })) + '</span></li>';
        box.hidden = false;
        return;
      }
      if (res.status === 422 && data.errors) {
        this.setSubmitting(false);
        this.showErrors(5, data.errors.map(function (e) { return { message: e.message || e.code }; }));
        return;
      }
      if (!res.ok || !data.booking) throw new Error(data.error || ('HTTP ' + res.status));
      var b = data.booking;
      store('tp-last-booking', { id: b.id, token: b.token, ref: b.ref, name: this.state.customer.firstName, paymentUrl: data.paymentUrl || null });
      store(STORE_KEY, null);
      if (data.paymentUrl) {
        $(this.root, '[data-tp-confirm]').textContent = S.redirecting;
        window.location.assign(data.paymentUrl);
        return;
      }
      this.submitting = false;
      this.showResult(b.status, { ref: b.ref, name: this.state.customer.firstName, id: b.id, token: b.token });
    } catch (e) {
      console.error('[TAXI PRO] Envoi impossible', e);
      self.setSubmitting(false);
      self.showErrors(5, [{ message: S.status_error_title + '. ' + fmt(S.status_error_text, { phone: (self.s.company || {}).phone || '' }) }]);
    }
  };
  Booking.prototype.summaryText = function (q, ref) {
    var S = this.S, cfg = this.cfg, lines = [S.summary_text_header, 'Réf. ' + ref, ''];
    this.summaryRows(q).forEach(function (r) { lines.push(r[0] + ' : ' + r[1]); });
    lines.push('');
    if (q.onRequest || q.total === null) lines.push(S.total + ' : ' + S.price_on_request);
    else {
      q.lines.forEach(function (l) { lines.push('  ' + l.label + ' : ' + P.formatMoney(l.amount, cfg)); });
      lines.push(S.total + ' : ' + P.formatMoney(q.total, cfg) + ' ' + (this.s.priceSuffix || ''));
      lines.push(S.not_server_validated);
    }
    var st = this.state;
    if (st.pickup && isFinite(st.pickup.lat)) lines.push('', 'GPS départ : ' + st.pickup.lat.toFixed(6) + ', ' + st.pickup.lng.toFixed(6));
    if (st.dropoff && isFinite(st.dropoff.lat)) lines.push('GPS arrivée : ' + st.dropoff.lat.toFixed(6) + ', ' + st.dropoff.lng.toFixed(6));
    return lines.join('\n');
  };
  Booking.prototype.submitContactForm = function (q) {
    var form = $(this.root, 'form.tp-contact-fallback') || $(this.root, 'form[action$="/contact"]');
    var c = this.state.customer, ref = makeRef();
    var set = function (n, v) { var f = $(form, '[data-tp-contact-field="' + n + '"]'); if (f) f.value = v; };
    set('name', (c.firstName + ' ' + c.lastName).trim());
    set('email', c.email);
    set('phone', c.phone);
    set('ref', ref);
    set('body', this.summaryText(q, ref));
    store('tp-contact-sent', { ref: ref, name: c.firstName });
    store(STORE_KEY, null);
    if (form.requestSubmit) form.requestSubmit(); else form.submit();
  };

  /* ---------- Statut après envoi ou retour de paiement ---------- */
  Booking.prototype.showResult = function (status, d) {
    var S = this.S, root = this.root, self = this;
    $(root, '[data-tp-form]').hidden = true;
    var aside = $(root, '[data-tp-aside]'); if (aside) aside.hidden = true;
    var bar = $(root, '[data-tp-mobilebar]'); if (bar) bar.hidden = true;
    var box = $(root, '[data-tp-result]');
    box.hidden = false;
    var map = {
      request: ['calendar', 'status_request_title', 'status_request_text'],
      pending_validation: ['calendar', 'status_request_title', 'status_request_text'],
      awaiting_payment: ['clock', 'status_payment_check_title', 'status_payment_check_text'],
      confirmed: ['check', 'status_confirmed_title', 'status_confirmed_text'],
      cancelled: ['alert', 'status_cancelled_title', 'status_cancelled_text'],
      error: ['alert', 'status_error_title', 'status_error_text']
    };
    var m = map[status] || map.pending_validation;
    var text = d.contactForm ? S.contact_form_sent_text : fmt(S[m[2]], { name: d.name || '', ref: d.ref ? '« ' + d.ref + ' »' : '', phone: (this.s.company || {}).phone || '' });
    var actions = '';
    if (d.paymentUrl && status === 'awaiting_payment') actions += '<a class="btn" href="' + esc(d.paymentUrl) + '">' + esc(S.resume_payment) + '</a>';
    if (d.id && d.token && this.backend) actions += '<a class="btn btn--secondary" href="' + esc(this.backend + '/api/bookings/' + encodeURIComponent(d.id) + '/ics?token=' + encodeURIComponent(d.token)) + '">' + icon('calendar') + esc(S.add_to_calendar) + '</a>';
    actions += '<button type="button" class="btn btn--ghost" data-tp-new>' + esc(S.new_booking) + '</button>';
    box.innerHTML = '<div class="tp-result tp-result--' + esc(status) + '" role="status" tabindex="-1"><span class="tp-result__icon">' + icon(m[0]) + '</span>' +
      '<h3 class="tp-result__title">' + esc(d.contactForm ? S.contact_form_sent_title : S[m[1]]) + '</h3>' +
      (d.ref ? '<p class="tp-result__ref">' + esc(d.ref) + '</p>' : '') +
      '<p class="tp-result__text">' + esc(text) + '</p><div class="btn-row">' + actions + '</div></div>';
    var r = $(box, '.tp-result'); if (r) r.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $(box, '[data-tp-new]').addEventListener('click', function () {
      store(STORE_KEY, null);
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* sans effet */ }
      box.hidden = true; $(root, '[data-tp-form]').hidden = false;
      if (aside) aside.hidden = false; if (bar) bar.hidden = false;
      self.state = self.defaults(); self.syncInputs(); self.render();
    });
  };
  Booking.prototype.loadStatus = async function (id, token, attempt) {
    attempt = attempt || 0;
    var last = store('tp-last-booking') || {};
    try {
      var res = await fetch(this.backend + '/api/bookings/' + encodeURIComponent(id) + '?token=' + encodeURIComponent(token));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var b = (await res.json()).booking;
      this.showResult(b.status, { ref: b.ref, name: b.firstName || last.name, id: id, token: token, paymentUrl: b.paymentUrl || last.paymentUrl });
      var self = this;
      if (b.status === 'awaiting_payment' && attempt < 24) setTimeout(function () { self.loadStatus(id, token, attempt + 1); }, 5000);
    } catch (e) {
      console.warn('[TAXI PRO] Statut indisponible', e);
      this.showResult('awaiting_payment', { ref: last.ref, id: id, token: token, paymentUrl: last.paymentUrl });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Formulaire rapide (héros)                                           */
  /* ------------------------------------------------------------------ */
  function Quick(root) {
    var C = readConfig(), self = this;
    this.root = root; this.cfg = C.cfg; this.s = C.s; this.S = C.S;
    this.geo = new G.Geo(this.s);
    this.manual = !this.geo.canAutocomplete();
    this.state = { pickup: null, dropoff: null, passengers: 1, when: this.cfg.booking.scheduled ? 'schedule' : 'asap' };
    var now = P.toLocalString(P.nowLocal(new Date(), this.cfg.timezone));
    var start = roundUpQuarter(addMinutes(now, this.cfg.booking.leadMin + 15));
    this.pickup = new AddressField($(root, '[data-tp-address="pickup"]'), this.geo, this.S, function (v) { self.state.pickup = v; self.clear(); });
    this.dropoff = new AddressField($(root, '[data-tp-address="dropoff"]'), this.geo, this.S, function (v) { self.state.dropoff = v; self.clear(); });
    var date = $(root, '[name="date"]'), time = $(root, '[name="time"]');
    if (date) { date.value = start.slice(0, 10); date.min = now.slice(0, 10); }
    if (time) time.value = start.slice(11, 16);
    var pax = $(root, '[data-tp-stepper="passengers"]');
    if (pax) { $(pax, 'input').max = this.cfg.booking.maxPassengers; this.pax = bindStepper(pax, function (v) { self.state.passengers = v; self.clear(); }); this.pax.set(1); }
    $(root, 'form').addEventListener('submit', function (e) { e.preventDefault(); self.submit(); });
    if (!this.cfg.vehicles.length) root.hidden = true;
  }
  Quick.prototype.clear = function () { var r = $(this.root, '[data-tp-quick-result]'); if (r) r.hidden = true; };
  Quick.prototype.params = function (route, vehicleId) {
    var st = this.state, root = this.root, p = new URLSearchParams();
    var put = function (k, v) { if (v !== undefined && v !== null && v !== '') p.set(k, v); };
    put('tp_from', st.pickup && st.pickup.label); put('tp_from_lat', st.pickup && st.pickup.lat); put('tp_from_lng', st.pickup && st.pickup.lng);
    put('tp_to', st.dropoff && st.dropoff.label); put('tp_to_lat', st.dropoff && st.dropoff.lat); put('tp_to_lng', st.dropoff && st.dropoff.lng);
    var date = $(root, '[name="date"]'), time = $(root, '[name="time"]');
    put('tp_date', date && date.value); put('tp_time', time && time.value);
    put('tp_pax', st.passengers); put('tp_vehicle', vehicleId);
    return p;
  };
  Quick.prototype.submit = async function () {
    var S = this.S, cfg = this.cfg, st = this.state, root = this.root, self = this;
    var out = $(root, '[data-tp-quick-result]'), btn = $(root, '[type="submit"]');
    var err = function (msg) { out.hidden = false; out.innerHTML = '<p class="tp-quick__error">' + icon('alert') + esc(msg) + '</p>'; };
    if (!this.pickup.isResolved() || !this.dropoff.isResolved()) return err(S.select_from_list);
    var route = null;
    btn.disabled = true; btn.classList.add('is-loading');
    try {
      if (!this.manual) route = await this.geo.route(st.pickup, st.dropoff);
    } catch (e) { console.warn('[TAXI PRO] Itinéraire indisponible', e); }
    btn.disabled = false; btn.classList.remove('is-loading');
    var date = $(root, '[name="date"]'), time = $(root, '[name="time"]');
    var req = {
      serviceId: cfg.services[0] && cfg.services[0].id, pickup: st.pickup, dropoff: st.dropoff,
      route: route ? { distanceKm: route.distanceKm, durationMin: route.durationMin, estimated: route.estimated } : {},
      datetime: date && time ? date.value + 'T' + time.value : '', passengers: st.passengers, luggage: 0
    };
    var best = null;
    if (route) P.quoteVehicles(cfg, req, {}).forEach(function (it) {
      if (it.fits && it.quote.total !== null && !it.quote.onRequest && (!best || it.quote.total < best.quote.total)) best = it;
    });
    var booking = document.querySelector('[data-tp-booking]');
    var params = this.params(route, null);
    var href = (this.s.booking && this.s.booking.pageUrl || '/pages/reservation') + '?' + params.toString();
    var dateErr = best && best.quote.errors.filter(function (e) { return ['LEAD_TIME', 'TOO_FAR', 'CLOSED', 'DATETIME_INVALID', 'FORBIDDEN_ZONE', 'OUT_OF_AREA'].indexOf(e.code) > -1; })[0];
    out.hidden = false;
    out.innerHTML = (best
      ? '<p class="tp-quick__price"><span>' + esc(fmt(S.quick_result, { amount: P.formatMoney(best.quote.total, cfg) })) + '</span><small>' +
        esc(fmt(S.quick_result_note, { vehicle: best.vehicle.name, km: fmt(S.km, { n: P.formatNumber(route.distanceKm, cfg, 1) }) })) + (this.s.priceSuffix ? ' · ' + esc(this.s.priceSuffix) : '') + '</small></p>'
      : '<p class="tp-quick__price"><span>' + esc(S.price_on_request) + '</span></p>') +
      (dateErr ? '<p class="tp-quick__error">' + icon('alert') + esc(dateErr.message) + '</p>' : '') +
      '<a class="btn btn--block" href="' + esc(href) + '" data-tp-quick-book>' + esc(S.quick_book) + '</a>';
    if (booking) {
      $(out, '[data-tp-quick-book]').addEventListener('click', function (e) {
        e.preventDefault();
        booking.dispatchEvent(new CustomEvent('tp:prefill', { detail: {
          pickup: st.pickup, dropoff: st.dropoff, route: route, passengers: st.passengers,
          date: date && date.value, time: time && time.value, asap: false
        } }));
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */
  function start() {
    if (!P || !G) { console.error('[TAXI PRO] tp-pricing.js et tp-geo.js doivent être chargés avant tp-booking.js'); return; }
    document.querySelectorAll('[data-tp-booking]:not(.is-ready)').forEach(function (el) {
      try { el.__tpBooking = new Booking(el); } catch (e) { console.error('[TAXI PRO] Réservation', e); }
    });
    document.querySelectorAll('[data-tp-quick]:not(.is-ready)').forEach(function (el) {
      try { el.classList.add('is-ready'); el.__tpQuick = new Quick(el); } catch (e) { console.error('[TAXI PRO] Formulaire rapide', e); }
    });
  }
  window.TaxiProBooking = { start: start, readConfig: readConfig, Booking: Booking, Quick: Quick };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // Éditeur de thème : réinitialiser après modification d'une section
  document.addEventListener('shopify:section:load', function () { window.__tpConfig = null; start(); });
})();
