import Link from "next/link";
import { venue } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { coast } from "@/lib/dict-coast";
import { href, localeNames, locales, type Locale, type PageKey } from "@/lib/i18n";

const colPages: PageKey[] = ["about", "menu", "visit", "faq"];

/** "Three generations" → Three <b>generations</b>: plain first word, bold rest. */
function Sub({ text }: { text: string }) {
  const [first, ...rest] = text.split(" ");
  return (
    <>
      {first} {rest.length > 0 && <strong className="font-semibold">{rest.join(" ")}</strong>}
    </>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const f = coast[locale].footer;
  return (
    <footer data-site-footer className="relative z-10 bg-[#0b5f6e] text-white">
      {/* the water above fades into the footer */}
      <div aria-hidden data-footer-fade className="pointer-events-none absolute inset-x-0 bottom-full hidden h-[38svh] bg-gradient-to-b from-transparent to-[#0b5f6e]" />

      <div className="relative min-h-[100svh] overflow-hidden pb-24 sm:pb-0">
        {/* giant faint mark */}
        <svg
          viewBox="0 0 40 32"
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[54%] w-[150vw] max-w-none -translate-x-1/2 -translate-y-1/2 text-white/[0.07] sm:w-[110vw]"
        >
          <path d="M4 18C2 9 10 3 20 3c10 0 17 5 16 14-1 8-8 12-17 12C11 29 6 25 4 18z" fill="none" stroke="currentColor" strokeWidth="3.4" />
          <path d="M9 17c3-2.5 6-2.5 9 0s6 2.5 9 0 4-1.6 5-1" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        </svg>

        <div className="container-k relative flex min-h-[100svh] flex-col pt-20 md:pt-[8vh]">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="caps text-[clamp(2rem,3.6vw,3.6rem)]">{f.title.caps}</p>
              <p className="script mt-1 text-[clamp(2.2rem,3.8vw,3.8rem)] leading-none">{f.title.script}</p>
              <p className="mt-8 text-sm text-white/90">
                {t.footer.contact} –{" "}
                <a href={`mailto:${venue.email}`} className="font-semibold italic hover:underline">
                  {venue.email}
                </a>
              </p>
            </div>
            <Link href={href(locale, "home")} aria-label={venue.name} className="hidden shrink-0 flex-col items-end leading-none md:flex">
              <span className="caps text-[1.9rem] tracking-[0.1em]">Plavi Kamen</span>
              <span className="script -mt-1 text-xl">konoba</span>
            </Link>
          </div>

          <div className="mt-auto grid gap-12 pt-20 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {f.cols.map((c, i) => (
              <div key={c.title}>
                <h2 className="caps text-[1.75rem]">{c.title}</h2>
                <p className="mt-1 text-[0.95rem]">
                  <Sub text={c.script} />
                </p>
                <p className="mt-5 max-w-sm text-[0.82rem] leading-relaxed text-white/80">{c.body}</p>
                <Link
                  href={href(locale, colPages[i])}
                  className="caps mt-6 inline-block border-b border-white/80 pb-0.5 text-[1.05rem] transition-colors hover:border-transparent hover:text-white/70"
                >
                  {f.discover}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-5 border-t border-white/25 py-8 md:flex-row md:items-center md:justify-between">
            <p className="caps text-[0.95rem] tracking-[0.02em] text-white/85">
              © {new Date().getFullYear()} {venue.name}. ·{" "}
              <a href="https://kyrostudio.eu" className="border-b border-white/60 hover:border-transparent">
                {t.footer.demo}
              </a>
            </p>
            <div className="flex items-center gap-6">
              <nav aria-label={t.footer.language} className="flex gap-4 text-[0.68rem] uppercase tracking-[0.2em]">
                {locales.map((l) => (
                  <Link key={l} href={href(l, "home")} hrefLang={l} aria-current={l === locale ? "true" : undefined} className="text-white/60 hover:text-white aria-[current=true]:text-white">
                    {localeNames[l].slice(0, 2)}
                  </Link>
                ))}
              </nav>
              <a href={`https://wa.me/${venue.phoneHref.replace("+", "")}`} aria-label="WhatsApp" className="hover:opacity-70">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 4 3.5 1.5.6 2.1.7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2z" />
                </svg>
              </a>
              <a href={`tel:${venue.phoneHref}`} aria-label={venue.phone} className="hover:opacity-70">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                </svg>
              </a>
              <a href={`mailto:${venue.email}`} aria-label={venue.email} className="hover:opacity-70">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
