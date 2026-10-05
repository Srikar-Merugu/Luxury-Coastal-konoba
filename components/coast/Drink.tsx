"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { cutouts, garnishes } from "@/lib/cutouts";
import { coast } from "@/lib/dict-coast";
import type { Locale } from "@/lib/i18n";

/**
 * Aperitivo. The glass rises into the word, the drawn lemon behind it turns,
 * monstera leaves drift in from the corners, and lime, lemon, ice and mint
 * circle the glass, each piece spinning as it goes round.
 */
export function Drink({ locale }: { locale: Locale }) {
  const t = coast[locale].drink;
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set("[data-a-ring]", { opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.7 },
      });
      // the glass rises into the word and settles
      tl.fromTo("[data-a-glass]", { y: "60vh", rotate: -7 }, { y: 0, rotate: 0, duration: 0.42, ease: "power2.out" }, 0)
        .to("[data-a-glass]", { y: "-10vh", rotate: 2, duration: 0.58 }, 0.42);
      // drawn lemon turns behind
      tl.fromTo("[data-a-lemon]", { rotate: -55, scale: 0.85 }, { rotate: 25, scale: 1.05, duration: 1 }, 0);
      // leaves drift in from the corners
      tl.fromTo("[data-a-leaf-r]", { y: "28vh", x: "6vw", rotate: -38 }, { y: "-22vh", x: 0, rotate: -14, duration: 1 }, 0);
      tl.fromTo("[data-a-leaf-l]", { y: "34vh", x: "-6vw", rotate: 16 }, { y: "-12vh", x: 0, rotate: -8, duration: 1 }, 0);
      // garnish ring: appears as the glass arrives, then keeps circling
      tl.fromTo("[data-a-ring]", { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.18);
      tl.fromTo("[data-a-orbit]", { rotate: -120 }, { rotate: 300, duration: 1 }, 0);
      gsap.utils.toArray<HTMLElement>("[data-a-piece]").forEach((el, i) => {
        // counter the orbit, plus each piece's own spin
        tl.fromTo(el, { rotate: 120 + i * 20 }, { rotate: -300 + (i % 2 ? 260 : -260), duration: 1 }, 0);
      });
      tl.to("[data-a-ring]", { opacity: 0, scale: 1.25, duration: 0.18 }, 0.82);

      gsap.fromTo(
        "[data-a-copy]",
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: root.current, start: "top 30%" } },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[115svh] overflow-hidden bg-[#f6f1e7]" aria-labelledby="drink-title">
      {/* monstera leaves, cropped by the edges */}
      <div data-a-leaf-r aria-hidden className="pointer-events-none absolute -right-[9vw] top-[4%] z-10 w-[34vw] max-w-[420px] sm:-right-[6vw] lg:w-[17vw]">
        <Image src={cutouts.monstera} alt="" sizes="(max-width: 1024px) 34vw, 17vw" className="h-auto w-full drop-shadow-[0_24px_30px_rgba(0,0,0,.16)]" />
      </div>
      <div data-a-leaf-l aria-hidden className="pointer-events-none absolute -left-[9vw] bottom-[6%] z-10 w-[34vw] max-w-[420px] sm:-left-[6vw] lg:w-[17vw]">
        <Image src={cutouts.monstera} alt="" sizes="(max-width: 1024px) 34vw, 17vw" className="h-auto w-full -scale-x-100 drop-shadow-[0_24px_30px_rgba(0,0,0,.16)]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full">
          {/* drawn lemon */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 w-[86vw] -translate-x-1/2 -translate-y-1/2 sm:w-[48vw] lg:w-[36vw]">
            <div data-a-lemon className="opacity-60">
              <Image src={cutouts.lemonDraw} alt="" sizes="(max-width: 640px) 86vw, 36vw" className="h-auto w-full" />
            </div>
          </div>

          {/* copy: kicker, word, note */}
          <div className="relative mx-auto w-fit px-4">
            <p data-a-copy className="label relative z-30 mb-2 text-[#2b2f8f] sm:mb-3">
              {t.eyebrow}
            </p>
            <h2 id="drink-title" data-a-copy className="caps whitespace-nowrap text-[clamp(3rem,12vw,9.6rem)] leading-none text-[#14137a] lg:text-[7vw]">
              {t.word}
            </h2>
            <p data-a-copy className="mx-auto mt-[58vw] max-w-[22rem] text-center text-[0.86rem] leading-relaxed text-[#4b4f9e] sm:mt-[30vw] md:absolute md:left-[73%] md:top-[calc(100%+3.2vw)] md:mt-0 md:w-[min(24rem,30vw)] md:max-w-none md:text-left">
              {t.body}
            </p>
          </div>

          {/* the glass with garnishes circling it */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[56vw] -translate-x-1/2 -translate-y-[47%] sm:w-[32vw] lg:w-[22vw]">
            <div aria-hidden className="absolute left-1/2 top-[44%] aspect-square w-[175%] -translate-x-1/2 -translate-y-1/2">
             <div data-a-ring className="h-full w-full opacity-0">
              <div data-a-orbit className="relative h-full w-full">
                {garnishes.map((g, i) => {
                  const a = (i / garnishes.length) * Math.PI * 2;
                  const size = [15, 15, 9, 14, 12, 13, 9, 9][i];
                  return (
                    <div
                      key={i}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${(50 + Math.cos(a) * 46).toFixed(2)}%`, top: `${(50 + Math.sin(a) * 46).toFixed(2)}%`, width: `${size}%` }}
                    >
                      <div data-a-piece>
                        <Image src={g} alt="" sizes="8vw" className="h-auto w-full drop-shadow-[0_10px_14px_rgba(0,0,0,.14)]" />
                      </div>
                    </div>
                  );
                })}
              </div>
             </div>
            </div>
            <div data-a-glass className="relative">
              <Image src={cutouts.margarita} alt="" sizes="(max-width: 640px) 56vw, 22vw" className="h-auto w-full drop-shadow-[0_40px_45px_rgba(40,40,60,.18)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
