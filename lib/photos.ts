/**
 * Photography. All AI-generated for this fictional venue (Freepik, Seedream 5 Pro),
 * no real restaurant, person or brand. Static imports give next/image the
 * dimensions and a blur placeholder; it serves AVIF/WebP at the right size.
 */
import aerial from "@/public/photos/aerial.jpg";
import bluehour from "@/public/photos/bluehour.jpg";
import beach from "@/public/photos/beach.jpg";
import boat from "@/public/photos/boat.jpg";
import catchPhoto from "@/public/photos/catch.jpg";
import foam from "@/public/photos/foam.jpg";
import grill from "@/public/photos/grill.jpg";
import grove from "@/public/photos/grove.jpg";
import hands from "@/public/photos/hands.jpg";
import house from "@/public/photos/house.jpg";
import peka from "@/public/photos/peka.jpg";
import risotto from "@/public/photos/risotto.jpg";
import scampi from "@/public/photos/scampi.jpg";
import opensea from "@/public/photos/opensea.jpg";
import seasky from "@/public/photos/seasky.jpg";
import terrace from "@/public/photos/terrace.jpg";
import type { Locale } from "./i18n";

export const photos = { aerial, beach, foam, bluehour, boat, catch: catchPhoto, grill, grove, hands, house, peka, risotto, scampi, seasky, opensea, terrace };
export type PhotoKey = keyof typeof photos;

export const alts: Record<PhotoKey, Record<Locale, string>> = {
  terrace: {
    en: "Konoba terrace with set tables a step above the turquoise sea, a wooden fishing boat moored alongside",
    hr: "Terasa konobe s postavljenim stolovima korak iznad tirkiznog mora, uz nju privezan drveni ribarski brod",
    de: "Terrasse der Konoba mit gedeckten Tischen direkt über dem türkisen Meer, daneben ein hölzernes Fischerboot",
  },
  aerial: {
    en: "Aerial view of a quiet cove with clear turquoise water, pine trees and a small stone pier",
    hr: "Pogled iz zraka na mirnu uvalu s tirkiznim morem, borovima i malim kamenim molom",
    de: "Luftaufnahme einer stillen Bucht mit türkisem Wasser, Pinien und einem kleinen Steinsteg",
  },
  grill: {
    en: "Whole gilt-head bream grilling over olive wood embers with lemon and rosemary",
    hr: "Orada na gradelama nad žarom od maslinovog drva, s limunom i ružmarinom",
    de: "Ganze Dorade auf dem Grill über Olivenholzglut mit Zitrone und Rosmarin",
  },
  scampi: {
    en: "Kvarner scampi buzara in a blue-rimmed dish with toasted bread and white wine",
    hr: "Kvarnerski škampi na buzaru u zdjeli s plavim rubom, uz prepečeni kruh i bijelo vino",
    de: "Kvarner-Scampi Buzara in einer Schale mit blauem Rand, dazu geröstetes Brot und Weißwein",
  },
  risotto: {
    en: "Black cuttlefish risotto on a white plate with a lemon wedge",
    hr: "Crni rižot od sipe na bijelom tanjuru s kriškom limuna",
    de: "Schwarzes Sepia-Risotto auf einem weißen Teller mit Zitronenspalte",
  },
  boat: {
    en: "A fisherman bringing a wooden boat into the harbour at dawn",
    hr: "Ribar u zoru uvodi drveni brod u luku",
    de: "Ein Fischer steuert sein Holzboot im Morgengrauen in den Hafen",
  },
  house: {
    en: "Stone house with sea-blue shutters, bougainvillea and herbs in terracotta pots",
    hr: "Kamena kuća s plavim škurama, bugenvilijom i začinskim biljem u teglama",
    de: "Steinhaus mit meerblauen Fensterläden, Bougainvillea und Kräutern in Terrakottatöpfen",
  },
  hands: {
    en: "Olive oil poured from a ceramic jug over grilled vegetables, sea in the background",
    hr: "Maslinovo ulje iz keramičkog vrča prelijeva se preko povrća s gradela, u pozadini more",
    de: "Olivenöl wird aus einem Tonkrug über gegrilltes Gemüse gegossen, im Hintergrund das Meer",
  },
  peka: {
    en: "The peka lid lifted to reveal octopus and potatoes roasted under embers",
    hr: "Podignuti poklopac peke otkriva hobotnicu i krumpir pečene pod žarom",
    de: "Der Peka-Deckel wird gehoben, darunter unter Glut gegarter Oktopus mit Kartoffeln",
  },
  grove: {
    en: "Old olive grove with dry stone walls behind the house",
    hr: "Stari maslinik sa suhozidima iza kuće",
    de: "Alter Olivenhain mit Trockensteinmauern hinter dem Haus",
  },
  catch: {
    en: "This morning's catch on ice: bream, red mullet, squid and langoustines",
    hr: "Jutrošnji ulov na ledu: orade, trlje, lignje i škampi",
    de: "Der Fang von heute früh auf Eis: Doraden, Rotbarben, Tintenfisch und Scampi",
  },
  beach: {
    en: "Turquoise water and white surf washing onto pale sand, seen from above",
    hr: "Tirkizno more i bijela pjena koja se razlijeva po svijetlom pijesku, pogled odozgo",
    de: "Türkises Wasser und weiße Brandung auf hellem Sand, von oben gesehen",
  },
  foam: {
    en: "Lace-like sea foam drifting over shallow turquoise water, seen from above",
    hr: "Morska pjena poput čipke nad plitkim tirkiznim morem, pogled odozgo",
    de: "Spitzenartiger Meerschaum über flachem, türkisem Wasser, von oben",
  },
  opensea: {
    en: "Open Adriatic sea under a summer sky with long feathery clouds",
    hr: "Otvoreno Jadransko more pod ljetnim nebom s dugim perjastim oblacima",
    de: "Offene Adria unter einem Sommerhimmel mit langen Federwolken",
  },
  seasky: {
    en: "Calm turquoise Adriatic sea under a pale summer sky, seen from a stone terrace",
    hr: "Mirno tirkizno Jadransko more pod blijedim ljetnim nebom, pogled s kamene terase",
    de: "Ruhiges türkises Adriatisches Meer unter blassem Sommerhimmel, von einer Steinterrasse aus",
  },
  bluehour: {
    en: "The terrace at blue hour, candles and string lights reflected in the calm sea",
    hr: "Terasa u plavom satu, svijeće i lampice odražavaju se u mirnom moru",
    de: "Die Terrasse zur blauen Stunde, Kerzen und Lichterketten spiegeln sich im ruhigen Meer",
  },
};
