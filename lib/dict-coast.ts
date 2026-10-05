import type { Locale } from "./i18n";
import type { PhotoKey } from "./photos";

type Pair = { caps: string; script: string };
type Chapter = Pair & { body: string; left: PhotoKey; right: PhotoKey };
type Card = Pair & { body: string; meta: string; photo: PhotoKey };

export type CoastDict = {
  findUs: string;
  menu: string;
  heroArc: string;
  believe: { lead: string; lines: Pair[] };
  journey: { eyebrow: string; intro: string; chapters: Chapter[] };
  coast: Pair;
  days: { eyebrow: string; title: Pair; body: string; cards: Card[] };
  drink: { eyebrow: string; word: string; body: string };
  gather: { eyebrow: string; title: Pair; labels: string[] };
  dayNight: { day: Pair; night: Pair };
  board: { eyebrow: string; kicker: string; title: Pair; hours: string };
  cta: Pair;
  footer: { title: Pair; cols: { title: string; script: string; body: string }[]; discover: string };
};

export const coast: Record<Locale, CoastDict> = {
  en: {
    findUs: "Find us",
    menu: "Menu",
    heroArc: "FISH FROM THIS MORNING",
    believe: {
      lead: "WE BELIEVE IN",
      lines: [
        { caps: "FISH", script: "from our own boat" },
        { caps: "OLIVE WOOD", script: "and a slow fire" },
        { caps: "THE SEA", script: "one step from the table" },
        { caps: "LONG LUNCHES", script: "that turn into evenings" },
      ],
    },
    journey: {
      eyebrow: "PLAVI KAMEN IN LUČICA",
      intro: "The day here starts on the water and ends by candlelight. Five moments from a day at the konoba, from the boat at dawn to the last glass by the sea.",
      chapters: [
        { caps: "MORNING", script: "at first light", body: "Luka takes the boat out before the town wakes. What he brings back is the menu: nothing frozen, nothing flown in.", left: "boat", right: "catch" },
        { caps: "LUNCH", script: "long and slow", body: "Pine shade, cold Žlahtina, scampi in buzara. The terrace sits one step above the water, so you hear the sea between courses.", left: "scampi", right: "hands" },
        { caps: "PEKA", script: "under the embers", body: "Octopus or island lamb, slow-roasted for two hours under an iron bell. Order it a day ahead and we will light the fire for you.", left: "peka", right: "grove" },
        { caps: "SUNSET", script: "the best table in the cove", body: "The sun drops behind Lošinj and the olive-wood coals are ready. The terrace fills first at golden hour, so book ahead.", left: "terrace", right: "grill" },
        { caps: "NIGHT", script: "candles by the water", body: "Lanterns on the tables, a last glass of rakija, boats knocking softly at the pier. Nobody is in a hurry to leave.", left: "bluehour", right: "house" },
      ],
    },
    coast: { caps: "COME FOR THE FISH", script: "stay for the sea" },
    days: {
      eyebrow: "WAYS TO SPEND THE DAY",
      title: { caps: "DAYS IN THE COVE", script: "choose your rhythm" },
      body: "Arrive for a long lunch, stay for the sunset, or bring the whole family. There is no wrong way to spend a day at the konoba.",
      cards: [
        { caps: "LONG LUNCH", script: "under the pines", body: "Grilled fish, chard and potatoes, a carafe of white. Lunch here is not something you rush.", meta: "12:00 – 16:00 · Terrace", photo: "hands" },
        { caps: "SUNSET TABLE", script: "as the light turns gold", body: "The most asked-for tables in the cove, right on the water's edge. Book a day or two ahead in summer.", meta: "From 19:00 · Book ahead", photo: "terrace" },
        { caps: "YOUR OCCASION", script: "up to thirty guests", body: "Birthdays, family reunions, sailing crews. We set one long table and suggest a menu for you.", meta: "Groups of 9+ · Set menus", photo: "bluehour" },
        { caps: "BY BOAT", script: "tie up at our pier", body: "Four berths for guests, free for up to four hours. Call ahead or hail us on VHF channel 17.", meta: "Free up to 4 hours", photo: "boat" },
      ],
    },
    drink: {
      eyebrow: "AS THE DAY TURNS",
      word: "APERITIVO",
      body: "The turn of the day on the terrace: something cold and sour in hand, a glass of Žlahtina for the table, the last of the sun and no reason to leave just yet.",
    },
    gather: {
      eyebrow: "MADE FOR GATHERING",
      title: { caps: "FROM THE BOAT TO THE TABLE", script: "every reason to stay" },
      labels: ["FROM THE GRILL / BY THE KILO", "BUZARA / KVARNER CLASSIC", "BLACK RISOTTO / CUTTLEFISH INK", "PEKA / ORDER A DAY AHEAD"],
    },
    dayNight: {
      day: { caps: "THE DAY SLOWS", script: "into golden hour" },
      night: { caps: "NIGHT FALLS", script: "candles, wine, sea air" },
    },
    board: { eyebrow: "CHALKED UP THIS MORNING", kicker: "Today at Plavi Kamen", title: { caps: "TODAY'S CATCH", script: "when it's gone, it's gone" }, hours: "Opening hours" },
    cta: { caps: "YOUR TABLE AWAITS", script: "by the water" },
    footer: {
      title: { caps: "THE WORLD OF PLAVI KAMEN", script: "all of it, by the sea" },
      cols: [
        { title: "OUR STORY", script: "Three generations", body: "One stone house, one boat and a family that has cooked what the sea gives since 1987." },
        { title: "MENU", script: "From the boat", body: "Fish of the day, Kvarner scampi, black risotto and slow peka dishes." },
        { title: "GETTING HERE", script: "Find the cove", body: "By car, ferry, bus or boat. Parking, berths and the walk from the harbour." },
        { title: "QUESTIONS", script: "Before you come", body: "Groups, children, dogs, card payment, allergies and everything in between." },
      ],
      discover: "Discover",
    },
  },
  hr: {
    findUs: "Kako do nas",
    menu: "Jelovnik",
    heroArc: "RIBA OD JUTROS",
    believe: {
      lead: "VJERUJEMO U",
      lines: [
        { caps: "RIBU", script: "s našeg broda" },
        { caps: "MASLINOVO DRVO", script: "i polagan žar" },
        { caps: "MORE", script: "na korak od stola" },
        { caps: "DUGE RUČKOVE", script: "koji postanu večeri" },
      ],
    },
    journey: {
      eyebrow: "PLAVI KAMEN U LUČICI",
      intro: "Dan ovdje počinje na moru, a završava uz svijeće. Pet trenutaka iz dana u konobi, od broda u zoru do zadnje čaše uz more.",
      chapters: [
        { caps: "JUTRO", script: "u prvo svjetlo", body: "Luka izlazi brodom prije nego se mjesto probudi. Ono što donese, to je jelovnik: ništa smrznuto, ništa dovezeno izdaleka.", left: "boat", right: "catch" },
        { caps: "RUČAK", script: "dugo i polako", body: "Hlad borova, hladna žlahtina, škampi na buzaru. Terasa je korak iznad mora pa između jela čujete valove.", left: "scampi", right: "hands" },
        { caps: "PEKA", script: "ispod žara", body: "Hobotnica ili otočna janjetina, dva sata pod željeznim zvonom. Naručite dan ranije i naložit ćemo vatru za vas.", left: "peka", right: "grove" },
        { caps: "ZALAZAK", script: "najbolji stol u uvali", body: "Sunce zalazi iza Lošinja, a žar od masline je spreman. Terasa se u zlatnom satu prva popuni, zato rezervirajte.", left: "terrace", right: "grill" },
        { caps: "NOĆ", script: "svijeće uz more", body: "Fenjeri na stolovima, zadnja čašica rakije, brodovi tiho kucaju o mol. Nitko se ne žuri kući.", left: "bluehour", right: "house" },
      ],
    },
    coast: { caps: "DOĐITE ZBOG RIBE", script: "ostanite zbog mora" },
    days: {
      eyebrow: "KAKO PROVESTI DAN",
      title: { caps: "DANI U UVALI", script: "odaberite svoj ritam" },
      body: "Dođite na dugi ručak, ostanite za zalazak ili dovedite cijelu obitelj. Ne postoji pogrešan način da provedete dan u konobi.",
      cards: [
        { caps: "DUGI RUČAK", script: "u hladu borova", body: "Riba s gradela, blitva s krumpirom, bokal bijelog. Ručak se ovdje ne požuruje.", meta: "12:00 – 16:00 · Terasa", photo: "hands" },
        { caps: "STOL ZA ZALAZAK", script: "kad svjetlo postane zlatno", body: "Najtraženiji stolovi u uvali, tik uz more. Ljeti rezervirajte dan ili dva unaprijed.", meta: "Od 19:00 · Uz rezervaciju", photo: "terrace" },
        { caps: "VAŠA PRIGODA", script: "do trideset gostiju", body: "Rođendani, obiteljska okupljanja, jedriličarske posade. Postavimo jedan dugi stol i predložimo meni.", meta: "Grupe od 9+ · Meniji", photo: "bluehour" },
        { caps: "BRODOM", script: "vežite se uz naš mol", body: "Četiri veza za goste, besplatno do četiri sata. Najavite se telefonom ili na VHF kanalu 17.", meta: "Besplatno do 4 sata", photo: "boat" },
      ],
    },
    drink: {
      eyebrow: "KAD SE DAN OKRENE",
      word: "APERITIV",
      body: "Prijelaz dana na terasi: nešto hladno i kiselkasto u ruci, čaša žlahtine za stol, zadnje sunce i nijedan razlog da se već ide.",
    },
    gather: {
      eyebrow: "STVORENO ZA DRUŽENJE",
      title: { caps: "OD BRODA DO STOLA", script: "svaki razlog da ostanete" },
      labels: ["S GRADELA / PO KILOGRAMU", "BUZARA / KVARNERSKI KLASIK", "CRNI RIŽOT / CRNILO SIPE", "PEKA / NARUČITE DAN RANIJE"],
    },
    dayNight: {
      day: { caps: "DAN USPORI", script: "u zlatni sat" },
      night: { caps: "NOĆ SE SPUSTI", script: "svijeće, vino, morski zrak" },
    },
    board: { eyebrow: "ZAPISANO JUTROS", kicker: "Danas u Plavom Kamenu", title: { caps: "ULOV DANA", script: "kad nestane, nestane" }, hours: "Radno vrijeme" },
    cta: { caps: "VAŠ STOL ČEKA", script: "uz more" },
    footer: {
      title: { caps: "SVIJET PLAVOG KAMENA", script: "sve to, uz more" },
      cols: [
        { title: "O NAMA", script: "Tri generacije", body: "Jedna kamena kuća, jedan brod i obitelj koja od 1987. kuha ono što more da." },
        { title: "JELOVNIK", script: "S broda", body: "Riba dana, kvarnerski škampi, crni rižot i jela ispod peke." },
        { title: "KAKO DO NAS", script: "Pronađite uvalu", body: "Automobilom, trajektom, autobusom ili brodom. Parking, vezovi i put iz luke." },
        { title: "PITANJA", script: "Prije dolaska", body: "Grupe, djeca, psi, plaćanje karticom, alergije i sve između." },
      ],
      discover: "Saznajte više",
    },
  },
  de: {
    findUs: "Anfahrt",
    menu: "Speisekarte",
    heroArc: "FISCH VON HEUTE FRÜH",
    believe: {
      lead: "WIR GLAUBEN AN",
      lines: [
        { caps: "FISCH", script: "vom eigenen Boot" },
        { caps: "OLIVENHOLZ", script: "und sanfte Glut" },
        { caps: "DAS MEER", script: "einen Schritt vom Tisch" },
        { caps: "LANGE MITTAGE", script: "die zu Abenden werden" },
      ],
    },
    journey: {
      eyebrow: "PLAVI KAMEN IN LUČICA",
      intro: "Der Tag beginnt hier auf dem Wasser und endet bei Kerzenlicht. Fünf Momente aus einem Tag in der Konoba, vom Boot im Morgengrauen bis zum letzten Glas am Meer.",
      chapters: [
        { caps: "MORGEN", script: "im ersten Licht", body: "Luka fährt hinaus, bevor der Ort erwacht. Was er mitbringt, ist die Speisekarte: nichts Tiefgekühltes, nichts Eingeflogenes.", left: "boat", right: "catch" },
        { caps: "MITTAG", script: "lang und gemütlich", body: "Pinienschatten, kühler Žlahtina, Scampi Buzara. Die Terrasse liegt eine Stufe über dem Wasser, zwischen den Gängen hört man das Meer.", left: "scampi", right: "hands" },
        { caps: "PEKA", script: "unter der Glut", body: "Oktopus oder Lamm von der Insel, zwei Stunden unter der eisernen Glocke gegart. Einen Tag vorher bestellen, wir machen das Feuer.", left: "peka", right: "grove" },
        { caps: "ABEND", script: "der schönste Tisch der Bucht", body: "Die Sonne sinkt hinter Lošinj, die Olivenholzglut ist bereit. Zur goldenen Stunde ist die Terrasse zuerst voll, bitte reservieren.", left: "terrace", right: "grill" },
        { caps: "NACHT", script: "Kerzen am Wasser", body: "Laternen auf den Tischen, ein letzter Rakija, Boote stoßen leise an den Steg. Niemand hat es eilig.", left: "bluehour", right: "house" },
      ],
    },
    coast: { caps: "KOMMEN SIE FÜR DEN FISCH", script: "bleiben Sie für das Meer" },
    days: {
      eyebrow: "WIE MAN DEN TAG VERBRINGT",
      title: { caps: "TAGE IN DER BUCHT", script: "wählen Sie Ihren Rhythmus" },
      body: "Kommen Sie zum langen Mittagessen, bleiben Sie zum Sonnenuntergang oder bringen Sie die ganze Familie mit. Es gibt keinen falschen Weg.",
      cards: [
        { caps: "LANGES MITTAGESSEN", script: "unter Pinien", body: "Fisch vom Grill, Mangold mit Kartoffeln, eine Karaffe Weißwein. Hier wird nicht gehetzt.", meta: "12:00 – 16:00 · Terrasse", photo: "hands" },
        { caps: "TISCH ZUM SONNENUNTERGANG", script: "wenn das Licht golden wird", body: "Die gefragtesten Tische der Bucht, direkt am Wasser. Im Sommer ein, zwei Tage vorher reservieren.", meta: "Ab 19:00 · Mit Reservierung", photo: "terrace" },
        { caps: "IHR ANLASS", script: "bis zu dreißig Gäste", body: "Geburtstage, Familientreffen, Segelcrews. Wir decken eine lange Tafel und schlagen ein Menü vor.", meta: "Gruppen ab 9 · Menüs", photo: "bluehour" },
        { caps: "MIT DEM BOOT", script: "am eigenen Steg", body: "Vier Liegeplätze für Gäste, bis zu vier Stunden kostenlos. Vorher anrufen oder UKW-Kanal 17.", meta: "Bis 4 Stunden kostenlos", photo: "boat" },
      ],
    },
    drink: {
      eyebrow: "WENN DER TAG SICH NEIGT",
      word: "APERITIVO",
      body: "Der Wendepunkt des Tages auf der Terrasse: etwas Kaltes, Säuerliches in der Hand, ein Glas Žlahtina für den Tisch, die letzte Sonne und kein Grund, schon zu gehen.",
    },
    gather: {
      eyebrow: "GEMACHT FÜRS ZUSAMMENSEIN",
      title: { caps: "VOM BOOT AUF DEN TISCH", script: "jeder Grund zu bleiben" },
      labels: ["VOM GRILL / NACH KILO", "BUZARA / KVARNER-KLASSIKER", "SCHWARZES RISOTTO / SEPIATINTE", "PEKA / EINEN TAG VORHER"],
    },
    dayNight: {
      day: { caps: "DER TAG VERWEILT", script: "bis zur goldenen Stunde" },
      night: { caps: "DIE NACHT KOMMT", script: "Kerzen, Wein, Meeresluft" },
    },
    board: { eyebrow: "HEUTE FRÜH ANGESCHRIEBEN", kicker: "Heute im Plavi Kamen", title: { caps: "FANG DES TAGES", script: "wenn er weg ist, ist er weg" }, hours: "Öffnungszeiten" },
    cta: { caps: "IHR TISCH WARTET", script: "am Wasser" },
    footer: {
      title: { caps: "DIE WELT VON PLAVI KAMEN", script: "all das, am Meer" },
      cols: [
        { title: "ÜBER UNS", script: "Drei Generationen", body: "Ein Steinhaus, ein Boot und eine Familie, die seit 1987 kocht, was das Meer gibt." },
        { title: "SPEISEKARTE", script: "Vom Boot", body: "Fisch des Tages, Kvarner-Scampi, schwarzes Risotto und Gerichte aus der Peka." },
        { title: "ANFAHRT", script: "Die Bucht finden", body: "Mit Auto, Fähre, Bus oder Boot. Parken, Liegeplätze und der Weg vom Hafen." },
        { title: "FRAGEN", script: "Vor dem Besuch", body: "Gruppen, Kinder, Hunde, Kartenzahlung, Allergien und alles dazwischen." },
      ],
      discover: "Entdecken",
    },
  },
};
