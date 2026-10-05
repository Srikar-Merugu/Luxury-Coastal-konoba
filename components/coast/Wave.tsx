/** Soft wave edge that bites into a photo, coloured like the section next to it. */
export function Wave({
  position = "bottom",
  gentle = false,
  className = "",
}: {
  position?: "top" | "bottom";
  gentle?: boolean;
  className?: string;
}) {
  const d = gentle
    ? "M0 92C220 70 480 58 760 66c260 8 470 34 680 22V140H0Z"
    : "M0 70C180 130 360 140 560 96 760 52 900 10 1100 34c140 17 250 60 340 86V140H0Z";
  return (
    <svg
      viewBox="0 0 1440 140"
      preserveAspectRatio="none"
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 z-10 w-full ${gentle ? "h-[5vw] max-h-20 min-h-8" : "h-[9vw] max-h-36 min-h-12"} ${
        position === "bottom" ? "-bottom-px" : "-top-px rotate-180"
      } ${className}`}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** Painted, torn edge where sand dissolves into the page (white by default). */
export function SandEdge({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[46%] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/25 via-55% to-white" />
      <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[70%] w-full">
        <defs>
          <filter id="sand-tear" x="-5%" y="-40%" width="110%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="5" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="46" xChannelSelector="R" yChannelSelector="G" result="torn" />
            <feGaussianBlur in="torn" stdDeviation="5" />
          </filter>
          <filter id="sand-speck">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
            <feColorMatrix values="0 0 0 0 0.62  0 0 0 0 0.48  0 0 0 0 0.32  0 0 0 14 -11.5" />
          </filter>
        </defs>
        <rect x="-40" y="96" width="1520" height="200" fill="#fff" fillOpacity=".92" filter="url(#sand-tear)" />
        <rect x="-40" y="150" width="1520" height="120" fill="#fff" />
        <rect x="0" y="70" width="1440" height="60" filter="url(#sand-speck)" opacity=".4" />
      </svg>
    </div>
  );
}
