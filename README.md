# Konoba Plavi Kamen — Luxury Coastal Konoba (demo)

A fictional, family-run fish konoba on the island of Cres, Kvarner, Croatia. Built by
**Kyro Studio** as a portfolio demo for hospitality clients ("get found by tourists before
they reach the coast"). Every venue detail, name, photo and video is invented or
AI-generated — no real restaurant, person or brand.

Live target: `konoba.demo.kyrostudio.eu`

## Stack

- Next.js 15 (App Router, TypeScript), Tailwind CSS v4
- GSAP + ScrollTrigger and Lenis for scroll-driven motion
- `next/image` (AVIF/WebP), lazy-loaded looping background videos
- Languages: Croatian (`/hr`), English (`/en`), German (`/de`) with translated slugs

## Home page, top to bottom

1. **Hero** — sea-and-sky video, arched title, scampi on a fork rising from a plate; on
   scroll the dish sinks behind the wave and the view turns to water from above.
2. **Plate story** — a plate rises and turns while five chapters (morning → night) are
   written on it; polaroids and line drawings drift past.
3. **Come for the fish** — overhead surf video with a painted sand edge.
4. **Days in the cove** — pinned horizontal cards.
5. **Aperitivo** — glass rising into the word, garnishes orbiting it.
6. **From the boat to the table** — dish gallery.
7. **Day → night** — the night scene wipes in over the golden-hour terrace.
8. **Today's catch** — printed-editorial board, steps through today's fish.
9. **Your table awaits** — the footer slides up over a foam video.

Signature features from the brief: catch of the day, seasonal hours with a live
open / closed-for-the-season state (`?preview=off-season` forces it), booking request
with terrace/indoor choice and large-group option, and directions (car, ferry, bus,
harbour, boat).

## Run it

```bash
npm install
npm run dev
```

Production build: `npm run build && npm start`.

## Where things live

| Path | What |
| --- | --- |
| `app/[locale]/` | Pages (home + `[slug]` for menu, book, visit, about, faq) |
| `components/coast/` | Home sections |
| `lib/content.ts` | Venue, menu, seasons, catch of the day, FAQ (mirrors the shared Supabase schema) |
| `lib/data.ts` | Data access — swap these bodies for Supabase queries |
| `lib/dict*.ts` | All copy in HR / EN / DE |
| `public/photos`, `public/cut`, `public/video` | AI-generated imagery and loops |
| `public/fonts/README.md` | How to drop in the licensed display fonts |

## Not done yet

- Booking API validates only; Supabase insert + Resend emails + `/admin` come with the
  shared starter.
- Licensed display fonts (see `public/fonts/README.md`); free look-alikes are used until then.
- HR/DE copy needs a native-speaker review; Lighthouse pass after deploy.
