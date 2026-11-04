// Calcul d'itinéraire côté serveur (clé secrète jamais exposée au navigateur).
// Fournisseurs : google (Routes API), mapbox (Directions), osrm (serveur auto-hébergé ou démonstration),
// estimate (vol d'oiseau × coefficient, signalé comme estimation). Résultats mis en cache.
import { decodePolyline } from './util.js';

const cache = new Map();
const TTL = 30 * 60 * 1000;

function haversineKm(a, b) {
  const R = 6371.0088, r = Math.PI / 180;
  const x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
export function validPoint(p) {
  return p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}
const key = (a, b, provider) => `${provider}|${(+a.lat).toFixed(5)},${(+a.lng).toFixed(5)}|${(+b.lat).toFixed(5)},${(+b.lng).toFixed(5)}`;

export function estimateRoute(a, b, roadFactor = 1.3) {
  const km = haversineKm(a, b) * roadFactor;
  return { distanceKm: Math.round(km * 10) / 10, durationMin: Math.round(km / 45 * 60 + 4), geometry: [[a.lat, a.lng], [b.lat, b.lng]], provider: 'estimate', estimated: true };
}

async function google(a, b, cfg, fetchImpl) {
  const res = await fetchImpl('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 'X-Goog-Api-Key': cfg.apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline'
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } },
      destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } },
      travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE', polylineEncoding: 'ENCODED_POLYLINE'
    })
  });
  if (!res.ok) throw new Error(`Google Routes ${res.status}`);
  const data = await res.json();
  const r = data.routes && data.routes[0];
  if (!r) throw new Error('Aucun itinéraire');
  return {
    distanceKm: Math.round(r.distanceMeters / 100) / 10,
    durationMin: Math.round(parseInt(String(r.duration).replace('s', ''), 10) / 60),
    geometry: r.polyline && r.polyline.encodedPolyline ? decodePolyline(r.polyline.encodedPolyline) : [],
    provider: 'google', estimated: false
  };
}

async function osrmLike(base, a, b, extra, fetchImpl, provider) {
  const res = await fetchImpl(`${base}${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson${extra}`);
  if (!res.ok) throw new Error(`${provider} ${res.status}`);
  const data = await res.json();
  const r = data.routes && data.routes[0];
  if (!r) throw new Error('Aucun itinéraire');
  return {
    distanceKm: Math.round(r.distance / 100) / 10,
    durationMin: Math.round(r.duration / 60),
    geometry: (r.geometry && r.geometry.coordinates || []).map((c) => [c[1], c[0]]),
    provider, estimated: false
  };
}

/** Itinéraire routier entre deux points, avec le fournisseur configuré pour le client. */
export async function computeRoute(a, b, cfg = {}, fetchImpl = fetch) {
  if (!validPoint(a) || !validPoint(b)) throw new Error('Coordonnées invalides');
  const provider = cfg.provider || 'osrm';
  const k = key(a, b, provider);
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < TTL) return hit.route;
  let route;
  try {
    if (provider === 'google') route = await google(a, b, cfg, fetchImpl);
    else if (provider === 'mapbox') route = await osrmLike('https://api.mapbox.com/directions/v5/mapbox/driving/', a, b, `&access_token=${encodeURIComponent(cfg.apiKey)}`, fetchImpl, 'mapbox');
    else if (provider === 'estimate') route = estimateRoute(a, b, cfg.roadFactor);
    else route = await osrmLike((cfg.osrmUrl || 'https://router.project-osrm.org').replace(/\/+$/, '') + '/route/v1/driving/', a, b, '', fetchImpl, 'osrm');
  } catch (e) {
    if (cfg.estimateFallback) route = estimateRoute(a, b, cfg.roadFactor);
    else throw e;
  }
  cache.set(k, { route, at: Date.now() });
  if (cache.size > 5000) cache.delete(cache.keys().next().value);
  return route;
}

export function clearRouteCache() { cache.clear(); }
