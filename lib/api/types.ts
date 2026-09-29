/**
 * The exact JSON shapes the Django API returns.
 *
 * These exist so the mapping from `snake_case` and string decimals into the
 * frontend's own vocabulary happens in one file, instead of being spread across
 * every component. Nothing outside `lib/api` should import from here.
 */

/** A decimal as DRF serialises it: a string, to keep the precision. */
export type ApiAmount = string;

export interface ApiProductOptionValue {
  id: number;
  slug: string;
  label: string;
  price_delta: ApiAmount;
}

export interface ApiProductOption {
  id: number;
  slug: string;
  name: string;
  values: ApiProductOptionValue[];
}

export interface ApiProduct {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: ApiAmount;
  images: string[];
  category_slug: string;
  preparation_hours: number;
  is_best_seller: boolean;
  is_new: boolean;
  in_stock: boolean;
  rating: number;
  options?: ApiProductOption[];
}

export interface ApiCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  image_url: string;
}
