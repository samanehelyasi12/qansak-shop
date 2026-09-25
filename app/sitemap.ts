import type { MetadataRoute } from "next";
import { getAllCategories } from "@/data/categories";
import { getAllProducts, getProductsByCategory } from "@/data/products";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap containing only public, indexable routes.
 *
 * Transactional / account routes are intentionally excluded — they carry a
 * page-level `noindex` and should not be advertised as landing pages.
 *
 * Categories with no products are also excluded: they render only an empty-state
 * message and are marked `noindex` in their own metadata, so listing them here
 * would advertise non-indexable, thin pages.
 *
 * Uses the same data helpers as the pages' `generateStaticParams`, so no
 * product or category is invented here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = getAllCategories()
    .filter((category) => getProductsByCategory(category.slug).length > 0)
    .map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = getAllProducts().map((product) => ({
    url: absoluteUrl(`/products/${product.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
