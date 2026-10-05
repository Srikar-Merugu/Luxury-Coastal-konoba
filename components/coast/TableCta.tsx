"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDict } from "@/lib/dict";
import { coast } from "@/lib/dict-coast";
import { href, type Locale } from "@/lib/i18n";
import { photos } from "@/lib/photos";

/**
 * Closing call to action over foam lacing across shallow water. The section
 * is twice the screen tall with a sticky stage, and the footer is pulled up
 * over its second half (see globals.css), so the water stays put while the
 * teal footer slides over it and deepens the tint.
 */
export function TableCta({ locale }: { locale: Locale }) {
  const t = coast[locale].cta;
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-cta-copy]",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.3, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: root.current, start: "top 55%" } },
      );
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.5, refreshPriority: -1 } })
        .to("[data-cta-copy-wrap]", { y: "-30vh", ease: "none" }, 0)
        .fromTo("[data-cta-tint]", { opacity: 0 }, { opacity: 1, ease: "none" }, 0)
        .fromTo("[data-cta-media]", { scale: 1 }, { scale: 1.1, ease: "none" }, 0);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} data-cta className="relative h-[200svh]" aria-labelledby="cta-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-teal">
        <div data-cta-media className="absolute inset-0 will-change-transform">
          <Image src={photos.foam} alt="" fill sizes="100vw" className="object-cover" />
          <FoamVideo />
        </div>
        <div className="absolute inset-0 bg-[#0a3b47]/10" />
        <div data-cta-tint className="absolute inset-0 bg-gradient-to-b from-[#0b5f6e]/30 to-[#0b5f6e]/80 opacity-0" />

        <div data-cta-copy-wrap className="relative flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <h2 id="cta-title" data-cta-copy className="caps text-[clamp(2.6rem,5.6vw,5.4rem)] drop-shadow-[0_2px_16px_rgba(0,40,60,.18)]">
            {t.caps}
          </h2>
          <p data-cta-copy className="script -mt-[0.25em] text-[clamp(2rem,3.6vw,3.4rem)]">
            {t.script}
          </p>
          <div data-cta-copy className="mt-10">
            <Link
              href={href(locale, "book")}
              className="inline-flex bg-white px-10 py-5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[#1f2a8a] transition-colors duration-300 hover:bg-[#1f2a8a] hover:text-white"
            >
              {getDict(locale).nav.book}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FoamVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || conn?.saveData) return;
    setSmall(window.matchMedia("(max-width: 767px)").matches);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const base = small ? "/video/foam-960" : "/video/foam";
  return (
    <div ref={ref} className="absolute inset-0">
      {on && (
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          onPlaying={() => setPlaying(true)}
        >
          <source src={`${base}.webm`} type="video/webm" />
          <source src={`${base}.mp4`} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
