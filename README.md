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
cp .env.example .env.local   # optional: without keys the site uses lib/content.ts
npm run dev
```

Production build: `npm run build && npm start`.

## Backend (Supabase, Resend, /admin)

1. In the Supabase SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`
   (regenerate it from `lib/content.ts` with `node --experimental-strip-types scripts/seed-sql.mts`).
2. Authentication → Users → add the owner login, then
   `insert into admins values ('konoba', '<user uuid>');`
3. Set the env vars from `.env.example` locally and in Vercel.

What happens then:

- **Booking:** the form posts to `/api/booking` → row in `booking_requests` (status
  `pending`) → email to `BOOKING_INBOX` and a "we received your request" email to the
  guest in their language. RLS: the public can only insert, never read.
- **/admin** (Supabase email + password, only users in `admins`): table requests with
  Confirm / Decline (emails the guest), the **catch of the day** editor, and a
  "closed now" switch with an optional reason.
- **Menu, hours and FAQ** are edited in the Supabase table editor. Pages re-render at
  most once a minute, and /admin changes publish at once. No redeploy.
- **Analytics:** Vercel Analytics (enable it in the project) and GA4 when
  `NEXT_PUBLIC_GA_ID` is set (Consent Mode, cookies denied by default). Both receive a
  `booking_submitted` event.

## Where things live

| Path | What |
| --- | --- |
| `app/[locale]/` | Pages (home + `[slug]` for menu, book, visit, about, faq) |
| `app/admin/` | Owner admin |
| `app/api/booking/` | Booking endpoint |
| `components/coast/` | Home sections |
| `lib/content.ts` | Built-in content and the fallback when Supabase is not set |
| `lib/data.ts` | Reads from Supabase, falls back to `lib/content.ts` |
| `lib/email.ts` | Booking emails (HR / EN / DE) |
| `lib/dict*.ts` | All copy in HR / EN / DE |
| `supabase/` | Schema with RLS, and seed data |
| `public/photos`, `public/cut`, `public/video` | AI-generated imagery and loops |
| `public/fonts/README.md` | How to drop in the licensed display fonts |

## Live setup

- Supabase project `konoba-plavi-kamen` (eu-central-1, ref `ljszqfwfqkexehkfkywi`): schema and
  seed applied, RLS checked (public reads content, can only insert bookings). Keys are set in
  Vercel for production, preview and development.
- Vercel project `luxury-coastal-konoba`; domain `konoba.demo.kyrostudio.eu` is added and waits
  for DNS on kyrostudio.eu:
  - `TXT _vercel.kyrostudio.eu` → `vc-domain-verify=konoba.demo.kyrostudio.eu,ceb60aaad35753b2f9ec`
  - `CNAME konoba.demo` → `cname.vercel-dns.com`
  Then set `NEXT_PUBLIC_SITE_URL=https://konoba.demo.kyrostudio.eu` in Vercel.

## Checks done (5 Oct 2026)

- PageSpeed Insights, mobile, home: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100 (`docs/proof/pagespeed-mobile-home.jpg`). Inner pages measure 90–98 with 100
  accessibility in Lighthouse mobile runs.
- Google Rich Results Test: Local business, Organization and Breadcrumbs valid on home;
  FAQ page valid (Google now shows FAQ rich results only for government and health sites).
- Test bookings from the local and the live site landed in `booking_requests` as pending.
- Phone-size run (Android emulation, 375 px): navigation, menu, booking slots, no overflow.

## Not done yet

- Owner login for /admin: create it in Supabase → Authentication → Users, then
  `insert into admins values ('konoba', '<user uuid>');`
- Resend: verify a sending domain, then set `RESEND_API_KEY`, `EMAIL_FROM`, `BOOKING_INBOX` in Vercel.
- GA4 measurement ID (`NEXT_PUBLIC_GA_ID`); turn on Web Analytics in the Vercel project.
- DNS records above for the custom domain.
- Licensed display fonts (see `public/fonts/README.md`); free look-alikes are used until then.
- Native-speaker sign-off on HR/DE (proofread once already); tests on a real iPhone and Android phone.
