export interface ProductOption {
  id: string;
  /** Slug the storefront addresses the option by, e.g. "size". */
  slug: string;
  label: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  /** Slug the storefront addresses the choice by, e.g. "2kg". */
  slug: string;
  label: string;
  /** Display only. The server re-reads this before charging anyone. */
  priceDelta: number;
}

export interface Product {
  reviews?: {
    author: string;
    rating: number;
    comment: string;
  }[];
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  categorySlug: string;
  preparationHours: number;
  isBestSeller: boolean;
  isNew: boolean;
  inStock: boolean;
  rating: number;
  options?: ProductOption[];
}
