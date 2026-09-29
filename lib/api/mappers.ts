/**
 * Backend response -> frontend domain type.
 *
 * The Django API speaks `snake_case`, numbers money as decimal strings and
 * identifies rows with integers. The rest of the app is written against
 * `types/product.ts` and `types/category.ts`, which are camelCase, use plain
 * numbers and use string ids for React keys. The translation happens here and
 * nowhere else, so no component has to know the backend's naming.
 *
 * These values are for display. They are never sent back as authority: the
 * storefront recomputes every amount on the server when an order is placed.
 */

import type { Category } from "@/types/category";
import type {
  Product,
  ProductOption,
  ProductOptionValue,
} from "@/types/product";

import type {
  ApiAmount,
  ApiCategory,
  ApiProduct,
  ApiProductOption,
  ApiProductOptionValue,
} from "./types";

/** Decimal string -> number, with a safe fallback. */
function toNumber(amount: ApiAmount | null | undefined): number {
  if (amount === null || amount === undefined || amount === "") return 0;
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapOptionValue(value: ApiProductOptionValue): ProductOptionValue {
  return {
    id: String(value.id),
    slug: value.slug,
    label: value.label,
    priceDelta: toNumber(value.price_delta),
  };
}

export function mapOption(option: ApiProductOption): ProductOption {
  return {
    id: String(option.id),
    slug: option.slug,
    label: option.name,
    values: option.values.map(mapOptionValue),
  };
}

export function mapProduct(product: ApiProduct): Product {
  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: toNumber(product.price),
    images: product.images ?? [],
    categorySlug: product.category_slug,
    preparationHours: product.preparation_hours,
    isBestSeller: product.is_best_seller,
    isNew: product.is_new,
    inStock: product.in_stock,
    rating: product.rating,
    // The catalog has no per-product sale price, so `discountPrice` stays
    // undefined and the UI falls back to the base price.
    ...(product.options?.length ? { options: product.options.map(mapOption) } : {}),
  };
}

export function mapCategory(category: ApiCategory): Category {
  return {
    id: String(category.id),
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image_url,
  };
}
