import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "prd-1",
    slug: "chocolate-truffle-cake",
    name: "کیک ترافل شکلاتی",
    description: "کیک شکلاتی سه لایه با گاناش تلخ و تراشه شکلات بلژیکی",
    price: 850000,
    discountPrice: 760000,
    images: ["/images/products/chocolate-truffle-cake.jpg"],
    categorySlug: "cakes",
    preparationHours: 24,
    isBestSeller: true,
    isNew: false,
    inStock: true,
    rating: 4.8,
    options: [
      {
        id: "size",
        label: "وزن",
        values: [
          { id: "1kg", label: "۱ کیلوگرم", priceDelta: 0 },
          { id: "2kg", label: "۲ کیلوگرم", priceDelta: 620000 },
        ],
      },
    ],
  },
  {
    id: "prd-2",
    slug: "vanilla-cream-cake",
    name: "کیک خامه وانیلی",
    description: "کیک اسفنجی وانیلی با خامه تازه و توت فرنگی",
    price: 720000,
    images: ["/images/products/vanilla-cream-cake.jpg"],
    categorySlug: "cakes",
    preparationHours: 24,
    isBestSeller: false,
    isNew: true,
    inStock: true,
    rating: 4.5,
  },
  {
    id: "prd-3",
    slug: "cream-puff",
    name: "نان خامه‌ای",
    description: "نان خامه‌ای تازه با خامه فرم گرفته",
    price: 45000,
    images: ["/images/products/cream-puff.jpg"],
    categorySlug: "pastries",
    preparationHours: 4,
    isBestSeller: true,
    isNew: false,
    inStock: true,
    rating: 4.7,
  },
  {
    id: "prd-4",
    slug: "danish-pastry",
    name: "دانمارکی",
    description: "شیرینی دانمارکی با مغز کاستارد و بادام",
    price: 55000,
    images: ["/images/products/danish-pastry.jpg"],
    categorySlug: "pastries",
    preparationHours: 4,
    isBestSeller: false,
    isNew: true,
    inStock: true,
    rating: 4.4,
  },
  {
    id: "prd-5",
    slug: "chickpea-cookie",
    name: "نان نخودچی",
    description: "شیرینی خشک سنتی با آرد نخودچی و هل",
    price: 320000,
    images: ["/images/products/chickpea-cookie.jpg"],
    categorySlug: "cookies",
    preparationHours: 12,
    isBestSeller: true,
    isNew: false,
    inStock: true,
    rating: 4.9,
  },
  {
    id: "prd-6",
    slug: "walnut-cookie",
    name: "شیرینی گردویی",
    description: "شیرینی خشک گردویی مجلسی",
    price: 380000,
    images: ["/images/products/walnut-cookie.jpg"],
    categorySlug: "cookies",
    preparationHours: 12,
    isBestSeller: false,
    isNew: false,
    inStock: true,
    rating: 4.6,
  },
  {
    id: "prd-7",
    slug: "butter-croissant",
    name: "کروسان کره‌ای",
    description: "کروسان ورقه‌ای با کره فرانسوی",
    price: 65000,
    images: ["/images/products/butter-croissant.jpg"],
    categorySlug: "breads",
    preparationHours: 6,
    isBestSeller: true,
    isNew: true,
    inStock: true,
    rating: 4.8,
  },
  {
    id: "prd-8",
    slug: "baguette",
    name: "باگت فرانسوی",
    description: "نان باگت تازه با پوسته ترد",
    price: 40000,
    images: ["/images/products/baguette.jpg"],
    categorySlug: "breads",
    preparationHours: 6,
    isBestSeller: false,
    isNew: false,
    inStock: true,
    rating: 4.3,
  },
  {
    id: "prd-9",
    slug: "dark-chocolate-box",
    name: "جعبه شکلات تلخ",
    description: "شکلات تلخ دست‌ساز ۷۰ درصد در جعبه کادویی",
    price: 490000,
    discountPrice: 440000,
    images: ["/images/products/dark-chocolate-box.jpg"],
    categorySlug: "chocolates",
    preparationHours: 8,
    isBestSeller: true,
    isNew: false,
    inStock: true,
    rating: 4.9,
  },
  {
    id: "prd-10",
    slug: "milk-chocolate-box",
    name: "جعبه شکلات شیری",
    description: "شکلات شیری با مغز فندق در جعبه کادویی",
    price: 460000,
    images: ["/images/products/milk-chocolate-box.jpg"],
    categorySlug: "chocolates",
    preparationHours: 8,
    isBestSeller: false,
    isNew: true,
    inStock: false,
    rating: 4.5,
  },
];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((product) => product.categorySlug === categorySlug);
}

export function getBestSellers(): Product[] {
  return products.filter((product) => product.isBestSeller);
}

export function getNewProducts(): Product[] {
  return products.filter((product) => product.isNew);
}

export function getProductSlugs(): string[] {
  return products.map((product) => product.slug);
}
