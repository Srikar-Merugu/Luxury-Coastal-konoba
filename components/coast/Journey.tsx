"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cutouts } from "@/lib/cutouts";
import { coast } from "@/lib/dict-coast";
import type { Locale } from "@/lib/i18n";
import { whenIdle } from "@/lib/idle";
import { photos } from "@/lib/photos";
import { doodles } from "../doodles";

/*
 * Scroll script, in "screens" of scroll distance:
 *   0   – 1.6  the plate rises from below the fold, turning, into the centre
 *   1.6 – …    one chapter per 1.4 screens is written on the plate
 * Polaroids and line drawings are not faded in and out: they ride up through
 * the frame on their own timing, so the page feels like it is drifting past
 * a table that stays put.
 */
const INTRO = 1.6;
const CHAPTER = 1.4;

export function Journey({ locale }: { locale: Locale }) {
  const t = coast[locale].journey;
  const n = t.chapters.length;
  const total = INTRO + n * CHAPTER;
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(-1);
  const [fill, setFill] = useState(0);

  useEffect(
    () =>
      whenIdle(() => {
        gsap.registerPlugin(ScrollTrigger);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              scrub: reduce ? true : 0.5,
              onUpdate: (self) => {
                const at = self.progress * total;
                setActive(at < INTRO ? -1 : Math.min(n - 1, Math.floor((at - INTRO) / CHAPTER)));
                setFill(Math.max(0, Math.min(1, (at - INTRO) / (n * CHAPTER))));
              },
            },
          });
          // keep the timeline exactly `total` long so positions line up with the script
          tl.set({}, {}, total);

          if (reduce) {
            gsap.set("[data-j-plate]", { xPercent: -50, yPercent: -50, y: 0 });
            return;
          }

          tl.fromTo(
            "[data-j-plate]",
            { xPercent: -50, yPercent: -50, y: "78vh" },
            { xPercent: -50, yPercent: -50, y: 0, duration: INTRO - 0.15, ease: "power2.out" },
            0.05,
          );
          tl.fromTo("[data-j-spin]", { rotate: -110 }, { rotate: 220, duration: total }, 0);

          gsap.utils.toArray<HTMLElement>("[data-j-float]").forEach((el) => {
            const start = Number(el.dataset.start);
            const span = Number(el.dataset.span);
            tl.fromTo(el, { y: "105vh", rotate: Number(el.dataset.r0) }, { y: "-75vh", rotate: Number(el.dataset.r1), duration: span }, start);
          });
        }, root);
        return () => ctx.revert();
      }),
    [n, total],
  );

  const chapterStart = (i: number) => INTRO + i * CHAPTER;

  return (
    <section ref={root} aria-label={t.eyebrow} className="relative bg-white" style={{ height: `${(total + 1) * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <p className="label absolute left-5 top-24 z-20 text-sea md:left-[4.5%] md:top-[11%]">{t.eyebrow}</p>

        <div className="absolute bottom-[5%] left-5 z-20 hidden max-w-[19rem] md:left-[4.5%] md:block">
          <span className="mb-4 block h-px w-28 bg-sea/50" />
          <p className="text-[0.78rem] leading-relaxed text-sea/80">{t.intro}</p>
        </div>

        {/* drifting polaroids and drawings */}
        {t.chapters.map((c, i) => {
          const s = chapterStart(i);
          const D1 = doodles[i % doodles.length];
          const D2 = doodles[(i + 3) % doodles.length];
          const leftFirst = i % 2 === 0;
          return (
            <div key={c.caps} aria-hidden className="pointer-events-none">
              {/* first polaroid: arrives as the chapter is written */}
              <figure
                data-j-float
                data-start={s - (i === 0 ? 0.55 : 0.75)}
                data-span={2.2}
                data-r0={leftFirst ? -2 : 3}
                data-r1={leftFirst ? -7 : 7}
                className={`absolute top-0 z-10 w-[36vw] bg-white p-1.5 pb-7 shadow-[0_24px_50px_rgba(23,48,79,.18)] will-change-transform sm:w-[24vw] lg:w-[18vw] lg:p-2.5 lg:pb-10 ${
                  leftFirst ? "left-[3%] lg:left-[4%]" : "right-[3%] lg:right-[5%]"
                }`}
                style={{ transform: "translateY(105vh)" }}
              >
                <div className="relative aspect-[4/5]">
                  <Image src={photos[c.left]} alt="" fill sizes="(max-width: 1024px) 36vw, 18vw" className="object-cover" />
                </div>
              </figure>
              {/* second polaroid on the other side, a little later */}
              <figure
                data-j-float
                data-start={s + 0.35}
                data-span={2.1}
                data-r0={leftFirst ? 4 : -3}
                data-r1={leftFirst ? 9 : -8}
                className={`absolute top-0 z-10 w-[30vw] bg-white p-1.5 pb-7 shadow-[0_24px_50px_rgba(23,48,79,.18)] will-change-transform sm:w-[20vw] lg:w-[14vw] lg:p-2 lg:pb-8 ${
                  leftFirst ? "right-[4%] lg:right-[8%]" : "left-[4%] lg:left-[9%]"
                }`}
                style={{ transform: "translateY(105vh)" }}
              >
                <div className="relative aspect-square">
                  <Image src={photos[c.right]} alt="" fill sizes="(max-width: 1024px) 30vw, 14vw" className="object-cover" />
                </div>
              </figure>
              {/* line drawings */}
              <div
                data-j-float
                data-start={s - (i === 0 ? 1.3 : 0.95)}
                data-span={1.9}
                data-r0={-8}
                data-r1={10}
                className={`absolute top-0 z-0 w-24 text-sage will-change-transform md:w-32 lg:w-40 ${leftFirst ? "left-[5%] lg:left-[6%]" : "right-[6%] lg:right-[9%]"}`}
                style={{ transform: "translateY(105vh)" }}
              >
                <D1 className="h-auto w-full" />
              </div>
              <div
                data-j-float
                data-start={s + 0.15}
                data-span={1.8}
                data-r0={6}
                data-r1={-6}
                className={`absolute top-0 z-0 hidden w-24 text-sage will-change-transform md:block lg:w-32 ${leftFirst ? "right-[16%] lg:right-[20%]" : "left-[17%] lg:left-[21%]"}`}
                style={{ transform: "translateY(105vh)" }}
              >
                <D2 className="h-auto w-full" />
              </div>
            </div>
          );
        })}

        {/* the plate */}
        <div
          data-j-plate
          className="absolute left-1/2 top-1/2 z-[5] w-[min(96vw,74svh)] will-change-transform lg:w-[min(50vw,90svh)]"
          style={{ transform: "translate(-50%, -50%) translateY(78vh)" }}
        >
          <div data-j-spin className="will-change-transform" style={{ transform: "rotate(-110deg)" }}>
            <Image
              src={cutouts.plateTop}
              alt=""
              sizes="(max-width: 1024px) 96vw, 50vw"
              className="h-auto w-full drop-shadow-[0_30px_40px_rgba(23,48,79,.14)]"
            />
          </div>

          <div className="absolute inset-[25%] grid place-items-center text-center">
            {t.chapters.map((c, i) => (
              <div
                key={c.caps}
                aria-hidden={active !== i}
                className={`col-start-1 row-start-1 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
                  active === i ? "translate-y-0 opacity-100" : i < active ? "-translate-y-5 opacity-0" : "translate-y-5 opacity-0"
                }`}
              >
                <h2 className="caps text-[clamp(1.9rem,5.4vw,4.4rem)] text-sea">{c.caps}</h2>
                <p className="script -mt-[0.45em] text-[clamp(1.4rem,3vw,2.5rem)] text-sage/90">{c.script}</p>
                <p className="mx-auto mt-4 max-w-[21rem] text-[clamp(0.68rem,1.05vw,0.86rem)] leading-relaxed text-ink-soft/80">{c.body}</p>
              </div>
            ))}
            <div
              className={`absolute bottom-[6%] left-1/2 w-[64%] -translate-x-1/2 transition-opacity duration-500 ${active < 0 ? "opacity-0" : "opacity-100"}`}
              aria-hidden
            >
              <div className="flex justify-between text-[0.62rem] tracking-[0.2em] text-sea/70">
                <span>0{Math.max(0, active) + 1}</span>
                <span>/ 0{n}</span>
              </div>
              <span className="relative mt-2 block h-px bg-sea/15">
                <span
                  className="absolute inset-0 origin-left bg-sea transition-transform duration-300"
                  style={{ transform: `scaleX(${0.06 + fill * 0.94})` }}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
