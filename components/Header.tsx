"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { venue } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { coast } from "@/lib/dict-coast";
import { href, locales, pageFromSlug, type Locale, type PageKey } from "@/lib/i18n";
import { Logo } from "./Logo";


export function currentPage(locale: Locale, pathname: string): PageKey {
  const slug = pathname.split("/")[2];
  return slug ? (pageFromSlug(locale, slug) ?? "home") : "home";
}

export function Header({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const page = currentPage(locale, pathname);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > window.innerHeight * 0.6);
      setHidden(y > 400 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const light = !solid && !open;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
        hidden && !open ? "-translate-y-full" : ""
      } ${solid && !open ? "bg-stone/85 text-sea shadow-[0_1px_0_rgba(23,48,79,.08)] backdrop-blur-xl" : ""} ${open ? "text-sea" : light ? "text-white" : ""}`}
    >
      <div className="container-k grid h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-24">
        <nav aria-label="Main" className="flex items-center gap-7">
          <button
            type="button"
            className="relative flex h-11 w-9 items-center justify-start md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`absolute h-px w-7 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1"}`} />
            <span className={`absolute h-px w-7 bg-current transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-1"}`} />
          </button>
          {(["visit", "menu"] as PageKey[]).map((p) => (
            <Link
              key={p}
              href={href(locale, p)}
              aria-current={page === p ? "page" : undefined}
              className="group relative hidden font-[family-name:var(--font-wide)] text-[1.15rem] uppercase tracking-[0.02em] md:inline"
            >
              {p === "visit" ? coast[locale].findUs : coast[locale].menu}
              <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
            </Link>
          ))}
        </nav>

        <Link href={href(locale, "home")} aria-label={venue.name} className="relative z-10 justify-self-center">
          <Logo />
        </Link>

        <div className="relative z-10 flex items-center justify-end gap-4 md:gap-6">
          <LangSwitch locale={locale} page={page} className="hidden lg:flex" />
          <Link
            href={href(locale, "book")}
            className={`hidden rounded-full border px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300 sm:inline-flex ${
              light ? "border-white/60 hover:bg-white hover:text-deep" : "border-deep/30 hover:bg-deep hover:text-stone"
            }`}
          >
            {t.nav.book}
          </Link>
          <button
            type="button"
            className="relative hidden h-11 w-9 items-center justify-end md:flex"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`absolute h-px w-8 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute h-px w-5 bg-current transition-all duration-500 ${open ? "w-8 -rotate-45" : "translate-y-1.5"}`} />
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`fixed inset-0 -z-0 flex flex-col bg-stone pt-28 text-sea transition-[clip-path] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
          open ? "[clip-path:inset(0_0_0_0)]" : "pointer-events-none [clip-path:inset(0_0_100%_0)]"
        }`}
        aria-hidden={!open}
      >
        <nav aria-label="Site" className="container-k flex flex-1 flex-col items-center justify-center text-center">
          {(["home", "menu", "book", "visit", "about", "faq"] as PageKey[]).map((p, i) => (
            <Link
              key={p}
              href={href(locale, p)}
              tabIndex={open ? 0 : -1}
              aria-current={page === p ? "page" : undefined}
              className={`caps py-2 text-[clamp(2.4rem,6vw,4.4rem)] transition-all duration-700 hover:text-ochre aria-[current=page]:text-ochre ${
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${150 + i * 50}ms` : "0ms" }}
            >
              {t.nav[p]}
            </Link>
          ))}
          <p className={`script mt-6 text-4xl text-sage transition-opacity delay-500 duration-700 ${open ? "opacity-100" : "opacity-0"}`}>{coast[locale].footer.title.script}</p>
        </nav>
        <div className="container-k flex items-center justify-between py-8 text-ink-soft">
          <LangSwitch locale={locale} page={page} className="flex" />
          <a href={`tel:${venue.phoneHref}`} tabIndex={open ? 0 : -1} className="text-sm">
            {venue.phone}
          </a>
        </div>
      </div>
    </header>

      {/* Phones: booking stays one thumb away */}
      {page !== "book" && (
        <Link
          href={href(locale, "book")}
          className={`fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-full bg-sea/95 py-2 pl-6 pr-2 text-stone shadow-2xl shadow-deep/30 backdrop-blur transition-all duration-500 sm:hidden ${
            solid && !open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
          }`}
        >
          <span className="text-[0.72rem] uppercase tracking-[0.22em]">{t.nav.book}</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ochre text-deep" aria-hidden>
            →
          </span>
        </Link>
      )}
    </>
  );
}

function LangSwitch({ locale, page, className = "" }: { locale: Locale; page: PageKey; className?: string }) {
  return (
    <div className={`items-center gap-3 ${className}`}>
      {locales.map((l) => (
        <Link
          key={l}
          href={href(l, page)}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className="label text-[0.68rem] opacity-55 transition-opacity hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:underline aria-[current=true]:underline-offset-4"
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
