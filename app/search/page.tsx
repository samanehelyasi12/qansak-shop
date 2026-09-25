import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import ProductCard from "@/components/product/ProductCard";
import { searchProducts } from "@/data/search";
import { getAllCategories } from "@/data/categories";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "جستجو",
  description: "جستجو در محصولات شیرینی‌سرای قندک",
  // Faceted-search URLs must never be indexed, but we still follow their links.
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = searchProducts(query);
  const allCategories = getAllCategories();

  return (
    <div className="py-12">
      <Container>
        <nav className="mb-8" aria-label="breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-cocoa/60">
            <li>
              <Link href="/" className="hover:text-caramel">خانه</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-cocoa font-medium" aria-current="page">
              جستجو
            </li>
          </ol>
        </nav>

        <header className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold text-cocoa sm:text-4xl">
            جستجو{query ? ` برای «${query}»` : ""}
          </h1>
          {query && (
            <p className="text-lg text-cocoa/70">
              {results.length > 0
                ? `${results.length} محصول یافت شد`
                : "هیچ محصولی یافت نشد"}
            </p>
          )}
        </header>

        {!query ? (
          <div className="text-center py-12">
            <p className="mb-4 text-cocoa/70">
              عبارت مورد نظر خود را جستجو کنید
            </p>
            <form action="/search" method="GET" className="mx-auto flex max-w-md gap-2">
              <input
                type="search"
                name="q"
                aria-label="جستجوی محصولات"
                defaultValue=""
                placeholder="جستجو در قندک..."
                className="flex-1 rounded-lg border border-caramel/30 bg-white px-4 py-2.5 text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
              />
              <button
                type="submit"
                className="rounded-lg bg-caramel px-5 py-2.5 font-medium text-white transition-colors hover:bg-cocoa cursor-pointer"
              >
                جستجو
              </button>
            </form>
          </div>
        ) : results.length > 0 ? (
          <section aria-label="نتایج جستجو">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <div className="mx-auto max-w-md rounded-xl border border-cream bg-white p-8 text-center shadow-sm">
            <p className="mb-6 text-cocoa/70">
              نتیجه‌ای برای «{query}» پیدا نشد. عبارت دیگری را امتحان کنید یا
              از دسته‌بندی‌ها شروع کنید.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {allCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="rounded-full bg-cream px-4 py-2 text-sm text-cocoa transition-colors hover:bg-caramel/10 hover:text-caramel cursor-pointer"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}