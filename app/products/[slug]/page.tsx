import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getProductSlugs, getProductsByCategory } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import PreparationTime from "@/components/product/PreparationTime";
import ProductClientWrapper from "@/components/product/ProductClientWrapper";
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
  const relatedProducts = getProductsByCategory(product.categorySlug)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="py-12">
      <Container>
        <nav className="mb-8" aria-label="breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-cocoa/60 flex-wrap">
            <li>
              <Link href="/" className="hover:text-caramel">خانه</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/categories/${product.categorySlug}`} className="hover:text-caramel">
                {category?.name || product.categorySlug}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-cocoa font-medium truncate max-w-[200px]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="sticky top-24 space-y-6">
            <ProductGallery product={product} />
            <PreparationTime product={product} />
          </div>

          <div className="space-y-6">
            <ProductInfo product={product} />
            <ProductClientWrapper product={product} />
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16" aria-labelledby="related-title">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 id="related-title" className="text-2xl font-bold text-cocoa">
                  محصولات مرتبط
                </h2>
                <p className="text-sm text-cocoa/70">محصولات دیگر از همین دسته‌بندی</p>
              </div>
              <Link href={`/categories/${product.categorySlug}`} className="text-sm text-caramel hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedProducts.map((p) => (
                <div key={p.id} className="block">
                  <Link href={`/products/${p.slug}`}>
                    <div className="aspect-square overflow-hidden rounded-lg bg-cream mb-2">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover hover:scale-105 transition duration-300"
                      />
                    </div>
                    <h3 className="mb-1 text-sm font-medium text-cocoa line-clamp-1">{p.name}</h3>
                    <p className="text-sm font-bold text-caramel">
                      {(p.discountPrice || p.price).toLocaleString("fa-IR")} تومان
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}