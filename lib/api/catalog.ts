/**
 * Catalog reads.
 *
 * Two entry points on purpose:
 *
 *  - `server` functions, for Server Components. They call the API directly and
 *    do not carry cookies; the catalog is public.
 *  - `client` functions, for components that live in the browser, such as the
 *    header's search box. They go through the shared client so the session and
 *    error handling behave the same everywhere.
 *
 * Either way the result is mapped to the frontend's own types, so a page never
 * sees a snake_case field.
 */

import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

import { apiClient, API_BASE_URL } from "./client";
import { mapCategory, mapProduct } from "./mappers";
import type { ApiCategory, ApiProduct } from "./types";

/** Catalog changes rarely; a short window keeps the pages fast. */
const REVALIDATE_SECONDS = 300;

async function serverGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export const serverCatalog = {
  products: async (): Promise<Product[]> => {
    try {
      return (await serverGet<ApiProduct[]>("/api/products/")).map(mapProduct);
    } catch {
      // A shop must still render its shell if the API is briefly unreachable.
      return [];
    }
  },

  productBySlug: async (slug: string): Promise<Product | null> => {
    try {
      return mapProduct(await serverGet<ApiProduct>(`/api/products/${slug}/`));
    } catch {
      return null;
    }
  },

  categories: async (): Promise<Category[]> => {
    try {
      return (await serverGet<ApiCategory[]>("/api/categories/")).map(mapCategory);
    } catch {
      return [];
    }
  },

  categoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      return mapCategory(await serverGet<ApiCategory>(`/api/categories/${slug}/`));
    } catch {
      return null;
    }
  },

  productsInCategory: async (slug: string): Promise<Product[]> => {
    try {
      const raw = await serverGet<ApiProduct[]>(
        `/api/products/?category=${encodeURIComponent(slug)}`,
      );
      return raw.map(mapProduct);
    } catch {
      return [];
    }
  },

  search: async (query: string): Promise<Product[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const raw = await serverGet<ApiProduct[]>(
        `/api/products/?search=${encodeURIComponent(trimmed)}`,
      );
      return raw.map(mapProduct);
    } catch {
      return [];
    }
  },

  /** The "new arrivals" strip. The server does the filtering. */
  newProducts: async (): Promise<Product[]> => {
    try {
      return (await serverGet<ApiProduct[]>("/api/products/?new=1")).map(mapProduct);
    } catch {
      return [];
    }
  },

  /** The "best sellers" strip. */
  bestSellers: async (): Promise<Product[]> => {
    try {
      return (
        await serverGet<ApiProduct[]>("/api/products/?best_seller=1")
      ).map(mapProduct);
    } catch {
      return [];
    }
  },
};

export const clientCatalog = {
  /** Type-ahead for the header. Runs in the browser, so it needs the session. */
  search: async (query: string): Promise<Product[]> => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const raw = await apiClient.get<ApiProduct[]>(
        `/api/products/?search=${encodeURIComponent(trimmed)}`,
      );
      return raw.map(mapProduct);
    } catch {
      return [];
    }
  },
};

/** One request for the header, which needs both lists. */
export const clientCategories = {
  all: async (): Promise<Category[]> => {
    try {
      const raw = await apiClient.get<ApiCategory[]>("/api/categories/");
      return raw.map(mapCategory);
    } catch {
      return [];
    }
  },
};
