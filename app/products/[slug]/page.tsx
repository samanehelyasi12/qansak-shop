import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getProductSlugs } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import PreparationTime from "@/components/product/PreparationTime";
import ProductClientWrapper from "@/components/product/ProductClientWrapper";
import ProductTabs from "@/components/product/ProductTabs";
import Container from "@/components/ui/Container";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "محصول یافت نشد" };
  }

  return {
    title: `${product.name} | قندک`,
    description: product.description,
    openGraph: {
      title: `${product.name} | قندک`,
      description: product.description,
      type: "website",
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = getCategoryBySlug(product.categorySlug);

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <nav className="mb-6 sm:mb-8" aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-cocoa/60 sm:text-sm">
            <li>
              <Link href="/" className="hover:text-caramel">خانه</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/products" className="hover:text-caramel">محصولات</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categories/${product.categorySlug}`} className="hover:text-caramel">
                {category?.name || product.categorySlug}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="max-w-[160px] truncate font-medium text-cocoa sm:max-w-[200px]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        {/*
          گرید اصلی:
          موبایل: تک‌ستونه (عکس بالا، بقیه پایین)
          از lg به بعد: عکس سمت چپ (ستون دوم به دلیل RTL) و ثابت (sticky)،
          توضیحات/گزینه‌ها/تب‌ها کاملاً سمت راست در یک ستون پشت سر هم
        */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-14">
          {/* ستون راست: اطلاعات محصول، گزینه‌ها، افزودن به سبد، تب‌ها */}
          <div className="order-2 space-y-6 lg:order-1">
            <ProductInfo product={product} />
            <ProductClientWrapper product={product} />
            <ProductTabs product={product} />
          </div>

          {/* ستون چپ: گالری عکس + زمان آماده‌سازی، ثابت هنگام اسکرول */}
          <div className="order-1 space-y-6 lg:sticky lg:top-24 lg:order-2 lg:self-start">
            <ProductGallery product={product} />
            <PreparationTime product={product} />
          </div>
        </div>
      </Container>
    </div>
  );
}