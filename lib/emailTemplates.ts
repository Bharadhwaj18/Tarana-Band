// Gig Poster email templates.
// Email clients ignore most CSS, so everything is table layout with inline styles,
// and every font has a web-safe fallback (Gmail and Outlook don't load web fonts).

import { SITE_URL } from './seo';

const INK = '#141414';
const PAPER = '#F1ECE2';
const RED = '#D2281F';
const MUTED = '#6B665C';
const DISPLAY = "'Archivo Black','Arial Black',Impact,Arial,sans-serif";
const BODY = 'Arial,Helvetica,sans-serif';
const MONO = "'Space Mono','Courier New',Courier,monospace";

const LOGO_URL = `${SITE_URL}/logo-white.png`;
const CONTACT_EMAIL = 'taranabandinfo@gmail.com';
const SOCIALS = [
  { label: 'Instagram', url: 'https://www.instagram.com/tarana_theband/' },
  { label: 'YouTube', url: 'https://www.youtube.com/@Tarana_theband' },
  { label: 'Spotify', url: 'https://open.spotify.com/artist/0YoC7nY83SVGBNoIYN33qT' },
];

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function orderNumber(id: string) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

function rupees(amount: number) {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

interface OrderItem {
  product?: { name?: string; price?: number };
  size?: string;
  quantity?: number;
}

interface OrderLike {
  id: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  items?: OrderItem[];
  total_amount?: number | string;
}

// ---------- building blocks ----------

function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-family:${BODY};font-size:16px;line-height:1.6;color:${INK};">${html}</p>`;
}

function itemLabel(item: OrderItem) {
  const size = item.size && item.size !== 'One Size' ? ` / ${escapeHtml(item.size)}` : '';
  return `${escapeHtml(item.product?.name || 'Item')}${size}`;
}

/** Receipt-style list of items with a total, like the bag on the site */
function receipt(order: OrderLike, extraLines: string[] = []) {
  const rows = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;font-family:${MONO};font-size:14px;color:${INK};">${item.quantity || 1} × ${itemLabel(item)}</td>
          <td align="right" style="padding:6px 0;font-family:${MONO};font-size:14px;color:${INK};white-space:nowrap;">${
            item.product?.price ? rupees(Number(item.product.price) * (item.quantity || 1)) : ''
          }</td>
        </tr>`
    )
    .join('');

  const extras = extraLines
    .map(
      (line) =>
        `<tr><td colspan="2" style="padding:2px 0;font-family:${MONO};font-size:12px;color:${MUTED};">${line}</td></tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border-top:2px dashed ${INK};border-bottom:2px dashed ${INK};">
      <tr><td colspan="2" style="padding:14px 0 6px;font-family:${MONO};font-size:13px;font-weight:bold;color:${INK};">ORDER ${escapeHtml(orderNumber(order.id))}</td></tr>
      ${rows}
      <tr>
        <td style="padding:12px 0 4px;font-family:${MONO};font-size:18px;font-weight:bold;color:${INK};border-top:1px solid ${INK};">TOTAL</td>
        <td align="right" style="padding:12px 0 4px;font-family:${MONO};font-size:18px;font-weight:bold;color:${INK};border-top:1px solid ${INK};">${rupees(Number(order.total_amount || 0))}</td>
      </tr>
      ${extras}
      <tr><td colspan="2" style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>
    </table>`;
}

/** Label / value rows, for addresses and admin details */
function details(rows: Array<[string, string]>) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:3px solid ${INK};background:#FFFFFF;">
      ${rows
        .map(
          ([label, value], i) => `
        <tr>
          <td valign="top" style="padding:12px 14px;width:96px;font-family:${MONO};font-size:11px;font-weight:bold;text-transform:uppercase;color:${INK};background:${PAPER};${
            i > 0 ? `border-top:1px solid ${INK};` : ''
          }">${escapeHtml(label)}</td>
          <td valign="top" style="padding:12px 14px;font-family:${BODY};font-size:15px;line-height:1.5;color:${INK};${
            i > 0 ? `border-top:1px solid ${INK};` : ''
          }">${value}</td>
        </tr>`
        )
        .join('')}
    </table>`;
}

/** A boxed highlight, e.g. tracking number */
function callout(label: string, valueHtml: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:${INK};">
      <tr><td style="padding:18px 20px;">
        <div style="font-family:${MONO};font-size:11px;font-weight:bold;text-transform:uppercase;color:#FF6A5E;">${escapeHtml(label)}</div>
        <div style="margin-top:6px;font-family:${DISPLAY};font-size:22px;letter-spacing:0.5px;color:${PAPER};">${valueHtml}</div>
      </td></tr>
    </table>`;
}

function button(label: string, url: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
      <tr><td style="background:${RED};border:3px solid ${INK};">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;font-family:${BODY};font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(label)}</a>
      </td></tr>
    </table>`;
}

function addressHtml(order: OrderLike) {
  return [
    order.address_line1,
    order.address_line2,
    [order.city, order.state].filter(Boolean).join(', ') + (order.pincode ? ` – ${order.pincode}` : ''),
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br>');
}

// ---------- page shell ----------

interface ShellOptions {
  preheader: string;
  eyebrow: string;
  title: string;
  /** Second line of the headline, shown in red */
  accent?: string;
  body: string;
  /** Band-facing emails get a plainer footer */
  forBand?: boolean;
}

function shell({ preheader, eyebrow, title, accent, body, forBand }: ShellOptions) {
  const footer = forBand
    ? `<p style="margin:0;font-family:${MONO};font-size:12px;line-height:1.7;color:#B8B2A6;">Sent by taranaband.in · <a href="${SITE_URL}/admin" style="color:${PAPER};">Open backstage</a></p>`
    : `
      <p style="margin:0 0 12px;font-family:${MONO};font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#FF6A5E;">Classical roots · Rock energy</p>
      <p style="margin:0 0 14px;font-family:${MONO};font-size:13px;line-height:1.8;">
        ${SOCIALS.map((s) => `<a href="${s.url}" style="color:${PAPER};text-decoration:underline;">${s.label}</a>`).join(' &nbsp;·&nbsp; ')}
      </p>
      <p style="margin:0;font-family:${MONO};font-size:12px;line-height:1.7;color:#B8B2A6;">
        Questions? Reply to this email or write to <a href="mailto:${CONTACT_EMAIL}" style="color:${PAPER};">${CONTACT_EMAIL}</a><br>
        <a href="${SITE_URL}" style="color:#B8B2A6;">taranaband.in</a>
      </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAPER};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border:3px solid ${INK};background:#FFFFFF;">
      <tr><td style="background:${INK};padding:20px 28px;">
        <a href="${SITE_URL}"><img src="${LOGO_URL}" alt="Tarana" width="96" style="display:block;width:96px;height:auto;border:0;"></a>
      </td></tr>
      <tr><td style="height:8px;line-height:8px;font-size:0;background:${RED};">&nbsp;</td></tr>
      <tr><td style="padding:32px 28px 8px;">
        <p style="margin:0 0 10px;font-family:${MONO};font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${INK};">${escapeHtml(eyebrow)}</p>
        <h1 style="margin:0 0 24px;font-family:${DISPLAY};font-size:40px;line-height:0.95;text-transform:uppercase;letter-spacing:-1px;color:${INK};font-weight:normal;">
          ${escapeHtml(title)}${accent ? `<br><span style="color:${RED};">${escapeHtml(accent)}</span>` : ''}
        </h1>
        ${body}
      </td></tr>
      <tr><td style="background:${INK};padding:24px 28px;color:${PAPER};">${footer}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ---------- the emails ----------

export function orderConfirmedEmail(order: OrderLike, paymentId: string) {
  const name = escapeHtml(order.customer_name || 'there');
  return {
    subject: `You're in! Tarana order ${orderNumber(order.id)} is confirmed`,
    html: shell({
      preheader: `Payment received. Your Tarana merch order ${orderNumber(order.id)} is confirmed.`,
      eyebrow: 'Order confirmed',
      title: "You're in",
      accent: 'Thank you.',
      body: [
        paragraph(`Hi ${name}, your payment went through and your order is confirmed. Every tee helps us play more shows and record more music.`),
        receipt(order, [`PAID VIA RAZORPAY · ${escapeHtml(paymentId)}`]),
        details([['Shipping to', addressHtml(order)]]),
        paragraph(`We ship via India Post. You'll get another email with the tracking number as soon as it's on its way.`),
        button('Visit taranaband.in', SITE_URL),
      ].join(''),
    }),
  };
}

export function newOrderBandEmail(order: OrderLike, paymentId: string) {
  return {
    subject: `New order ${orderNumber(order.id)} · ${order.customer_name || 'Customer'} · ${rupees(Number(order.total_amount || 0))}`,
    html: shell({
      forBand: true,
      preheader: `Paid order from ${order.customer_name || 'a customer'}. Ready to pack and ship.`,
      eyebrow: 'New merch order · paid',
      title: 'Pack it',
      accent: 'Ship it.',
      body: [
        receipt(order, [`RAZORPAY PAYMENT · ${escapeHtml(paymentId)}`]),
        details([
          ['Customer', escapeHtml(order.customer_name)],
          ['Phone', `<a href="tel:${escapeHtml(order.phone)}" style="color:${INK};">${escapeHtml(order.phone)}</a>`],
          ['Email', `<a href="mailto:${escapeHtml(order.email)}" style="color:${INK};">${escapeHtml(order.email)}</a>`],
          ['Ship to', addressHtml(order)],
        ]),
        button('Open orders', `${SITE_URL}/admin/merch-orders`),
      ].join(''),
    }),
  };
}

export function orderShippedEmail(order: OrderLike, carrier?: string | null, trackingNumber?: string | null) {
  const name = escapeHtml(order.customer_name || 'there');
  const tracking = trackingNumber
    ? callout(carrier ? `${carrier} tracking number` : 'Tracking number', escapeHtml(trackingNumber))
    : carrier
      ? callout('Shipped with', escapeHtml(carrier))
      : '';
  return {
    subject: `Your Tarana order ${orderNumber(order.id)} is on its way`,
    html: shell({
      preheader: trackingNumber
        ? `Shipped! Tracking number ${trackingNumber}.`
        : 'Your Tarana merch has been shipped.',
      eyebrow: 'Order shipped',
      title: "It's on",
      accent: 'its way.',
      body: [
        paragraph(`Hi ${name}, good news: your Tarana merch has left the building.`),
        tracking,
        receipt(order),
        details([['Shipping to', addressHtml(order)]]),
        paragraph('Wear it loud, and tag us on Instagram when it arrives. We love seeing it out in the wild.'),
      ].join(''),
    }),
  };
}

export function orderCancelledEmail(order: OrderLike, reason: string | null, refundProofUrl: string) {
  const name = escapeHtml(order.customer_name || 'there');
  return {
    subject: `Your Tarana order ${orderNumber(order.id)} has been cancelled`,
    html: shell({
      preheader: 'Your order was cancelled and your refund has been processed.',
      eyebrow: 'Order cancelled',
      title: 'Order',
      accent: 'cancelled.',
      body: [
        paragraph(`Hi ${name}, your merch order has been cancelled and we've processed your refund.`),
        reason ? details([['Reason', escapeHtml(reason)]]) : '',
        receipt(order, ['REFUNDED']),
        paragraph('You can see the refund confirmation here:'),
        button('View refund proof', refundProofUrl),
        paragraph("Sorry it didn't work out this time. If anything looks wrong, just reply to this email."),
      ].join(''),
    }),
  };
}

export function contactBandEmail(form: { name: string; email: string; phone?: string; message: string }) {
  const rows: Array<[string, string]> = [
    ['Name', escapeHtml(form.name)],
    ['Email', `<a href="mailto:${escapeHtml(form.email)}" style="color:${INK};">${escapeHtml(form.email)}</a>`],
  ];
  if (form.phone) {
    rows.push(['Phone', `<a href="tel:${escapeHtml(form.phone)}" style="color:${INK};">${escapeHtml(form.phone)}</a>`]);
  }
  return {
    subject: `New message from ${form.name} · taranaband.in`,
    html: shell({
      forBand: true,
      preheader: form.message.slice(0, 120),
      eyebrow: 'Contact form',
      title: 'New',
      accent: 'message.',
      body: [
        details(rows),
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-left:6px solid ${RED};background:${PAPER};">
          <tr><td style="padding:16px 18px;font-family:${BODY};font-size:16px;line-height:1.6;color:${INK};">${escapeHtml(form.message).replace(/\n/g, '<br>')}</td></tr>
        </table>`,
        paragraph('Hit reply to answer them directly.'),
      ].join(''),
    }),
  };
}
