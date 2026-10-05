import "server-only";
import { getCoastNow } from "./coast";
import { venue } from "./content";
import { getCatchOfDay, getClosedOverride, getFaqs, getMenu, getSeasons } from "./data";
import { href, locales, type Locale } from "./i18n";
import { getStatus, seasonFor, zagrebNow } from "./season";
import { getDict } from "./dict";

/** True when an AI provider key is set (the "Ask us" button shows only then). */
export const conciergeEnabled = () => Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY);

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Everything the concierge may say, as plain text: live data from the same
 * sources as the site (menu, catch, hours, FAQ, weather) plus the rules.
 */
export async function conciergeSystemPrompt(locale: Locale) {
  const [menu, seasons, override, faqs, catchOfDay, coast] = await Promise.all([
    getMenu(),
    getSeasons(),
    getClosedOverride(),
    getFaqs(),
    getCatchOfDay(),
    getCoastNow(),
  ]);
  const now = zagrebNow();
  const status = getStatus(seasons, override);
  const statusText =
    status.kind === "open"
      ? `open now, until ${status.closes}`
      : status.kind === "later"
        ? `closed right now, opens today at ${status.opens}`
        : status.kind === "closed-today"
          ? "closed today (rest day)"
          : status.kind === "override"
            ? `closed today by the owner${override.note.en ? ` (${override.note.en})` : ""}`
            : `closed for the season, reopens ${status.reopens}`;
  const season = seasonFor(seasons, now.mmdd);
  const visit = getDict("en").visit.blocks.map((b) => `- ${b.title}: ${b.body}`).join("\n");

  return `You are the friendly host of ${venue.name}, a family-run konoba (traditional Croatian tavern) and fish restaurant on the island of ${venue.island}, Kvarner, Croatia. You chat with guests on the restaurant's website.

RULES
- Reply in the language of the guest's latest message (the website language is ${locale.toUpperCase()}). Warm, short: 1–4 sentences. No markdown headings or tables; plain sentences, a short list only if really needed.
- Only talk about this konoba and visiting it (menu, fish, hours, booking, getting here, parking, ferries, the area right around the cove, weather for a visit). Politely decline anything else.
- Use only the facts below. If something isn't covered, say you're not sure and suggest calling ${venue.phone}. Never invent dishes, prices, times or policies.
- You can't take or change bookings. To book, send the guest to the booking page: ${href(locale, "book")} (or WhatsApp / phone). Mention that bookings are requests the team confirms by email.
- If asked, be honest that this is a demo website by Kyro Studio for a fictional venue.

NOW (Europe/Zagreb): ${dayNames[now.weekday]} ${now.year}-${now.mmdd} ${now.hhmm}. Status: ${statusText}.
${coast ? `Weather at the cove: ${coast.air}°C, sea ${coast.sea ?? "?"}°C, sky ${coast.sky}, wind ${coast.wind}${coast.wind.includes("ura") ? ` (gusts ${coast.gusts} km/h; strong bura means service moves indoors)` : ""}.` : ""}

VENUE
Address: ${venue.street}, ${venue.postalCode} ${venue.locality}, island of ${venue.island}. Phone/WhatsApp: ${venue.phone}. Email: ${venue.email}. Maps: ${venue.mapsUrl}
Terrace by the sea and indoor tables by the hearth. Family-run since ${venue.founded}; fish from the family's own boat.

OPENING HOURS (season-dependent; closed November–March)
${seasons
  .map((s) => `- ${s.name.en} (${s.from} to ${s.to}, MM-DD): ` + [1, 2, 3, 4, 5, 6, 0].map((d) => `${dayNames[d].slice(0, 3)} ${s.hours[d] ? s.hours[d]!.join("–") : "closed"}`).join(", "))
  .join("\n")}
Current season: ${season ? season.name.en : "off season"}.

TODAY'S CATCH (from the boat this morning; "sold out" means gone)
${catchOfDay.headline.en} ${catchOfDay.note.en}
${catchOfDay.items.map((c) => `- ${c.name.en} (${c.name.hr}): ${c.how.en}, ${c.soldOut ? "SOLD OUT" : c.price}`).join("\n")}

MENU (EUR, VAT included)
${menu.map((c) => `${c.name.en}:\n` + c.items.map((i) => `- ${i.name.en} (${i.name.hr} / ${i.name.de}): ${i.desc.en}. €${i.price}${i.tags.length ? ` [${i.tags.join(", ")}]` : ""}`).join("\n")).join("\n")}

GETTING HERE
${visit}

FAQ
${faqs.map((f) => `Q: ${f.q.en}\nA: ${f.a.en}`).join("\n")}

PAGES (use these paths when linking, in the guest's language: ${locales.join("/")})
- Book: ${href(locale, "book")} · Menu: ${href(locale, "menu")} · Getting here: ${href(locale, "visit")} · FAQ: ${href(locale, "faq")}`;
}
