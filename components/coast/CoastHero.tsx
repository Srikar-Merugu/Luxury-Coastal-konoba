"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cutouts } from "@/lib/cutouts";
import { coast } from "@/lib/dict-coast";
import type { Locale } from "@/lib/i18n";
import { whenIdle } from "@/lib/idle";
import { alts, photos } from "@/lib/photos";
import { Wave } from "./Wave";

/**
 * Sea and sky, the title arched over the horizon, and a plate rising from
 * below with the morning's scampi on a fork. On scroll the fork lifts, the
 * title drifts up and the sea sinks away.
 */
export function CoastHero({ locale }: { locale: Locale }) {
  const t = coast[locale];
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .fromTo("[data-h-bg]", { scale: 1.18 }, { scale: 1, duration: 2.6 }, 0)
        .fromTo("[data-h-arc]", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.8 }, 0.3)
        // no fade on the plate: it is the largest image, so it must paint straight away
        .fromTo("[data-h-plate]", { yPercent: 40 }, { yPercent: 0, duration: 1.8 }, 0.5)
        .fromTo("[data-h-fork]", { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 2 }, 0.75);
    }, root);

    // Scroll exit is only needed once the visitor scrolls; build it at idle.
    const stopScroll = whenIdle(() => {
      const scrollCtx = gsap.context(() => {
        // Held in place for a beat (the section is taller than the screen and its
        // stage is sticky): the dish sinks behind the wave, the title floats off
        // and the horizon gives way to clear water seen from above.
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 } })
          .to("[data-h-arc]", { y: "-22vh", opacity: 0, ease: "none", duration: 0.45 }, 0)
          .to("[data-h-fork]", { y: "78vh", ease: "power1.in", duration: 0.75 }, 0)
          .to("[data-h-plate]", { y: "62vh", ease: "power1.in", duration: 0.8 }, 0.08)
          .to("[data-h-bg]", { scale: 1.12, ease: "none", duration: 1 }, 0)
          .fromTo("[data-h-water]", { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, ease: "none", duration: 0.55 }, 0.4);
      }, root);
      return () => scrollCtx.revert();
    });
    return () => {
      stopScroll();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} className="relative h-[175svh] bg-white">
      <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden bg-foam">
        <div data-h-bg className="absolute inset-0 will-change-transform">
          <Image
            src={photos.opensea}
            alt={alts.opensea[locale]}
            fill
            loading="eager"
            sizes="100vw"
            quality={80}
            placeholder="blur"
            className="object-cover object-[center_70%]"
          />
          <SeaVideo />
        </div>
        {/* Clear water from above, faded in as the dish sinks */}
        <div data-h-water className="absolute inset-0 opacity-0 will-change-transform">
          <Image src={photos.aerial} alt="" fill sizes="100vw" className="object-cover object-[center_40%]" />
        </div>
        {/* A soft vignette keeps the white title readable on bright skies */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep/35 via-deep/10 to-transparent" />

        <h1 className="sr-only">{t.heroArc}</h1>
        <svg
          data-h-arc
          viewBox="0 0 1000 300"
          aria-hidden
          className="absolute left-1/2 top-[19%] w-[104%] max-w-none -translate-x-1/2 sm:top-[17%] sm:w-[86%] lg:top-[19%] lg:w-[66%] xl:w-[62%]"
        >
          <defs>
            <path id="hero-arc" d="M40 290 Q500 -60 960 290" />
            <filter id="arc-shadow" x="-10%" y="-30%" width="120%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="5" floodColor="#0b2340" floodOpacity=".3" />
            </filter>
          </defs>
          <text
            className="fill-white"
            stroke="#fff"
            strokeWidth={1.4}
            paintOrder="stroke"
            filter="url(#arc-shadow)"
            style={{ fontFamily: "var(--font-wide)", fontSize: 80, fontWeight: 400, letterSpacing: 0 }}
          >
            <textPath href="#hero-arc" startOffset="50%" textAnchor="middle">
              {t.heroArc}
            </textPath>
          </text>
        </svg>

        {/* Round plate, tipped towards us, sitting low behind the wave */}
        <div
          data-h-plate
          className="absolute left-1/2 top-[66%] w-[104vw] -translate-x-1/2 will-change-transform sm:top-[64%] sm:w-[70vw] lg:top-[67%] lg:w-[48vw]"
          style={{ perspective: "1600px" }}
        >
          <div style={{ transform: "rotateX(42deg)", transformOrigin: "50% 0%" }}>
            <Image
              src={cutouts.plateTop}
              alt=""
              sizes="(max-width: 640px) 104vw, 48vw"
              // the largest element on first paint: fetched first, ahead of the sky and the fork
              priority
              fetchPriority="high"
              className="h-auto w-full drop-shadow-[0_40px_50px_rgba(23,48,79,.25)]"
            />
          </div>
        </div>

        {/* The scampi on its fork, rising out of the plate */}
        <div
          data-h-fork
          className="absolute left-1/2 top-[46%] z-[5] w-[62vw] -translate-x-[48%] will-change-transform [mask-image:linear-gradient(to_bottom,black_72%,transparent_96%)] lg:[mask-image:none] sm:top-[42%] sm:w-[40vw] lg:top-[41%] lg:w-[34vw] xl:w-[32vw]"
        >
          <Image
            src={cutouts.fork}
            alt=""
            sizes="(max-width: 640px) 62vw, 34vw"
            loading="eager"
            className="h-auto w-full lg:drop-shadow-[0_30px_36px_rgba(23,48,79,.3)]"
          />
        </div>

        <Wave className="text-white" />
      </div>
    </section>
  );
}

/**
 * Looping sea film over the poster photo. Starts once the page has settled,
 * fades in when it is actually playing, and is skipped for reduced motion
 * or data-saver. Phones get a lighter 960px encode.
 */
function SeaVideo() {
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || conn?.saveData) return;
    setSmall(window.matchMedia("(max-width: 767px)").matches);
    const id = window.setTimeout(() => setOn(true), 400);
    return () => window.clearTimeout(id);
  }, []);
  if (!on) return null;
  const base = small ? "/video/sea-960" : "/video/sea";
  return (
    <video
      className={`absolute inset-0 h-full w-full object-cover object-[center_70%] transition-opacity duration-[1200ms] ${playing ? "opacity-100" : "opacity-0"}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      onPlaying={() => setPlaying(true)}
    >
      <source src={`${base}.webm?v=3`} type="video/webm" />
      <source src={`${base}.mp4?v=3`} type="video/mp4" />
    </video>
  );
}
