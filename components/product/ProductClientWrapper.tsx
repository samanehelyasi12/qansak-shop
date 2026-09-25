"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { useCart } from "@/lib/cart/store";
import ProductOptions from "./ProductOptions";
import AddToCart from "./AddToCart";

interface ProductClientWrapperProps {
  product: Product;
}

export default function ProductClientWrapper({ product }: ProductClientWrapperProps) {
  const { addItem } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleOptionChange = (optionId: string, valueId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: valueId }));
  };

  const handleAddToCart = (
    target: Product,
    options: Record<string, string>,
    quantity: number,
  ) => {
    addItem(target, options, quantity);
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