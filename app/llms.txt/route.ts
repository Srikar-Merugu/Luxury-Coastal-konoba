import { faqs, menu, seasons, venue } from "@/lib/content";
import { href } from "@/lib/i18n";

export const dynamic = "force-static";

export function GET() {
  const hours = seasons
    .map((s) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        .map((d, i) => `${d} ${s.hours[i] ? s.hours[i]!.join("–") : "closed"}`)
        .join(", ");
      return `- ${s.name.en} (${s.from} to ${s.to}, MM-DD): ${days}`;
    })
    .join("\n");

  const dishes = menu
    .map((c) => `### ${c.name.en}\n` + c.items.map((i) => `- ${i.name.en} (${i.name.hr}): ${i.desc.en}. €${i.price}${i.tags.length ? ` [${i.tags.join(", ")}]` : ""}`).join("\n"))
    .join("\n\n");

  const body = `# ${venue.name}

> Family-run konoba (traditional Croatian tavern) and fish restaurant on the island of Cres, Kvarner, Croatia. Fresh fish of the day from the family's own boat, grilled over olive wood, served on a terrace by the sea. Open seasonally, 1 April to 31 October. Languages: Croatian, English, German.

Note: this is a fictional demo venue built by Kyro Studio (https://kyrostudio.eu).

## Contact
- Address: ${venue.street}, ${venue.postalCode} ${venue.locality}, island of ${venue.island}, Croatia
- Phone: ${venue.phone}
- Email: ${venue.email}
- Coordinates: ${venue.geo.lat}, ${venue.geo.lng}
- Book a table: ${venue.url}${href("en", "book")}

## Opening hours
${hours}
- Closed November to March.

## Menu (prices in EUR)
${dishes}

## FAQ
${faqs.map((f) => `**${f.q.en}**\n${f.a.en}`).join("\n\n")}

## Pages
- Home: ${venue.url}/en (HR: ${venue.url}/hr, DE: ${venue.url}/de)
- Menu: ${venue.url}${href("en", "menu")}
- Getting here: ${venue.url}${href("en", "visit")}
- FAQ: ${venue.url}${href("en", "faq")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
