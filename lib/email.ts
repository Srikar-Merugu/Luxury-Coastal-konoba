import "server-only";
import { venue } from "./content";
import type { Locale } from "./i18n";

/**
 * Booking emails through Resend. Needs RESEND_API_KEY, EMAIL_FROM (an address
 * on a domain verified in Resend) and BOOKING_INBOX (the Kyro test inbox that
 * plays the owner). Without a key, emails are skipped and logged.
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

type Mail = { to: string; subject: string; text: string; replyTo?: string };

export async function sendMail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set, skipped: "${mail.subject}" → ${mail.to}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${venue.name} <onboarding@resend.dev>`,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.replyTo && { reply_to: mail.replyTo }),
    }),
  });
  if (!res.ok) console.error(`[email] Resend ${res.status}: ${await res.text()}`);
  return res.ok;
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
      intro: (n: string) => `Poštovani/a ${n},\n\nhvala na upitu. Javit ćemo vam se uskoro s potvrdom. Ovo još nije potvrda rezervacije.`,
    },
    confirmed: {
      subject: "Vaš stol je potvrđen",
      intro: (n: string) => `Poštovani/a ${n},\n\nvaš stol je potvrđen. Veselimo se vašem dolasku.`,
    },
    declined: {
      subject: "Nažalost, nemamo slobodan stol",
      intro: (n: string) =>
        `Poštovani/a ${n},\n\nnažalost, za traženi termin nemamo slobodan stol. Nazovite nas i pronaći ćemo drugi termin.`,
    },
    details: "Detalji",
    people: "osoba",
    seating: "Mjesto",
    group: "Velika grupa",
    note: "Napomena",
    sign: "Konoba Plavi Kamen",
  },
  en: {
    received: {
      subject: "We received your table request",
      intro: (n: string) => `Hello ${n},\n\nthank you for your request. We will reply shortly to confirm. This is not a confirmation yet.`,
    },
    confirmed: {
      subject: "Your table is confirmed",
      intro: (n: string) => `Hello ${n},\n\nyour table is confirmed. We look forward to seeing you.`,
    },
    declined: {
      subject: "Sorry, we have no table at that time",
      intro: (n: string) => `Hello ${n},\n\nunfortunately we have no table free at the time you asked for. Call us and we will find another time.`,
    },
    details: "Details",
    people: "people",
    seating: "Seating",
    group: "Large group",
    note: "Note",
    sign: "Konoba Plavi Kamen",
  },
  de: {
    received: {
      subject: "Wir haben Ihre Tischanfrage erhalten",
      intro: (n: string) =>
        `Hallo ${n},\n\nvielen Dank für Ihre Anfrage. Wir melden uns in Kürze mit einer Bestätigung. Dies ist noch keine Bestätigung.`,
    },
    confirmed: {
      subject: "Ihr Tisch ist bestätigt",
      intro: (n: string) => `Hallo ${n},\n\nIhr Tisch ist bestätigt. Wir freuen uns auf Ihren Besuch.`,
    },
    declined: {
      subject: "Leider ist kein Tisch frei",
      intro: (n: string) =>
        `Hallo ${n},\n\nleider ist zur gewünschten Zeit kein Tisch frei. Rufen Sie uns an, dann finden wir einen anderen Termin.`,
    },
    details: "Details",
    people: "Personen",
    seating: "Platz",
    group: "Große Gruppe",
    note: "Notiz",
    sign: "Konoba Plavi Kamen",
  },
} as const;

function details(b: Booking, locale: Locale) {
  const c = copy[locale];
  return [
    `${fmtDate(b.date, locale)}, ${b.time}`,
    `${b.party_size} ${c.people}`,
    `${c.seating}: ${seatingWord[locale][b.seating] ?? b.seating}`,
    b.large_group ? c.group : null,
    b.note ? `${c.note}: ${b.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

const footer = `\n\n${venue.name}\n${venue.street}, ${venue.postalCode} ${venue.locality}, ${venue.island}\n${venue.phone}\n\n— Demo concept by Kyro Studio (kyrostudio.eu). Fictional venue.`;

export function guestMail(b: Booking, kind: "received" | "confirmed" | "declined"): Mail {
  const c = copy[b.locale] ?? copy.en;
  return {
    to: b.email,
    subject: `${c[kind].subject} · ${venue.name}`,
    text: `${c[kind].intro(b.name)}\n\n${c.details}:\n${details(b, b.locale)}${footer}`,
    replyTo: process.env.BOOKING_INBOX || venue.email,
  };
}

export function ownerMail(b: Booking): Mail | null {
  const to = process.env.BOOKING_INBOX;
  if (!to) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL || venue.url;
  return {
    to,
    subject: `New table request: ${b.name}, ${b.party_size} ppl, ${b.date} ${b.time}${b.large_group ? " (large group)" : ""}`,
    text:
      `New request (pending)\n\n${details(b, "en")}\n\nName: ${b.name}\nPhone: ${b.phone}\nEmail: ${b.email}\nLanguage: ${b.locale.toUpperCase()}\n\n` +
      `Confirm or decline in ${site}/admin`,
    replyTo: b.email,
  };
}
