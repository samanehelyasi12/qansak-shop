"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import ProductOptions from "./ProductOptions";
import AddToCart from "./AddToCart";

interface ProductClientWrapperProps {
  product: Product;
}

export default function ProductClientWrapper({ product }: ProductClientWrapperProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleOptionChange = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: valueId }));
  };

  const handleAddToCart = (product: Product, options: Record<string, string>, quantity: number) => {
    console.log("Add to cart:", { product: product.id, options, quantity });
  };

  return (
    <div className="space-y-6">
      <ProductOptions
        product={product}
        onOptionChange={handleOptionChange}
        selectedOptions={selectedOptions}
      />
      <AddToCart
        product={product}
        selectedOptions={selectedOptions}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}