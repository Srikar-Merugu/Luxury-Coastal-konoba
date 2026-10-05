"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { venue } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { coast } from "@/lib/dict-coast";
import { href, locales, pageFromSlug, type Locale, type PageKey } from "@/lib/i18n";
import { photos, type PhotoKey } from "@/lib/photos";
import { Logo } from "./Logo";

const navPhotos: [PageKey, PhotoKey][] = [
  ["home", "terrace"],
  ["menu", "grill"],
  ["book", "bluehour"],
  ["visit", "aerial"],
  ["about", "house"],
  ["faq", "grove"],
];

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
  const [hover, setHover] = useState<PageKey>("home");
  // The menu's photos load only once someone reaches for the menu, not on every page view.
  const [primed, setPrimed] = useState(false);
  const prime = () => setPrimed(true);
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
    if (open) {
      setHover(page);
      setPrimed(true);
    }
  }, [open, page]);

  const light = !solid && !open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          hidden && !open ? "-translate-y-full" : ""
        } ${solid && !open ? "bg-stone/85 text-sea shadow-[0_1px_0_rgba(23,48,79,.08)] backdrop-blur-xl" : ""} ${open || light ? "text-white" : ""}`}
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
              onPointerEnter={prime}
              onFocus={prime}
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

          <Link href={href(locale, "home")} className="relative z-10 justify-self-center">
            <Logo />
          </Link>

          <div className="relative z-10 flex items-center justify-end gap-4 md:gap-6">
            <LangSwitch locale={locale} page={page} className="hidden lg:flex" />
            <Link
              href={href(locale, "book")}
              className={`hidden rounded-full border px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300 sm:inline-flex ${
                light || open ? "border-white/60 hover:bg-white hover:text-deep" : "border-deep/30 hover:bg-deep hover:text-stone"
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
              onPointerEnter={prime}
              onFocus={prime}
            >
              <span className={`absolute h-px w-8 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
              <span className={`absolute h-px w-5 bg-current transition-all duration-500 ${open ? "w-8 -rotate-45" : "translate-y-1.5"}`} />
            </button>
          </div>
        </div>

        {/* Site menu: teal panel slides in from the left, photo of the hovered page on the right */}
        <div id="mobile-nav" className={`fixed inset-0 -z-10 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
          <div className={`absolute inset-0 bg-deep transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)}>
            {primed &&
              navPhotos.map(([key, photo]) => (
                <div
                  key={key}
                  className={`absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] ${
                    hover === key && open ? "scale-100 opacity-100" : "scale-110 opacity-0"
                  }`}
                >
                  <Image src={photos[photo]} alt="" fill sizes="60vw" className="object-cover" />
                </div>
              ))}
            <div className="absolute inset-0 bg-deep/15" />
          </div>

          <div
            className={`absolute inset-y-0 left-0 flex w-full flex-col overflow-hidden bg-[#0b5f6e]/92 backdrop-blur-md transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] md:w-[46%] lg:w-[40%] ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <svg viewBox="0 0 40 32" aria-hidden className="pointer-events-none absolute -left-[20%] top-[18%] w-[140%] text-white/[0.06]">
              <path d="M4 18C2 9 10 3 20 3c10 0 17 5 16 14-1 8-8 12-17 12C11 29 6 25 4 18z" fill="none" stroke="currentColor" strokeWidth="3.4" />
              <path d="M9 17c3-2.5 6-2.5 9 0s6 2.5 9 0 4-1.6 5-1" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
            </svg>

            <nav aria-label="Site" className="relative flex flex-1 flex-col justify-center px-6 pt-24 sm:px-10 lg:px-[3.2vw]">
              {(["home", "menu", "book", "visit", "about", "faq"] as PageKey[]).map((p, i) => (
                <Link
                  key={p}
                  href={href(locale, p)}
                  tabIndex={open ? 0 : -1}
                  aria-current={page === p ? "page" : undefined}
                  onMouseEnter={() => setHover(p)}
                  onFocus={() => setHover(p)}
                  className={`caps block py-[0.12em] text-[clamp(2.3rem,3.6vw,3.6rem)] text-white transition-[opacity,transform,color] duration-700 hover:translate-x-2 hover:text-[#cfe6dc] aria-[current=page]:text-[#cfe6dc] ${
                    open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  }`}
                  style={{ transitionDelay: open ? `${250 + i * 60}ms` : "0ms" }}
                >
                  {t.nav[p]}
                </Link>
              ))}
            </nav>

            <div
              className={`relative flex items-end justify-between gap-6 px-6 pb-8 text-white transition-opacity delay-700 duration-700 sm:px-10 lg:px-[3.2vw] ${open ? "opacity-100" : "opacity-0"}`}
            >
              <Link
                href={href(locale, "visit")}
                tabIndex={open ? 0 : -1}
                className="caps border-b border-white/70 pb-0.5 text-[1.05rem] hover:border-transparent"
              >
                {coast[locale].findUs}
              </Link>
              <div className="flex flex-col items-end gap-3">
                <LangSwitch locale={locale} page={page} className="flex" />
                <a href={`tel:${venue.phoneHref}`} tabIndex={open ? 0 : -1} className="text-xs tracking-wide text-white/80 hover:text-white">
                  {venue.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Phones: booking stays one thumb away */}
      {page !== "book" && (
        <Link
          data-booking-bar
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
