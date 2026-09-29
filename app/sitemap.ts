import type { MetadataRoute } from "next";
import { serverCatalog } from "@/lib/api/catalog";
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
 * The catalogue comes from the API, so nothing here is invented and nothing
 * goes stale.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [products, categories] = await Promise.all([
    serverCatalog.products(),
    serverCatalog.categories(),
  ]);

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

  const productSlugsByCategory = new Map<string, Set<string>>();
  products.forEach((product) => {
    const set = productSlugsByCategory.get(product.categorySlug) ?? new Set<string>();
    set.add(product.slug);
    productSlugsByCategory.set(product.categorySlug, set);
  });

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => productSlugsByCategory.has(category.slug))
    .map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
