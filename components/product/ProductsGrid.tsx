"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

interface ProductsGridProps {
  products: Product[];
}

type ScreenType = "mobile" | "tablet" | "desktop";

export default function ProductsGrid({ products }: ProductsGridProps) {
  const [screen, setScreen] = useState<ScreenType>("mobile");

  useEffect(() => {
    const updateScreen = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreen("mobile");
      } else if (width < 1024) {
        setScreen("tablet");
      } else {
        setScreen("desktop");
      }
    };

    updateScreen();
    window.addEventListener("resize", updateScreen);
    return () => window.removeEventListener("resize", updateScreen);
  }, []);

  const gridCols =
    screen === "mobile"
      ? "grid-cols-1"
      : screen === "tablet"
        ? "grid-cols-2"
        : "grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}