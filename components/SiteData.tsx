"use client";

import { createContext, useContext } from "react";
import type { Season } from "@/lib/content";
import type { Override } from "@/lib/season";

type SiteData = { seasons: Season[]; override: Override };

const Ctx = createContext<SiteData | null>(null);

/** Seasons and the closed override, loaded on the server and shared with client components. */
export function SiteDataProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteData(): SiteData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteData outside SiteDataProvider");
  return v;
}
