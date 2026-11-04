// Fichiers iCalendar (.ics) : ajout d'une course à l'agenda du client, flux d'agenda de l'entreprise.
import { parseLocal } from './pricing.js';

/** Convertit une heure locale naïve (AAAA-MM-JJTHH:MM) du fuseau donné en instant UTC. */
export function localToUtc(localStr, timeZone) {
  const naive = parseLocal(localStr);
  if (naive === null) return null;
  const offsetAt = (t) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(t));
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - t;
  };
  let utc = naive - offsetAt(naive);
  utc = naive - offsetAt(utc);
  return new Date(utc);
}

const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
const fold = (line) => {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
};

export function bookingEvent(booking, { company = {}, timeZone = 'Europe/Brussels', domain = 'taxipro' } = {}) {
  const start = localToUtc(booking.quote.datetime || booking.request.datetime, timeZone);
  if (!start) return [];
  const minutes = Math.max(30, Math.round((booking.quote.durationMin || 0) + 15)) || 60;
  const end = new Date(start.getTime() + minutes * 60000);
  const lines = [
    'BEGIN:VEVENT',
    `UID:${booking.id}@${domain}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${company.name || 'Taxi'} · ${booking.ref}`)}`,
    `LOCATION:${esc(booking.request.pickup && booking.request.pickup.label)}`,
    `DESCRIPTION:${esc([
      booking.request.pickup && booking.request.pickup.label,
      booking.request.dropoff ? `→ ${booking.request.dropoff.label}` : '',
      company.phone ? `${company.phone}` : ''
    ].filter(Boolean).join('\n'))}`,
    `STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : booking.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE'}`,
    'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', `DESCRIPTION:${esc(booking.ref)}`, 'END:VALARM',
    'END:VEVENT'
  ];
  if (booking.quote.roundTrip && booking.quote.returnDatetime) {
    const rs = localToUtc(booking.quote.returnDatetime, timeZone);
    if (rs) lines.push('BEGIN:VEVENT', `UID:${booking.id}-retour@${domain}`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(rs)}`,
      `DTEND:${stamp(new Date(rs.getTime() + minutes * 60000))}`, `SUMMARY:${esc(`${company.name || 'Taxi'} · ${booking.ref} (retour)`)}`,
      `LOCATION:${esc(booking.request.dropoff && booking.request.dropoff.label)}`, 'END:VEVENT');
  }
  return lines;
}

export function calendar(events, name = 'Taxi Pro') {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TAXI PRO//Reservations//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`, ...events.flat(), 'END:VCALENDAR']
    .map(fold).join('\r\n') + '\r\n';
}
