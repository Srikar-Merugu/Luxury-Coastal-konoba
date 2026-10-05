/* Loose single-line drawings in sage, drawn for this site. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function DoodleFish(p: P) {
  return (
    <svg viewBox="0 0 140 60" aria-hidden {...p}>
      <g {...s}>
        <path d="M8 31c16-18 52-24 80-12 9 4 15 8 20 12-5 4-11 8-20 12-28 12-64 6-80-12z" />
        <path d="M108 31l24-17c-3 11-3 23 0 34z" />
        <circle cx="27" cy="27" r="2" />
        <path d="M42 20c5 7 5 15 0 22M60 17c4 9 4 20 0 28M76 19c3 8 3 17 0 24" opacity=".6" />
      </g>
    </svg>
  );
}

export function DoodleOlive(p: P) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden {...p}>
      <g {...s}>
        <path d="M12 108C40 80 70 48 110 12" />
        <path d="M34 86c-10-1-18 3-22-4 7-6 16-4 22 4zM48 72c1-10-3-18 4-22 6 7 4 16-4 22zM62 58c-10-1-18 3-22-4 7-6 16-4 22 4zM76 44c1-10-3-18 4-22 6 7 4 16-4 22zM90 31c-9-1-16 3-20-4 7-6 15-4 20 4z" />
        <ellipse cx="57" cy="83" rx="5" ry="7" transform="rotate(-30 57 83)" />
        <ellipse cx="83" cy="57" rx="4.5" ry="6.5" transform="rotate(-30 83 57)" />
      </g>
    </svg>
  );
}

export function DoodleGlass(p: P) {
  return (
    <svg viewBox="0 0 70 110" aria-hidden {...p}>
      <g {...s}>
        <path d="M14 8h42c2 20-4 38-21 42C18 46 12 28 14 8z" />
        <path d="M17 26c10 3 26 3 36 0" opacity=".6" />
        <path d="M35 50v40M20 100c8-6 22-6 30 0" />
        <path d="M48 10l10-6M54 18c4-1 8 0 10 3" />
      </g>
    </svg>
  );
}

export function DoodleAnchor(p: P) {
  return (
    <svg viewBox="0 0 90 110" aria-hidden {...p}>
      <g {...s}>
        <circle cx="45" cy="13" r="7" />
        <path d="M45 20v76M28 36h34" />
        <path d="M10 66c4 20 20 30 35 30s31-10 35-30M10 66l-4 8M10 66l9 3M80 66l4 8M80 66l-9 3" />
      </g>
    </svg>
  );
}

export function DoodleShell(p: P) {
  return (
    <svg viewBox="0 0 100 90" aria-hidden {...p}>
      <g {...s}>
        <path d="M50 82C22 80 6 58 10 36 14 16 32 6 50 6s36 10 40 30c4 22-12 44-40 46z" />
        <path d="M50 82V8M50 82 26 14M50 82 74 14M50 82 14 30M50 82 86 30" opacity=".6" />
        <path d="M40 82h20v6H40z" />
      </g>
    </svg>
  );
}

export function DoodleLemon(p: P) {
  return (
    <svg viewBox="0 0 110 80" aria-hidden {...p}>
      <g {...s}>
        <path d="M8 40c8-20 30-32 50-30 22 2 38 14 44 30-6 16-22 28-44 30C38 72 16 60 8 40z" />
        <path d="M4 40h6M100 40h6" />
        <path d="M30 26c10-6 30-8 44 0" opacity=".5" />
        <path d="M58 10c2-6 8-8 14-6-2 6-8 8-14 6z" />
      </g>
    </svg>
  );
}

export const doodles = [DoodleFish, DoodleGlass, DoodleOlive, DoodleShell, DoodleAnchor, DoodleLemon];
