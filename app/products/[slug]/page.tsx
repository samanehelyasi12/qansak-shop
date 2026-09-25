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
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, buildProductMetaDescription, siteName } from "@/lib/site";

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

  const canonical = absoluteUrl(`/products/${product.slug}`);
  const description = buildProductMetaDescription(product);

  return {
    title: product.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${product.name} | ${siteName}`,
      description,
      type: "website",
      url: canonical,
      // Absolute URLs are required by the OG spec; metadataBase cannot be
      // relied on for arrays of plain strings.
      images: product.images.map((image) => ({
        url: absoluteUrl(image),
        alt: product.name,
      })),
    },
  };
}

/**
 * Schema.org JSON-LD for the product.
 *
 * Only fields backed by real, currently-trusted data are emitted.
 * `aggregateRating` and `review` are intentionally OMITTED: the product data is
 * static/mock, so publishing rating structured data would be fabricated
 * rich-result markup. Add it in a later batch once real user reviews exist.
 */
function buildProductJsonLd(product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  categorySlug: string;
  inStock: boolean;
}) {
  const effectivePrice = product.discountPrice ?? product.price;
  const category = getCategoryBySlug(product.categorySlug);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    // Absolute image URLs are required by the spec.
    image: product.images.map((image) => absoluteUrl(image)),
    sku: product.id,
    ...(category
      ? {
          category: category.name,
        }
      : {}),
    brand: {
      "@type": "Brand",
      name: siteName,
    },
    url: absoluteUrl(`/products/${product.slug}`),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      // Prices are stored in Toman; Schema.org/ISO-4217 expects IRR (Rial).
      // 1 Toman = 10 Rial.
      priceCurrency: "IRR",
      price: effectivePrice * 10,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteName,
      },
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
      <JsonLd data={buildProductJsonLd(product)} />
      {/* Describes the breadcrumb that is already visible below; renders no UI. */}
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", href: "/" },
          { name: "محصولات", href: "/products" },
          {
            name: category?.name || product.categorySlug,
            href: `/categories/${product.categorySlug}`,
          },
          { name: product.name },
        ]}
      />
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