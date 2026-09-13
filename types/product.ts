export interface ProductOption {
  id: string;
  label: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  label: string;
  priceDelta: number;
}

export interface Product {
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
