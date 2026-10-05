import type { MetadataRoute } from "next";
import { venue } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${venue.url}/sitemap.xml`,
  };
}
