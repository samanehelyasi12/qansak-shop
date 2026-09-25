import type { Product } from "@/types/product";
import { products } from "@/data/products";
import { getAllCategories } from "@/data/categories";

const ARABIC_TO_PERSIAN: Record<string, string> = {
  "ك": "ک",
  "ي": "ی",
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[كي]/g, (char) => ARABIC_TO_PERSIAN[char])
    .replace(/[۰-۹٠-٩]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(char) % 10))
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchProducts(query: string): Product[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const target = normalize(trimmed);
  const categories = getAllCategories();
  const categoryNameBySlug = new Map(
    categories.map((category) => [category.slug, category.name]),
  );

  return products.filter((product) => {
    const haystack = normalize(
      [
        product.name,
        product.description,
        categoryNameBySlug.get(product.categorySlug) ?? "",
      ].join(" "),
    );
    return haystack.includes(target);
  });
}