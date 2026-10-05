"use client";

import { useEffect, useRef, useState } from "react";

/** Overhead surf loop. Loads only when the section nears the viewport. */
export function BeachVideo() {
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

  const base = small ? "/video/beach-960" : "/video/beach";
  return (
    <div ref={ref} className="absolute inset-0">
      {on && (
        <video
          className={`absolute inset-0 h-full w-full object-cover object-[center_45%] transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          onPlaying={() => setPlaying(true)}
        >
          <source src={`${base}.webm?v=2`} type="video/webm" />
          <source src={`${base}.mp4?v=2`} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
