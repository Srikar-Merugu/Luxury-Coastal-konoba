/**
 * Venue content. Every venue detail is fictional (Kyro demo rule).
 *
 * Shapes mirror the shared starter's Supabase tables (menu_categories,
 * menu_items, opening_hours, faqs) plus two konoba-specific additions
 * (seasons, catch_of_day). When the starter lands, swap the exports in
 * lib/data.ts for Supabase queries; components only talk to lib/data.ts.
 */
import type { Locale } from "./i18n";

export type L = Record<Locale, string>;
export type Tag = "vegan" | "vegetarian" | "gluten-free";

export const venue = {
  name: "Konoba Plavi Kamen",
  shortName: "Plavi Kamen",
  street: "Obala Lučica 7",
  postalCode: "51557",
  locality: "Lučica",
  island: "Cres",
  region: "Primorje-Gorski Kotar",
  country: "HR",
  phone: "+385 51 000 188",
  phoneHref: "+38551000188",
  email: "stol@konoba.demo.kyrostudio.eu",
  geo: { lat: 44.9312, lng: 14.4069 },
  mapsUrl: "https://maps.google.com/?q=44.9312,14.4069",
  priceRange: "€€",
  founded: 1987,
  url: "https://konoba.demo.kyrostudio.eu",
};

/* ---------- Seasons & hours ---------- */

export type Season = {
  id: string;
  name: L;
  /** MM-DD inclusive */
  from: string;
  to: string;
  /** weekday 0=Sun..6=Sat → [opens, closes] or null when closed */
  hours: Record<number, [string, string] | null>;
};

const shoulder: Season["hours"] = {
  0: ["12:00", "22:00"],
  1: null,
  2: ["12:00", "22:00"],
  3: ["12:00", "22:00"],
  4: ["12:00", "22:00"],
  5: ["12:00", "23:00"],
  6: ["12:00", "23:00"],
};
const high: Season["hours"] = {
  0: ["11:00", "24:00"],
  1: ["11:00", "24:00"],
  2: ["11:00", "24:00"],
  3: ["11:00", "24:00"],
  4: ["11:00", "24:00"],
  5: ["11:00", "24:00"],
  6: ["11:00", "24:00"],
};

export const seasons: Season[] = [
  { id: "spring", name: { hr: "Proljeće", en: "Spring", de: "Frühling" }, from: "04-01", to: "06-14", hours: shoulder },
  { id: "summer", name: { hr: "Ljeto", en: "Summer", de: "Sommer" }, from: "06-15", to: "09-15", hours: high },
  { id: "autumn", name: { hr: "Jesen", en: "Autumn", de: "Herbst" }, from: "09-16", to: "10-31", hours: shoulder },
];

/** Owner can force the closed state from /admin (e.g. storm, private event). */
export const closedOverride: { active: boolean; note: L } = {
  active: false,
  note: { hr: "", en: "", de: "" },
};

/* ---------- Catch of the day ---------- */

export type CatchItem = { name: L; how: L; price: string; soldOut?: boolean; photo: import("./photos").PhotoKey };
export const catchOfDay: { updatedAt: string; by: string; headline: L; note: L; items: CatchItem[] } = {
  updatedAt: "2026-10-04T07:40:00+02:00",
  by: "Luka",
  headline: {
    hr: "Bura je stala, mreže su bile pune.",
    en: "The bura dropped and the nets came in full.",
    de: "Die Bora hat nachgelassen, die Netze waren voll.",
  },
  note: {
    hr: "Ovo je stiglo jutros s našeg broda. Kad nestane, nestane. Pitajte konobara što je na gradelama.",
    en: "This came in on our boat this morning. When it's gone, it's gone. Ask your waiter what's on the grill.",
    de: "Das kam heute früh mit unserem Boot. Wenn es weg ist, ist es weg. Fragen Sie, was auf dem Grill liegt.",
  },
  items: [
    {
      name: { hr: "Orada", en: "Gilt-head bream", de: "Dorade" },
      how: { hr: "s gradela, blitva", en: "grilled, with chard", de: "vom Grill, mit Mangold" },
      price: "65 €/kg",
      photo: "grill",
    },
    {
      name: { hr: "Kvarnerski škampi", en: "Kvarner scampi", de: "Kvarner-Scampi" },
      how: { hr: "na buzaru", en: "buzara style", de: "Buzara-Art" },
      price: "26 €",
      photo: "scampi",
    },
    {
      name: { hr: "Lignje", en: "Squid", de: "Tintenfisch" },
      how: { hr: "s gradela", en: "grilled", de: "vom Grill" },
      price: "22 €",
      photo: "catch",
    },
    {
      name: { hr: "Zubatac", en: "Dentex", de: "Zahnbrasse" },
      how: { hr: "za dvoje, s gradela", en: "for two, grilled", de: "für zwei, vom Grill" },
      price: "72 €/kg",
      soldOut: true,
      photo: "boat",
    },
  ],
};

/* ---------- Menu ---------- */

export type MenuItem = { name: L; desc: L; price: string; tags: Tag[]; signature?: boolean; photo?: import("./photos").PhotoKey };
export type MenuCategory = { id: string; name: L; photo: import("./photos").PhotoKey; items: MenuItem[] };

export const menu: MenuCategory[] = [
  {
    id: "cold",
    photo: "catch",
    name: { hr: "Hladna predjela", en: "Cold starters", de: "Kalte Vorspeisen" },
    items: [
      {
        name: { hr: "Carpaccio od brancina", en: "Sea bass carpaccio", de: "Wolfsbarsch-Carpaccio" },
        desc: {
          hr: "Tanko rezan brancin, limun, maslinovo ulje s Cresa, kapari",
          en: "Thin-sliced sea bass, lemon, Cres olive oil, capers",
          de: "Hauchdünner Wolfsbarsch, Zitrone, Olivenöl aus Cres, Kapern",
        },
        price: "16",
        tags: ["gluten-free"],
      },
      {
        name: { hr: "Salata od hobotnice", en: "Octopus salad", de: "Oktopussalat" },
        desc: {
          hr: "Hobotnica, krumpir, crveni luk, peršin",
          en: "Octopus, potato, red onion, parsley",
          de: "Oktopus, Kartoffeln, rote Zwiebeln, Petersilie",
        },
        price: "15",
        tags: ["gluten-free"],
      },
      {
        name: { hr: "Marinirani inćuni", en: "Marinated anchovies", de: "Marinierte Sardellen" },
        desc: {
          hr: "Inćuni iz uvale, češnjak, ocat od vina, domaći kruh",
          en: "Anchovies from the bay, garlic, wine vinegar, house bread",
          de: "Sardellen aus der Bucht, Knoblauch, Weinessig, hausgemachtes Brot",
        },
        price: "11",
        tags: [],
      },
      {
        name: { hr: "Ovčji sir i pršut", en: "Sheep's cheese and prosciutto", de: "Schafskäse und Pršut" },
        desc: {
          hr: "Otočni ovčji sir, pršut, masline, smokve",
          en: "Island sheep's cheese, cured ham, olives, figs",
          de: "Schafskäse von der Insel, Rohschinken, Oliven, Feigen",
        },
        price: "18",
        tags: ["gluten-free"],
      },
    ],
  },
  {
    id: "warm",
    photo: "scampi",
    name: { hr: "Topla predjela", en: "Warm starters", de: "Warme Vorspeisen" },
    items: [
      {
        name: { hr: "Kvarnerski škampi na buzaru", en: "Kvarner scampi buzara", de: "Kvarner-Scampi Buzara" },
        desc: {
          hr: "Škampi, bijelo vino, češnjak, rajčica, krušne mrvice",
          en: "Scampi, white wine, garlic, tomato, breadcrumbs",
          de: "Scampi, Weißwein, Knoblauch, Tomate, Semmelbrösel",
        },
        price: "26",
        tags: [],
        signature: true,
        photo: "scampi",
      },
      {
        name: { hr: "Crni rižot", en: "Black cuttlefish risotto", de: "Schwarzes Risotto" },
        desc: {
          hr: "Sipa, crnilo, bijelo vino, peršin",
          en: "Cuttlefish, its ink, white wine, parsley",
          de: "Sepia, Tinte, Weißwein, Petersilie",
        },
        price: "19",
        tags: ["gluten-free"],
        signature: true,
        photo: "risotto",
      },
      {
        name: { hr: "Šurlice s pomidorom", en: "Šurlice with tomato", de: "Šurlice mit Tomate" },
        desc: {
          hr: "Ručno valjana otočna tjestenina, rajčica, bosiljak",
          en: "Hand-rolled island pasta, slow tomato, basil",
          de: "Handgerollte Inselpasta, Tomate, Basilikum",
        },
        price: "14",
        tags: ["vegan"],
      },
    ],
  },
  {
    id: "sea",
    photo: "grill",
    name: { hr: "Riba i plodovi mora", en: "Fish and seafood", de: "Fisch und Meeresfrüchte" },
    items: [
      {
        name: { hr: "Riba dana s gradela", en: "Fish of the day, grilled", de: "Fisch des Tages vom Grill" },
        desc: {
          hr: "Ulov jutra, blitva s krumpirom, maslinovo ulje",
          en: "This morning's catch, chard and potato, olive oil",
          de: "Fang des Morgens, Mangold mit Kartoffeln, Olivenöl",
        },
        price: "65/kg",
        tags: ["gluten-free"],
        signature: true,
        photo: "grill",
      },
      {
        name: { hr: "Lignje s gradela", en: "Grilled squid", de: "Gegrillter Tintenfisch" },
        desc: {
          hr: "Lignje, češnjak, peršin, limun",
          en: "Squid, garlic, parsley, lemon",
          de: "Tintenfisch, Knoblauch, Petersilie, Zitrone",
        },
        price: "22",
        tags: ["gluten-free"],
      },
      {
        name: { hr: "Brodet s palentom", en: "Fish stew with polenta", de: "Fischeintopf mit Polenta" },
        desc: {
          hr: "Tri vrste ribe, rajčica, vino, palenta",
          en: "Three kinds of fish, tomato, wine, soft polenta",
          de: "Drei Fischsorten, Tomate, Wein, Polenta",
        },
        price: "24",
        tags: ["gluten-free"],
      },
      {
        name: { hr: "Hobotnica ispod peke", en: "Octopus under the peka", de: "Oktopus unter der Peka" },
        desc: {
          hr: "Peče se dva sata pod žarom. Naručite dan ranije.",
          en: "Slow-roasted for two hours under embers. Order a day ahead.",
          de: "Zwei Stunden unter Glut gegart. Bitte einen Tag vorher bestellen.",
        },
        price: "28",
        tags: ["gluten-free"],
        signature: true,
        photo: "peka",
      },
    ],
  },
  {
    id: "land",
    photo: "peka",
    name: { hr: "S kopna", en: "From the land", de: "Vom Land" },
    items: [
      {
        name: { hr: "Janjetina ispod peke", en: "Lamb under the peka", de: "Lamm unter der Peka" },
        desc: {
          hr: "Creska janjetina, krumpir, ružmarin. Naručite dan ranije.",
          en: "Cres lamb, potatoes, rosemary. Order a day ahead.",
          de: "Lamm aus Cres, Kartoffeln, Rosmarin. Bitte einen Tag vorher bestellen.",
        },
        price: "28",
        tags: ["gluten-free"],
      },
      {
        name: { hr: "Povrće s gradela", en: "Grilled vegetables", de: "Gegrilltes Gemüse" },
        desc: {
          hr: "Tikvice, patlidžan, paprika, blitva, maslinovo ulje",
          en: "Courgette, aubergine, pepper, chard, olive oil",
          de: "Zucchini, Aubergine, Paprika, Mangold, Olivenöl",
        },
        price: "13",
        tags: ["vegan", "gluten-free"],
      },
    ],
  },
  {
    id: "sweet",
    photo: "hands",
    name: { hr: "Deserti", en: "Desserts", de: "Desserts" },
    items: [
      {
        name: { hr: "Torta od badema", en: "Almond cake", de: "Mandelkuchen" },
        desc: {
          hr: "Bademi, limunova korica, maraskino",
          en: "Almonds, lemon zest, maraschino",
          de: "Mandeln, Zitronenschale, Maraschino",
        },
        price: "7",
        tags: ["vegetarian"],
      },
      {
        name: { hr: "Palačinke s domaćim pekmezom", en: "Pancakes with house jam", de: "Palatschinken mit Hausmarmelade" },
        desc: {
          hr: "Pekmez od smokava iz našeg vrta",
          en: "Fig jam from our own garden",
          de: "Feigenmarmelade aus unserem Garten",
        },
        price: "6",
        tags: ["vegetarian"],
      },
      {
        name: { hr: "Sorbet od limuna", en: "Lemon sorbet", de: "Zitronensorbet" },
        desc: { hr: "Otočni limun, menta", en: "Island lemons, mint", de: "Inselzitronen, Minze" },
        price: "5",
        tags: ["vegan", "gluten-free"],
      },
    ],
  },
];

/* ---------- FAQ ---------- */

export const faqs: { q: L; a: L }[] = [
  {
    q: {
      hr: "Trebam li rezervirati stol?",
      en: "Do I need to book a table?",
      de: "Muss ich einen Tisch reservieren?",
    },
    a: {
      hr: "Od lipnja do rujna da, posebno za terasu u vrijeme zalaska sunca. Izvan sezone obično imamo slobodan stol, ali rezervacija vam čuva mjesto uz more.",
      en: "From June to September, yes, especially for the terrace at sunset. Outside those months we usually have a free table, but booking keeps you a seat by the water.",
      de: "Von Juni bis September ja, besonders für die Terrasse zum Sonnenuntergang. In der Nebensaison haben wir meist einen freien Tisch, aber mit Reservierung sitzen Sie sicher am Wasser.",
    },
  },
  {
    q: {
      hr: "Primate li veće grupe?",
      en: "Can you seat large groups?",
      de: "Nehmen Sie größere Gruppen auf?",
    },
    a: {
      hr: "Da, do 30 osoba na terasi. Za grupe od 9 ili više osoba odaberite opciju za veliku grupu u obrascu i javit ćemo vam se s prijedlogom menija.",
      en: "Yes, up to 30 guests on the terrace. For 9 or more, tick the large-group option in the booking form and we will reply with a set menu suggestion.",
      de: "Ja, bis zu 30 Gäste auf der Terrasse. Ab 9 Personen wählen Sie im Formular die Option für große Gruppen, wir melden uns mit einem Menüvorschlag.",
    },
  },
  {
    q: { hr: "Jesu li djeca dobrodošla?", en: "Are children welcome?", de: "Sind Kinder willkommen?" },
    a: {
      hr: "Naravno. Imamo dječje stolice i manje porcije ribe i tjestenine.",
      en: "Of course. We have high chairs and smaller portions of fish and pasta.",
      de: "Natürlich. Wir haben Kinderhochstühle und kleinere Portionen Fisch und Pasta.",
    },
  },
  {
    q: { hr: "Mogu li doći sa psom?", en: "Can I bring my dog?", de: "Darf ich meinen Hund mitbringen?" },
    a: {
      hr: "Psi su dobrodošli na terasi. Donijet ćemo posudu s vodom.",
      en: "Dogs are welcome on the terrace. We will bring a bowl of water.",
      de: "Hunde sind auf der Terrasse willkommen. Wir bringen eine Schale Wasser.",
    },
  },
  {
    q: { hr: "Gdje mogu parkirati?", en: "Where can I park?", de: "Wo kann ich parken?" },
    a: {
      hr: "Na javnom parkiralištu iznad uvale, tri minute hoda do nas. U srpnju i kolovozu parking se plaća 2 € na sat.",
      en: "In the public car park above the cove, a three-minute walk down to us. In July and August it costs €2 per hour.",
      de: "Auf dem öffentlichen Parkplatz oberhalb der Bucht, drei Gehminuten entfernt. Im Juli und August kostet er 2 € pro Stunde.",
    },
  },
  {
    q: { hr: "Mogu li platiti karticom?", en: "Can I pay by card?", de: "Kann ich mit Karte bezahlen?" },
    a: {
      hr: "Da, primamo sve veće kartice i Apple Pay te Google Pay.",
      en: "Yes, we take all major cards, Apple Pay and Google Pay.",
      de: "Ja, wir akzeptieren alle gängigen Karten sowie Apple Pay und Google Pay.",
    },
  },
  {
    q: {
      hr: "Možete li prilagoditi jela alergijama?",
      en: "Can you cook around allergies?",
      de: "Können Sie auf Allergien eingehen?",
    },
    a: {
      hr: "Da. Na jelovniku su označena veganska i bezglutenska jela, a kuhinja može prilagoditi većinu ostalih. Recite nam pri rezervaciji ili konobaru.",
      en: "Yes. Vegan and gluten-free dishes are marked on the menu, and the kitchen can adapt most others. Tell us in your booking note or tell your waiter.",
      de: "Ja. Vegane und glutenfreie Gerichte sind auf der Karte markiert, die Küche passt die meisten anderen an. Geben Sie es bei der Reservierung an oder sagen Sie es unserem Service.",
    },
  },
  {
    q: {
      hr: "Kada ste otvoreni?",
      en: "When are you open?",
      de: "Wann haben Sie geöffnet?",
    },
    a: {
      hr: "Od 1. travnja do 31. listopada. Ljeti (15. 6. – 15. 9.) svaki dan od 11 do 24 h, u proljeće i jesen od 12 do 22 h, ponedjeljkom zatvoreno. Zimi je konoba zatvorena.",
      en: "From 1 April to 31 October. In summer (15 June – 15 September) daily from 11:00 to midnight; in spring and autumn from 12:00 to 22:00, closed Mondays. We close for the winter.",
      de: "Vom 1. April bis 31. Oktober. Im Sommer (15. Juni – 15. September) täglich 11–24 Uhr, im Frühling und Herbst 12–22 Uhr, montags Ruhetag. Im Winter geschlossen.",
    },
  },
  {
    q: {
      hr: "Mogu li doći brodom?",
      en: "Can I arrive by boat?",
      de: "Kann ich mit dem Boot kommen?",
    },
    a: {
      hr: "Da. Imamo četiri veza na našem molu za goste konobe, besplatno do 4 sata. Najavite se telefonom ili na VHF kanalu 17.",
      en: "Yes. We have four berths on our pier for guests, free for up to four hours. Call ahead or hail us on VHF channel 17.",
      de: "Ja. Für Gäste gibt es vier Liegeplätze an unserem Steg, bis zu vier Stunden kostenlos. Bitte vorher anrufen oder über UKW-Kanal 17 melden.",
    },
  },
];
