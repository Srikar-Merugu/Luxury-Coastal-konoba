"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { whenIdle } from "@/lib/idle";

/**
 * One motion layer for the whole site, driven by data attributes so pages
 * stay server components:
 *
 *   data-split            words rise from behind a mask (on scroll; "load" = immediately)
 *   data-reveal           fade + lift
 *   data-clip             image unmasks bottom→top while it settles from a zoom
 *   data-parallax="0.12"  drifts against the scroll
 *   data-scrub-words      words light up as you read (scroll-scrubbed)
 *   data-hscroll          pinned horizontal gallery (desktop), track = [data-hscroll-track]
 *   data-chapters         sticky image story: [data-chapter=i] text ↔ [data-chapter-img=i]
 *
 * Reduced-motion visitors get no smoothing and no initial hidden states.
 */

let lenis: Lenis | null = null;

function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = "1";
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? "").split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            continue;
          }
          const outer = document.createElement("span");
          outer.className = "split-word";
          const inner = document.createElement("span");
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName !== "BR") {
        walk(child);
      }
    }
  };
  walk(el);
}

export function Motion() {
  const pathname = usePathname();

  // Smooth scroll, created once.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ duration: 1.15, anchors: { offset: -96 } });
    lenis.on("scroll", ScrollTrigger.update);
    // Exposed in development so the page can be driven from devtools.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __lenis: Lenis }).__lenis = lenis;
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // Per-page animations.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lenis?.scrollTo(0, { immediate: true });
    if (reduce) return;
    document.documentElement.classList.add("motion-ready");

    // Built at idle so hydration and the first paint aren't held up.
    return whenIdle(() => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          splitWords(el);
          const words = el.querySelectorAll(".split-word > span");
          const onLoad = el.dataset.split === "load";
          gsap.fromTo(
            words,
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.045,
              delay: onLoad ? 0.25 : 0,
              scrollTrigger: onLoad ? undefined : { trigger: el, start: "top 88%" },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: "expo.out",
            delay: Number(el.dataset.reveal) || 0,
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
          const img = el.querySelector("img");
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
          tl.to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.inOut" });
          if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0);
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = Number(el.dataset.parallax) || 0.12;
          gsap.fromTo(
            el,
            { yPercent: -amount * 100 },
            {
              yPercent: amount * 100,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: Number(el.dataset.zoom) || 1.3 },
            { scale: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "center center", scrub: true } },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-scrub-words]").forEach((el) => {
          splitWords(el);
          gsap.fromTo(
            el.querySelectorAll(".split-word > span"),
            // words start dimmed but still readable (3:1 for this large text)
            { opacity: 0.55 },
            { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } },
          );
        });

        const mm = gsap.matchMedia();
        mm.add("(min-width: 1024px)", () => {
          // Horizontal galleries hold with CSS sticky (no GSAP pin): pinning
          // re-parents the section, and React then fails to remove it when
          // you navigate away. The section is made exactly tall enough for
          // the track to travel its full width while the stage sticks.
          const cleanups: (() => void)[] = [];
          gsap.utils.toArray<HTMLElement>("[data-hscroll]").forEach((section) => {
            const track = section.querySelector<HTMLElement>("[data-hscroll-track]");
            if (!track) return;
            const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
            const size = () => {
              section.style.height = `${window.innerHeight + distance()}px`;
            };
            size();
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.6,
                invalidateOnRefresh: true,
                refreshPriority: 1,
                onRefreshInit: size,
              },
            });
            tl.to(track, { x: () => -distance(), ease: "none" }, 0);
            const bar = section.querySelector<HTMLElement>("[data-hscroll-progress]");
            if (bar) tl.fromTo(bar, { scaleX: 0.08 }, { scaleX: 1, ease: "none" }, 0);
            cleanups.push(() => {
              section.style.height = "";
            });
          });
          return () => cleanups.forEach((fn) => fn());
        });

        gsap.utils.toArray<HTMLElement>("[data-chapters]").forEach((root) => {
          const imgs = root.querySelectorAll<HTMLElement>("[data-chapter-img]");
          const marks = root.querySelectorAll<HTMLElement>("[data-chapter-mark]");
          root.querySelectorAll<HTMLElement>("[data-chapter]").forEach((ch) => {
            const i = ch.dataset.chapter;
            ScrollTrigger.create({
              trigger: ch,
              start: "top 55%",
              end: "bottom 55%",
              onToggle: (self) => {
                if (!self.isActive) return;
                imgs.forEach((img) => img.classList.toggle("is-active", img.dataset.chapterImg === i));
                marks.forEach((m) => m.classList.toggle("is-active", m.dataset.chapterMark === i));
              },
            });
          });
        });
      });

      // Pins created here add scroll length; section-level triggers created
      // earlier (by their own components) must re-measure, in page order.
      const raf = requestAnimationFrame(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      });

      // Images and fonts change layout after first paint.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      document.fonts?.ready.then(refresh);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("load", refresh);
        ctx.revert();
      };
    });
  }, [pathname]);

  return null;
}
