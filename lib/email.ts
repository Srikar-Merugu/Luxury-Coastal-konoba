import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { venue } from "./content";
import { bookingIcs, renderEmail } from "./email-template";
import { href, type Locale } from "./i18n";
import { guestWhatsApp, venueWhatsApp } from "./whatsapp";

/**
 * Booking emails. Sent through Gmail when SMTP_USER and SMTP_PASS (a Google
 * app password) are set, which reaches any address without owning a domain;
 * otherwise through Resend (RESEND_API_KEY, EMAIL_FROM on a verified domain).
 * BOOKING_INBOX receives every new request. Without either sender, emails
 * are skipped and logged.
 */

export type Booking = {
  id?: string;
  date: string;
  time: string;
  party_size: number;
  seating: string;
  large_group: boolean;
  name: string;
  phone: string;
  email: string;
  note: string;
  locale: Locale;
};

type Attachment = { filename: string; content: string; contentType: string };
type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string; attachments?: Attachment[] };
type Sent = { ok: boolean; error?: string };

/** Sends one email; never throws. `error` says why it was not sent. */
export async function sendMail(mail: Mail): Promise<Sent> {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return viaGmail(mail);
  if (process.env.RESEND_API_KEY) return viaResend(mail);
  console.warn(`[email] no sender configured, skipped: "${mail.subject}" → ${mail.to}`);
  return { ok: false, error: "email is not set up (add SMTP_USER and SMTP_PASS in Vercel)" };
}

let transport: Transporter | null = null;

async function viaGmail(mail: Mail): Promise<Sent> {
  const user = process.env.SMTP_USER!;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    // app passwords are shown with spaces; Gmail wants them without
    auth: { user, pass: process.env.SMTP_PASS!.replace(/\s+/g, "") },
  });
  try {
    // Gmail only sends as the signed-in account, so the address stays `user`.
    await transport.sendMail({
      from: { name: venue.name, address: user },
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.html && { html: mail.html }),
      ...(mail.attachments && { attachments: mail.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })) }),
      html: mail.html,
      replyTo: mail.replyTo,
      attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });
    return { ok: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[email] Gmail: ${reason}`);
    return { ok: false, error: `Gmail: ${reason}` };
  }
}

async function viaResend(mail: Mail): Promise<Sent> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${venue.name} <onboarding@resend.dev>`,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.replyTo && { reply_to: mail.replyTo }),
    }),
  });
  if (res.ok) return { ok: true };
  const body = await res.text();
  console.error(`[email] Resend ${res.status}: ${body}`);
  let reason = body;
  try {
    reason = JSON.parse(body).message ?? body;
  } catch {}
  return { ok: false, error: `Resend: ${reason}` };
}

const fmtDate = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "hr" ? "hr-HR" : locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

const seatingWord: Record<Locale, Record<string, string>> = {
  hr: { terrace: "terasa", indoor: "unutra", any: "bilo gdje" },
  en: { terrace: "terrace", indoor: "indoors", any: "no preference" },
  de: { terrace: "Terrasse", indoor: "drinnen", any: "egal" },
};

const copy = {
  hr: {
    received: {
      subject: "Primili smo vaš upit za stol",
      status: "Upit zaprimljen",
      title: (n: string) => `Hvala, ${n}!`,
      text: "Primili smo vaš upit i javit ćemo vam se uskoro s potvrdom, obično u nekoliko sati. Ovo još nije potvrda rezervacije.",
    },
    confirmed: {
      subject: "Vaš stol je potvrđen",
      status: "Potvrđeno",
      title: (n: string) => `Vidimo se uskoro, ${n}!`,
      text: "Vaš stol je potvrđen. Veselimo se vašem dolasku. Ako vam se planovi promijene, javite nam se.",
    },
    declined: {
      subject: "Nažalost, nemamo slobodan stol",
      status: "Nema slobodnog stola",
      title: (n: string) => `Žao nam je, ${n}`,
      text: "Za traženi termin nemamo slobodan stol. Odaberite drugo vrijeme ili nas nazovite i rado ćemo pronaći rješenje.",
    },
    labels: { date: "Datum", time: "Vrijeme", guests: "Osobe", seating: "Mjesto", group: "Velika grupa", groupYes: "Da, javit ćemo se s prijedlogom menija", note: "Napomena" },
    people: (n: number) => `${n} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "osobe" : "osoba"}`,
    buttons: { directions: "Kako do nas", whatsapp: "WhatsApp", another: "Odaberite drugo vrijeme" },
    calendar: "U privitku je pozivnica za vaš kalendar.",
    request: "Odgovaramo e-poštom, obično u nekoliko sati.",
    hello: (n: string) => `Poštovani/a ${n},`,
  },
  en: {
    received: {
      subject: "We received your table request",
      status: "Request received",
      title: (n: string) => `Thank you, ${n}!`,
      text: "We have your request and will email you shortly to confirm, usually within a few hours. This is not a confirmation yet.",
    },
    confirmed: {
      subject: "Your table is confirmed",
      status: "Confirmed",
      title: (n: string) => `See you soon, ${n}!`,
      text: "Your table is confirmed. We look forward to welcoming you. If your plans change, just let us know.",
    },
    declined: {
      subject: "Sorry, we have no table at that time",
      status: "No table available",
      title: (n: string) => `We're sorry, ${n}`,
      text: "We have no table free at the time you asked for. Please pick another time, or call us and we'll gladly find a way.",
    },
    labels: { date: "Date", time: "Time", guests: "Guests", seating: "Seating", group: "Large group", groupYes: "Yes, we'll suggest a set menu", note: "Note" },
    people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
    buttons: { directions: "Get directions", whatsapp: "WhatsApp", another: "Choose another time" },
    calendar: "A calendar invite is attached.",
    request: "We reply by email, usually within a few hours.",
    hello: (n: string) => `Hello ${n},`,
  },
  de: {
    received: {
      subject: "Wir haben Ihre Tischanfrage erhalten",
      status: "Anfrage erhalten",
      title: (n: string) => `Vielen Dank, ${n}!`,
      text: "Wir haben Ihre Anfrage erhalten und melden uns in Kürze per E-Mail mit einer Bestätigung, meist innerhalb weniger Stunden. Dies ist noch keine Bestätigung.",
    },
    confirmed: {
      subject: "Ihr Tisch ist bestätigt",
      status: "Bestätigt",
      title: (n: string) => `Bis bald, ${n}!`,
      text: "Ihr Tisch ist bestätigt. Wir freuen uns auf Ihren Besuch. Falls sich Ihre Pläne ändern, geben Sie uns bitte Bescheid.",
    },
    declined: {
      subject: "Leider ist kein Tisch frei",
      status: "Kein Tisch frei",
      title: (n: string) => `Es tut uns leid, ${n}`,
      text: "Zur gewünschten Zeit ist leider kein Tisch frei. Bitte wählen Sie eine andere Zeit oder rufen Sie uns an, wir finden gern eine Lösung.",
    },
    labels: { date: "Datum", time: "Uhrzeit", guests: "Personen", seating: "Platz", group: "Große Gruppe", groupYes: "Ja, wir schlagen ein Menü vor", note: "Notiz" },
    people: (n: number) => `${n} ${n === 1 ? "Person" : "Personen"}`,
    buttons: { directions: "Route planen", whatsapp: "WhatsApp", another: "Andere Zeit wählen" },
    calendar: "Eine Kalendereinladung ist angehängt.",
    request: "Wir antworten per E-Mail, meist innerhalb weniger Stunden.",
    hello: (n: string) => `Hallo ${n},`,
  },
} as const;

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || venue.url).replace(/\/$/, "");

/** Where new requests go: BOOKING_INBOX, else the Gmail account that sends. */
const ownerInbox = () => process.env.BOOKING_INBOX || process.env.SMTP_USER || "";

function rowsFor(b: Booking, locale: Locale): [string, string][] {
  const c = copy[locale];
  return [
    [c.labels.date, fmtDate(b.date, locale)],
    [c.labels.time, locale === "de" ? `${b.time} Uhr` : b.time],
    [c.labels.guests, c.people(b.party_size)],
    [c.labels.seating, seatingWord[locale][b.seating] ?? b.seating],
    ...(b.large_group ? ([[c.labels.group, c.labels.groupYes]] as [string, string][]) : []),
    ...(b.note ? ([[c.labels.note, b.note]] as [string, string][]) : []),
  ];
}

export function guestMail(b: Booking, kind: "received" | "confirmed" | "declined", opts: { minutes?: number } = {}): Mail {
  const locale = copy[b.locale] ? b.locale : "en";
  const c = copy[locale];
  const k = c[kind];
  const site = siteUrl();
  const rows = rowsFor(b, locale);
  const buttons =
    kind === "declined"
      ? [
          { label: c.buttons.another, href: `${site}${href(locale, "book")}`, primary: true },
          { label: c.buttons.whatsapp, href: venueWhatsApp() },
        ]
      : [
          { label: c.buttons.directions, href: venue.mapsUrl, primary: true },
          { label: c.buttons.whatsapp, href: venueWhatsApp() },
        ];
  const smallprint = kind === "confirmed" ? c.calendar : kind === "received" ? c.request : undefined;
  const html = renderEmail({
    lang: locale,
    preheader: `${k.status} · ${fmtDate(b.date, locale)}, ${b.time} · ${c.people(b.party_size)}`,
    status: { label: k.status, tone: kind === "received" ? "pending" : kind === "confirmed" ? "ok" : "no" },
    title: k.title(b.name),
    paragraphs: [k.text],
    rows,
    buttons,
    smallprint,
    site,
  });
  const text = `${c.hello(b.name)}\n\n${k.text}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\n${venue.name}\n${venue.street}, ${venue.postalCode} ${venue.locality}, ${venue.island}\n${venue.phone}\n\n— Demo concept by Kyro Studio (kyrostudio.eu). Fictional venue.`;
  const attachments =
    kind === "confirmed" && b.id
      ? [
          {
            filename: "plavi-kamen-table.ics",
            contentType: "text/calendar; charset=utf-8; method=PUBLISH",
            content: bookingIcs({
              id: b.id,
              date: b.date,
              time: b.time,
              minutes: opts.minutes ?? 120,
              title: `${venue.name} · ${c.people(b.party_size)}`,
              description: `${venue.phone} · ${venue.mapsUrl}`,
            }),
          },
        ]
      : undefined;
  return { to: b.email, subject: `${k.subject} · ${venue.name}`, text, html, replyTo: ownerInbox() || venue.email, attachments };
}

export function ownerMail(b: Booking): Mail | null {
  const to = ownerInbox();
  if (!to) return null;
  const site = siteUrl();
  const rows: [string, string][] = [
    ...rowsFor(b, "en"),
    ["Name", b.name],
    ["Phone", b.phone],
    ["Email", b.email],
    ["Language", b.locale.toUpperCase()],
  ];
  const html = renderEmail({
    lang: "en",
    preheader: `${b.name} · ${b.party_size} guests · ${b.date} ${b.time}`,
    status: { label: b.large_group ? "New request · large group" : "New request", tone: "pending" },
    title: `${b.name}, ${b.party_size} ${b.party_size === 1 ? "guest" : "guests"}`,
    paragraphs: ["A new table request is waiting. Confirm or decline it in the admin; the guest is emailed in their language."],
    rows,
    buttons: [
      { label: "Open admin", href: `${site}/admin`, primary: true },
      { label: "WhatsApp guest", href: guestWhatsApp(b.phone, `Hello ${b.name}, this is ${venue.name} about your table request (${b.date}, ${b.time}).`) },
    ],
    site,
  });
  return {
    to,
    subject: `New table request: ${b.name}, ${b.party_size} ppl, ${b.date} ${b.time}${b.large_group ? " (large group)" : ""}`,
    text: `New request (pending)\n\n${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\nConfirm or decline in ${site}/admin`,
    html,
    replyTo: b.email,
  };
}
