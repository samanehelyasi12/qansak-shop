import type { Category } from "@/types/category";

export const categories: Category[] = [
  {
    id: "cat-1",
    slug: "cake",
    name: "کیک",
    description: "کیک‌های خامه‌ای و شکلاتی تازه",
    image: "/images/categories/cake.webp",
  },
  {
    id: "cat-2",
    slug: "cheesecake",
    name: "چیزکیک",
    description: "چیزکیک‌های خامه‌ای و میوه‌ای",
    image: "/images/categories/cheesecake.webp",
  },
  {
    id: "cat-3",
    slug: "cafe-cake",
    name: "کیک کافه",
    description: "کیک‌های مناسب سرو با چای و قهوه",
    image: "/images/categories/cafe-cake.webp",
  },
  {
    id: "cat-4",
    slug: "afternoon-cake",
    name: "کیک عصرانه",
    description: "کیک‌های سبک مناسب عصرانه",
    image: "/images/categories/afternoon-cake.webp",
  },
  {
    id: "cat-5",
    slug: "jar-cake",
    name: "کیک شیشه‌ای",
    description: "کیک‌های شیشه‌ای لایه‌ای",
    image: "/images/categories/jar-cake.webp",
  },
  {
    id: "cat-6",
    slug: "cake-mix",
    name: "پودر کیک",
    description: "ترکیب چند طعم کیک در یک جعبه",
    image: "/images/categories/cake-mix.webp",
  },
  {
    id: "cat-7",
    slug: "bread",
    name: "نان",
    description: "نان‌های تازه و خانگی",
    image: "/images/categories/bread.webp",
  },
  {
    id: "cat-8",
    slug: "cookie",
    name: "کوکی",
    description: "کوکی‌های شکلاتی و مغزدار",
    image: "/images/categories/cookie.webp",
  },
  {
    id: "cat-9",
    slug: "sable",
    name: " سابله کیک",
    description: "شیرینی خشک کره‌ای فرانسوی",
    image: "/images/categories/sable.webp",
  },
  {
    id: "cat-10",
    slug: "candy",
    name: "قند",
    description: "آب‌نبات‌های دست‌ساز رنگارنگ",
    image: "/images/categories/candy.webp",
  },
  {
    id: "cat-11",
    slug: "tiramisu",
    name: "تیرامیسو",
    description: "تیرامیسوی ایتالیایی اصل",
    image: "/images/categories/tiramisu.webp",
  },
  {
    id: "cat-12",
    slug: "drink-powder",
    name: "پودر نوشیدنی",
    description: "پودر شیک و نوشیدنی‌های سرد",
    image: "/images/categories/drink-powder.webp",
  },
];

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getCategorySlugs(): string[] {
  return categories.map((category) => category.slug);
}