import type { Product } from "@/types/product";
import { getCategoryBySlug } from "@/data/categories";
import { getEffectiveProductPrice } from "@/lib/pricing";

/**
 * Central source of truth for the public site URL.
 *
 * The project currently has NO confirmed production domain, so this falls back
 * to the local dev origin. To configure a real domain later, set:
 *
 *   NEXT_PUBLIC_SITE_URL=https://your-domain.com
 *
 * in `.env.local` (or your hosting provider's environment settings).
 * No other file needs to change.
 */

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/** Normalised base URL, never with a trailing slash. */
export const siteUrl = (
  RAW_SITE_URL && RAW_SITE_URL.length > 0 ? RAW_SITE_URL : "http://localhost:3000"
).replace(/\/+$/, "");

export const siteName = "قندک";

/** Verified social profiles, taken from the existing Footer links. */
export const socialProfiles = [
  "https://t.me/qandak",
  "https://instagram.com/qandak",
];

/**
 * Existing brand asset shipped with the project (public/images/hero/logo.webp).
 * Intrinsic size is declared so Open Graph can emit valid width/height.
 */
export const siteLogoPath = "/images/hero/logo.webp";
export const siteLogoWidth = 1512;
export const siteLogoHeight = 526;

/**
 * Whether a real production domain has been configured yet.
 * Used to avoid emitting misleading absolute URLs during local development.
 */
export const hasRealSiteUrl =
  typeof RAW_SITE_URL === "string" && RAW_SITE_URL.length > 0;

/**
 * Build an absolute URL from a root-relative path.
 * Accepts a leading-slash path ("/products") and returns the full origin + path.
 */
export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${clean}`;
}

/** Persian digits for prices, matching the format shown in the UI. */
function formatPrice(value: number): string {
  return value.toLocaleString("fa-IR");
}

/**
 * A short, accurate summary of what is actually on the product page:
 * the product's own description plus its real, currently-displayed price and
 * availability. Nothing is invented here.
 */
export function buildProductMetaDescription(product: Product): string {
  const price = formatPrice(getEffectiveProductPrice(product));
  const category = getCategoryBySlug(product.categorySlug);
  const categoryLabel = category?.name ? ` در دستهٔ ${category.name}` : "";

  return `${product.description}${categoryLabel} — ${price} تومان، ${
    product.inStock ? "موجود" : "ناموجود"
  }. سفارش آنلاین از شیرینی‌سرای قندک.`;
}
