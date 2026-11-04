// Tests du moteur de tarification — node --test taxi-pro/tests
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const P = require('../theme/assets/tp-pricing.js');
const RAW = JSON.parse(readFileSync(new URL('./fixtures/config.json', import.meta.url)));
const clone = () => JSON.parse(JSON.stringify(RAW));
const NOW = new Date('2026-11-04T10:00:00Z'); // mercredi 4 novembre 2026, 11:00 à Bruxelles

const PTS = {
  ixelles: { lat: 50.827, lng: 4.36, label: 'Ixelles' },
  uccle: { lat: 50.8, lng: 4.34, label: 'Uccle' },
  grandPlace: { lat: 50.8467, lng: 4.3525, label: 'Grand-Place' },
  bru: { lat: 50.901, lng: 4.4844, label: 'Brussels Airport' },
  crl: { lat: 50.4592, lng: 4.4538, label: 'Charleroi Airport' },
  midi: { lat: 50.8357, lng: 4.336, label: 'Gare du Midi' },
  leuven: { lat: 50.8798, lng: 4.7005, label: 'Leuven' },
  lux: { lat: 49.6116, lng: 6.1319, label: 'Luxembourg' },
  lux2: { lat: 49.62, lng: 6.14, label: 'Luxembourg Kirchberg' },
  paris: { lat: 48.8566, lng: 2.3522, label: 'Paris' }
};

function q(extra = {}, raw = RAW) {
  return P.quote(raw, {
    serviceId: 'taxi', vehicleId: 'berline', pickup: PTS.ixelles, dropoff: PTS.uccle,
    route: { distanceKm: 10, durationMin: 20 }, datetime: '2026-11-10T14:00', passengers: 1, luggage: 0,
    ...extra
  }, { now: NOW });
}
const line = (r, code) => r.lines.find(l => l.code === code);

test('conversion des montants saisis', () => {
  assert.equal(P.num('2,15'), 2.15);
  assert.equal(P.num('1.234,50 €'), 1234.5);
  assert.equal(P.num('1,234.50'), 1234.5);
  assert.equal(P.num(' 0.30 '), 0.3);
  assert.equal(P.num('', 7), 7);
  assert.equal(P.num('abc', null), null);
});

test('tarif compteur : prise en charge + km × prix', () => {
  const r = q();
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(line(r, 'base').amount, 5);
  assert.equal(line(r, 'distance').amount, 20);
  assert.equal(r.total, 25);
  assert.equal(r.basis, 'meter');
});

test('prix à la minute activable', () => {
  const raw = clone(); raw.settings.tariff.perMinEnabled = true;
  const r = q({}, raw);
  assert.equal(line(r, 'time').amount, 6);
  assert.equal(r.total, 31);
});

test('minimum de facturation', () => {
  const r = q({ route: { distanceKm: 2, durationMin: 6 } });
  assert.equal(line(r, 'minimum').amount, 3);
  assert.equal(r.total, 12);
});

test('supplément de nuit, y compris après minuit', () => {
  assert.equal(q({ datetime: '2026-11-10T23:00' }).total, 30);
  assert.equal(q({ datetime: '2026-11-12T05:59' }).lines.some(l => l.code === 'night'), true);
  assert.equal(q({ datetime: '2026-11-10T06:00' }).total, 25);
});

test('dimanche, et combinaison des majorations (plus forte, cumul, priorité)', () => {
  assert.equal(q({ datetime: '2026-11-15T14:00' }).total, 28.8); // 28,75 arrondi au 0,10
  assert.equal(q({ datetime: '2026-11-14T14:00' }).total, 25); // samedi non majoré dans cette config
  assert.equal(q({ datetime: '2026-11-15T23:00' }).total, 30); // max : nuit 20 % > dimanche 15 %
  const sum = clone(); sum.settings.surcharges.combine = 'sum';
  assert.equal(q({ datetime: '2026-11-15T23:00' }, sum).total, 33.8);
  const prio = clone(); prio.settings.surcharges.combine = 'priority';
  assert.equal(q({ datetime: '2026-11-15T23:00' }, prio).total, 28.8); // le week-end (priorité 20) l'emporte
});

test('jours fériés fixes et mobiles (Pâques)', () => {
  assert.equal(q({ datetime: '2026-11-11T14:00' }).total, 31.3);
  assert.equal(P.isHoliday(Date.UTC(2026, 3, 6), ['easter+1']), true); // lundi de Pâques 2026
  assert.equal(P.isHoliday(Date.UTC(2027, 2, 29), ['easter+1']), true); // lundi de Pâques 2027
  assert.equal(P.isHoliday(Date.UTC(2027, 4, 6), ['easter+39']), true); // Ascension 2027
  assert.equal(P.isHoliday(Date.UTC(2026, 10, 12), ['11-11']), false);
});

test('plages horaires personnalisées : heures de pointe et réveillon', () => {
  assert.equal(q({ datetime: '2026-11-10T08:00' }).total, 27.5);
  const r = q({ datetime: '2026-12-31T21:00' });
  assert.equal(r.total, 37.5);
  assert.ok(r.rules.includes('time:reveillon'));
});

test('forfait de trajet : prix fixe, sens inverse, prix par véhicule et coefficient', () => {
  const r = q({ dropoff: PTS.bru, route: { distanceKm: 14, durationMin: 25 } });
  assert.equal(r.basis, 'route');
  assert.equal(r.total, 45);
  assert.equal(line(r, 'airport'), undefined); // forfait sans suppléments
  assert.equal(q({ pickup: PTS.bru, dropoff: PTS.ixelles, route: { distanceKm: 14, durationMin: 25 } }).total, 45);
  assert.equal(q({ vehicleId: 'van', dropoff: PTS.bru, route: { distanceKm: 14 } }).total, 65);
  assert.equal(q({ vehicleId: 'break', dropoff: PTS.bru, route: { distanceKm: 14 } }).total, 49.5);
  // Forfait sans majoration horaire, même la nuit
  assert.equal(q({ dropoff: PTS.bru, route: { distanceKm: 14 }, datetime: '2026-11-10T23:30' }).total, 45);
});

test('priorité entre forfaits concurrents', () => {
  const r = q({ pickup: PTS.midi, dropoff: PTS.bru, route: { distanceKm: 15 } });
  assert.equal(r.total, 40);
  assert.ok(r.rules.includes('route:midi-bru'));
  // Le forfait Midi → aéroport n'est pas réversible : le forfait Bruxelles s'applique au retour
  assert.equal(q({ pickup: PTS.bru, dropoff: PTS.midi, route: { distanceKm: 15 } }).total, 45);
});

test('forfait avec suppléments : nuit + aéroport', () => {
  const r = q({ dropoff: PTS.crl, route: { distanceKm: 55 }, datetime: '2026-11-10T23:00' });
  assert.equal(r.total, 85 + 17 + 12);
});

test('supplément aéroport (global ou propre à la zone) et supplément gare', () => {
  assert.equal(q({ pickup: PTS.leuven, dropoff: PTS.bru, route: { distanceKm: 20 } }).total, 55);
  assert.equal(q({ pickup: PTS.leuven, dropoff: PTS.crl, route: { distanceKm: 70 } }).total, 157);
  assert.equal(q({ pickup: PTS.midi, dropoff: PTS.leuven, route: { distanceKm: 30 } }).total, 68);
  assert.equal(q({ pickup: PTS.leuven, dropoff: PTS.midi, route: { distanceKm: 30 } }).total, 65); // gare : départ uniquement
});

test('forfait « toute adresse » vers une zone, avec péages', () => {
  const r = q({ pickup: PTS.leuven, dropoff: PTS.lux, route: { distanceKm: 200 } });
  assert.equal(r.total, 394.5);
  assert.equal(line(r, 'tolls').amount, 4.5);
});

test('zone tarifaire : tarif propre à la zone', () => {
  const raw = clone(); raw.routes = []; raw.settings.geo.radiusKm = '0';
  const r = q({ pickup: PTS.lux, dropoff: PTS.lux2, route: { distanceKm: 5 } }, raw);
  assert.equal(r.total, 19); // 6 + 5 × 2,60
  assert.ok(r.rules.includes('zone:lux'));
});

test('zone interdite et zone d’intervention', () => {
  const forb = q({ pickup: PTS.grandPlace });
  assert.equal(forb.ok, false);
  assert.ok(forb.errors.some(e => e.code === 'FORBIDDEN_ZONE'));
  const far = q({ pickup: { lat: 48.85, lng: 2.35 }, dropoff: PTS.paris, route: { distanceKm: 8 } });
  assert.equal(far.ok, true);
  assert.equal(far.onRequest, true);
  assert.equal(far.total, null);
  const block = clone(); block.settings.geo.outOfArea = 'block';
  assert.ok(q({ pickup: { lat: 48.85, lng: 2.35 }, dropoff: PTS.paris, route: { distanceKm: 8 } }, block).errors.some(e => e.code === 'OUT_OF_AREA'));
  // Départ dans la zone, arrivée hors zone : accepté avec la règle « départ ou arrivée »
  assert.equal(q({ dropoff: PTS.paris, route: { distanceKm: 310 } }).onRequest, false);
});

test('distance maximale : devis', () => {
  const r = q({ dropoff: PTS.paris, route: { distanceKm: 900 } });
  assert.equal(r.onRequest, true);
  assert.ok(r.warnings.some(w => w.code === 'MAX_DISTANCE_QUOTE'));
});

test('capacité des véhicules, passagers et bagages supplémentaires', () => {
  assert.ok(q({ passengers: 6 }).errors.some(e => e.code === 'VEHICLE_CAPACITY'));
  const van = q({ vehicleId: 'van', passengers: 6 });
  assert.equal(van.ok, true);
  assert.equal(van.total, 45); // 25 × 1,4 + 2 passagers × 5
  const brk = q({ vehicleId: 'break', luggage: 5 });
  assert.equal(brk.total, 31.5); // 25 × 1,1 + 2 bagages × 2
  assert.ok(q({ luggage: 5 }).errors.some(e => e.code === 'VEHICLE_LUGGAGE'));
  assert.ok(q({ vehicleId: 'van', passengers: 9 }).errors.some(e => e.code === 'MAX_PASSENGERS'));
});

test('véhicule à tarif propre et minimum propre', () => {
  assert.equal(q({ vehicleId: 'luxe' }).total, 40);
  assert.equal(q({ vehicleId: 'luxe', route: { distanceKm: 3 } }).total, 25);
});

test('options : fixe, à l’unité, pourcentage, gratuite ; restrictions', () => {
  const r = q({ options: { 'siege-bebe': 1, rehausseur: 2, premium: 1, eau: 1 } });
  assert.equal(r.ok, true);
  assert.equal(r.total, 47.5);
  assert.equal(r.options.length, 4);
  assert.ok(q({ options: { pancarte: 1 } }).errors.some(e => e.code === 'OPTION_UNKNOWN'));
  assert.equal(q({ serviceId: 'aeroport', options: { pancarte: 1 } }).ok, true);
  assert.ok(q({ options: { rehausseur: 3 } }).errors.some(e => e.code === 'OPTION_QTY'));
  assert.ok(q({ options: { inexistante: 1 } }).errors.some(e => e.code === 'OPTION_UNKNOWN'));
});

test('aller-retour : chaque trajet à sa propre heure, remise', () => {
  const r = q({ roundTrip: true, returnDatetime: '2026-11-10T23:00' });
  assert.equal(r.legs.length, 2);
  assert.equal(r.legs[0].subtotal, 25);
  assert.equal(r.legs[1].subtotal, 30);
  assert.equal(line(r, 'round-trip-discount').amount, -5.5);
  assert.equal(r.total, 49.5);
  assert.ok(q({ roundTrip: true, returnDatetime: '2026-11-10T13:00' }).errors.some(e => e.code === 'RETURN_BEFORE'));
  assert.ok(q({ roundTrip: true }).errors.some(e => e.code === 'RETURN_REQUIRED'));
});

test('attente facturée au-delà des minutes offertes', () => {
  const r = q({ waitingMin: 20 });
  assert.equal(line(r, 'waiting').amount, 7.5);
  assert.equal(r.total, 32.5);
});

test('délais de réservation et horaires', () => {
  assert.ok(q({ datetime: '2026-11-04T11:30' }).errors.some(e => e.code === 'LEAD_TIME'));
  assert.equal(q({ datetime: '2026-11-04T12:30' }).ok, true);
  assert.ok(q({ datetime: '2027-06-01T12:00' }).errors.some(e => e.code === 'TOO_FAR'));
  assert.ok(q({ datetime: '2026-02-30T12:00' }).errors.some(e => e.code === 'DATETIME_INVALID'));
  assert.ok(q({ datetime: '' }).errors.some(e => e.code === 'DATETIME_REQUIRED'));
  const raw = clone();
  raw.settings.booking.hours = { always: false, tue: '06:00-12:00, 14:00-02:00', wed: '' };
  assert.ok(q({ datetime: '2026-11-10T13:00' }, raw).errors.some(e => e.code === 'CLOSED'));
  assert.equal(q({ datetime: '2026-11-10T15:00' }, raw).ok, true);
  assert.equal(q({ datetime: '2026-11-11T01:00' }, raw).ok, true); // suite de la plage du mardi
  assert.ok(q({ datetime: '2026-11-11T03:00' }, raw).errors.some(e => e.code === 'CLOSED'));
});

test('réservation immédiate au fuseau de l’entreprise', () => {
  const r = P.quote(RAW, {
    serviceId: 'taxi', vehicleId: 'berline', pickup: PTS.ixelles, dropoff: PTS.uccle,
    route: { distanceKm: 10 }, immediate: true, passengers: 1
  }, { now: new Date('2026-11-04T21:30:00Z') });
  assert.equal(r.datetime, '2026-11-04T22:30');
  assert.equal(r.total, 30);
  const off = clone(); off.settings.booking.immediate = false;
  assert.ok(P.quote(off, { vehicleId: 'berline', pickup: PTS.ixelles, dropoff: PTS.uccle, route: { distanceKm: 10 }, immediate: true }, { now: NOW })
    .errors.some(e => e.code === 'IMMEDIATE_DISABLED'));
  assert.equal(P.toLocalString(P.nowLocal(new Date('2026-07-01T12:00:00Z'), 'Europe/Brussels')), '2026-07-01T14:00');
});

test('mise à disposition à l’heure', () => {
  const base = { serviceId: 'mise-a-disposition', dropoff: null, route: null };
  assert.equal(q({ ...base, hours: 3 }).total, 135);
  assert.equal(q({ ...base, hours: 1 }).total, 90); // minimum 2 h
  assert.equal(q({ ...base, hours: 3, vehicleId: 'van' }).total, 180); // taux horaire propre au van
  assert.ok(q({ ...base }).errors.some(e => e.code === 'HOURS_REQUIRED'));
});

test('prestation à prix fixe et prestation sur devis', () => {
  assert.equal(q({ serviceId: 'forfait-mariage', vehicleId: 'van' }).total, 350);
  const d = q({ serviceId: 'sur-mesure' });
  assert.equal(d.onRequest, true);
  assert.equal(d.total, null);
  assert.equal(d.ok, true);
});

test('coefficient de prestation', () => {
  assert.equal(q({ serviceId: 'evenement' }).total, 30);
});

test('arrondi, acompte et TVA incluse', () => {
  const r = q();
  assert.equal(r.deposit, 7.5);
  assert.equal(r.balance, 17.5);
  assert.equal(r.vat, 1.42);
  const up = clone(); up.settings.tariff.rounding = '1'; up.settings.tariff.roundingMode = 'up';
  const u = q({ route: { distanceKm: 10.1 } }, up);
  assert.equal(u.subtotal, 25.2);
  assert.equal(u.total, 26);
  assert.equal(line(u, 'rounding').amount, 0.8);
});

test('éléments désactivés ou inconnus', () => {
  const all = P.quoteVehicles(RAW, { serviceId: 'taxi', pickup: PTS.ixelles, dropoff: PTS.uccle, route: { distanceKm: 10 }, datetime: '2026-11-10T14:00', passengers: 6 }, { now: NOW });
  assert.deepEqual(all.map(x => x.vehicle.id), ['berline', 'break', 'van', 'luxe']);
  assert.deepEqual(all.filter(x => x.fits).map(x => x.vehicle.id), ['van']);
  assert.ok(q({ vehicleId: 'limousine' }).errors.some(e => e.code === 'VEHICLE_UNKNOWN'));
  assert.ok(q({ serviceId: 'inactif' }).errors.some(e => e.code === 'SERVICE_UNKNOWN'));
  assert.ok(q({ vehicleId: '' }).errors.some(e => e.code === 'VEHICLE_REQUIRED'));
});

test('adresses ou distance manquantes : pas de prix inventé', () => {
  const r = q({ route: {} });
  assert.equal(r.total, null);
  assert.ok(r.errors.some(e => e.code === 'DISTANCE_UNAVAILABLE'));
  assert.equal(q({ dropoff: null }).total, null);
});

test('comparaison de prix au centime', () => {
  assert.equal(P.samePrice(25, '25.00'), true);
  assert.equal(P.samePrice(25, 25.01), false);
  assert.equal(P.samePrice(null, null), true);
});

test('formatage monétaire selon la langue', () => {
  const cfg = P.normalizeConfig(RAW);
  assert.match(P.formatMoney(1234.5, cfg), /1.?234,50.€/);
});

test('détection des trajets aéroport, même sous forfait (affichage du numéro de vol)', () => {
  const r = q({ dropoff: PTS.bru, route: { distanceKm: 14 } });
  assert.equal(r.basis, 'route');
  assert.equal(line(r, 'airport'), undefined);
  assert.equal(r.airport, true);
  assert.equal(q().airport, false);
});
