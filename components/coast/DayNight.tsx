"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { coast } from "@/lib/dict-coast";
import type { Locale } from "@/lib/i18n";
import { whenIdle } from "@/lib/idle";
import { alts, photos, type PhotoKey } from "@/lib/photos";

/**
 * Day → night. The stage holds while the night scene wipes in from the left
 * edge. Each scene carries its own title, so the wipe line cuts through the
 * words and for a moment you read half of each.
 */
export function DayNight({ locale }: { locale: Locale }) {
  const t = coast[locale].dayNight;
  const root = useRef<HTMLElement>(null);

  useEffect(
    () =>
      whenIdle(() => {
        gsap.registerPlugin(ScrollTrigger);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ctx = gsap.context(() => {
          // Day holds first, then night wipes in from the left while zooming out
          // to rest; the day pushes in a touch as it is covered.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              scrub: reduce ? true : 0.6,
              // measure after the pinned sections above it have added their length
              refreshPriority: -1,
              invalidateOnRefresh: true,
            },
          });
          tl.set({}, {}, 1);
          tl.fromTo("[data-dn-night]", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power1.inOut" }, 0.28);
          tl.fromTo("[data-dn-bar]", { scaleX: 0.5 }, { scaleX: 1, duration: 0.5, ease: "power1.inOut" }, 0.28);
          if (!reduce) {
            tl.fromTo("[data-dn-night-img]", { scale: 1.38, xPercent: -6 }, { scale: 1.04, xPercent: 0, duration: 0.6, ease: "power2.out" }, 0.28);
            tl.fromTo("[data-dn-day-img]", { scale: 1.04 }, { scale: 1.16, duration: 0.55 }, 0.25);
            tl.fromTo("[data-dn-caption]", { y: 16 }, { y: -16, duration: 1 }, 0);
          }
        }, root);

        // late layout changes (fonts, images) — re-measure once things settle
        const settle = window.setTimeout(() => ScrollTrigger.refresh(), 1200);
        return () => {
          window.clearTimeout(settle);
          ctx.revert();
        };
      }),
    [],
  );

  return (
    <section ref={root} className="relative h-[280svh] bg-night" aria-label={`${t.day.caps} / ${t.night.caps}`}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Scene photo="terrace" locale={locale} caps={t.day.caps} script={t.day.script} imgAttr="data-dn-day-img" as="h2" />
        <div data-dn-night className="absolute inset-0 z-10" style={{ clipPath: "inset(0% 100% 0% 0%)" }}>
          <Scene photo="bluehour" locale={locale} caps={t.night.caps} script={t.night.script} imgAttr="data-dn-night-img" as="p" />
        </div>

        {/* two-part progress line: day half, night half */}
        <div className="absolute bottom-[6%] left-1/2 z-20 h-px w-36 -translate-x-1/2 bg-white/30" aria-hidden>
          <span data-dn-bar className="absolute inset-0 origin-left bg-white" style={{ transform: "scaleX(.5)" }} />
        </div>
      </div>
    </section>
  );
}

function Scene({
  photo,
  locale,
  caps,
  script,
  imgAttr,
  as: Tag,
}: {
  photo: PhotoKey;
  locale: Locale;
  caps: string;
  script: string;
  imgAttr: string;
  as: "h2" | "p";
}) {
  return (
    <div className="absolute inset-0">
      <div {...{ [imgAttr]: "" }} className="absolute inset-0 will-change-transform">
        <Image src={photos[photo]} alt={alts[photo][locale]} fill sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-[#0b0f16]/45" />
      <div data-dn-caption className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <Tag className="caps text-[clamp(2.6rem,6.4vw,6.2rem)] text-white">{caps}</Tag>
        <p className="script -mt-[0.1em] text-[clamp(1.9rem,3.6vw,3.4rem)] text-[#a9dca0]">{script}</p>
      </div>
    </div>
  );
}
