/*!
 * TAXI PRO — moteur de tarification
 * ---------------------------------------------------------------------------
 * Fichier unique utilisé à la fois :
 *   - dans le navigateur (thème Shopify) pour l'affichage instantané des prix ;
 *   - sur le serveur (backend Node) pour valider le prix avant confirmation ou paiement.
 *
 * Aucun tarif n'est écrit dans ce fichier : tous les montants proviennent de la
 * configuration produite par le thème (réglages + groupe de sections « Configuration
 * Taxi Pro »), transmise à `normalizeConfig()`.
 *
 * Ordre de calcul d'un trajet (documenté dans docs/TARIFICATION.md) :
 *   1. Base du prix (une seule source, par priorité) :
 *        prestation « sur devis » > prestation à prix fixe > mise à disposition (à l'heure)
 *        > forfait de trajet > tarif de zone > tarif du véhicule > tarif général
 *   2. Course = prise en charge + km × prix/km (+ minutes × prix/min)
 *   3. Coefficients : véhicule, zone, prestation
 *   4. Minimum de facturation
 *   5. Majorations horaires (nuit, week-end, jours fériés, plages personnalisées)
 *      combinées selon le mode choisi : « la plus forte », « cumul » ou « priorité »
 *   6. Suppléments fixes : prestation, véhicule, aéroport, gare, passagers, bagages, péages
 *   7. Aller-retour : second trajet calculé à sa propre date, remise éventuelle
 *   8. Options, attente, arrondi, acompte
 * ---------------------------------------------------------------------------
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TaxiProPricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var MS_MIN = 60000;
  var MS_DAY = 86400000;

  /* ------------------------------------------------------------------ */
  /* Conversion tolérante des valeurs saisies dans l'éditeur de thème    */
  /* ------------------------------------------------------------------ */

  /** Convertit « 2,15 », « 2.15 », « 1 234,50 € » ou 2.15 en nombre. */
  function num(v, fallback) {
    if (v === null || v === undefined || v === false || v === true) return fallback;
    if (typeof v === 'number') return isFinite(v) ? v : fallback;
    var s = String(v).replace(/[\s  €$£%]|CHF|EUR/gi, '');
    if (s === '' || s === '-') return fallback;
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
    var n = Number(s);
    return isFinite(n) ? n : fallback;
  }
  function int(v, fallback) {
    var n = num(v, null);
    return n === null ? fallback : Math.round(n);
  }
  function bool(v, fallback) {
    if (v === true || v === false) return v;
    if (v === 'true' || v === 1 || v === '1') return true;
    if (v === 'false' || v === 0 || v === '0') return false;
    return fallback;
  }
  function str(v, fallback) {
    if (v === null || v === undefined) return fallback === undefined ? '' : fallback;
    return String(v).trim();
  }
  function list(v) {
    if (Array.isArray(v)) return v.map(function (x) { return str(x); }).filter(Boolean);
    return str(v).split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function slug(v) {
    return str(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function round2(x) { return Math.round((x + (x >= 0 ? 1 : -1) * 1e-9) * 100) / 100; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /** « 22:00 » → 1320 minutes. Renvoie null si invalide. */
  function parseHM(v) {
    var m = /^(\d{1,2})[:hH.](\d{2})?$/.exec(str(v));
    if (!m) return null;
    var h = Number(m[1]), mi = Number(m[2] || 0);
    if (h > 24 || mi > 59) return null;
    return h * 60 + mi;
  }

  /* ------------------------------------------------------------------ */
  /* Dates en « heure locale de l'entreprise »                           */
  /* On travaille sur des horodatages naïfs (UTC utilisé comme repère)   */
  /* pour éviter tout décalage lié au fuseau du visiteur.                */
  /* ------------------------------------------------------------------ */

  function parseLocal(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(str(v));
    if (!m) return null;
    var t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    var d = new Date(t);
    if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return t;
  }
  function nowLocal(now, timeZone) {
    var date = now instanceof Date ? now : new Date(now || Date.now());
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timeZone || 'UTC', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).formatToParts(date);
      var p = {};
      parts.forEach(function (x) { p[x.type] = x.value; });
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
    } catch (e) {
      return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
    }
  }
  function ymd(t) { return new Date(t).toISOString().slice(0, 10); }
  function minutesOfDay(t) { var d = new Date(t); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
  function weekday(t) { return new Date(t).getUTCDay(); }
  function toLocalString(t) { return new Date(t).toISOString().slice(0, 16); }

  /** Dimanche de Pâques (calendrier grégorien), en horodatage naïf. */
  function easter(year) {
    var a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(year, month - 1, day);
  }

  /**
   * Jours fériés : une entrée par ligne.
   *   2026-12-24   date précise
   *   12-25        tous les ans
   *   easter+1     relatif à Pâques (lundi de Pâques) ; easter+39 Ascension ; easter+50 lundi de Pentecôte
   */
  function isHoliday(t, entries) {
    var date = ymd(t), md = date.slice(5), year = new Date(t).getUTCFullYear();
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i].toLowerCase().replace(/\s/g, '');
      if (!e) continue;
      if (e === date || e === md) return true;
      var m = /^(?:easter|paques|pâques|pasen|ostern)([+-]\d+)?$/.exec(e);
      if (m && ymd(easter(year) + Number(m[1] || 0) * MS_DAY) === date) return true;
    }
    return false;
  }

  /** Plage horaire (début, fin) en minutes, la fin pouvant passer minuit. */
  function inWindow(minute, start, end) {
    if (start === null || end === null) return false;
    if (start === end) return true; // 00:00-00:00 = toute la journée
    if (start < end) return minute >= start && minute < end;
    return minute >= start || minute < end;
  }

  /** « 06:00-12:00, 14:00-02:00 » → [{start, end}] */
  function parseRanges(v) {
    return list(v).map(function (r) {
      var p = r.split(/\s*[-–à]\s*/);
      return { start: parseHM(p[0]), end: parseHM(p[1]) };
    }).filter(function (r) { return r.start !== null && r.end !== null; });
  }

  /* ------------------------------------------------------------------ */
  /* Géométrie                                                           */
  /* ------------------------------------------------------------------ */

  function haversineKm(a, b) {
    if (!a || !b) return null;
    var R = 6371.0088, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }
  function parsePolygon(v) {
    return str(v).split(/\n|;|\|/).map(function (line) {
      var p = line.trim().split(/[\s,]+/);
      return p.length >= 2 ? { lat: num(p[0], NaN), lng: num(p[1], NaN) } : null;
    }).filter(function (p) { return p && isFinite(p.lat) && isFinite(p.lng); });
  }
  function pointInPolygon(pt, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].lng, yi = poly[i].lat, xj = poly[j].lng, yj = poly[j].lat;
      if (((yi > pt.lat) !== (yj > pt.lat)) && (pt.lng < (xj - xi) * (pt.lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function validPoint(p) {
    return !!p && isFinite(num(p.lat, NaN)) && isFinite(num(p.lng, NaN)) &&
      Math.abs(num(p.lat)) <= 90 && Math.abs(num(p.lng)) <= 180;
  }
  function point(p) { return validPoint(p) ? { lat: num(p.lat), lng: num(p.lng), label: str(p.label) } : null; }
  function zoneContains(zone, pt) {
    if (!pt) return false;
    if (zone.polygon.length >= 3) return pointInPolygon(pt, zone.polygon);
    if (zone.center && zone.radiusKm > 0) return haversineKm(zone.center, pt) <= zone.radiusKm;
    return false;
  }
  function appliesOn(rule, inA, inB) {
    if (rule === 'pickup') return inA;
    if (rule === 'dropoff') return inB;
    if (rule === 'both') return inA && inB;
    return inA || inB; // either
  }

  /* ------------------------------------------------------------------ */
  /* Normalisation de la configuration                                   */
  /* ------------------------------------------------------------------ */

  var DEFAULT_LABELS = {
    base: 'Prise en charge', distance: 'Distance ({km} km × {rate})', time: 'Durée ({min} min × {rate})',
    minimum: 'Complément minimum de facturation', route: 'Forfait {name}', hourly: '{name} : {hours} h × {rate}',
    fixed: '{name}', multiplierVehicle: 'Coefficient véhicule {name} (× {value})', multiplierZone: 'Coefficient zone {name} (× {value})',
    multiplierService: 'Coefficient {name} (× {value})', night: 'Supplément nuit', weekend: 'Supplément week-end',
    holiday: 'Supplément jour férié', timeRule: '{name}', airport: 'Supplément aéroport', zone: 'Supplément {name}',
    passengers: 'Passagers supplémentaires ({n})', luggage: 'Bagages supplémentaires ({n})', tolls: 'Péages',
    serviceSurcharge: 'Supplément {name}', vehicleSurcharge: 'Supplément véhicule {name}', option: '{name}',
    optionQty: '{name} × {n}', waiting: 'Attente ({min} min)', roundTripDiscount: 'Remise aller-retour (−{value} %)',
    outbound: 'Aller', returnLeg: 'Retour', rounding: 'Arrondi',
    err_ROUTE_REQUIRED: 'Indiquez une adresse de départ et une adresse d’arrivée valides.',
    err_PICKUP_REQUIRED: 'Indiquez une adresse de départ valide.',
    err_DISTANCE_UNAVAILABLE: 'La distance du trajet n’a pas pu être calculée.',
    err_DATETIME_REQUIRED: 'Indiquez la date et l’heure de prise en charge.',
    err_DATETIME_INVALID: 'La date ou l’heure est invalide.',
    err_LEAD_TIME: 'Les réservations doivent être faites au moins {min} minutes à l’avance.',
    err_TOO_FAR: 'Les réservations sont ouvertes jusqu’à {days} jours à l’avance.',
    err_CLOSED: 'Nous ne sommes pas disponibles à cette heure-là.',
    err_CLOSED_RETURN: 'Nous ne sommes pas disponibles à l’heure du retour.',
    err_IMMEDIATE_DISABLED: 'La réservation immédiate n’est pas proposée.',
    err_SCHEDULED_DISABLED: 'La réservation à l’avance n’est pas proposée.',
    err_RETURN_REQUIRED: 'Indiquez la date et l’heure du retour.',
    err_RETURN_BEFORE: 'Le retour doit avoir lieu après l’aller.',
    err_VEHICLE_REQUIRED: 'Choisissez un véhicule.',
    err_VEHICLE_UNKNOWN: 'Ce véhicule n’est pas disponible.',
    err_VEHICLE_CAPACITY: 'Ce véhicule accepte au maximum {n} passagers.',
    err_VEHICLE_LUGGAGE: 'Ce véhicule accepte au maximum {n} bagages.',
    err_MAX_PASSENGERS: 'Le nombre de passagers est limité à {n} par réservation.',
    err_MAX_LUGGAGE: 'Le nombre de bagages est limité à {n} par réservation.',
    err_PASSENGERS_MIN: 'Indiquez au moins un passager.',
    err_SERVICE_UNKNOWN: 'Cette prestation n’est pas disponible.',
    err_OPTION_UNKNOWN: 'Une option choisie n’est pas disponible.',
    err_OPTION_QTY: 'Quantité trop élevée pour l’option {name} (maximum {n}).',
    err_FORBIDDEN_ZONE: 'Nous ne desservons pas cette adresse ({name}).',
    err_OUT_OF_AREA: 'Cette adresse est en dehors de notre zone d’intervention.',
    err_MAX_DISTANCE: 'Ce trajet dépasse la distance maximale de {km} km.',
    err_HOURS_REQUIRED: 'Indiquez la durée de mise à disposition.',
    warn_ON_REQUEST: 'Ce trajet fait l’objet d’un devis personnalisé.',
    warn_OUT_OF_AREA_QUOTE: 'Adresse hors de notre zone habituelle : le prix sera confirmé sur devis.',
    warn_MAX_DISTANCE_QUOTE: 'Trajet longue distance : le prix sera confirmé sur devis.',
    warn_ESTIMATED_DISTANCE: 'Distance estimée à vol d’oiseau : le prix sera confirmé.'
  };

  function surcharge(o, defaults) {
    o = o || {};
    return {
      enabled: bool(o.enabled, !!defaults.enabled),
      type: str(o.type, defaults.type || 'percent') === 'fixed' ? 'fixed' : 'percent',
      value: num(o.value, defaults.value || 0),
      priority: int(o.priority, defaults.priority || 0)
    };
  }

  function normalizeConfig(raw) {
    raw = raw || {};
    var s = raw.settings || {};
    var t = s.tariff || {};
    var su = s.surcharges || {};
    var g = s.geo || {};
    var b = s.booking || {};
    var pay = b.payment || {};
    var hours = b.hours || {};

    var cfg = {
      version: VERSION,
      currency: (str(s.currency, 'EUR') || 'EUR').toUpperCase(),
      locale: str(s.locale, 'fr-BE') || 'fr-BE',
      timezone: str(s.timezone, 'Europe/Brussels') || 'Europe/Brussels',
      vatRate: num(s.vatRate, 0),
      labels: Object.assign({}, DEFAULT_LABELS, raw.labels || s.labels || {}),
      tariff: {
        base: num(t.base, 0),
        perKm: num(t.perKm, 0),
        perMin: num(t.perMin, 0),
        perMinEnabled: bool(t.perMinEnabled, false),
        minimum: num(t.minimum, 0),
        rounding: num(t.rounding, 0.01) > 0 ? num(t.rounding, 0.01) : 0.01,
        roundingMode: ['up', 'down'].indexOf(str(t.roundingMode)) > -1 ? str(t.roundingMode) : 'nearest'
      },
      surcharges: {
        combine: ['max', 'sum', 'priority'].indexOf(str(su.combine)) > -1 ? str(su.combine) : 'max',
        night: Object.assign(surcharge(su.night, { type: 'percent', priority: 10 }), {
          start: parseHM((su.night || {}).start || '22:00'), end: parseHM((su.night || {}).end || '06:00')
        }),
        weekend: Object.assign(surcharge(su.weekend, { type: 'percent', priority: 20 }), {
          saturday: bool((su.weekend || {}).saturday, true), sunday: bool((su.weekend || {}).sunday, true)
        }),
        holiday: Object.assign(surcharge(su.holiday, { type: 'percent', priority: 30 }), {
          dates: list((su.holiday || {}).dates)
        }),
        airport: { enabled: bool((su.airport || {}).enabled, false), amount: num((su.airport || {}).amount, 0) },
        passengers: {
          enabled: bool((su.passengers || {}).enabled, false),
          included: int((su.passengers || {}).included, 4), amount: num((su.passengers || {}).amount, 0)
        },
        luggage: {
          enabled: bool((su.luggage || {}).enabled, false),
          included: int((su.luggage || {}).included, 2), amount: num((su.luggage || {}).amount, 0)
        },
        waiting: {
          enabled: bool((su.waiting || {}).enabled, false),
          perMin: num((su.waiting || {}).perMin, 0), freeMin: int((su.waiting || {}).freeMin, 0)
        },
        tolls: { enabled: bool((su.tolls || {}).enabled, false) }
      },
      roundTrip: {
        enabled: bool((s.roundTrip || {}).enabled, true),
        discount: clamp(num((s.roundTrip || {}).discount, 0), 0, 100)
      },
      hourly: {
        rate: num((s.hourly || {}).rate, 0),
        minHours: Math.max(0, num((s.hourly || {}).minHours, 1))
      },
      deposit: { percent: clamp(num(pay.depositPercent, 30), 0, 100) },
      geo: {
        center: point({ lat: g.lat, lng: g.lng }),
        radiusKm: Math.max(0, num(g.radiusKm, 0)),
        areaRule: ['pickup', 'dropoff', 'both', 'either'].indexOf(str(g.areaRule)) > -1 ? str(g.areaRule) : 'either',
        outOfArea: str(g.outOfArea) === 'block' ? 'block' : 'quote',
        maxDistanceKm: Math.max(0, num(g.maxDistanceKm, 0)),
        maxDistanceAction: str(g.maxDistanceAction) === 'block' ? 'block' : 'quote'
      },
      booking: {
        immediate: bool(b.immediate, true),
        scheduled: bool(b.scheduled, true),
        leadMin: Math.max(0, int(b.leadMin, 60)),
        maxDays: Math.max(0, int(b.maxDays, 365)),
        maxPassengers: Math.max(1, int(b.maxPassengers, 8)),
        maxLuggage: Math.max(0, int(b.maxLuggage, 10)),
        always: bool(hours.always, true),
        hours: {}
      },
      vehicles: [], options: [], services: [], zones: [], routes: [], timeRules: []
    };
    DAY_KEYS.forEach(function (k) { cfg.booking.hours[k] = parseRanges(hours[k]); });

    (raw.vehicles || []).forEach(function (v, i) {
      if (!v || bool(v.enabled, true) === false) return;
      var p = v.pricing || {};
      var id = slug(v.id) || slug(v.name) || 'vehicule-' + (i + 1);
      cfg.vehicles.push({
        id: id, name: str(v.name, id), description: str(v.description), image: str(v.image),
        imageAlt: str(v.imageAlt), badge: str(v.badge), equipment: list(v.equipment),
        passengers: Math.max(1, int(v.passengers, 4)), luggage: Math.max(0, int(v.luggage, 2)),
        mode: str(p.mode) === 'custom' ? 'custom' : 'multiplier',
        multiplier: num(p.multiplier, 1) > 0 ? num(p.multiplier, 1) : 1,
        base: num(p.base, null), perKm: num(p.perKm, null), perMin: num(p.perMin, null), minimum: num(p.minimum, null),
        hourlyRate: num(p.hourlyRate, null), surcharge: num(p.surcharge, 0)
      });
    });

    (raw.options || []).forEach(function (o, i) {
      if (!o || bool(o.enabled, true) === false) return;
      var id = slug(o.id) || slug(o.name) || 'option-' + (i + 1);
      var type = ['fixed', 'per_unit', 'percent'].indexOf(str(o.type)) > -1 ? str(o.type) : 'fixed';
      cfg.options.push({
        id: id, name: str(o.name, id), description: str(o.description), icon: str(o.icon),
        type: type, price: num(o.price, 0),
        maxQty: type === 'per_unit' ? Math.max(1, int(o.maxQty, 3)) : 1,
        services: list(o.services).map(slug)
      });
    });

    (raw.services || []).forEach(function (sv, i) {
      if (!sv || bool(sv.enabled, true) === false) return;
      var id = slug(sv.id) || slug(sv.name) || 'prestation-' + (i + 1);
      var mode = ['meter', 'hourly', 'fixed', 'quote'].indexOf(str(sv.mode)) > -1 ? str(sv.mode) : 'meter';
      cfg.services.push({
        id: id, name: str(sv.name, id), description: str(sv.description), icon: str(sv.icon), mode: mode,
        multiplier: num(sv.multiplier, 1) > 0 ? num(sv.multiplier, 1) : 1, surcharge: num(sv.surcharge, 0),
        minimum: num(sv.minimum, 0), fixedPrice: num(sv.fixedPrice, 0), hourlyRate: num(sv.hourlyRate, null),
        minHours: num(sv.minHours, null), airport: bool(sv.airport, false), roundTrip: bool(sv.roundTrip, mode === 'meter')
      });
    });

    (raw.zones || []).forEach(function (z, i) {
      if (!z || bool(z.enabled, true) === false) return;
      var id = slug(z.id) || slug(z.name) || 'zone-' + (i + 1);
      var type = ['airport', 'station', 'pricing', 'forbidden', 'service', 'area'].indexOf(str(z.type)) > -1 ? str(z.type) : 'area';
      cfg.zones.push({
        id: id, name: str(z.name, id), type: type,
        center: point({ lat: z.lat, lng: z.lng }), radiusKm: Math.max(0, num(z.radiusKm, 0)), polygon: parsePolygon(z.polygon),
        appliesOn: ['pickup', 'dropoff', 'both', 'either'].indexOf(str(z.appliesOn)) > -1 ? str(z.appliesOn) : 'either',
        surcharge: num(z.surcharge, null), multiplier: num(z.multiplier, null),
        base: num(z.base, null), perKm: num(z.perKm, null), perMin: num(z.perMin, null), minimum: num(z.minimum, null),
        tolls: num(z.tolls, 0), priority: int(z.priority, 0)
      });
    });

    (raw.routes || []).forEach(function (r, i) {
      if (!r || bool(r.enabled, true) === false) return;
      var vehiclePrices = {};
      list(r.vehiclePrices).forEach(function (pair) {
        var m = /^([^:=]+)[:=](.+)$/.exec(pair);
        if (m && num(m[2], null) !== null) vehiclePrices[slug(m[1])] = num(m[2]);
      });
      cfg.routes.push({
        id: slug(r.id) || 'forfait-' + (i + 1), name: str(r.name, 'Forfait ' + (i + 1)),
        from: slug(r.from) || '*', to: slug(r.to) || '*', bidirectional: bool(r.bidirectional, true),
        price: num(r.price, 0), vehiclePrices: vehiclePrices, vehicles: list(r.vehicles).map(slug),
        services: list(r.services).map(slug), priority: int(r.priority, 50),
        applySurcharges: bool(r.applySurcharges, false), tolls: num(r.tolls, 0)
      });
      if (str(r.from) === '*') cfg.routes[cfg.routes.length - 1].from = '*';
      if (str(r.to) === '*') cfg.routes[cfg.routes.length - 1].to = '*';
    });

    (raw.timeRules || []).forEach(function (tr, i) {
      if (!tr || bool(tr.enabled, true) === false) return;
      var days = list(tr.days).map(function (d) {
        var k = d.toLowerCase().slice(0, 3);
        var map = { lun: 1, mon: 1, mar: 2, tue: 2, mer: 3, wed: 3, jeu: 4, thu: 4, ven: 5, fri: 5, sam: 6, sat: 6, dim: 0, sun: 0 };
        return map[k] !== undefined ? map[k] : int(d, -1) % 7;
      }).filter(function (d) { return d >= 0; });
      cfg.timeRules.push({
        id: slug(tr.id) || 'plage-' + (i + 1), name: str(tr.name, 'Majoration'),
        days: days, start: parseHM(tr.start || '00:00'), end: parseHM(tr.end || '00:00'), dates: list(tr.dates),
        type: str(tr.type) === 'fixed' ? 'fixed' : 'percent', value: num(tr.value, 0), priority: int(tr.priority, 40)
      });
    });

    return cfg;
  }

  /* ------------------------------------------------------------------ */
  /* Outils                                                              */
  /* ------------------------------------------------------------------ */

  function fmt(template, params) {
    return String(template || '').replace(/\{(\w+)\}/g, function (_, k) {
      return params && params[k] !== undefined && params[k] !== null ? params[k] : '';
    });
  }
  function formatMoney(amount, cfg) {
    if (amount === null || amount === undefined) return '';
    try {
      return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.currency }).format(amount);
    } catch (e) {
      return amount.toFixed(2) + ' ' + cfg.currency;
    }
  }
  function formatNumber(n, cfg, digits) {
    try { return new Intl.NumberFormat(cfg.locale, { maximumFractionDigits: digits === undefined ? 1 : digits }).format(n); }
    catch (e) { return String(Math.round(n * 10) / 10); }
  }
  function roundTo(amount, step, mode) {
    if (!step || step <= 0.01) return round2(amount);
    // Calcul en centimes entiers pour éviter les erreurs de virgule flottante (28,75 / 0,1)
    var cents = Math.round(amount * 100), stepC = Math.round(step * 100);
    var q = cents / stepC;
    var r = mode === 'up' ? Math.ceil(q) : mode === 'down' ? Math.floor(q) : Math.round(q);
    return round2(r * stepC / 100);
  }
  function findById(arr, id) {
    var key = slug(id);
    for (var i = 0; i < arr.length; i++) if (arr[i].id === key) return arr[i];
    return null;
  }
  function err(cfg, code, params, field) {
    return { code: code, field: field || null, message: fmt(cfg.labels['err_' + code] || code, params) };
  }
  function warn(cfg, code, params) {
    return { code: code, message: fmt(cfg.labels['warn_' + code] || code, params) };
  }

  /** L'entreprise est-elle disponible à cet instant (horodatage naïf) ? */
  function isOpen(cfg, t) {
    if (cfg.booking.always) return true;
    var day = weekday(t), minute = minutesOfDay(t);
    var today = cfg.booking.hours[DAY_KEYS[day]] || [];
    for (var i = 0; i < today.length; i++) {
      var r = today[i];
      if (r.start < r.end || r.start === r.end) { if (inWindow(minute, r.start, r.end)) return true; }
      else if (minute >= r.start) return true; // plage qui passe minuit, partie du soir
    }
    var yesterday = cfg.booking.hours[DAY_KEYS[(day + 6) % 7]] || [];
    for (var j = 0; j < yesterday.length; j++) {
      var y = yesterday[j];
      if (y.start > y.end && minute < y.end) return true; // suite de la plage de la veille
    }
    return false;
  }

  /** Majorations horaires applicables à une heure de prise en charge. */
  function timeSurcharges(cfg, t) {
    var su = cfg.surcharges, minute = minutesOfDay(t), day = weekday(t), found = [];
    if (su.night.enabled && su.night.value && inWindow(minute, su.night.start, su.night.end))
      found.push({ code: 'night', label: cfg.labels.night, type: su.night.type, value: su.night.value, priority: su.night.priority });
    if (su.weekend.enabled && su.weekend.value && ((day === 6 && su.weekend.saturday) || (day === 0 && su.weekend.sunday)))
      found.push({ code: 'weekend', label: cfg.labels.weekend, type: su.weekend.type, value: su.weekend.value, priority: su.weekend.priority });
    if (su.holiday.enabled && su.holiday.value && isHoliday(t, su.holiday.dates))
      found.push({ code: 'holiday', label: cfg.labels.holiday, type: su.holiday.type, value: su.holiday.value, priority: su.holiday.priority });
    cfg.timeRules.forEach(function (r) {
      if (!r.value) return;
      var dateOk = r.dates.length ? isHoliday(t, r.dates) : true;
      var dayOk = r.days.length ? r.days.indexOf(day) > -1 : true;
      if (dateOk && dayOk && inWindow(minute, r.start, r.end))
        found.push({ code: 'time:' + r.id, label: fmt(cfg.labels.timeRule, { name: r.name }), type: r.type, value: r.value, priority: r.priority });
    });
    return found;
  }

  /** Applique la règle de combinaison des majorations horaires à un montant de course. */
  function combineTime(cfg, list, fare) {
    if (!list.length) return [];
    var withAmount = list.map(function (s) {
      return Object.assign({}, s, { amount: round2(s.type === 'percent' ? fare * s.value / 100 : s.value) });
    });
    var mode = cfg.surcharges.combine;
    if (mode === 'sum') return withAmount;
    if (mode === 'priority') {
      withAmount.sort(function (a, b) { return b.priority - a.priority || b.amount - a.amount; });
      return [withAmount[0]];
    }
    withAmount.sort(function (a, b) { return b.amount - a.amount || b.priority - a.priority; });
    return [withAmount[0]];
  }

  function matchingZones(cfg, a, b) {
    return cfg.zones.map(function (z) {
      var inA = zoneContains(z, a), inB = zoneContains(z, b);
      return { zone: z, inA: inA, inB: inB };
    }).filter(function (m) { return m.inA || m.inB; });
  }

  function findRoute(cfg, a, b, vehicle, service) {
    var best = null;
    cfg.routes.forEach(function (r) {
      if (r.vehicles.length && (!vehicle || r.vehicles.indexOf(vehicle.id) < 0)) return;
      if (r.services.length && (!service || r.services.indexOf(service.id) < 0)) return;
      var zf = r.from === '*' ? null : findById(cfg.zones, r.from);
      var zt = r.to === '*' ? null : findById(cfg.zones, r.to);
      if ((r.from !== '*' && !zf) || (r.to !== '*' && !zt)) return;
      var inF = function (p) { return r.from === '*' || zoneContains(zf, p); };
      var inT = function (p) { return r.to === '*' || zoneContains(zt, p); };
      var ok = (inF(a) && inT(b)) || (r.bidirectional && inF(b) && inT(a));
      if (!ok) return;
      var price = r.vehiclePrices[vehicle ? vehicle.id : ''];
      if (price === undefined) price = r.price * (vehicle && vehicle.mode === 'multiplier' ? vehicle.multiplier : 1);
      var cand = { route: r, price: round2(price) };
      if (!best || r.priority > best.route.priority || (r.priority === best.route.priority && cand.price < best.price)) best = cand;
    });
    return best;
  }

  /* ------------------------------------------------------------------ */
  /* Calcul d'un trajet (aller ou retour)                                */
  /* ------------------------------------------------------------------ */

  function priceLeg(cfg, ctx, leg) {
    var L = cfg.labels, lines = [], rules = [];
    var vehicle = ctx.vehicle, service = ctx.service;
    var km = Math.max(0, leg.distanceKm || 0), minutes = Math.max(0, leg.durationMin || 0);
    var fare = 0, basis = 'meter', route = null, applyTime = true, applyAirport = true;
    var zones = matchingZones(cfg, leg.from, leg.to);

    if (service.mode === 'fixed') {
      basis = 'fixed';
      fare = service.fixedPrice * (vehicle.mode === 'multiplier' ? vehicle.multiplier : 1);
      lines.push({ code: 'fixed', label: fmt(L.fixed, { name: service.name }), amount: round2(fare) });
    } else if (service.mode === 'hourly') {
      basis = 'hourly';
      var hours = Math.max(ctx.hours, service.minHours !== null ? service.minHours : cfg.hourly.minHours);
      var rate = service.hourlyRate !== null ? service.hourlyRate : vehicle.hourlyRate !== null ? vehicle.hourlyRate : cfg.hourly.rate;
      if (service.hourlyRate !== null || vehicle.hourlyRate === null) rate = rate * (vehicle.mode === 'multiplier' ? vehicle.multiplier : 1);
      fare = round2(hours * rate);
      lines.push({ code: 'hourly', label: fmt(L.hourly, { name: service.name, hours: formatNumber(hours, cfg, 2), rate: formatMoney(round2(rate), cfg) }), amount: fare });
    } else {
      route = findRoute(cfg, leg.from, leg.to, vehicle, service);
      if (route) {
        basis = 'route';
        fare = route.price;
        applyTime = route.route.applySurcharges;
        applyAirport = route.route.applySurcharges;
        rules.push('route:' + route.route.id);
        lines.push({ code: 'route', label: fmt(L.route, { name: route.route.name }), amount: fare });
      } else {
        // Tarif compteur : général → véhicule (si tarif propre) → zone tarifaire prioritaire
        var p = { base: cfg.tariff.base, perKm: cfg.tariff.perKm, perMin: cfg.tariff.perMin, minimum: cfg.tariff.minimum };
        if (vehicle.mode === 'custom') {
          ['base', 'perKm', 'perMin', 'minimum'].forEach(function (k) { if (vehicle[k] !== null) p[k] = vehicle[k]; });
          rules.push('vehicle-tariff:' + vehicle.id);
        }
        var pz = zones.filter(function (m) {
          return m.zone.type === 'pricing' && appliesOn(m.zone.appliesOn, m.inA, m.inB);
        }).sort(function (a, b) { return b.zone.priority - a.zone.priority; })[0];
        if (pz) {
          ['base', 'perKm', 'perMin', 'minimum'].forEach(function (k) { if (pz.zone[k] !== null) p[k] = pz.zone[k]; });
          rules.push('zone:' + pz.zone.id);
          ctx.pricingZone = pz.zone;
        }
        var base = round2(p.base), dist = round2(km * p.perKm);
        lines.push({ code: 'base', label: L.base, amount: base });
        lines.push({ code: 'distance', label: fmt(L.distance, { km: formatNumber(km, cfg, 1), rate: formatMoney(p.perKm, cfg) }), amount: dist });
        fare = base + dist;
        if (cfg.tariff.perMinEnabled && p.perMin) {
          var tm = round2(minutes * p.perMin);
          lines.push({ code: 'time', label: fmt(L.time, { min: Math.round(minutes), rate: formatMoney(p.perMin, cfg) }), amount: tm });
          fare += tm;
        }
        if (vehicle.mode === 'multiplier' && vehicle.multiplier !== 1) {
          var dv = round2(fare * (vehicle.multiplier - 1));
          lines.push({ code: 'multiplier-vehicle', label: fmt(L.multiplierVehicle, { name: vehicle.name, value: vehicle.multiplier }), amount: dv });
          fare += dv;
        }
        if (pz && pz.zone.multiplier !== null && pz.zone.multiplier !== 1) {
          var dz = round2(fare * (pz.zone.multiplier - 1));
          lines.push({ code: 'multiplier-zone', label: fmt(L.multiplierZone, { name: pz.zone.name, value: pz.zone.multiplier }), amount: dz });
          fare += dz;
        }
        ctx.minimum = Math.max(ctx.minimum || 0, p.minimum || 0);
      }
    }

    if (service.multiplier !== 1 && basis !== 'fixed') {
      var ds = round2(fare * (service.multiplier - 1));
      lines.push({ code: 'multiplier-service', label: fmt(L.multiplierService, { name: service.name, value: service.multiplier }), amount: ds });
      fare += ds;
    }
    // Minimum de facturation (tarif compteur et mise à disposition)
    var minimum = Math.max(basis === 'meter' ? ctx.minimum || 0 : 0, service.minimum || 0);
    if (basis !== 'route' && basis !== 'fixed' && minimum > fare) {
      lines.push({ code: 'minimum', label: L.minimum, amount: round2(minimum - fare) });
      fare = minimum;
    }
    fare = round2(fare);

    // Majorations horaires
    var timeLines = [];
    if (applyTime) {
      timeLines = combineTime(cfg, timeSurcharges(cfg, leg.time), fare);
      timeLines.forEach(function (s) {
        if (!s.amount) return;
        var lbl = s.label + (s.type === 'percent' ? ' (+' + formatNumber(s.value, cfg, 2) + ' %)' : '');
        lines.push({ code: s.code, label: lbl, amount: s.amount });
        rules.push(s.code.indexOf('time:') === 0 ? s.code : 'time:' + s.code);
      });
    }
    var timeTotal = timeLines.reduce(function (a, s) { return a + s.amount; }, 0);
    var tripAmount = round2(fare + timeTotal); // base de la remise aller-retour et des options en %

    // Suppléments fixes
    var fixed = [];
    if (service.surcharge) fixed.push({ code: 'service-surcharge', label: fmt(L.serviceSurcharge, { name: service.name }), amount: service.surcharge });
    if (vehicle.surcharge) fixed.push({ code: 'vehicle-surcharge', label: fmt(L.vehicleSurcharge, { name: vehicle.name }), amount: vehicle.surcharge });
    if (cfg.surcharges.airport.enabled && applyAirport) {
      var air = 0, airZone = null;
      zones.forEach(function (m) {
        if (m.zone.type !== 'airport') return;
        var amt = m.zone.surcharge !== null ? m.zone.surcharge : cfg.surcharges.airport.amount;
        if (amt > air) { air = amt; airZone = m.zone; }
      });
      if (air) { fixed.push({ code: 'airport', label: L.airport, amount: air }); rules.push('airport:' + airZone.id); }
    }
    zones.forEach(function (m) {
      var z = m.zone;
      if (z.type === 'station' && z.surcharge && appliesOn(z.appliesOn, m.inA, m.inB) && (applyAirport || basis !== 'route')) {
        fixed.push({ code: 'zone:' + z.id, label: fmt(L.zone, { name: z.name }), amount: z.surcharge });
        rules.push('zone:' + z.id);
      }
      if (z.type === 'pricing' && z.surcharge && ctx.pricingZone === z && basis === 'meter') {
        fixed.push({ code: 'zone:' + z.id, label: fmt(L.zone, { name: z.name }), amount: z.surcharge });
      }
    });
    var su = cfg.surcharges;
    if (su.passengers.enabled && su.passengers.amount && ctx.passengers > su.passengers.included) {
      var np = ctx.passengers - su.passengers.included;
      fixed.push({ code: 'passengers', label: fmt(L.passengers, { n: np }), amount: np * su.passengers.amount });
    }
    if (su.luggage.enabled && su.luggage.amount && ctx.luggage > su.luggage.included) {
      var nl = ctx.luggage - su.luggage.included;
      fixed.push({ code: 'luggage', label: fmt(L.luggage, { n: nl }), amount: nl * su.luggage.amount });
    }
    if (su.tolls.enabled) {
      var tolls = route ? route.route.tolls : (ctx.pricingZone && basis === 'meter' ? ctx.pricingZone.tolls : 0);
      if (tolls) fixed.push({ code: 'tolls', label: L.tolls, amount: tolls });
    }
    fixed.forEach(function (f) { f.amount = round2(f.amount); lines.push(f); });
    var fixedTotal = fixed.reduce(function (a, f) { return a + f.amount; }, 0);

    return {
      label: leg.isReturn ? L.returnLeg : L.outbound,
      from: leg.from, to: leg.to, distanceKm: km, durationMin: minutes,
      datetime: toLocalString(leg.time), basis: basis, lines: lines, rules: rules,
      tripAmount: tripAmount, subtotal: round2(tripAmount + fixedTotal)
    };
  }

  /* ------------------------------------------------------------------ */
  /* Devis complet                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * @param {object} cfgOrRaw configuration normalisée (ou brute)
   * @param {object} req {
   *   serviceId, vehicleId, pickup:{lat,lng,label}, dropoff:{…},
   *   route:{distanceKm,durationMin,estimated}, returnRoute:{…},
   *   immediate:bool, datetime:'AAAA-MM-JJTHH:MM', roundTrip:bool, returnDatetime,
   *   passengers, luggage, hours, waitingMin, options:{id:quantité}
   * }
   * @param {object} opts { now: Date } — horloge injectable (tests, serveur)
   */
  function quote(cfgOrRaw, req, opts) {
    var cfg = cfgOrRaw && cfgOrRaw.tariff && cfgOrRaw.version === VERSION ? cfgOrRaw : normalizeConfig(cfgOrRaw);
    req = req || {};
    opts = opts || {};
    var L = cfg.labels, errors = [], warnings = [], onRequest = false;

    var service = req.serviceId ? findById(cfg.services, req.serviceId) : cfg.services[0] || null;
    if (req.serviceId && !service) errors.push(err(cfg, 'SERVICE_UNKNOWN', null, 'service'));
    if (!service) service = { id: 'standard', name: '', mode: 'meter', multiplier: 1, surcharge: 0, minimum: 0, hourlyRate: null, minHours: null, roundTrip: true };

    var vehicle = req.vehicleId ? findById(cfg.vehicles, req.vehicleId) : null;
    if (!req.vehicleId && !opts.allowNoVehicle) errors.push(err(cfg, 'VEHICLE_REQUIRED', null, 'vehicle'));
    else if (req.vehicleId && !vehicle) errors.push(err(cfg, 'VEHICLE_UNKNOWN', null, 'vehicle'));
    if (!vehicle) vehicle = { id: '', name: '', mode: 'multiplier', multiplier: 1, base: null, perKm: null, perMin: null, minimum: null, hourlyRate: null, surcharge: 0, passengers: 99, luggage: 99 };

    var passengers = Math.max(0, int(req.passengers, 1));
    var luggage = Math.max(0, int(req.luggage, 0));
    if (passengers < 1) errors.push(err(cfg, 'PASSENGERS_MIN', null, 'passengers'));
    if (passengers > cfg.booking.maxPassengers) errors.push(err(cfg, 'MAX_PASSENGERS', { n: cfg.booking.maxPassengers }, 'passengers'));
    if (luggage > cfg.booking.maxLuggage) errors.push(err(cfg, 'MAX_LUGGAGE', { n: cfg.booking.maxLuggage }, 'luggage'));
    if (vehicle.id && passengers > vehicle.passengers) errors.push(err(cfg, 'VEHICLE_CAPACITY', { n: vehicle.passengers }, 'vehicle'));
    if (vehicle.id && luggage > vehicle.luggage) errors.push(err(cfg, 'VEHICLE_LUGGAGE', { n: vehicle.luggage }, 'vehicle'));

    // Adresses et distance
    var from = point(req.pickup), to = point(req.dropoff);
    var needsDropoff = service.mode !== 'hourly';
    var r = req.route || {};
    var distanceKm = num(r.distanceKm, null), durationMin = num(r.durationMin, null);
    if (!from) errors.push(err(cfg, needsDropoff ? 'ROUTE_REQUIRED' : 'PICKUP_REQUIRED', null, 'pickup'));
    if (needsDropoff && !to) errors.push(err(cfg, 'ROUTE_REQUIRED', null, 'dropoff'));
    if (needsDropoff && service.mode === 'meter' && from && to && (distanceKm === null || distanceKm < 0)) {
      errors.push(err(cfg, 'DISTANCE_UNAVAILABLE', null, 'route'));
    }
    if (r.estimated) warnings.push(warn(cfg, 'ESTIMATED_DISTANCE'));

    // Zones interdites et zone d'intervention
    if (from || to) {
      cfg.zones.forEach(function (z) {
        if (z.type === 'forbidden' && (zoneContains(z, from) || zoneContains(z, to)))
          errors.push(err(cfg, 'FORBIDDEN_ZONE', { name: z.name }, 'route'));
      });
      var serviceZones = cfg.zones.filter(function (z) { return z.type === 'service'; });
      var areaDefined = (cfg.geo.center && cfg.geo.radiusKm > 0) || serviceZones.length > 0;
      if (areaDefined) {
        var inside = function (p) {
          if (!p) return false;
          if (cfg.geo.center && cfg.geo.radiusKm > 0 && haversineKm(cfg.geo.center, p) <= cfg.geo.radiusKm) return true;
          return serviceZones.some(function (z) { return zoneContains(z, p); });
        };
        var okArea = appliesOn(cfg.geo.areaRule, inside(from), needsDropoff ? inside(to) : inside(from));
        if (!okArea && (from || to)) {
          if (cfg.geo.outOfArea === 'block') errors.push(err(cfg, 'OUT_OF_AREA', null, 'route'));
          else { onRequest = true; warnings.push(warn(cfg, 'OUT_OF_AREA_QUOTE')); }
        }
      }
      if (cfg.geo.maxDistanceKm > 0 && distanceKm !== null && distanceKm > cfg.geo.maxDistanceKm) {
        if (cfg.geo.maxDistanceAction === 'block') errors.push(err(cfg, 'MAX_DISTANCE', { km: cfg.geo.maxDistanceKm }, 'route'));
        else { onRequest = true; warnings.push(warn(cfg, 'MAX_DISTANCE_QUOTE')); }
      }
    }

    // Date et heure
    var now = nowLocal(opts.now || new Date(), cfg.timezone);
    var time = null;
    if (req.immediate) {
      if (!cfg.booking.immediate) errors.push(err(cfg, 'IMMEDIATE_DISABLED', null, 'datetime'));
      time = now;
      if (!isOpen(cfg, time)) errors.push(err(cfg, 'CLOSED', null, 'datetime'));
    } else if (!str(req.datetime)) {
      errors.push(err(cfg, 'DATETIME_REQUIRED', null, 'datetime'));
      time = now + cfg.booking.leadMin * MS_MIN;
    } else {
      time = parseLocal(req.datetime);
      if (time === null) { errors.push(err(cfg, 'DATETIME_INVALID', null, 'datetime')); time = now; }
      else {
        if (!cfg.booking.scheduled) errors.push(err(cfg, 'SCHEDULED_DISABLED', null, 'datetime'));
        if (time < now + cfg.booking.leadMin * MS_MIN) errors.push(err(cfg, 'LEAD_TIME', { min: cfg.booking.leadMin }, 'datetime'));
        if (cfg.booking.maxDays && time > now + cfg.booking.maxDays * MS_DAY) errors.push(err(cfg, 'TOO_FAR', { days: cfg.booking.maxDays }, 'datetime'));
        if (!isOpen(cfg, time)) errors.push(err(cfg, 'CLOSED', null, 'datetime'));
      }
    }
    var hours = num(req.hours, 0);
    if (service.mode === 'hourly' && !(hours > 0)) errors.push(err(cfg, 'HOURS_REQUIRED', null, 'hours'));

    // Aller-retour
    var roundTrip = !!req.roundTrip && cfg.roundTrip.enabled && service.roundTrip && service.mode === 'meter';
    var returnTime = null;
    if (roundTrip) {
      returnTime = parseLocal(req.returnDatetime);
      if (returnTime === null) errors.push(err(cfg, 'RETURN_REQUIRED', null, 'returnDatetime'));
      else {
        if (returnTime <= time + Math.round(durationMin || 0) * MS_MIN) errors.push(err(cfg, 'RETURN_BEFORE', null, 'returnDatetime'));
        if (!isOpen(cfg, returnTime)) errors.push(err(cfg, 'CLOSED_RETURN', null, 'returnDatetime'));
      }
    }

    // Options
    var chosen = [];
    var reqOptions = req.options || {};
    Object.keys(reqOptions).forEach(function (key) {
      var qty = Math.max(0, int(reqOptions[key], 0));
      if (!qty) return;
      var o = findById(cfg.options, key);
      if (!o || (o.services.length && o.services.indexOf(service.id) < 0)) { errors.push(err(cfg, 'OPTION_UNKNOWN', null, 'options')); return; }
      if (qty > o.maxQty) { errors.push(err(cfg, 'OPTION_QTY', { name: o.name, n: o.maxQty }, 'options')); qty = o.maxQty; }
      chosen.push({ option: o, qty: qty });
    });

    var result = {
      ok: false, onRequest: false, errors: errors, warnings: warnings,
      currency: cfg.currency, serviceId: service.id, vehicleId: vehicle.id,
      passengers: passengers, luggage: luggage, roundTrip: roundTrip,
      datetime: time !== null ? toLocalString(time) : null, returnDatetime: returnTime !== null ? toLocalString(returnTime) : null,
      distanceKm: distanceKm, durationMin: durationMin,
      airport: cfg.zones.some(function (z) { return z.type === 'airport' && (zoneContains(z, from) || zoneContains(z, to)); }),
      legs: [], lines: [], options: [], rules: [], basis: null,
      subtotal: null, rounding: 0, total: null, deposit: null, balance: null, vat: null, vatRate: cfg.vatRate,
      engine: VERSION
    };

    if (service.mode === 'quote') onRequest = true;
    var canPrice = !onRequest && from && (!needsDropoff || to) &&
      (service.mode !== 'meter' || distanceKm !== null) && (service.mode !== 'hourly' || hours > 0);

    if (canPrice) {
      var ctx = { vehicle: vehicle, service: service, passengers: passengers, luggage: luggage, hours: hours, minimum: 0 };
      var out = priceLeg(cfg, ctx, { from: from, to: to, distanceKm: distanceKm || 0, durationMin: durationMin || 0, time: time, isReturn: false });
      result.legs.push(out);
      if (roundTrip && returnTime !== null) {
        var rr = req.returnRoute || r;
        var ctx2 = { vehicle: vehicle, service: service, passengers: passengers, luggage: luggage, hours: hours, minimum: 0 };
        result.legs.push(priceLeg(cfg, ctx2, {
          from: to, to: from, distanceKm: num(rr.distanceKm, distanceKm) || 0, durationMin: num(rr.durationMin, durationMin) || 0,
          time: returnTime, isReturn: true
        }));
      }
      result.basis = out.basis;
      var subtotal = 0, tripTotal = 0;
      result.legs.forEach(function (leg) {
        subtotal += leg.subtotal; tripTotal += leg.tripAmount;
        result.rules = result.rules.concat(leg.rules);
        leg.lines.forEach(function (l) {
          result.lines.push({ code: l.code, label: result.legs.length > 1 ? leg.label + ' · ' + l.label : l.label, amount: l.amount, leg: leg.label });
        });
      });
      if (roundTrip && cfg.roundTrip.discount > 0 && result.legs.length > 1) {
        var disc = -round2(tripTotal * cfg.roundTrip.discount / 100);
        result.lines.push({ code: 'round-trip-discount', label: fmt(L.roundTripDiscount, { value: formatNumber(cfg.roundTrip.discount, cfg, 2) }), amount: disc });
        subtotal += disc;
        result.rules.push('round-trip-discount');
      }
      chosen.forEach(function (c) {
        var o = c.option, amount;
        if (o.type === 'percent') amount = round2(tripTotal * o.price / 100);
        else amount = round2(o.price * c.qty);
        var label = o.type === 'per_unit' && c.qty > 1 ? fmt(L.optionQty, { name: o.name, n: c.qty }) : fmt(L.option, { name: o.name });
        result.options.push({ id: o.id, name: o.name, qty: c.qty, amount: amount });
        result.lines.push({ code: 'option:' + o.id, label: label, amount: amount });
        subtotal += amount;
      });
      var w = cfg.surcharges.waiting, waitMin = Math.max(0, int(req.waitingMin, 0));
      if (w.enabled && w.perMin && waitMin > w.freeMin) {
        var wa = round2((waitMin - w.freeMin) * w.perMin);
        result.lines.push({ code: 'waiting', label: fmt(L.waiting, { min: waitMin - w.freeMin }), amount: wa });
        subtotal += wa;
      }
      subtotal = round2(subtotal);
      var total = roundTo(subtotal, cfg.tariff.rounding, cfg.tariff.roundingMode);
      if (total !== subtotal) result.lines.push({ code: 'rounding', label: L.rounding, amount: round2(total - subtotal) });
      result.subtotal = subtotal;
      result.rounding = round2(total - subtotal);
      result.total = total;
      result.deposit = round2(total * cfg.deposit.percent / 100);
      result.balance = round2(total - result.deposit);
      result.vat = cfg.vatRate > 0 ? round2(total - total / (1 + cfg.vatRate / 100)) : 0;
    }

    if (onRequest) {
      result.onRequest = true;
      if (service.mode === 'quote') warnings.push(warn(cfg, 'ON_REQUEST'));
    }
    result.ok = errors.length === 0;
    return result;
  }

  /** Devis pour chaque véhicule (étape « Véhicule »). */
  function quoteVehicles(cfgOrRaw, req, opts) {
    var cfg = cfgOrRaw && cfgOrRaw.version === VERSION && cfgOrRaw.tariff ? cfgOrRaw : normalizeConfig(cfgOrRaw);
    return cfg.vehicles.map(function (v) {
      var q = quote(cfg, Object.assign({}, req, { vehicleId: v.id }), opts);
      return { vehicle: v, quote: q, fits: !q.errors.some(function (e) { return e.code === 'VEHICLE_CAPACITY' || e.code === 'VEHICLE_LUGGAGE'; }) };
    });
  }

  /** Comparaison stricte d'un prix affiché et d'un prix recalculé (au centime). */
  function samePrice(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) return a === b;
    return Math.abs(num(a, NaN) - num(b, NaN)) < 0.005;
  }

  return {
    VERSION: VERSION,
    normalizeConfig: normalizeConfig,
    quote: quote,
    quoteVehicles: quoteVehicles,
    samePrice: samePrice,
    formatMoney: formatMoney,
    formatNumber: formatNumber,
    haversineKm: haversineKm,
    zoneContains: zoneContains,
    isOpen: isOpen,
    isHoliday: isHoliday,
    nowLocal: nowLocal,
    parseLocal: parseLocal,
    toLocalString: toLocalString,
    num: num,
    slug: slug,
    fmt: fmt,
    DEFAULT_LABELS: DEFAULT_LABELS
  };
});
