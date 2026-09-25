import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Public crawling policy.
 *
 * Deliberately permissive: the transactional pages (/cart, /checkout/*,
 * /order/*, /payment/*, /login, /register, /search) are NOT disallowed here.
 * They are excluded from indexing with a page-level `noindex` directive
 * instead, which only works if crawlers can actually fetch those pages.
 * Blocking them here would hide the noindex from crawlers entirely.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
