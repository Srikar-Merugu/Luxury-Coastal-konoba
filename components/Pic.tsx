import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { alts, photos, type PhotoKey } from "@/lib/photos";

/**
 * Framed photo. `clip` unmasks it on scroll, `parallax` lets the image drift
 * inside its frame (the image is oversized so edges never show).
 */
export function Pic({
  name,
  locale,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  clip = false,
  parallax,
  decorative = false,
}: {
  name: PhotoKey;
  locale: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  clip?: boolean;
  parallax?: number;
  decorative?: boolean;
}) {
  const img = (
    <Image
      src={photos[name]}
      alt={decorative ? "" : alts[name][locale]}
      fill
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : "low"}
      placeholder="blur"
      quality={78}
      className="object-cover"
    />
  );
  return (
    <div className={`relative overflow-hidden bg-stone-2 ${className}`} data-clip={clip || undefined}>
      {parallax ? (
        <div className="absolute inset-x-0 -inset-y-[14%]" data-parallax={parallax}>
          {img}
        </div>
      ) : (
        img
      )}
    </div>
  );
}
