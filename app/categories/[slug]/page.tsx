// app/categories/[slug]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, getAllCategories } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import Container from "@/components/ui/Container";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { absoluteUrl } from "@/lib/site";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "دسته‌بندی یافت نشد" };
  }

  const products = getProductsByCategory(slug);
  const hasProducts = products.length > 0;

  // Each description combines the category's own copy with its real, current
  // product names, so every category gets genuinely distinct text rather than
  // the same sentence with only the name swapped in.
  const description = hasProducts
    ? `${category.description} — شامل ${products
        .map((product) => product.name)
        .join("، ")}. سفارش آنلاین از شیرینی‌سرای قندک.`
    : `${category.description} — سفارش آنلاین از شیرینی‌سرای قندک.`;

  return {
    title: `خرید ${category.name}`,
    description,
    alternates: {
      canonical: absoluteUrl(`/categories/${category.slug}`),
    },
    // A category with no products renders only the empty-state message, so it
    // is thin content. Keep it crawlable (it still passes link equity) but out
    // of the index. Links are followed so its products can still be discovered.
    robots: hasProducts
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(slug);
  const allCategories = getAllCategories();

  return (
    <section
      className="relative min-h-screen bg-cover bg-center bg-no-repeat py-12 sm:py-16"
      style={{
        backgroundImage: `url('/images/decor/products-bg-desktop.webp')`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* Breadcrumb metadata for the visible trail below; renders no UI. */}
      <BreadcrumbJsonLd
        items={[
          { name: "خانه", href: "/" },
          { name: "فروشگاه", href: "/products" },
          { name: category.name },
        ]}
      />
      {/* پس‌زمینه برای موبایل */}
      <style>{`
        @media (max-width: 1023px) {
          section {
            background-image: url('/images/decor/products-bg-mobile.webp') !important;
            background-attachment: scroll;
          }
        }
      `}</style>

      {/* Overlay نیمه‌شفاف برای خوانایی بهتر متن */}
      <div className="absolute inset-0 bg-white/5"></div>

      <Container>
        <div className="relative z-10">
          {/* Breadcrumb - شیشه‌ای */}
          <nav className="mb-8 sm:mb-10" aria-label="breadcrumb">
            <ol className="inline-block rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 px-4 py-3 sm:px-6 sm:py-4 text-xs text-cocoa/80 sm:text-sm shadow-lg">
              <li className="flex items-center gap-2 flex-wrap">
                <Link href="/" className="hover:text-cocoa transition font-medium">خانه</Link>
                <span aria-hidden="true" className="text-cocoa/60">/</span>
                <Link href="/products" className="hover:text-cocoa transition font-medium">فروشگاه</Link>
                <span aria-hidden="true" className="text-cocoa/60">/</span>
                <span className="text-cocoa font-bold" aria-current="page">{category.name}</span>
              </li>
            </ol>
          </nav>

          {/* عنوان دسته‌بندی - شیشه‌ای */}
          <header className="mb-10 rounded-3xl bg-white/25 backdrop-blur-lg border border-white/50 p-4 text-center sm:p-6 lg:p-8 shadow-xl">
            <h1 className="mb-2 text-2xl font-bold text-cocoa sm:text-3xl lg:text-4xl">
              {category.name}
            </h1>
            <p className="text-xs text-cocoa/70 sm:text-sm lg:text-base">{category.description}</p>
          </header>

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-4">
            {/* سایر دسته‌بندی‌ها - سمت چپ (فقط تو دسکتاپ) - شیشه‌ای */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 p-4 sm:p-5 shadow-lg">
                <h3 className="mb-4 font-bold text-cocoa text-sm lg:text-base">سایر دسته‌بندی‌ها</h3>
                <div className="space-y-2">
                  {allCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className={`block rounded-xl px-3 py-2.5 transition text-sm font-medium ${
                        cat.slug === slug
                          ? "bg-white/60 backdrop-blur-sm text-berry border border-berry/30 shadow-md"
                          : "text-cocoa hover:bg-white/30 hover:backdrop-blur-sm border border-transparent hover:border-white/30"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* محصولات - سمت راست (تو دسکتاپ، تمام عرض تو موبایل) */}
            <div className="lg:col-span-3">
              {products.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-cocoa/60">
                  <p className="text-sm sm:text-base">محصولی در این دسته‌بندی یافت نشد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}