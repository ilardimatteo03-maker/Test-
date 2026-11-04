/*!
 * TAXI PRO — adresses, itinéraires et carte
 * ---------------------------------------------------------------------------
 * Interface unique au-dessus de plusieurs fournisseurs :
 *   autocomplétion : google (Places API New), mapbox (Search Box), photon (OpenStreetMap, démonstration)
 *   itinéraire     : backend (recommandé, clé secrète côté serveur), google, mapbox, osrm (démonstration)
 *   carte          : Google Maps (fournisseur google) ou Leaflet + tuiles configurables
 *
 * Seules des clés publiques, restreintes au domaine de la boutique, sont utilisées ici.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var scripts = {};
  function loadScript(src) {
    if (!scripts[src]) {
      scripts[src] = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src; s.async = true;
        s.onload = resolve;
        s.onerror = function () { delete scripts[src]; reject(new Error('Script indisponible : ' + src)); };
        document.head.appendChild(s);
      });
    }
    return scripts[src];
  }
  function loadCss(href) {
    if (document.querySelector('link[data-tp-css="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-tp-css', href);
    document.head.appendChild(l);
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  async function getJson(url, init, signal) {
    var res = await fetch(url, Object.assign({ signal: signal }, init || {}));
    if (!res.ok) {
      var e = new Error('HTTP ' + res.status); e.status = res.status;
      try { e.body = await res.json(); } catch (_) { /* corps non JSON */ }
      throw e;
    }
    return res.json();
  }
  function haversineKm(a, b) {
    var R = 6371.0088, r = Math.PI / 180;
    var x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }
  function num(v, d) {
    var n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.'));
    return isFinite(n) ? n : d;
  }

  /* ---------------------------------------------------------------- */
  /* Google Maps JavaScript API (chargement unique)                   */
  /* ---------------------------------------------------------------- */
  var googlePromise = null;
  function loadGoogle(key, language, region) {
    if (window.google && google.maps && google.maps.importLibrary) return Promise.resolve();
    if (!googlePromise) {
      googlePromise = new Promise(function (resolve, reject) {
        window.__tpGoogleReady = function () { resolve(); };
        var src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) +
          '&v=weekly&loading=async&callback=__tpGoogleReady' +
          (language ? '&language=' + encodeURIComponent(language) : '') +
          (region ? '&region=' + encodeURIComponent(region) : '');
        loadScript(src).catch(function (e) { googlePromise = null; reject(e); });
      });
    }
    return googlePromise;
  }

  /* ---------------------------------------------------------------- */
  /* Service géographique                                             */
  /* ---------------------------------------------------------------- */
  function Geo(settings) {
    var i = (settings && settings.integrations) || {};
    var g = (settings && settings.geo) || {};
    this.settings = settings || {};
    this.language = (settings && settings.language) || document.documentElement.lang || 'fr';
    this.countries = String(g.countries || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);
    var lat = num(g.lat, NaN), lng = num(g.lng, NaN);
    this.center = isFinite(lat) && isFinite(lng) ? { lat: lat, lng: lng } : null;
    this.backendUrl = String(i.backendUrl || '').replace(/\/+$/, '');
    this.shop = i.shop || '';
    this.googleKey = String(i.googleKey || '').trim();
    this.mapboxToken = String(i.mapboxToken || '').trim();
    this.estimateFallback = !!i.estimateFallback;
    this.roadFactor = num(i.roadFactor, 1.3) || 1.3;
    this.tilesUrl = i.tilesUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.tilesAttribution = i.tilesAttribution || '© OpenStreetMap';
    this.leafletJs = i.leafletJs; this.leafletCss = i.leafletCss;
    this.mapEnabled = i.mapEnabled !== false;
    this.warnings = [];

    var ac = i.autocomplete || 'photon';
    if (ac === 'google' && !this.googleKey) { this.warnings.push('Clé Google manquante : autocomplétion Photon utilisée.'); ac = 'photon'; }
    if (ac === 'mapbox' && !this.mapboxToken) { this.warnings.push('Jeton Mapbox manquant : autocomplétion Photon utilisée.'); ac = 'photon'; }
    this.autocompleteProvider = ac;

    var rt = i.routing || 'osrm';
    if (rt === 'backend' && !this.backendUrl) { this.warnings.push('URL du service de réservation manquante : itinéraire OSRM utilisé.'); rt = 'osrm'; }
    if (rt === 'google' && !this.googleKey) { this.warnings.push('Clé Google manquante : itinéraire OSRM utilisé.'); rt = 'osrm'; }
    if (rt === 'mapbox' && !this.mapboxToken) { this.warnings.push('Jeton Mapbox manquant : itinéraire OSRM utilisé.'); rt = 'osrm'; }
    this.routingProvider = rt;
    this.mapProvider = (ac === 'google' || rt === 'google') && this.googleKey ? 'google' : 'leaflet';
    this.warnings.forEach(function (w) { console.warn('[TAXI PRO] ' + w); });
    this.session = uuid();
  }

  Geo.prototype.canAutocomplete = function () { return this.autocompleteProvider !== 'none'; };

  /** Suggestions d'adresses : [{ id, main, secondary, label, lat?, lng? }] */
  Geo.prototype.suggest = async function (query, signal) {
    var q = String(query || '').trim();
    if (q.length < 3) return [];
    var p = this.autocompleteProvider;
    if (p === 'google') return this._googleSuggest(q);
    if (p === 'mapbox') return this._mapboxSuggest(q, signal);
    if (p === 'photon') return this._photonSuggest(q, signal);
    return [];
  };

  /** Coordonnées d'une suggestion : { lat, lng, label } */
  Geo.prototype.resolve = async function (s) {
    if (isFinite(s.lat) && isFinite(s.lng)) return { lat: s.lat, lng: s.lng, label: s.label };
    if (this.autocompleteProvider === 'google') {
      var place = s.raw.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      this._gToken = null; // fin de la session d'autocomplétion facturée
      return { lat: place.location.lat(), lng: place.location.lng(), label: s.label };
    }
    if (this.autocompleteProvider === 'mapbox') {
      var url = 'https://api.mapbox.com/search/searchbox/v1/retrieve/' + encodeURIComponent(s.id) +
        '?session_token=' + this.session + '&access_token=' + encodeURIComponent(this.mapboxToken);
      var data = await getJson(url);
      this.session = uuid();
      var f = data.features && data.features[0];
      if (!f) throw new Error('Adresse introuvable');
      return { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], label: s.label };
    }
    throw new Error('Adresse sans coordonnées');
  };

  /** Adresse lisible d'une position (bouton « Utiliser ma position »). */
  Geo.prototype.reverse = async function (lat, lng) {
    try {
      if (this.autocompleteProvider === 'google') {
        await loadGoogle(this.googleKey, this.language);
        var lib = await google.maps.importLibrary('geocoding');
        var r = await new lib.Geocoder().geocode({ location: { lat: lat, lng: lng } });
        if (r.results && r.results[0]) return r.results[0].formatted_address;
      } else if (this.autocompleteProvider === 'mapbox') {
        var d = await getJson('https://api.mapbox.com/search/geocode/v6/reverse?longitude=' + lng + '&latitude=' + lat +
          '&language=' + this.language + '&limit=1&access_token=' + encodeURIComponent(this.mapboxToken));
        if (d.features && d.features[0]) return d.features[0].properties.full_address || d.features[0].properties.name;
      } else if (this.autocompleteProvider === 'photon') {
        var p = await getJson('https://photon.komoot.io/reverse?lon=' + lng + '&lat=' + lat + this._photonLang());
        if (p.features && p.features[0]) return this._photonItem(p.features[0]).label;
      }
    } catch (e) { console.warn('[TAXI PRO] Géocodage inverse indisponible', e); }
    return lat.toFixed(5) + ', ' + lng.toFixed(5);
  };

  /** Itinéraire routier : { distanceKm, durationMin, geometry: [[lat, lng]…], provider, estimated } */
  Geo.prototype.route = async function (a, b, signal) {
    try {
      var p = this.routingProvider;
      if (p === 'backend') return await this._backendRoute(a, b, signal);
      if (p === 'google') return await this._googleRoute(a, b);
      if (p === 'mapbox') return await this._osrmLike('https://api.mapbox.com/directions/v5/mapbox/driving/', a, b,
        '&access_token=' + encodeURIComponent(this.mapboxToken), signal, 'mapbox');
      return await this._osrmLike('https://router.project-osrm.org/route/v1/driving/', a, b, '', signal, 'osrm');
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      if (this.estimateFallback) return this.estimate(a, b);
      throw e;
    }
  };

  /** Estimation à vol d'oiseau × coefficient routier (signalée comme estimation). */
  Geo.prototype.estimate = function (a, b) {
    var km = haversineKm(a, b) * this.roadFactor;
    return { distanceKm: Math.round(km * 10) / 10, durationMin: Math.round(km / 45 * 60 + 4), geometry: [[a.lat, a.lng], [b.lat, b.lng]], provider: 'estimate', estimated: true };
  };

  /* ---------- Google ---------- */
  Geo.prototype._googleSuggest = async function (q) {
    await loadGoogle(this.googleKey, this.language);
    var lib = await google.maps.importLibrary('places');
    if (!this._gToken) this._gToken = new lib.AutocompleteSessionToken();
    var req = { input: q, sessionToken: this._gToken, language: this.language };
    if (this.countries.length) req.includedRegionCodes = this.countries.slice(0, 15);
    if (this.center) req.locationBias = { center: this.center, radius: 50000 };
    var res = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
    return (res.suggestions || []).filter(function (s) { return s.placePrediction; }).map(function (s) {
      var p = s.placePrediction;
      return {
        id: p.placeId, raw: p, label: p.text.text,
        main: p.mainText ? p.mainText.text : p.text.text,
        secondary: p.secondaryText ? p.secondaryText.text : ''
      };
    });
  };
  Geo.prototype._googleRoute = async function (a, b) {
    await loadGoogle(this.googleKey, this.language);
    var lib = await google.maps.importLibrary('routes');
    var res = await new lib.DirectionsService().route({ origin: a, destination: b, travelMode: 'DRIVING' });
    var r = res.routes[0], leg = r.legs[0];
    return {
      distanceKm: Math.round(leg.distance.value / 100) / 10,
      durationMin: Math.round(leg.duration.value / 60),
      geometry: (r.overview_path || []).map(function (p) { return [p.lat(), p.lng()]; }),
      provider: 'google', estimated: false
    };
  };

  /* ---------- Mapbox ---------- */
  Geo.prototype._mapboxSuggest = async function (q, signal) {
    var url = 'https://api.mapbox.com/search/searchbox/v1/suggest?q=' + encodeURIComponent(q) +
      '&limit=6&language=' + encodeURIComponent(this.language) + '&session_token=' + this.session +
      '&types=address,poi,place,street,locality' +
      (this.countries.length ? '&country=' + this.countries.join(',') : '') +
      (this.center ? '&proximity=' + this.center.lng + ',' + this.center.lat : '') +
      '&access_token=' + encodeURIComponent(this.mapboxToken);
    var data = await getJson(url, null, signal);
    return (data.suggestions || []).map(function (s) {
      var secondary = s.full_address && s.full_address !== s.name ? s.full_address : (s.place_formatted || '');
      return { id: s.mapbox_id, main: s.name, secondary: secondary, label: secondary ? s.name + ', ' + (s.place_formatted || secondary) : s.name };
    });
  };

  /* ---------- Photon (OpenStreetMap) ---------- */
  Geo.prototype._photonLang = function () {
    return ['de', 'en', 'fr', 'it'].indexOf(this.language) > -1 ? '&lang=' + this.language : '';
  };
  Geo.prototype._photonItem = function (f) {
    var p = f.properties || {};
    var street = [p.street, p.housenumber].filter(Boolean).join(' ');
    var main = p.name && p.name !== p.street ? p.name : (street || p.city || '');
    var place = [p.postcode, p.city || p.town || p.village || p.district].filter(Boolean).join(' ');
    var secondary = [p.name && street && p.name.indexOf(p.street) < 0 ? street : '', place, p.country].filter(Boolean).join(', ');
    return {
      id: (p.osm_type || '') + (p.osm_id || Math.random()),
      main: main, secondary: secondary, label: [main, secondary].filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], countrycode: String(p.countrycode || '').toLowerCase()
    };
  };
  Geo.prototype._photonSuggest = async function (q, signal) {
    var url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(q) + '&limit=10' + this._photonLang() +
      (this.center ? '&lat=' + this.center.lat + '&lon=' + this.center.lng : '');
    var data = await getJson(url, null, signal);
    var self = this, seen = {};
    return (data.features || []).map(function (f) { return self._photonItem(f); }).filter(function (s) {
      if (self.countries.length && s.countrycode && self.countries.indexOf(s.countrycode) < 0) return false;
      if (!s.main || seen[s.label]) return false;
      seen[s.label] = true; return true;
    }).slice(0, 6);
  };

  /* ---------- OSRM / Mapbox Directions (format identique) ---------- */
  Geo.prototype._osrmLike = async function (base, a, b, extra, signal, provider) {
    var url = base + a.lng + ',' + a.lat + ';' + b.lng + ',' + b.lat + '?overview=full&geometries=geojson' + extra;
    var data = await getJson(url, null, signal);
    var r = data.routes && data.routes[0];
    if (!r) throw new Error('Aucun itinéraire');
    return {
      distanceKm: Math.round(r.distance / 100) / 10,
      durationMin: Math.round(r.duration / 60),
      geometry: (r.geometry && r.geometry.coordinates || []).map(function (c) { return [c[1], c[0]]; }),
      provider: provider, estimated: false
    };
  };

  /* ---------- Backend ---------- */
  Geo.prototype._backendRoute = async function (a, b, signal) {
    var data = await getJson(this.backendUrl + '/api/route', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop: this.shop, from: { lat: a.lat, lng: a.lng }, to: { lat: b.lat, lng: b.lng } })
    }, signal);
    return {
      distanceKm: data.distanceKm, durationMin: data.durationMin, geometry: data.geometry || [],
      provider: 'backend:' + (data.provider || ''), estimated: !!data.estimated
    };
  };

  /* ---------------------------------------------------------------- */
  /* Carte du trajet                                                  */
  /* ---------------------------------------------------------------- */
  function RouteMap(container, geo) {
    this.el = container; this.geo = geo; this.map = null; this.layers = [];
  }
  RouteMap.prototype.ready = async function () {
    if (this.map) return;
    if (this.geo.mapProvider === 'google') {
      await loadGoogle(this.geo.googleKey, this.geo.language);
      var maps = await google.maps.importLibrary('maps');
      this.map = new maps.Map(this.el, { center: this.geo.center || { lat: 50.85, lng: 4.35 }, zoom: 11, disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative' });
      return;
    }
    if (this.geo.leafletCss) loadCss(this.geo.leafletCss);
    await loadScript(this.geo.leafletJs);
    this.map = L.map(this.el, { zoomControl: true, scrollWheelZoom: false, attributionControl: true })
      .setView(this.geo.center ? [this.geo.center.lat, this.geo.center.lng] : [50.85, 4.35], 10);
    L.tileLayer(this.geo.tilesUrl, { maxZoom: 19, attribution: this.geo.tilesAttribution }).addTo(this.map);
  };
  RouteMap.prototype.show = async function (from, to, geometry, color) {
    try { await this.ready(); } catch (e) { console.warn('[TAXI PRO] Carte indisponible', e); this.el.hidden = true; return; }
    var pts = [];
    if (from) pts.push([from.lat, from.lng]);
    if (to) pts.push([to.lat, to.lng]);
    var line = geometry && geometry.length > 1 ? geometry : pts;
    color = color || '#c8a35a';
    if (this.geo.mapProvider === 'google') {
      this.layers.forEach(function (l) { l.setMap(null); });
      this.layers = [];
      var map = this.map, bounds = new google.maps.LatLngBounds();
      if (line.length > 1) this.layers.push(new google.maps.Polyline({ map: map, path: line.map(function (p) { return { lat: p[0], lng: p[1] }; }), strokeColor: color, strokeWeight: 5, strokeOpacity: .9 }));
      pts.forEach(function (p, i) {
        this.layers.push(new google.maps.Circle({ map: map, center: { lat: p[0], lng: p[1] }, radius: 60, strokeColor: '#111', strokeWeight: 2, fillColor: i ? color : '#ffffff', fillOpacity: 1 }));
        bounds.extend({ lat: p[0], lng: p[1] });
      }, this);
      line.forEach(function (p) { bounds.extend({ lat: p[0], lng: p[1] }); });
      if (pts.length > 1) map.fitBounds(bounds, 40); else if (pts.length) { map.setCenter({ lat: pts[0][0], lng: pts[0][1] }); map.setZoom(14); }
      return;
    }
    var m = this.map;
    this.layers.forEach(function (l) { m.removeLayer(l); });
    this.layers = [];
    if (line.length > 1) this.layers.push(L.polyline(line, { color: color, weight: 5, opacity: .9 }).addTo(m));
    pts.forEach(function (p, i) {
      this.layers.push(L.circleMarker(p, { radius: 8, color: '#111', weight: 2, fillColor: i ? color : '#ffffff', fillOpacity: 1 }).addTo(m));
    }, this);
    setTimeout(function () { m.invalidateSize(); }, 50);
    var all = line.concat(pts);
    if (all.length > 1) m.fitBounds(L.latLngBounds(all), { padding: [30, 30] });
    else if (pts.length) m.setView(pts[0], 14);
  };

  window.TaxiProGeo = { Geo: Geo, RouteMap: RouteMap, haversineKm: haversineKm, loadScript: loadScript };
})();
