// Envoi des e-mails par API HTTP (Resend, Postmark, SendGrid, Brevo) ou en mode développement
// (« console » : journal ; « memory » : conservés en mémoire pour les tests ; « file » : fichiers HTML).
// Les modèles reprennent le logo, le nom et les couleurs publiés par le thème.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as h, log } from './util.js';
import { texts } from './i18n.js';
import { formatMoney, normalizeConfig } from './pricing.js';

export const outbox = []; // fournisseur « memory »

const fill = (t, p) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => (p[k] !== undefined && p[k] !== null ? p[k] : ''));

export async function sendEmail(tenant, msg, { fetchImpl = fetch, dataDir = 'data' } = {}) {
  const e = tenant.email || {};
  const from = e.from || 'TAXI PRO <no-reply@example.com>';
  const fromMatch = /^(.*)<(.+)>$/.exec(from);
  const fromName = fromMatch ? fromMatch[1].trim() : '';
  const fromEmail = fromMatch ? fromMatch[2].trim() : from;
  const to = [].concat(msg.to).filter(Boolean);
  if (!to.length) return { skipped: true };
  const attachments = msg.attachments || [];
  const post = async (url, headers, body) => {
    const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${e.provider} ${res.status} ${await res.text().catch(() => '')}`.slice(0, 300));
    return { sent: true };
  };
  switch (e.provider) {
    case 'resend':
      return post('https://api.resend.com/emails', { Authorization: `Bearer ${e.apiKey}` }, {
        from, to, subject: msg.subject, html: msg.html, text: msg.text, reply_to: e.replyTo || undefined,
        attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') }))
      });
    case 'postmark':
      return post('https://api.postmarkapp.com/email', { 'X-Postmark-Server-Token': e.apiKey, Accept: 'application/json' }, {
        From: from, To: to.join(','), Subject: msg.subject, HtmlBody: msg.html, TextBody: msg.text, ReplyTo: e.replyTo || undefined, MessageStream: 'outbound',
        Attachments: attachments.map((a) => ({ Name: a.filename, Content: Buffer.from(a.content).toString('base64'), ContentType: a.contentType }))
      });
    case 'sendgrid':
      return post('https://api.sendgrid.com/v3/mail/send', { Authorization: `Bearer ${e.apiKey}` }, {
        personalizations: [{ to: to.map((email) => ({ email })) }], from: { email: fromEmail, name: fromName || undefined },
        reply_to: e.replyTo ? { email: e.replyTo } : undefined, subject: msg.subject,
        content: [{ type: 'text/plain', value: msg.text }, { type: 'text/html', value: msg.html }],
        attachments: attachments.length ? attachments.map((a) => ({ content: Buffer.from(a.content).toString('base64'), filename: a.filename, type: a.contentType })) : undefined
      });
    case 'brevo':
      return post('https://api.brevo.com/v3/smtp/email', { 'api-key': e.apiKey, Accept: 'application/json' }, {
        sender: { email: fromEmail, name: fromName || undefined }, to: to.map((email) => ({ email })), subject: msg.subject,
        htmlContent: msg.html, textContent: msg.text, replyTo: e.replyTo ? { email: e.replyTo } : undefined,
        attachment: attachments.length ? attachments.map((a) => ({ name: a.filename, content: Buffer.from(a.content).toString('base64') })) : undefined
      });
    case 'memory':
      outbox.push({ tenant: tenant.id, ...msg, to });
      return { sent: true };
    case 'file': {
      const dir = join(dataDir, tenant.id, 'outbox');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${Date.now()}-${msg.event || 'email'}.html`), `<!-- To: ${to.join(', ')} | ${msg.subject} -->\n${msg.html}`);
      return { sent: true };
    }
    default:
      log('info', 'e-mail (mode console)', { tenant: tenant.id, to: to.join(','), subject: msg.subject });
      return { sent: true, console: true };
  }
}

/** Lignes de détail d'une réservation, dans la langue du client. */
export function bookingDetails(booking, raw, T) {
  const cfg = normalizeConfig(raw);
  const q = booking.quote, r = booking.request;
  const service = cfg.services.find((s) => s.id === q.serviceId);
  const vehicle = cfg.vehicles.find((v) => v.id === q.vehicleId);
  const date = (s) => {
    if (!s) return '';
    try { return new Intl.DateTimeFormat(cfg.locale, { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(`${s}:00Z`)); } catch (e) { return s.replace('T', ' '); }
  };
  const rows = [[T.ref, booking.ref]];
  if (service) rows.push([T.service, service.name]);
  rows.push([T.from, r.pickup && r.pickup.label]);
  if (r.dropoff) rows.push([T.to, r.dropoff.label]);
  rows.push([T.when, r.immediate ? `${T.asap} (${date(q.datetime)})` : date(q.datetime)]);
  if (q.roundTrip) rows.push([T.return, date(q.returnDatetime)]);
  if (r.hours) rows.push([T.hours, `${r.hours} h`]);
  if (q.distanceKm) rows.push([T.distance, `${q.distanceKm} km · ${Math.round(q.durationMin || 0)} min`]);
  if (vehicle) rows.push([T.vehicle, vehicle.name]);
  rows.push([T.passengers, `${q.passengers} / ${q.luggage}`]);
  if (q.options && q.options.length) rows.push([T.options, q.options.map((o) => `${o.name}${o.qty > 1 ? ` × ${o.qty}` : ''}`).join(', ')]);
  if (booking.customer.flight) rows.push([T.flight, booking.customer.flight]);
  if (booking.customer.comments) rows.push([T.comments, booking.customer.comments]);
  rows.push([T.payment, T[`pay_${booking.payment.mode}`] || booking.payment.mode]);
  rows.push([T.total, q.total === null || q.onRequest ? T.on_request : formatMoney(q.total, cfg)]);
  if (booking.payment.mode === 'deposit' && booking.payment.amountDue) rows.push([T.deposit, formatMoney(booking.payment.amountDue, cfg)]);
  rows.push([T.status, T[`st_${booking.status}`] || booking.status]);
  return { rows: rows.filter((x) => x[1]), cfg };
}

export function renderEmail({ raw, booking, kind, locale, extra = {}, forAdmin = false }) {
  const T = texts(locale);
  const company = (raw.settings && raw.settings.company) || {};
  const colors = company.colors || {};
  const accent = colors.accent || '#C8A35A', accentText = colors.accentText || '#0B0B0C';
  const { rows, cfg } = bookingDetails(booking, raw, T);
  const p = { ref: booking.ref, name: booking.customer.firstName, amount: extra.amount !== undefined ? formatMoney(extra.amount, cfg) : '', date: extra.date || '', status: T[`st_${booking.status}`] || booking.status };
  const subject = fill(T[`${kind}_subject`], p);
  const title = fill(T[`${kind}_title`], p);
  const intro = fill(T[`${kind}_intro`], p);
  const button = extra.buttonUrl ? `<p style="margin:28px 0 8px"><a href="${h(extra.buttonUrl)}" style="display:inline-block;padding:14px 26px;background:${h(accent)};color:${h(accentText)};text-decoration:none;border-radius:4px;font-weight:600">${h(extra.buttonLabel || T.payment_button)}</a></p>` : '';
  const table = rows.map(([k, v]) => `<tr><td style="padding:9px 0;border-bottom:1px solid #eee;color:#666;font-size:13px;width:38%;vertical-align:top">${h(k)}</td><td style="padding:9px 0;border-bottom:1px solid #eee;font-size:14px;color:#111">${h(v)}</td></tr>`).join('');
  const customer = forAdmin ? `<tr><td style="padding:9px 0;border-bottom:1px solid #eee;color:#666;font-size:13px">${h(T.customer)}</td><td style="padding:9px 0;border-bottom:1px solid #eee;font-size:14px">${h(`${booking.customer.firstName} ${booking.customer.lastName}`)}<br><a href="mailto:${h(booking.customer.email)}">${h(booking.customer.email)}</a><br><a href="tel:${h(booking.customer.phone)}">${h(booking.customer.phone)}</a></td></tr>` : '';
  const logo = company.logo ? `<img src="${h(company.logo)}" alt="${h(company.name)}" width="160" style="display:block;max-width:160px;height:auto;border:0">` : `<span style="font-size:20px;font-weight:600;color:#111">${h(company.name || 'Taxi')}</span>`;
  const html = `<!doctype html><html lang="${h(locale || 'fr')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${h(subject)}</title></head>
<body style="margin:0;background:#f4f4f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#ffffff;padding:26px 32px">${logo}</td></tr>
<tr><td style="height:4px;background:${h(accent)}"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${h(title)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333">${h(intro)}</p>${button}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">${customer}${table}</table>
</td></tr>
<tr><td style="padding:22px 32px;background:#fafaf8;font-size:12px;line-height:1.6;color:#777">
<strong style="color:#333">${h(company.legalName || company.name || '')}</strong><br>${h(company.address || '')}<br>
${company.phone ? `<a href="tel:${h(company.phoneHref || company.phone)}" style="color:#333">${h(company.phone)}</a> · ` : ''}${company.email ? `<a href="mailto:${h(company.email)}" style="color:#333">${h(company.email)}</a>` : ''}
${company.vat ? `<br>TVA ${h(company.vat)}` : ''}<br><br>${h(T.footer)}
</td></tr></table></td></tr></table></body></html>`;
  const text = [title, '', intro, extra.buttonUrl ? `\n${extra.buttonLabel || T.payment_button} : ${extra.buttonUrl}\n` : '', ...rows.map(([k, v]) => `${k} : ${v}`),
    '', company.name || '', company.phone || '', company.email || ''].join('\n');
  return { subject, html, text };
}
