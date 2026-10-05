import { venue } from "./content";

/**
 * Branded HTML email in the site's look (teal header, serif titles, sand
 * details card). Table layout and inline styles only, because that is what
 * Gmail, Outlook and Apple Mail render reliably.
 */

const C = { teal: "#0b5f6e", deep: "#17304f", ink: "#1b2a3a", soft: "#5a6774", stone: "#fbf8f2", sand: "#f3ede2", line: "#e6dccb", ochre: "#8a6a2c" };
const serif = "Georgia, 'Times New Roman', serif";
const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailParts = {
  lang: string;
  preheader: string;
  status?: { label: string; tone: "pending" | "ok" | "no" };
  title: string;
  paragraphs: string[];
  rows: [string, string][];
  buttons: { label: string; href: string; primary?: boolean }[];
  smallprint?: string;
  site: string;
};

const toneColor = { pending: { bg: "#fbefd9", fg: C.ochre }, ok: { bg: "#e3f1e8", fg: "#1f6b43" }, no: { bg: "#f8e3dd", fg: "#9a3a24" } };

export function renderEmail(p: EmailParts) {
  const tone = p.status ? toneColor[p.status.tone] : null;
  const rows = p.rows
    .map(
      ([k, v], i) => `<tr>
        <td style="padding:12px 0;${i ? `border-top:1px solid ${C.line};` : ""}font:12px/1.4 ${sans};letter-spacing:.14em;text-transform:uppercase;color:${C.soft};width:38%;vertical-align:top">${esc(k)}</td>
        <td style="padding:12px 0;${i ? `border-top:1px solid ${C.line};` : ""}font:16px/1.45 ${sans};color:${C.ink};vertical-align:top">${esc(v)}</td>
      </tr>`,
    )
    .join("");
  const buttons = p.buttons
    .map(
      (b) =>
        `<a href="${esc(b.href)}" style="display:inline-block;margin:0 8px 10px 0;padding:13px 22px;border-radius:999px;font:600 13px/1 ${sans};letter-spacing:.12em;text-transform:uppercase;text-decoration:none;${
          b.primary ? `background:${C.deep};color:#ffffff;` : `background:#ffffff;color:${C.deep};border:1px solid ${C.deep};`
        }">${esc(b.label)}</a>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${p.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(p.title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.stone};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(p.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.stone};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
    <tr><td align="center" style="background:${C.teal};padding:26px 24px 22px;">
      <div style="font:400 24px/1 ${serif};letter-spacing:.32em;color:#ffffff;text-transform:uppercase;">Plavi Kamen</div>
      <div style="font:italic 17px/1.6 ${serif};color:#ffffff;opacity:.85;">konoba · Lučica, Cres</div>
    </td></tr>
    <tr><td style="line-height:0;"><img src="${p.site}/email/terrace.jpg" width="600" alt="${esc(venue.name)} terrace by the sea" style="display:block;width:100%;height:auto;border:0;"></td></tr>
    <tr><td style="padding:34px 32px 8px;">
      ${p.status && tone ? `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${tone.bg};color:${tone.fg};font:600 11px/1 ${sans};letter-spacing:.16em;text-transform:uppercase;">${esc(p.status.label)}</span>` : ""}
      <h1 style="margin:16px 0 0;font:400 30px/1.15 ${serif};color:${C.deep};">${esc(p.title)}</h1>
      ${p.paragraphs.map((t) => `<p style="margin:14px 0 0;font:16px/1.6 ${sans};color:${C.ink};">${esc(t)}</p>`).join("")}
    </td></tr>
    ${
      p.rows.length
        ? `<tr><td style="padding:22px 32px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand};border-radius:14px;"><tr><td style="padding:8px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr></table>
    </td></tr>`
        : ""
    }
    ${buttons ? `<tr><td style="padding:22px 32px 4px;">${buttons}</td></tr>` : ""}
    ${p.smallprint ? `<tr><td style="padding:6px 32px 0;font:13px/1.5 ${sans};color:${C.soft};">${esc(p.smallprint)}</td></tr>` : ""}
    <tr><td style="padding:30px 32px 30px;">
      <div style="border-top:1px solid ${C.line};padding-top:20px;font:13px/1.6 ${sans};color:${C.soft};">
        <strong style="color:${C.deep};">${esc(venue.name)}</strong><br>
        ${esc(`${venue.street}, ${venue.postalCode} ${venue.locality}, ${venue.island}`)}<br>
        <a href="tel:${venue.phoneHref}" style="color:${C.deep};">${esc(venue.phone)}</a> · <a href="${p.site}" style="color:${C.deep};">${esc(p.site.replace(/^https?:\/\//, ""))}</a>
      </div>
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font:12px/1.5 ${sans};color:${C.soft};">Demo concept by <a href="https://kyrostudio.eu" style="color:${C.soft};">Kyro Studio</a> · fictional venue</p>
</td></tr>
</table>
</body>
</html>`;
}

/** Calendar invite (.ics) for a confirmed table, in the venue's time zone. */
export function bookingIcs(opts: { id: string; date: string; time: string; minutes: number; title: string; description: string }) {
  const [y, m, d] = opts.date.split("-").map(Number);
  const [hh, mm] = opts.time.split(":").map(Number);
  // Zagreb wall-clock → UTC (offset taken from that day, so summer time is right)
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zagreb", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(guess));
  const zh = Number(parts.find((x) => x.type === "hour")?.value) % 24;
  const zm = Number(parts.find((x) => x.type === "minute")?.value);
  const offsetMin = ((zh * 60 + zm - (hh * 60 + mm) + 1440 * 1.5) % 1440) - 720;
  const start = new Date(guess - offsetMin * 60_000);
  const end = new Date(start.getTime() + opts.minutes * 60_000);
  const f = (x: Date) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const line = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kyro Studio//Konoba Plavi Kamen//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.id}@konoba-plavi-kamen`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(start)}`,
    `DTEND:${f(end)}`,
    `SUMMARY:${line(opts.title)}`,
    `LOCATION:${line(`${venue.name}, ${venue.street}, ${venue.postalCode} ${venue.locality}, ${venue.island}, Croatia`)}`,
    `GEO:${venue.geo.lat};${venue.geo.lng}`,
    `DESCRIPTION:${line(opts.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
