import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllCategories, getCategoryBySlug, getCategorySlugs } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import CategoryCard from "@/components/home/CategoryCard";
import SectionTitle from "@/components/ui/SectionTitle";
import Container from "@/components/ui/Container";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "دسته‌بندی یافت نشد" };
  }

  return {
    title: `${category.name} | قندک`,
    description: category.description,
    openGraph: {
      title: `${category.name} | قندک`,
      description: category.description,
      type: "website",
    },
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
    <div className="py-12">
      <Container>
        <nav className="mb-8" aria-label="breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-cocoa/60">
            <li>
              <Link href="/" className="hover:text-caramel">خانه</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/categories/cakes" className="hover:text-caramel">
                دسته‌بندی‌ها
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-cocoa font-medium" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        <header className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold text-cocoa sm:text-4xl">
            {category.name}
          </h1>
          <p className="text-lg text-cocoa/70 max-w-2xl mx-auto">
            {category.description}
          </p>
        </header>

        <section aria-labelledby="products-title">
          <SectionTitle id="products-title" title="محصولات" subtitle={`${products.length} محصول یافت شد`} />
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-cocoa/60">
              <p>محصولی در این دسته‌بندی یافت نشد</p>
            </div>
          )}
        </section>

        <section className="mt-16" aria-labelledby="other-categories-title">
          <SectionTitle
            id="other-categories-title"
            title="سایر دسته‌بندی‌ها"
            subtitle="دسته‌بندی‌های دیگر را هم ببینید"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {allCategories
              .filter((c) => c.slug !== slug)
              .map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
          </div>
        </section>
      </Container>
    </div>
  );
}