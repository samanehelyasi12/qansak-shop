import Link from "next/link";
import type { Category } from "@/types/category";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block overflow-hidden rounded-xl border border-cream bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-cream">
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="mb-1 font-bold text-cocoa">{category.name}</h3>
        <p className="text-xs text-cocoa/60">{category.description}</p>
      </div>
    </Link>
  );
}
