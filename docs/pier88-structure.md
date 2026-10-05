# Pier88 Coast: structure reference for the konoba rebuild

Source: https://pier88coast.com (MONARQ, Awwwards nominee Aug 2026; WordPress + Elementor + GSAP).
Studied 4 Oct 2026 at a 1440×900 viewport. The full page is about 20,100px tall.

**Rule:** follow the section order, pacing and motion patterns below. Use only our own
copy, photos (lib/photos.ts), drawings, logo and brand. Do not copy their code, assets or text.

## Section order (top → height)
| # | Their section | What it does | Konoba equivalent |
|---|---|---|---|
| 1 | Hero `coastal-table-section` (900) | Sky and sea photo, headline arched over the horizon, a dish on a fork rising from a gold-rimmed plate; minimal header ("Find us" left, wordmark centre, menu icon right) | Arched "Plavi Kamen · Cres · Kvarner" over the cove; our own plate and fish illustration or cut-out photo |
| 2 | About editorial (1665) | Big mixed-type statement: uppercase serif words interleaved with italic script words ("fresh *seafood*", "ocean *air*") | Statement in Instrument Serif caps plus Caveat or italic words |
| 3 | Plate journey `#p88PlateJourney` (7380, pinned) | Giant plate stays centred; chapters 01/05 → 05/05 (Breakfast, Lunch…, Beyond) appear inside it; polaroids and hand-drawn doodles fly in around it; progress bar | Dawn catch → terrace lunch → peka → sunset → night, using our photos as polaroids |
| 4 | Coastal atmosphere (1260) | "Come for the coast, *stay for the feeling*" image collage | Cove / house / grove collage |
| 5 | Food experience (900; separate desktop and mobile versions) | "Ways to spend the day": horizontal choice of rhythms | Lunch / sunset / groups / by boat |
| 6 | Drinks / aperitivo (1035) | Afternoon drinks story | Žlahtina and rakija at the turn of the day |
| 7 | Aperitivo interlude (900) | "From the kitchen to the table": list of dish categories with hover previews | Menu categories with photo previews |
| 8 | Day / night switcher (900; mobile switcher) | Toggle or split between a day mood and a night mood | Terrace (day) ↔ bluehour (night) |
| 9 | Calendar directory (900, inverted colours) | "Seven dates" event list | Catch of the day board / seasonal hours |
| 10 | Waves CTA (900) | Animated waves to the booking call to action | Booking band with animated sea |
| 11 | Footer (900) | "The world of …", contact, story links | Our footer |

## Typography
Their fonts: a script-like display face, Cormorant-style serif, Plus Jakarta Sans and Inter.
We'll use our own pairing: Instrument Serif (caps and italic), Caveat for the script words, Inter for body text.

## Next steps
1. Hero: arched text plus a rising plate and dish (use the GSAP setup in components/Motion.tsx).
2. Pinned plate journey with 5 chapters and our polaroids and line doodles (draw new ones; don't trace theirs).
3. The remaining sections in the order above, reusing lib/content.ts and lib/dict.ts.
