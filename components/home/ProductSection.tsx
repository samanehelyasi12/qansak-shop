import type { Product } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";
import SectionTitle from "@/components/ui/SectionTitle";
import Container from "@/components/ui/Container";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
  viewAllLabel = "مشاهده همه",
}: ProductSectionProps) {
  return (
    <section className="py-16 bg-cream/30" aria-labelledby={title.toLowerCase().replace(/\s+/g, "-")}>
      <Container>
        <div className="flex items-end justify-between mb-8">
          <SectionTitle title={title} subtitle={subtitle} />
          {viewAllHref && (
            <Link href={viewAllHref}>
              <Button variant="ghost" size="sm">
                {viewAllLabel}
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}